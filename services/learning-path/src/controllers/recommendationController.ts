import { Request, Response } from 'express';
import { AppError, logger } from '@pageflow/utils';
import { RecommendationService } from '../services/recommendationService';

export class RecommendationController {
  private static recommendationService = new RecommendationService();
  private static logger = logger.child({ component: 'RecommendationController' });

  /**
   * Get content recommendations for user
   */
  public static async getContentRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit, category, difficulty } = req.query;
      
      const recommendations = await this.recommendationService.getContentRecommendations(userId, {
        limit: limit ? parseInt(limit as string) : 10,
        category: category as string,
        difficulty: difficulty as string
      });

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting content recommendations',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get content recommendations' });
    }
  }

  /**
   * Submit content feedback
   */
  public static async submitContentFeedback(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { contentId, rating, feedback, interactionType } = req.body;
      
      await this.recommendationService.submitContentFeedback(userId, {
        contentId,
        rating,
        feedback,
        interactionType
      });

      this.logger.info({
        message: 'Content feedback submitted',
        userId,
        contentId
      });

      res.json({
        success: true,
        message: 'Feedback submitted successfully'
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error submitting content feedback',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  }

  /**
   * Get similar content
   */
  public static async getSimilarContent(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { contentId, limit } = req.query;
      
      const similarContent = await this.recommendationService.getSimilarContent(userId, contentId as string, {
        limit: limit ? parseInt(limit as string) : 5
      });

      res.json({
        success: true,
        data: similarContent
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting similar content',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get similar content' });
    }
  }

  /**
   * Get learning path recommendations
   */
  public static async getLearningPathRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { goals, preferences, limit } = req.query;
      
      const recommendations = await this.recommendationService.getLearningPathRecommendations(userId, {
        goals: goals as string,
        preferences: preferences ? JSON.parse(preferences as string) : undefined,
        limit: limit ? parseInt(limit as string) : 5
      });

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting learning path recommendations',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get learning path recommendations' });
    }
  }

  /**
   * Update learning preferences
   */
  public static async updateLearningPreferences(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const preferences = req.body;
      
      await this.recommendationService.updateLearningPreferences(userId, preferences);

      this.logger.info({
        message: 'Learning preferences updated',
        userId
      });

      res.json({
        success: true,
        message: 'Preferences updated successfully'
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error updating learning preferences',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  }

  /**
   * Get next steps recommendations
   */
  public static async getNextStepsRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { currentPath, progress } = req.query;
      
      const nextSteps = await this.recommendationService.getNextStepsRecommendations(userId, {
        currentPath: currentPath as string,
        progress: progress ? JSON.parse(progress as string) : undefined
      });

      res.json({
        success: true,
        data: nextSteps
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting next steps recommendations',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get next steps recommendations' });
    }
  }

  /**
   * Get collaborative recommendations
   */
  public static async getCollaborativeRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit } = req.query;
      
      const recommendations = await this.recommendationService.getCollaborativeRecommendations(userId, {
        limit: limit ? parseInt(limit as string) : 10
      });

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting collaborative recommendations',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get collaborative recommendations' });
    }
  }

  /**
   * Submit rating for collaborative filtering
   */
  public static async submitRating(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { contentId, rating, timestamp } = req.body;
      
      await this.recommendationService.submitRating(userId, {
        contentId,
        rating,
        timestamp: timestamp || new Date()
      });

      this.logger.info({
        message: 'Rating submitted',
        userId,
        contentId,
        rating
      });

      res.json({
        success: true,
        message: 'Rating submitted successfully'
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error submitting rating',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to submit rating' });
    }
  }

  /**
   * Get trending content
   */
  public static async getTrendingContent(req: Request, res: Response): Promise<void> {
    try {
      const { limit, timeframe } = req.query;
      
      const trendingContent = await this.recommendationService.getTrendingContent({
        limit: limit ? parseInt(limit as string) : 10,
        timeframe: timeframe as string || '7d'
      });

      res.json({
        success: true,
        data: trendingContent
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting trending content',
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get trending content' });
    }
  }

  /**
   * Get popular content
   */
  public static async getPopularContent(req: Request, res: Response): Promise<void> {
    try {
      const { limit, category } = req.query;
      
      const popularContent = await this.recommendationService.getPopularContent({
        limit: limit ? parseInt(limit as string) : 10,
        category: category as string
      });

      res.json({
        success: true,
        data: popularContent
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting popular content',
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get popular content' });
    }
  }

  /**
   * Get new content
   */
  public static async getNewContent(req: Request, res: Response): Promise<void> {
    try {
      const { limit, category } = req.query;
      
      const newContent = await this.recommendationService.getNewContent({
        limit: limit ? parseInt(limit as string) : 10,
        category: category as string
      });

      res.json({
        success: true,
        data: newContent
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting new content',
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get new content' });
    }
  }
} 