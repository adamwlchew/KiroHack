import request from 'supertest';
import express from 'express';
import { assessmentRoutes } from '../routes/assessmentRoutes';
import { errorHandler } from '../middleware/errorHandler';

describe('Assessment Service Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Add health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'healthy', 
        service: 'assessment-service',
        timestamp: new Date().toISOString()
      });
    });
    
    app.use('/api/assessments', assessmentRoutes);
    app.use(errorHandler);
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'assessment-service');
    });
  });

  describe('Assessment CRUD Operations', () => {
    let assessmentId: string;

    it('should create a new assessment', async () => {
      const assessmentData = {
        title: 'Integration Test Assessment',
        description: 'An assessment created during integration testing',
        type: 'quiz',
        questions: [
          {
            id: 'q1',
            type: 'multiple-choice',
            text: 'What is the capital of France?',
            options: ['London', 'Paris', 'Berlin', 'Madrid'],
            correctAnswer: 'Paris',
            points: 10,
          },
        ],
        passingScore: 70,
        maxAttempts: 3,
      };

      const response = await request(app)
        .post('/api/assessments')
        .send(assessmentData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(assessmentData.title);
      expect(response.body.questions).toHaveLength(1);

      assessmentId = response.body.id;
    });

    it('should retrieve the created assessment', async () => {
      const response = await request(app)
        .get(`/api/assessments/${assessmentId}`)
        .expect(200);

      expect(response.body.id).toBe(assessmentId);
      expect(response.body.title).toBe('Integration Test Assessment');
    });

    it('should update the assessment', async () => {
      const updateData = {
        title: 'Updated Integration Test Assessment',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/assessments/${assessmentId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
    });

    it('should get assessment questions', async () => {
      const response = await request(app)
        .get(`/api/assessments/${assessmentId}/questions`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].text).toBe('What is the capital of France?');
    });

    it('should submit assessment answers', async () => {
      const submissionData = {
        userId: 'test-user-123',
        answers: { q1: 'Paris' },
      };

      const response = await request(app)
        .post(`/api/assessments/${assessmentId}/submit`)
        .send(submissionData)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.assessmentId).toBe(assessmentId);
      expect(response.body.userId).toBe('test-user-123');
      expect(response.body.score).toBe(10);
      expect(response.body.passed).toBe(true);
    });

    it('should get assessment results for user', async () => {
      const response = await request(app)
        .get(`/api/assessments/${assessmentId}/results/test-user-123`)
        .expect(200);

      expect(response.body.assessmentId).toBe(assessmentId);
      expect(response.body.userId).toBe('test-user-123');
    });

    it('should get assessment analytics', async () => {
      const response = await request(app)
        .get(`/api/assessments/${assessmentId}/analytics`)
        .expect(200);

      expect(response.body).toHaveProperty('totalSubmissions');
      expect(response.body).toHaveProperty('averageScore');
      expect(response.body).toHaveProperty('passRate');
      expect(response.body.totalSubmissions).toBeGreaterThan(0);
    });

    it('should get user assessments', async () => {
      const response = await request(app)
        .get('/api/assessments/user/test-user-123/assessments')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should delete the assessment', async () => {
      await request(app)
        .delete(`/api/assessments/${assessmentId}`)
        .expect(204);
    });

    it('should return 404 for deleted assessment', async () => {
      await request(app)
        .get(`/api/assessments/${assessmentId}`)
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent assessment', async () => {
      await request(app)
        .get('/api/assessments/non-existent-id')
        .expect(404);
    });

    it('should return 404 for non-existent route', async () => {
      await request(app)
        .get('/api/assessments/non-existent-id/invalid-endpoint')
        .expect(404);
    });

    it('should handle invalid JSON', async () => {
      await request(app)
        .post('/api/assessments')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });
  });

  describe('Assessment Submission Edge Cases', () => {
    let assessmentId: string;

    beforeEach(async () => {
      // Create a test assessment
      const assessmentData = {
        title: 'Edge Case Test Assessment',
        description: 'Testing edge cases',
        type: 'quiz',
        questions: [
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
            type: 'short-answer',
            text: 'What is the capital of Japan?',
            correctAnswer: 'Tokyo',
            points: 10,
          },
        ],
        passingScore: 70,
        maxAttempts: 3,
      };

      const response = await request(app)
        .post('/api/assessments')
        .send(assessmentData)
        .expect(201);

      assessmentId = response.body.id;
    });

    afterEach(async () => {
      // Clean up
      if (assessmentId) {
        await request(app)
          .delete(`/api/assessments/${assessmentId}`)
          .expect(204);
      }
    });

    it('should handle partial answers', async () => {
      const submissionData = {
        userId: 'partial-user',
        answers: { q1: '4' }, // Only answer one question
      };

      const response = await request(app)
        .post(`/api/assessments/${assessmentId}/submit`)
        .send(submissionData)
        .expect(200);

      expect(response.body.score).toBe(10);
      expect(response.body.maxScore).toBe(20);
      expect(response.body.percentage).toBe(50);
      expect(response.body.passed).toBe(false);
    });

    it('should handle incorrect answers', async () => {
      const submissionData = {
        userId: 'incorrect-user',
        answers: { q1: '3', q2: 'Osaka' }, // Both wrong
      };

      const response = await request(app)
        .post(`/api/assessments/${assessmentId}/submit`)
        .send(submissionData)
        .expect(200);

      expect(response.body.score).toBe(0);
      expect(response.body.percentage).toBe(0);
      expect(response.body.passed).toBe(false);
    });

    it('should handle empty answers', async () => {
      const submissionData = {
        userId: 'empty-user',
        answers: {},
      };

      const response = await request(app)
        .post(`/api/assessments/${assessmentId}/submit`)
        .send(submissionData)
        .expect(200);

      expect(response.body.score).toBe(0);
      expect(response.body.percentage).toBe(0);
      expect(response.body.passed).toBe(false);
    });
  });
}); 