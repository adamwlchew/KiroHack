import { Request, Response } from 'express';
import { AppError, logger } from '@pageflow/utils';
import { LearningPathService } from '../services/learningPathService';

export class LearningPathController {
  private static learningPathService = new LearningPathService();
  private static logger = logger.child({ component: 'LearningPathController' });

  /**
   * Create a new learning path
   */
  public static async createLearningPath(req: Request, res: Response): Promise<void> {
    try {
      const learningPathData = req.body;
      
      const learningPath = await this.learningPathService.createLearningPath(learningPathData);
      
      this.logger.info({
        message: 'Learning path created',
        learningPathId: learningPath.id
      });

      res.status(201).json({
        success: true,
        data: learningPath
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error creating learning path',
        error: error.message
      });
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create learning path' });
      }
    }
  }

  /**
   * Get all learning paths
   */
  public static async getAllLearningPaths(req: Request, res: Response): Promise<void> {
    try {
      const { category, difficulty, limit, offset } = req.query;
      
      const learningPaths = await this.learningPathService.getAllLearningPaths({
        category: category as string,
        difficulty: difficulty as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.json({
        success: true,
        data: learningPaths
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting learning paths',
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get learning paths' });
    }
  }

  /**
   * Get learning path by ID
   */
  public static async getLearningPathById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const learningPath = await this.learningPathService.getLearningPathById(id);
      
      if (!learningPath) {
        res.status(404).json({ error: 'Learning path not found' });
        return;
      }

      res.json({
        success: true,
        data: learningPath
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting learning path',
        learningPathId: req.params.id,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get learning path' });
    }
  }

  /**
   * Update learning path
   */
  public static async updateLearningPath(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updatedPath = await this.learningPathService.updateLearningPath(id, updateData);
      
      if (!updatedPath) {
        res.status(404).json({ error: 'Learning path not found' });
        return;
      }

      this.logger.info({
        message: 'Learning path updated',
        learningPathId: id
      });

      res.json({
        success: true,
        data: updatedPath
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error updating learning path',
        learningPathId: req.params.id,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to update learning path' });
    }
  }

  /**
   * Delete learning path
   */
  public static async deleteLearningPath(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const deleted = await this.learningPathService.deleteLearningPath(id);
      
      if (!deleted) {
        res.status(404).json({ error: 'Learning path not found' });
        return;
      }

      this.logger.info({
        message: 'Learning path deleted',
        learningPathId: id
      });

      res.json({
        success: true,
        message: 'Learning path deleted successfully'
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error deleting learning path',
        learningPathId: req.params.id,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to delete learning path' });
    }
  }

  /**
   * Generate personalized learning path
   */
  public static async generatePersonalizedPath(req: Request, res: Response): Promise<void> {
    try {
      const { userId, goals, preferences, priorKnowledge } = req.body;
      
      const personalizedPath = await this.learningPathService.generatePersonalizedPath({
        userId,
        goals,
        preferences,
        priorKnowledge
      });

      this.logger.info({
        message: 'Personalized learning path generated',
        userId,
        learningPathId: personalizedPath.id
      });

      res.json({
        success: true,
        data: personalizedPath
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error generating personalized learning path',
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to generate personalized learning path' });
    }
  }

  /**
   * Adapt learning path for user
   */
  public static async adaptLearningPath(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, progress, feedback } = req.body;
      
      const adaptedPath = await this.learningPathService.adaptLearningPath(id, {
        userId,
        progress,
        feedback
      });

      this.logger.info({
        message: 'Learning path adapted',
        learningPathId: id,
        userId
      });

      res.json({
        success: true,
        data: adaptedPath
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error adapting learning path',
        learningPathId: req.params.id,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to adapt learning path' });
    }
  }

  /**
   * Optimize learning path
   */
  public static async optimizeLearningPath(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { optimizationCriteria } = req.body;
      
      const optimizedPath = await this.learningPathService.optimizeLearningPath(id, optimizationCriteria);

      this.logger.info({
        message: 'Learning path optimized',
        learningPathId: id
      });

      res.json({
        success: true,
        data: optimizedPath
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error optimizing learning path',
        learningPathId: req.params.id,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to optimize learning path' });
    }
  }

  /**
   * Get user progress for learning path
   */
  public static async getUserProgress(req: Request, res: Response): Promise<void> {
    try {
      const { id, userId } = req.params;
      
      const progress = await this.learningPathService.getUserProgress(id, userId);

      res.json({
        success: true,
        data: progress
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting user progress',
        learningPathId: req.params.id,
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get user progress' });
    }
  }

  /**
   * Update user progress for learning path
   */
  public static async updateUserProgress(req: Request, res: Response): Promise<void> {
    try {
      const { id, userId } = req.params;
      const progressData = req.body;
      
      const updatedProgress = await this.learningPathService.updateUserProgress(id, userId, progressData);

      this.logger.info({
        message: 'User progress updated',
        learningPathId: id,
        userId
      });

      res.json({
        success: true,
        data: updatedProgress
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error updating user progress',
        learningPathId: req.params.id,
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to update user progress' });
    }
  }

  /**
   * Get learning path analytics
   */
  public static async getLearningPathAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const analytics = await this.learningPathService.getLearningPathAnalytics(id);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting learning path analytics',
        learningPathId: req.params.id,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get learning path analytics' });
    }
  }

  /**
   * Get learning path modules
   */
  public static async getLearningPathModules(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const modules = await this.learningPathService.getLearningPathModules(id);

      res.json({
        success: true,
        data: modules
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting learning path modules',
        learningPathId: req.params.id,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get learning path modules' });
    }
  }

  /**
   * Add module to learning path
   */
  public static async addModuleToPath(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const moduleData = req.body;
      
      const updatedPath = await this.learningPathService.addModuleToPath(id, moduleData);

      this.logger.info({
        message: 'Module added to learning path',
        learningPathId: id,
        moduleId: moduleData.id
      });

      res.json({
        success: true,
        data: updatedPath
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error adding module to learning path',
        learningPathId: req.params.id,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to add module to learning path' });
    }
  }

  /**
   * Update module in learning path
   */
  public static async updateModuleInPath(req: Request, res: Response): Promise<void> {
    try {
      const { id, moduleId } = req.params;
      const updateData = req.body;
      
      const updatedPath = await this.learningPathService.updateModuleInPath(id, moduleId, updateData);

      this.logger.info({
        message: 'Module updated in learning path',
        learningPathId: id,
        moduleId
      });

      res.json({
        success: true,
        data: updatedPath
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error updating module in learning path',
        learningPathId: req.params.id,
        moduleId: req.params.moduleId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to update module in learning path' });
    }
  }

  /**
   * Remove module from learning path
   */
  public static async removeModuleFromPath(req: Request, res: Response): Promise<void> {
    try {
      const { id, moduleId } = req.params;
      
      const updatedPath = await this.learningPathService.removeModuleFromPath(id, moduleId);

      this.logger.info({
        message: 'Module removed from learning path',
        learningPathId: id,
        moduleId
      });

      res.json({
        success: true,
        data: updatedPath
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error removing module from learning path',
        learningPathId: req.params.id,
        moduleId: req.params.moduleId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to remove module from learning path' });
    }
  }

  /**
   * Get path recommendations for user
   */
  public static async getPathRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { id, userId } = req.params;
      
      const recommendations = await this.learningPathService.getPathRecommendations(id, userId);

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting path recommendations',
        learningPathId: req.params.id,
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get path recommendations' });
    }
  }

  /**
   * Update user preferences for learning path
   */
  public static async updateUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      const { id, userId } = req.params;
      const preferences = req.body;
      
      const updatedPreferences = await this.learningPathService.updateUserPreferences(id, userId, preferences);

      this.logger.info({
        message: 'User preferences updated',
        learningPathId: id,
        userId
      });

      res.json({
        success: true,
        data: updatedPreferences
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error updating user preferences',
        learningPathId: req.params.id,
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to update user preferences' });
    }
  }
} 