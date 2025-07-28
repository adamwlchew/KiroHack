import { Request, Response, NextFunction } from 'express';
import { logger } from '@pageflow/utils';
import { assessmentService } from '../services/assessmentService';

export const assessmentController = {
  // Get all assessments
  getAllAssessments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assessments = await assessmentService.getAllAssessments();
      res.json(assessments);
    } catch (error) {
      next(error);
    }
  },

  // Get assessment by ID
  getAssessmentById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const assessment = await assessmentService.getAssessmentById(id);
      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      res.json(assessment);
    } catch (error) {
      next(error);
    }
  },

  // Create new assessment
  createAssessment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assessmentData = req.body;
      const assessment = await assessmentService.createAssessment(assessmentData);
      res.status(201).json(assessment);
    } catch (error) {
      next(error);
    }
  },

  // Update assessment
  updateAssessment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const assessment = await assessmentService.updateAssessment(id, updateData);
      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      res.json(assessment);
    } catch (error) {
      next(error);
    }
  },

  // Delete assessment
  deleteAssessment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const deleted = await assessmentService.deleteAssessment(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  // Get assessment questions
  getAssessmentQuestions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const assessment = await assessmentService.getAssessmentById(id);
      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      res.json(assessment.questions);
    } catch (error) {
      next(error);
    }
  },

  // Submit assessment
  submitAssessment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { userId, answers } = req.body;
      const result = await assessmentService.submitAssessment(id, userId, answers);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  // Get assessment results
  getAssessmentResults: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, userId } = req.params;
      const results = await assessmentService.getAssessmentResults(id, userId);
      res.json(results);
    } catch (error) {
      next(error);
    }
  },

  // Get assessment analytics
  getAssessmentAnalytics: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const analytics = await assessmentService.getAssessmentAnalytics(id);
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  },

  // Get user assessments
  getUserAssessments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      // For now, return all assessments since we don't have user-specific filtering
      // In a real implementation, this would filter by user
      const assessments = await assessmentService.getAllAssessments();
      res.json(assessments);
    } catch (error) {
      next(error);
    }
  },
}; 