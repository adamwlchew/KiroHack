import request from 'supertest';
import express from 'express';
import { assessmentRoutes } from '../routes/assessmentRoutes';
import { errorHandler } from '../middleware/errorHandler';

describe('Assessment Service Performance Tests', () => {
  let app: express.Application;
  let assessmentIds: string[] = [];

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

  afterAll(async () => {
    // Clean up test assessments
    for (const id of assessmentIds) {
      try {
        await request(app).delete(`/api/assessments/${id}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Load Testing', () => {
    it('should handle multiple concurrent assessment creations', async () => {
      const startTime = Date.now();
      const concurrentRequests = 10;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const assessmentData = {
          title: `Performance Test Assessment ${i}`,
          description: `Assessment ${i} for performance testing`,
          type: 'quiz',
          questions: [
            {
              id: 'q1',
              type: 'multiple-choice',
              text: `Question ${i}`,
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 'A',
              points: 10,
            },
          ],
          passingScore: 70,
          maxAttempts: 3,
        };

        promises.push(
          request(app)
            .post('/api/assessments')
            .send(assessmentData)
            .expect(201)
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Store assessment IDs for cleanup
      results.forEach(result => {
        assessmentIds.push(result.body.id);
      });

      // Performance assertions
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(results).toHaveLength(concurrentRequests);
      
      results.forEach(result => {
        expect(result.body).toHaveProperty('id');
        expect(result.body).toHaveProperty('title');
      });

      console.log(`Created ${concurrentRequests} assessments in ${duration}ms`);
    });

    it('should handle multiple concurrent assessment retrievals', async () => {
      if (assessmentIds.length === 0) {
        console.log('Skipping test - no assessments available');
        return;
      }

      const startTime = Date.now();
      const concurrentRequests = 20;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const assessmentId = assessmentIds[i % assessmentIds.length];
        promises.push(
          request(app)
            .get(`/api/assessments/${assessmentId}`)
            .expect(200)
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      expect(results).toHaveLength(concurrentRequests);

      console.log(`Retrieved ${concurrentRequests} assessments in ${duration}ms`);
    });

    it('should handle multiple concurrent assessment submissions', async () => {
      if (assessmentIds.length === 0) {
        console.log('Skipping test - no assessments available');
        return;
      }

      const startTime = Date.now();
      const concurrentRequests = 15;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const assessmentId = assessmentIds[i % assessmentIds.length];
        const submissionData = {
          userId: `performance-user-${i}`,
          answers: { q1: 'A' },
        };

        promises.push(
          request(app)
            .post(`/api/assessments/${assessmentId}/submit`)
            .send(submissionData)
            .expect(200)
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(4000); // Should complete within 4 seconds
      expect(results).toHaveLength(concurrentRequests);

      results.forEach(result => {
        expect(result.body).toHaveProperty('score');
        expect(result.body).toHaveProperty('passed');
      });

      console.log(`Submitted ${concurrentRequests} assessments in ${duration}ms`);
    });
  });

  describe('Response Time Testing', () => {
    it('should respond to health check within 100ms', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/health')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(100);
      console.log(`Health check response time: ${responseTime}ms`);
    });

    it('should create assessment within 500ms', async () => {
      const assessmentData = {
        title: 'Response Time Test Assessment',
        description: 'Testing response time for assessment creation',
        type: 'quiz',
        questions: [],
        passingScore: 70,
        maxAttempts: 3,
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/assessments')
        .send(assessmentData)
        .expect(201);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      assessmentIds.push(response.body.id);

      expect(responseTime).toBeLessThan(500);
      console.log(`Assessment creation response time: ${responseTime}ms`);
    });

    it('should retrieve assessment within 200ms', async () => {
      if (assessmentIds.length === 0) {
        console.log('Skipping test - no assessments available');
        return;
      }

      const assessmentId = assessmentIds[0];
      const startTime = Date.now();
      
      await request(app)
        .get(`/api/assessments/${assessmentId}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(200);
      console.log(`Assessment retrieval response time: ${responseTime}ms`);
    });
  });

  describe('Memory Usage Testing', () => {
    it('should not leak memory during multiple operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const operations = 50;
      const promises = [];

      for (let i = 0; i < operations; i++) {
        const assessmentData = {
          title: `Memory Test Assessment ${i}`,
          description: `Assessment ${i} for memory testing`,
          type: 'quiz',
          questions: [],
          passingScore: 70,
          maxAttempts: 3,
        };

        promises.push(
          request(app)
            .post('/api/assessments')
            .send(assessmentData)
            .expect(201)
        );
      }

      const results = await Promise.all(promises);
      
      // Store IDs for cleanup
      results.forEach(result => {
        assessmentIds.push(result.body.id);
      });

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      
      console.log(`Memory usage: ${Math.round(memoryIncrease / 1024 / 1024 * 100) / 100}MB increase`);
    });
  });

  describe('Error Recovery Testing', () => {
    it('should handle errors gracefully under load', async () => {
      const promises = [];
      const validRequests = 5;
      const invalidRequests = 5;

      // Valid requests
      for (let i = 0; i < validRequests; i++) {
        const assessmentData = {
          title: `Error Recovery Test ${i}`,
          description: 'Valid assessment data',
          type: 'quiz',
          questions: [],
          passingScore: 70,
          maxAttempts: 3,
        };

        promises.push(
          request(app)
            .post('/api/assessments')
            .send(assessmentData)
            .expect(201)
        );
      }

      // Invalid requests (should fail) - use non-existent endpoint
      for (let i = 0; i < invalidRequests; i++) {
        promises.push(
          request(app)
            .get('/api/assessments/non-existent-id')
            .expect(404)
        );
      }

      const results = await Promise.all(promises);
      
      // Store valid assessment IDs for cleanup
      results.slice(0, validRequests).forEach(result => {
        if (result.body.id) {
          assessmentIds.push(result.body.id);
        }
      });

      expect(results).toHaveLength(validRequests + invalidRequests);
      
      // Valid requests should succeed
      results.slice(0, validRequests).forEach(result => {
        expect(result.status).toBe(201);
      });

      // Invalid requests should fail
      results.slice(validRequests).forEach(result => {
        expect(result.status).toBe(404);
      });
    });
  });
}); 