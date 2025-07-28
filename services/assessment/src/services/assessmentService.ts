import { logger } from '@pageflow/utils';
import { v4 as uuidv4 } from 'uuid';
import { Assessment, Question, AssessmentSubmission, Answer } from '@pageflow/types';
import { AssessmentRepository } from '../repositories/assessmentRepository';

// AI grading service interface
interface AIGradingService {
  gradeEssayQuestion(prompt: string, userAnswer: string, rubric: string): Promise<{
    score: number;
    maxScore: number;
    feedback: string;
    reasoning: string;
  }>;
  
  gradeShortAnswer(prompt: string, userAnswer: string, correctAnswer: string): Promise<{
    score: number;
    maxScore: number;
    feedback: string;
    similarity: number;
  }>;
}

// Mock AI grading service - would be replaced with actual Bedrock integration
class MockAIGradingService implements AIGradingService {
  async gradeEssayQuestion(prompt: string, userAnswer: string, rubric: string) {
    // Simulate AI grading with basic text analysis
    const wordCount = userAnswer.split(' ').length;
    const hasKeywords = this.checkKeywords(userAnswer, prompt);
    const score = Math.min(100, wordCount * 2 + (hasKeywords ? 20 : 0));
    
    return {
      score: Math.min(score, 100),
      maxScore: 100,
      feedback: this.generateEssayFeedback(score, wordCount, hasKeywords),
      reasoning: `Graded based on word count (${wordCount}), keyword presence (${hasKeywords}), and content relevance.`
    };
  }

  async gradeShortAnswer(prompt: string, userAnswer: string, correctAnswer: string) {
    const similarity = this.calculateTextSimilarity(userAnswer.toLowerCase(), correctAnswer.toLowerCase());
    const score = Math.round(similarity * 100);
    
    return {
      score,
      maxScore: 100,
      feedback: similarity > 0.8 ? 'Excellent answer!' : 'Consider reviewing the material.',
      similarity
    };
  }

  private checkKeywords(userAnswer: string, prompt: string): boolean {
    const keywords = prompt.toLowerCase().split(' ').filter(word => word.length > 4);
    return keywords.some(keyword => userAnswer.toLowerCase().includes(keyword));
  }

  private generateEssayFeedback(score: number, wordCount: number, hasKeywords: boolean): string {
    if (score >= 80) return 'Excellent response with good detail and relevant content.';
    if (score >= 60) return 'Good response, but could include more specific details.';
    return 'Response needs more detail and specific examples.';
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(' '));
    const words2 = new Set(text2.split(' '));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }
}

export class AssessmentService {
  private repository: AssessmentRepository;
  private aiGradingService: AIGradingService;

  constructor() {
    this.repository = new AssessmentRepository();
    this.aiGradingService = new MockAIGradingService();
  }

  /**
   * Initialize the service and create database tables
   */
  async initialize(): Promise<void> {
    try {
      await this.repository.createTable();
      logger.info('Assessment service initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize assessment service: ${error}`);
      throw error;
    }
  }

  /**
   * Get all assessments
   */
  async getAllAssessments(): Promise<Assessment[]> {
    try {
      logger.info('Fetching all assessments');
      return await this.repository.getAllAssessments();
    } catch (error) {
      logger.error(`Failed to fetch assessments: ${error}`);
      throw error;
    }
  }

  /**
   * Get assessment by ID
   */
  async getAssessmentById(id: string): Promise<Assessment | null> {
    try {
      logger.info(`Fetching assessment with ID: ${id}`);
      return await this.repository.getAssessmentById(id);
    } catch (error) {
      logger.error(`Failed to fetch assessment ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Create new assessment
   */
  async createAssessment(data: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assessment> {
    try {
      logger.info(`Creating new assessment: ${data.title}`);
      
      // Validate assessment data
      this.validateAssessmentData(data);
      
      const assessment = await this.repository.createAssessment(data);
      logger.info(`Assessment created successfully: ${assessment.id}`);
      return assessment;
    } catch (error) {
      logger.error(`Failed to create assessment: ${error}`);
      throw error;
    }
  }

  /**
   * Update assessment
   */
  async updateAssessment(id: string, data: Partial<Assessment>): Promise<Assessment | null> {
    try {
      logger.info(`Updating assessment with ID: ${id}`);
      
      // Validate update data
      if (data.questions) {
        this.validateQuestions(data.questions);
      }
      
      const assessment = await this.repository.updateAssessment(id, data);
      if (assessment) {
        logger.info(`Assessment updated successfully: ${id}`);
      }
      return assessment;
    } catch (error) {
      logger.error(`Failed to update assessment ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Delete assessment
   */
  async deleteAssessment(id: string): Promise<boolean> {
    try {
      logger.info(`Deleting assessment with ID: ${id}`);
      const deleted = await this.repository.deleteAssessment(id);
      if (deleted) {
        logger.info(`Assessment deleted successfully: ${id}`);
      }
      return deleted;
    } catch (error) {
      logger.error(`Failed to delete assessment ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Submit assessment with AI-assisted grading
   */
  async submitAssessment(
    assessmentId: string,
    userId: string,
    answers: Record<string, any>,
    startedAt: Date = new Date()
  ): Promise<AssessmentSubmission> {
    try {
      logger.info(`Submitting assessment ${assessmentId} for user ${userId}`);
      
      // Get assessment
      const assessment = await this.repository.getAssessmentById(assessmentId);
      if (!assessment) {
        throw new Error('Assessment not found');
      }

      // Check attempt limits
      const existingSubmissions = await this.repository.getUserSubmissions(userId, assessmentId);
      if (existingSubmissions.length >= assessment.attempts) {
        throw new Error(`Maximum attempts (${assessment.attempts}) exceeded for this assessment`);
      }

      // Grade the submission
      const gradedAnswers = await this.gradeSubmission(assessment, answers);
      
      // Calculate total score
      const totalScore = gradedAnswers.reduce((sum, answer) => sum + answer.pointsAwarded, 0);
      const maxScore = assessment.questions.reduce((sum, question) => sum + question.points, 0);
      const percentage = (totalScore / maxScore) * 100;
      const passed = percentage >= assessment.passingScore;

      // Generate feedback
      const feedback = await this.generateFeedback(assessment, gradedAnswers, percentage, passed);

      // Create submission
      const submission: Omit<AssessmentSubmission, 'id' | 'gradedAt'> = {
        userId,
        assessmentId,
        answers: gradedAnswers,
        score: totalScore,
        passed,
        feedback,
        startedAt,
        submittedAt: new Date(),
        attemptNumber: existingSubmissions.length + 1
      };

      const createdSubmission = await this.repository.createSubmission(submission);
      
      logger.info(`Assessment submitted successfully - Assessment: ${assessmentId}, User: ${userId}, Score: ${totalScore}, Percentage: ${percentage}, Passed: ${passed}`);

      return createdSubmission;
    } catch (error) {
      logger.error(`Failed to submit assessment ${assessmentId} for user ${userId}: ${error}`);
      throw error;
    }
  }

  /**
   * Get assessment results for a user
   */
  async getAssessmentResults(assessmentId: string, userId: string): Promise<AssessmentSubmission[]> {
    try {
      logger.info(`Fetching assessment results for user ${userId} and assessment ${assessmentId}`);
      return await this.repository.getUserSubmissions(userId, assessmentId);
    } catch (error) {
      logger.error(`Failed to fetch assessment results for assessment ${assessmentId} and user ${userId}: ${error}`);
      throw error;
    }
  }

  /**
   * Get assessment analytics
   */
  async getAssessmentAnalytics(assessmentId: string): Promise<any> {
    try {
      logger.info(`Fetching analytics for assessment ${assessmentId}`);
      return await this.repository.getAssessmentAnalytics(assessmentId);
    } catch (error) {
      logger.error(`Failed to fetch assessment analytics for assessment ${assessmentId}: ${error}`);
      throw error;
    }
  }

  /**
   * Grade submission with AI assistance
   */
  private async gradeSubmission(assessment: Assessment, answers: Record<string, any>): Promise<Answer[]> {
    const gradedAnswers: Answer[] = [];

    for (const question of assessment.questions) {
      const userAnswer = answers[question.id];
      let isCorrect = false;
      let pointsAwarded = 0;
      let feedback = '';

      switch (question.type) {
        case 'multiple_choice':
        case 'true_false':
          isCorrect = userAnswer === question.correctAnswer;
          pointsAwarded = isCorrect ? question.points : 0;
          feedback = isCorrect ? (question.feedback?.correct || '') : (question.feedback?.incorrect || 'Incorrect answer');
          break;

        case 'short_answer':
          const shortAnswerResult = await this.aiGradingService.gradeShortAnswer(
            question.prompt,
            userAnswer || '',
            question.correctAnswer as string
          );
          pointsAwarded = Math.round((shortAnswerResult.score / 100) * question.points);
          isCorrect = shortAnswerResult.score >= 80;
          feedback = shortAnswerResult.feedback;
          break;

        case 'essay':
          const essayResult = await this.aiGradingService.gradeEssayQuestion(
            question.prompt,
            userAnswer || '',
            JSON.stringify(question.feedback)
          );
          pointsAwarded = Math.round((essayResult.score / 100) * question.points);
          isCorrect = essayResult.score >= 70;
          feedback = essayResult.feedback;
          break;

        default:
          pointsAwarded = 0;
          feedback = 'Question type not supported for automated grading';
      }

      gradedAnswers.push({
        questionId: question.id,
        value: userAnswer,
        isCorrect,
        pointsAwarded,
        feedback
      });
    }

    return gradedAnswers;
  }

  /**
   * Generate personalized feedback
   */
  private async generateFeedback(
    assessment: Assessment,
    answers: Answer[],
    percentage: number,
    passed: boolean
  ): Promise<string> {
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const totalQuestions = assessment.questions.length;
    const strengthAreas = this.identifyStrengthAreas(assessment, answers);
    const improvementAreas = this.identifyImprovementAreas(assessment, answers);

    let feedback = `You scored ${percentage.toFixed(1)}% (${correctAnswers}/${totalQuestions} correct). `;
    
    if (passed) {
      feedback += `Congratulations! You passed this assessment. `;
    } else {
      feedback += `You need ${assessment.passingScore}% to pass. `;
    }

    if (strengthAreas.length > 0) {
      feedback += `Your strengths include: ${strengthAreas.join(', ')}. `;
    }

    if (improvementAreas.length > 0) {
      feedback += `Areas for improvement: ${improvementAreas.join(', ')}. `;
    }

    return feedback;
  }

  /**
   * Identify strength areas based on correct answers
   */
  private identifyStrengthAreas(assessment: Assessment, answers: Answer[]): string[] {
    const strengths: string[] = [];
    const questionTypes = new Map<string, number>();
    const difficulties = new Map<string, number>();

    for (let i = 0; i < assessment.questions.length; i++) {
      const question = assessment.questions[i];
      const answer = answers[i];
      
      if (answer.isCorrect) {
        questionTypes.set(question.type, (questionTypes.get(question.type) || 0) + 1);
        difficulties.set(question.difficulty, (difficulties.get(question.difficulty) || 0) + 1);
      }
    }

    // Add type-based strengths
    for (const [type, count] of questionTypes) {
      if (count >= 2) {
        strengths.push(`${type.replace('_', ' ')} questions`);
      }
    }

    // Add difficulty-based strengths
    for (const [difficulty, count] of difficulties) {
      if (count >= 2) {
        strengths.push(`${difficulty} difficulty questions`);
      }
    }

    return strengths;
  }

  /**
   * Identify areas for improvement
   */
  private identifyImprovementAreas(assessment: Assessment, answers: Answer[]): string[] {
    const improvements: string[] = [];
    const incorrectTypes = new Map<string, number>();

    for (let i = 0; i < assessment.questions.length; i++) {
      const question = assessment.questions[i];
      const answer = answers[i];
      
      if (!answer.isCorrect) {
        incorrectTypes.set(question.type, (incorrectTypes.get(question.type) || 0) + 1);
      }
    }

    for (const [type, count] of incorrectTypes) {
      if (count >= 2) {
        improvements.push(`${type.replace('_', ' ')} questions`);
      }
    }

    return improvements;
  }

  /**
   * Validate assessment data
   */
  private validateAssessmentData(data: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>): void {
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Assessment title is required');
    }
    
    if (data.passingScore < 0 || data.passingScore > 100) {
      throw new Error('Passing score must be between 0 and 100');
    }
    
    if (data.attempts < 1) {
      throw new Error('Maximum attempts must be at least 1');
    }
    
    if (data.questions && data.questions.length > 0) {
      this.validateQuestions(data.questions);
    }
  }

  /**
   * Validate questions
   */
  private validateQuestions(questions: Question[]): void {
    for (const question of questions) {
      if (!question.prompt || question.prompt.trim().length === 0) {
        throw new Error('Question prompt is required');
      }
      
      if (question.points <= 0) {
        throw new Error('Question points must be greater than 0');
      }
      
      if (question.type === 'multiple_choice' && (!question.options || question.options.length < 2)) {
        throw new Error('Multiple choice questions must have at least 2 options');
      }
    }
  }
}

// Export singleton instance
export const assessmentService = new AssessmentService(); 