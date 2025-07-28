import { PostgresRepository } from '@pageflow/db-utils';
import { Assessment, Question, AssessmentSubmission, Answer } from '@pageflow/types';
import { logger } from '@pageflow/utils';

/**
 * PostgreSQL repository for assessment data
 */
export class AssessmentRepository extends PostgresRepository {
  constructor() {
    super('assessments');
  }

  /**
   * Create assessment table if it doesn't exist
   */
  async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS assessments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL DEFAULT 'quiz',
        time_limit INTEGER,
        passing_score INTEGER NOT NULL,
        max_attempts INTEGER NOT NULL DEFAULT 1,
        curriculum_standards JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS questions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        prompt TEXT NOT NULL,
        options JSONB,
        correct_answer JSONB,
        points INTEGER NOT NULL DEFAULT 1,
        difficulty VARCHAR(20) DEFAULT 'medium',
        feedback JSONB,
        order_index INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS assessment_submissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        max_score INTEGER NOT NULL,
        percentage DECIMAL(5,2) NOT NULL,
        passed BOOLEAN NOT NULL,
        feedback TEXT,
        started_at TIMESTAMP WITH TIME ZONE NOT NULL,
        submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
        graded_at TIMESTAMP WITH TIME ZONE,
        attempt_number INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS submission_answers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        submission_id UUID NOT NULL REFERENCES assessment_submissions(id) ON DELETE CASCADE,
        question_id UUID NOT NULL,
        answer_value JSONB,
        is_correct BOOLEAN,
        points_awarded INTEGER DEFAULT 0,
        feedback TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_questions_assessment_id ON questions(assessment_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON assessment_submissions(user_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_assessment_id ON assessment_submissions(assessment_id);
      CREATE INDEX IF NOT EXISTS idx_submission_answers_submission_id ON submission_answers(submission_id);
    `;

    await this.query(query);
    logger.info('Assessment tables created successfully');
  }

  /**
   * Create a new assessment
   */
  async createAssessment(assessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assessment> {
    const query = `
      INSERT INTO assessments (title, description, type, time_limit, passing_score, max_attempts, curriculum_standards)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await this.query<Assessment>(query, [
      assessment.title,
      assessment.description,
      'quiz', // Default type since Assessment doesn't have a type field
      assessment.timeLimit,
      assessment.passingScore,
      assessment.attempts,
      JSON.stringify(assessment.curriculumStandards || [])
    ]);

    const createdAssessment = result.rows[0];
    
    // Insert questions if provided
    if (assessment.questions && assessment.questions.length > 0) {
      await this.insertQuestions(createdAssessment.id, assessment.questions);
    }

    return this.mapToAssessment(createdAssessment);
  }

  /**
   * Get assessment by ID with questions
   */
  async getAssessmentById(id: string): Promise<Assessment | null> {
    const assessmentQuery = `
      SELECT * FROM assessments WHERE id = $1
    `;
    
    const assessmentResult = await this.query<Assessment>(assessmentQuery, [id]);
    if (assessmentResult.rows.length === 0) {
      return null;
    }

    const assessment = assessmentResult.rows[0];
    const questions = await this.getQuestionsByAssessmentId(id);
    
    return this.mapToAssessment(assessment, questions);
  }

  /**
   * Get all assessments
   */
  async getAllAssessments(): Promise<Assessment[]> {
    const query = `
      SELECT * FROM assessments ORDER BY created_at DESC
    `;
    
    const result = await this.query<Assessment>(query);
    const assessments = await Promise.all(
      result.rows.map(async (assessment) => {
        const questions = await this.getQuestionsByAssessmentId(assessment.id);
        return this.mapToAssessment(assessment, questions);
      })
    );

    return assessments;
  }

  /**
   * Update assessment
   */
  async updateAssessment(id: string, updates: Partial<Assessment>): Promise<Assessment | null> {
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'questions')
      .map((key, index) => `${this.camelToSnake(key)} = $${index + 2}`)
      .join(', ');

    if (!setClause) {
      return this.getAssessmentById(id);
    }

    const query = `
      UPDATE assessments 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const values = [id, ...Object.values(updates).filter((_, index) => 
      Object.keys(updates)[index] !== 'id' && Object.keys(updates)[index] !== 'questions'
    )];

    const result = await this.query<Assessment>(query, values);
    if (result.rows.length === 0) {
      return null;
    }

    const assessment = result.rows[0];
    const questions = await this.getQuestionsByAssessmentId(id);
    
    return this.mapToAssessment(assessment, questions);
  }

  /**
   * Delete assessment
   */
  async deleteAssessment(id: string): Promise<boolean> {
    const query = `
      DELETE FROM assessments WHERE id = $1
    `;
    
    const result = await this.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Create assessment submission
   */
  async createSubmission(submission: Omit<AssessmentSubmission, 'id' | 'gradedAt'>): Promise<AssessmentSubmission> {
    const query = `
      INSERT INTO assessment_submissions (
        user_id, assessment_id, score, max_score, percentage, passed, 
        feedback, started_at, submitted_at, attempt_number
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await this.query<AssessmentSubmission>(query, [
      submission.userId,
      submission.assessmentId,
      submission.score,
      submission.score, // Use score as maxScore since AssessmentSubmission doesn't have maxScore
      100, // Calculate percentage as 100 since we're using score as maxScore
      submission.passed,
      submission.feedback,
      submission.startedAt,
      submission.submittedAt,
      submission.attemptNumber
    ]);

    const createdSubmission = result.rows[0];

    // Insert answers if provided
    if (submission.answers && submission.answers.length > 0) {
      await this.insertSubmissionAnswers(createdSubmission.id, submission.answers);
    }

    return this.mapToSubmission(createdSubmission);
  }

  /**
   * Get submission by ID with answers
   */
  async getSubmissionById(id: string): Promise<AssessmentSubmission | null> {
    const query = `
      SELECT * FROM assessment_submissions WHERE id = $1
    `;
    
    const result = await this.query<AssessmentSubmission>(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    const submission = result.rows[0];
    const answers = await this.getSubmissionAnswers(id);
    
    return this.mapToSubmission(submission, answers);
  }

  /**
   * Get user's submissions for an assessment
   */
  async getUserSubmissions(userId: string, assessmentId: string): Promise<AssessmentSubmission[]> {
    const query = `
      SELECT * FROM assessment_submissions 
      WHERE user_id = $1 AND assessment_id = $2 
      ORDER BY attempt_number ASC
    `;
    
    const result = await this.query<AssessmentSubmission>(query, [userId, assessmentId]);
    
    const submissions = await Promise.all(
      result.rows.map(async (submission) => {
        const answers = await this.getSubmissionAnswers(submission.id);
        return this.mapToSubmission(submission, answers);
      })
    );

    return submissions;
  }

  /**
   * Get assessment analytics
   */
  async getAssessmentAnalytics(assessmentId: string): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_submissions,
        AVG(percentage) as average_score,
        MIN(percentage) as lowest_score,
        MAX(percentage) as highest_score,
        COUNT(CASE WHEN passed = true THEN 1 END) as passed_count,
        COUNT(CASE WHEN passed = false THEN 1 END) as failed_count
      FROM assessment_submissions 
      WHERE assessment_id = $1
    `;
    
    const result = await this.query(query, [assessmentId]);
    return result.rows[0];
  }

  /**
   * Insert questions for an assessment
   */
  private async insertQuestions(assessmentId: string, questions: Question[]): Promise<void> {
    const query = `
      INSERT INTO questions (
        assessment_id, type, prompt, options, correct_answer, 
        points, difficulty, feedback, order_index
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      await this.query(query, [
        assessmentId,
        question.type,
        question.prompt,
        JSON.stringify(question.options || []),
        JSON.stringify(question.correctAnswer),
        question.points,
        question.difficulty || 'medium',
        JSON.stringify(question.feedback || {}),
        i + 1
      ]);
    }
  }

  /**
   * Get questions for an assessment
   */
  private async getQuestionsByAssessmentId(assessmentId: string): Promise<Question[]> {
    const query = `
      SELECT * FROM questions 
      WHERE assessment_id = $1 
      ORDER BY order_index ASC
    `;
    
    const result = await this.query<Question>(query, [assessmentId]);
    return result.rows.map(this.mapToQuestion);
  }

  /**
   * Insert submission answers
   */
  private async insertSubmissionAnswers(submissionId: string, answers: Answer[]): Promise<void> {
    const query = `
      INSERT INTO submission_answers (
        submission_id, question_id, answer_value, is_correct, points_awarded, feedback
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    for (const answer of answers) {
      await this.query(query, [
        submissionId,
        answer.questionId,
        JSON.stringify(answer.value),
        answer.isCorrect,
        answer.pointsAwarded,
        answer.feedback
      ]);
    }
  }

  /**
   * Get submission answers
   */
  private async getSubmissionAnswers(submissionId: string): Promise<Answer[]> {
    const query = `
      SELECT * FROM submission_answers 
      WHERE submission_id = $1
    `;
    
    const result = await this.query<Answer>(query, [submissionId]);
    return result.rows.map(this.mapToAnswer);
  }

  /**
   * Map database row to Assessment
   */
  private mapToAssessment(row: any, questions: Question[] = []): Assessment {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      questions,
      timeLimit: row.time_limit,
      passingScore: row.passing_score,
      attempts: row.max_attempts,
      curriculumStandards: row.curriculum_standards || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /**
   * Map database row to Question
   */
  private mapToQuestion(row: any): Question {
    return {
      id: row.id,
      type: row.type,
      prompt: row.prompt,
      options: row.options || [],
      correctAnswer: row.correct_answer,
      points: row.points,
      difficulty: row.difficulty,
      feedback: row.feedback
    };
  }

  /**
   * Map database row to AssessmentSubmission
   */
  private mapToSubmission(row: any, answers: Answer[] = []): AssessmentSubmission {
    return {
      id: row.id,
      userId: row.user_id,
      assessmentId: row.assessment_id,
      answers,
      score: row.score,
      passed: row.passed,
      feedback: row.feedback,
      startedAt: new Date(row.started_at),
      submittedAt: new Date(row.submitted_at),
      gradedAt: row.graded_at ? new Date(row.graded_at) : undefined,
      attemptNumber: row.attempt_number
    };
  }

  /**
   * Map database row to Answer
   */
  private mapToAnswer(row: any): Answer {
    return {
      questionId: row.question_id,
      value: row.answer_value,
      isCorrect: row.is_correct,
      pointsAwarded: row.points_awarded,
      feedback: row.feedback
    };
  }

  /**
   * Convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
} 