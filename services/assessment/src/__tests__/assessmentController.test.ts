import request from 'supertest';
import express from 'express';
import { assessmentController } from '../controllers/assessmentController';
import { assessmentService } from '../services/assessmentService';

// Mock the assessment service
jest.mock('../services/assessmentService');
const mockAssessmentService = assessmentService as jest.Mocked<typeof assessmentService>;

describe('AssessmentController', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Set up routes
    app.get('/assessments', assessmentController.getAllAssessments);
    app.get('/assessments/:id', assessmentController.getAssessmentById);
    app.post('/assessments', assessmentController.createAssessment);
    app.put('/assessments/:id', assessmentController.updateAssessment);
    app.delete('/assessments/:id', assessmentController.deleteAssessment);
    app.get('/assessments/:id/questions', assessmentController.getAssessmentQuestions);
    app.post('/assessments/:id/submit', assessmentController.submitAssessment);
    app.get('/assessments/:id/results/:userId', assessmentController.getAssessmentResults);
    app.get('/assessments/:id/analytics', assessmentController.getAssessmentAnalytics);
    app.get('/user/:userId/assessments', assessmentController.getUserAssessments);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /assessments', () => {
    it('should return all assessments', async () => {
      const mockAssessments = [
        { id: '1', title: 'Test Assessment 1' },
        { id: '2', title: 'Test Assessment 2' },
      ];

      mockAssessmentService.getAllAssessments.mockResolvedValue(mockAssessments);

      const response = await request(app)
        .get('/assessments')
        .expect(200);

      expect(response.body).toEqual(mockAssessments);
      expect(mockAssessmentService.getAllAssessments).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockAssessmentService.getAllAssessments.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/assessments')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /assessments/:id', () => {
    it('should return assessment by id', async () => {
      const mockAssessment = { id: '1', title: 'Test Assessment' };
      mockAssessmentService.getAssessmentById.mockResolvedValue(mockAssessment);

      const response = await request(app)
        .get('/assessments/1')
        .expect(200);

      expect(response.body).toEqual(mockAssessment);
      expect(mockAssessmentService.getAssessmentById).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent assessment', async () => {
      mockAssessmentService.getAssessmentById.mockResolvedValue(null);

      const response = await request(app)
        .get('/assessments/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Assessment not found');
    });
  });

  describe('POST /assessments', () => {
    it('should create new assessment', async () => {
      const assessmentData = {
        title: 'New Assessment',
        description: 'A new assessment',
        type: 'quiz',
        questions: [],
        passingScore: 70,
        maxAttempts: 3,
      };

      const createdAssessment = { id: '1', ...assessmentData };
      mockAssessmentService.createAssessment.mockResolvedValue(createdAssessment);

      const response = await request(app)
        .post('/assessments')
        .send(assessmentData)
        .expect(201);

      expect(response.body).toEqual(createdAssessment);
      expect(mockAssessmentService.createAssessment).toHaveBeenCalledWith(assessmentData);
    });
  });

  describe('PUT /assessments/:id', () => {
    it('should update existing assessment', async () => {
      const updateData = { title: 'Updated Assessment' };
      const updatedAssessment = { id: '1', title: 'Updated Assessment' };
      mockAssessmentService.updateAssessment.mockResolvedValue(updatedAssessment);

      const response = await request(app)
        .put('/assessments/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedAssessment);
      expect(mockAssessmentService.updateAssessment).toHaveBeenCalledWith('1', updateData);
    });

    it('should return 404 for non-existent assessment', async () => {
      mockAssessmentService.updateAssessment.mockResolvedValue(null);

      const response = await request(app)
        .put('/assessments/non-existent')
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Assessment not found');
    });
  });

  describe('DELETE /assessments/:id', () => {
    it('should delete existing assessment', async () => {
      mockAssessmentService.deleteAssessment.mockResolvedValue(true);

      await request(app)
        .delete('/assessments/1')
        .expect(204);

      expect(mockAssessmentService.deleteAssessment).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent assessment', async () => {
      mockAssessmentService.deleteAssessment.mockResolvedValue(false);

      const response = await request(app)
        .delete('/assessments/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Assessment not found');
    });
  });

  describe('GET /assessments/:id/questions', () => {
    it('should return assessment questions', async () => {
      const mockQuestions = [
        { id: 'q1', text: 'Question 1' },
        { id: 'q2', text: 'Question 2' },
      ];
      mockAssessmentService.getAssessmentQuestions.mockResolvedValue(mockQuestions);

      const response = await request(app)
        .get('/assessments/1/questions')
        .expect(200);

      expect(response.body).toEqual(mockQuestions);
      expect(mockAssessmentService.getAssessmentQuestions).toHaveBeenCalledWith('1');
    });
  });

  describe('POST /assessments/:id/submit', () => {
    it('should submit assessment answers', async () => {
      const submissionData = {
        userId: 'user123',
        answers: { q1: 'answer1', q2: 'answer2' },
      };

      const mockResult = {
        id: 'result1',
        assessmentId: '1',
        userId: 'user123',
        score: 80,
        maxScore: 100,
        percentage: 80,
        passed: true,
        answers: submissionData.answers,
        timeSpent: 300,
        submittedAt: new Date(),
      };

      mockAssessmentService.submitAssessment.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/assessments/1/submit')
        .send(submissionData)
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(mockAssessmentService.submitAssessment).toHaveBeenCalledWith(
        '1',
        'user123',
        submissionData.answers
      );
    });
  });

  describe('GET /assessments/:id/results/:userId', () => {
    it('should return assessment results for user', async () => {
      const mockResult = {
        id: 'result1',
        assessmentId: '1',
        userId: 'user123',
        score: 80,
        maxScore: 100,
        percentage: 80,
        passed: true,
        answers: {},
        timeSpent: 300,
        submittedAt: new Date(),
      };

      mockAssessmentService.getAssessmentResults.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/assessments/1/results/user123')
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(mockAssessmentService.getAssessmentResults).toHaveBeenCalledWith('1', 'user123');
    });
  });

  describe('GET /assessments/:id/analytics', () => {
    it('should return assessment analytics', async () => {
      const mockAnalytics = {
        totalSubmissions: 10,
        averageScore: 75,
        passRate: 80,
        scoreDistribution: { '0-20': 1, '21-40': 1, '41-60': 2, '61-80': 3, '81-100': 3 },
      };

      mockAssessmentService.getAssessmentAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/assessments/1/analytics')
        .expect(200);

      expect(response.body).toEqual(mockAnalytics);
      expect(mockAssessmentService.getAssessmentAnalytics).toHaveBeenCalledWith('1');
    });
  });

  describe('GET /user/:userId/assessments', () => {
    it('should return user assessments', async () => {
      const mockUserAssessments = [
        { id: 'result1', assessmentId: '1', userId: 'user123', score: 80 },
        { id: 'result2', assessmentId: '2', userId: 'user123', score: 90 },
      ];

      mockAssessmentService.getUserAssessments.mockResolvedValue(mockUserAssessments);

      const response = await request(app)
        .get('/user/user123/assessments')
        .expect(200);

      expect(response.body).toEqual(mockUserAssessments);
      expect(mockAssessmentService.getUserAssessments).toHaveBeenCalledWith('user123');
    });
  });
}); 