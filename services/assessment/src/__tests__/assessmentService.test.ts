import { assessmentService } from '../services/assessmentService';
import { Assessment, Question } from '@pageflow/types';

describe('AssessmentService', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  describe('getAllAssessments', () => {
    it('should return empty array when no assessments exist', async () => {
      const assessments = await assessmentService.getAllAssessments();
      expect(assessments).toEqual([]);
    });

    it('should return all assessments when they exist', async () => {
      const mockAssessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Test Assessment',
        description: 'A test assessment',
        questions: [],
        passingScore: 70,
        attempts: 3,
        curriculumStandards: [],
      };

      const created = await assessmentService.createAssessment(mockAssessment);
      const assessments = await assessmentService.getAllAssessments();
      
      expect(assessments).toHaveLength(1);
      expect(assessments[0].id).toBe(created.id);
    });
  });

  describe('getAssessmentById', () => {
    it('should return null for non-existent assessment', async () => {
      const assessment = await assessmentService.getAssessmentById('non-existent-id');
      expect(assessment).toBeNull();
    });

    it('should return assessment when it exists', async () => {
      const mockAssessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Test Assessment',
        description: 'A test assessment',
        questions: [],
        passingScore: 70,
        attempts: 3,
        curriculumStandards: [],
      };

      const created = await assessmentService.createAssessment(mockAssessment);
      const retrieved = await assessmentService.getAssessmentById(created.id);
      
      expect(retrieved).toEqual(created);
    });
  });

  describe('createAssessment', () => {
    it('should create assessment with valid data', async () => {
      const mockAssessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Test Assessment',
        description: 'A test assessment',
        questions: [],
        passingScore: 70,
        attempts: 3,
        curriculumStandards: [],
      };

      const result = await assessmentService.createAssessment(mockAssessment);
      
      expect(result.id).toBeDefined();
      expect(result.title).toBe(mockAssessment.title);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should create assessment with questions', async () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'multiple_choice',
          prompt: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          points: 10,
          difficulty: 'easy',
        },
      ];

      const mockAssessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Math Quiz',
        description: 'Basic math assessment',
        questions,
        passingScore: 70,
        attempts: 3,
        curriculumStandards: [],
      };

      const result = await assessmentService.createAssessment(mockAssessment);
      
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].prompt).toBe('What is 2+2?');
    });
  });

  describe('updateAssessment', () => {
    it('should return null for non-existent assessment', async () => {
      const result = await assessmentService.updateAssessment('non-existent-id', { title: 'Updated' });
      expect(result).toBeNull();
    });

    it('should update existing assessment', async () => {
      const mockAssessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Original Title',
        description: 'Original description',
        questions: [],
        passingScore: 70,
        attempts: 3,
        curriculumStandards: [],
      };

      const created = await assessmentService.createAssessment(mockAssessment);
      const updated = await assessmentService.updateAssessment(created.id, { title: 'Updated Title' });
      
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.description).toBe('Original description'); // Should remain unchanged
    });
  });

  describe('deleteAssessment', () => {
    it('should return false for non-existent assessment', async () => {
      const result = await assessmentService.deleteAssessment('non-existent-id');
      expect(result).toBe(false);
    });

    it('should delete existing assessment', async () => {
      const mockAssessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Test Assessment',
        description: 'A test assessment',
        questions: [],
        passingScore: 70,
        attempts: 3,
        curriculumStandards: [],
      };

      const created = await assessmentService.createAssessment(mockAssessment);
      const deleted = await assessmentService.deleteAssessment(created.id);
      
      expect(deleted).toBe(true);
      
      // Verify it's actually deleted
      const retrieved = await assessmentService.getAssessmentById(created.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('submitAssessment', () => {
    it('should throw error for non-existent assessment', async () => {
      await expect(
        assessmentService.submitAssessment('non-existent-id', 'user123', {})
      ).rejects.toThrow('Assessment not found');
    });

    it('should calculate correct score for multiple choice questions', async () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'multiple_choice',
          prompt: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          points: 10,
          difficulty: 'easy',
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          prompt: 'What is 3+3?',
          options: ['5', '6', '7', '8'],
          correctAnswer: '6',
          points: 10,
          difficulty: 'easy',
        },
      ];

      const mockAssessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Math Quiz',
        description: 'Basic math assessment',
        questions,
        passingScore: 70,
        attempts: 3,
        curriculumStandards: [],
      };

      const assessment = await assessmentService.createAssessment(mockAssessment);
      const answers = { q1: '4', q2: '6' }; // All correct
      
      const result = await assessmentService.submitAssessment(assessment.id, 'user123', answers);
      
      expect(result.score).toBe(20);
      expect(result.passed).toBe(true);
    });

    it('should calculate partial score for mixed answers', async () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'multiple-choice',
          text: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          points: 10,
        },
        {
          id: 'q2',
          type: 'multiple-choice',
          text: 'What is 3+3?',
          options: ['5', '6', '7', '8'],
          correctAnswer: '6',
          points: 10,
        },
      ];

      const mockAssessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Math Quiz',
        description: 'Basic math assessment',
        type: 'quiz',
        questions,
        passingScore: 70,
        maxAttempts: 3,
      };

      const assessment = await assessmentService.createAssessment(mockAssessment);
      const answers = { q1: '4', q2: '5' }; // One correct, one wrong
      
      const result = await assessmentService.submitAssessment(assessment.id, 'user123', answers);
      
      expect(result.score).toBe(10);
      expect(result.maxScore).toBe(20);
      expect(result.percentage).toBe(50);
      expect(result.passed).toBe(false);
    });

    it('should handle short answer questions with similarity matching', async () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'short-answer',
          text: 'What is the capital of France?',
          correctAnswer: 'Paris',
          points: 10,
        },
      ];

      const mockAssessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Geography Quiz',
        description: 'Geography assessment',
        type: 'quiz',
        questions,
        passingScore: 70,
        maxAttempts: 3,
      };

      const assessment = await assessmentService.createAssessment(mockAssessment);
      const answers = { q1: 'Paris' }; // Exact match
      
      const result = await assessmentService.submitAssessment(assessment.id, 'user123', answers);
      
      expect(result.score).toBe(10);
      expect(result.passed).toBe(true);
    });
  });

  describe('getAssessmentAnalytics', () => {
    it('should return empty analytics for assessment with no submissions', async () => {
      const mockAssessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Test Assessment',
        description: 'A test assessment',
        type: 'quiz',
        questions: [],
        passingScore: 70,
        maxAttempts: 3,
      };

      const assessment = await assessmentService.createAssessment(mockAssessment);
      const analytics = await assessmentService.getAssessmentAnalytics(assessment.id);
      
      expect(analytics.totalSubmissions).toBe(0);
      expect(analytics.averageScore).toBe(0);
      expect(analytics.passRate).toBe(0);
    });

    it('should calculate analytics for assessment with submissions', async () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'multiple-choice',
          text: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          points: 10,
        },
      ];

      const mockAssessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Math Quiz',
        description: 'Basic math assessment',
        type: 'quiz',
        questions,
        passingScore: 70,
        maxAttempts: 3,
      };

      const assessment = await assessmentService.createAssessment(mockAssessment);
      
      // Submit multiple times
      await assessmentService.submitAssessment(assessment.id, 'user1', { q1: '4' }); // 100%
      await assessmentService.submitAssessment(assessment.id, 'user2', { q1: '3' }); // 0%
      
      const analytics = await assessmentService.getAssessmentAnalytics(assessment.id);
      
      expect(analytics.totalSubmissions).toBe(2);
      expect(analytics.averageScore).toBe(5); // (10 + 0) / 2
      expect(analytics.passRate).toBe(50); // 1 out of 2 passed
    });
  });

  describe('getUserAssessments', () => {
    it('should return empty array for user with no assessments', async () => {
      const assessments = await assessmentService.getUserAssessments('user123');
      expect(assessments).toEqual([]);
    });

    it('should return assessments for specific user', async () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'multiple-choice',
          text: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          points: 10,
        },
      ];

      const mockAssessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Math Quiz',
        description: 'Basic math assessment',
        type: 'quiz',
        questions,
        passingScore: 70,
        maxAttempts: 3,
      };

      const assessment = await assessmentService.createAssessment(mockAssessment);
      await assessmentService.submitAssessment(assessment.id, 'user123', { q1: '4' });
      
      const userAssessments = await assessmentService.getUserAssessments('user123');
      
      expect(userAssessments).toHaveLength(1);
      expect(userAssessments[0].userId).toBe('user123');
    });
  });
}); 