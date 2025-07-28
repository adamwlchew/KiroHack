import { Request, Response } from 'express';
import { AppError, logger } from '@pageflow/utils';
import { PersonalizationService } from '../services/personalizationService';

export class PersonalizationController {
  private static personalizationService = new PersonalizationService();
  private static logger = logger.child({ component: 'PersonalizationController' });

  /**
   * Detect learning style for user
   */
  public static async detectLearningStyle(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { assessmentData, behaviorData } = req.body;
      
      const learningStyle = await this.personalizationService.detectLearningStyle(userId, {
        assessmentData,
        behaviorData
      });

      this.logger.info({
        message: 'Learning style detected',
        userId,
        learningStyle: learningStyle.type
      });

      res.json({
        success: true,
        data: learningStyle
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error detecting learning style',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to detect learning style' });
    }
  }

  /**
   * Get learning style for user
   */
  public static async getLearningStyle(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      const learningStyle = await this.personalizationService.getLearningStyle(userId);

      res.json({
        success: true,
        data: learningStyle
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting learning style',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get learning style' });
    }
  }

  /**
   * Update learning style for user
   */
  public static async updateLearningStyle(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const learningStyleData = req.body;
      
      const updatedStyle = await this.personalizationService.updateLearningStyle(userId, learningStyleData);

      this.logger.info({
        message: 'Learning style updated',
        userId,
        learningStyle: updatedStyle.type
      });

      res.json({
        success: true,
        data: updatedStyle
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error updating learning style',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to update learning style' });
    }
  }

  /**
   * Get learning preferences for user
   */
  public static async getLearningPreferences(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      const preferences = await this.personalizationService.getLearningPreferences(userId);

      res.json({
        success: true,
        data: preferences
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting learning preferences',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get learning preferences' });
    }
  }

  /**
   * Update learning preferences for user
   */
  public static async updateLearningPreferences(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const preferences = req.body;
      
      const updatedPreferences = await this.personalizationService.updateLearningPreferences(userId, preferences);

      this.logger.info({
        message: 'Learning preferences updated',
        userId
      });

      res.json({
        success: true,
        data: updatedPreferences
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error updating learning preferences',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to update learning preferences' });
    }
  }

  /**
   * Assess learning preferences
   */
  public static async assessLearningPreferences(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { assessmentData } = req.body;
      
      const assessment = await this.personalizationService.assessLearningPreferences(userId, assessmentData);

      this.logger.info({
        message: 'Learning preferences assessed',
        userId
      });

      res.json({
        success: true,
        data: assessment
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error assessing learning preferences',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to assess learning preferences' });
    }
  }

  /**
   * Create adaptive profile for user
   */
  public static async createAdaptiveProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const profileData = req.body;
      
      const adaptiveProfile = await this.personalizationService.createAdaptiveProfile(userId, profileData);

      this.logger.info({
        message: 'Adaptive profile created',
        userId
      });

      res.json({
        success: true,
        data: adaptiveProfile
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error creating adaptive profile',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to create adaptive profile' });
    }
  }

  /**
   * Get adaptive profile for user
   */
  public static async getAdaptiveProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      const adaptiveProfile = await this.personalizationService.getAdaptiveProfile(userId);

      res.json({
        success: true,
        data: adaptiveProfile
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting adaptive profile',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get adaptive profile' });
    }
  }

  /**
   * Update adaptive profile for user
   */
  public static async updateAdaptiveProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const profileData = req.body;
      
      const updatedProfile = await this.personalizationService.updateAdaptiveProfile(userId, profileData);

      this.logger.info({
        message: 'Adaptive profile updated',
        userId
      });

      res.json({
        success: true,
        data: updatedProfile
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error updating adaptive profile',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to update adaptive profile' });
    }
  }

  /**
   * Adjust difficulty for user
   */
  public static async adjustDifficulty(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { contentId, performance, feedback } = req.body;
      
      const adjustedDifficulty = await this.personalizationService.adjustDifficulty(userId, {
        contentId,
        performance,
        feedback
      });

      this.logger.info({
        message: 'Difficulty adjusted',
        userId,
        contentId,
        newDifficulty: adjustedDifficulty.level
      });

      res.json({
        success: true,
        data: adjustedDifficulty
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error adjusting difficulty',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to adjust difficulty' });
    }
  }

  /**
   * Get difficulty level for user
   */
  public static async getDifficultyLevel(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { contentId } = req.query;
      
      const difficultyLevel = await this.personalizationService.getDifficultyLevel(userId, contentId as string);

      res.json({
        success: true,
        data: difficultyLevel
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting difficulty level',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get difficulty level' });
    }
  }

  /**
   * Update difficulty level for user
   */
  public static async updateDifficultyLevel(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { contentId, level, reason } = req.body;
      
      const updatedDifficulty = await this.personalizationService.updateDifficultyLevel(userId, {
        contentId,
        level,
        reason
      });

      this.logger.info({
        message: 'Difficulty level updated',
        userId,
        contentId,
        level
      });

      res.json({
        success: true,
        data: updatedDifficulty
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error updating difficulty level',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to update difficulty level' });
    }
  }

  /**
   * Get learning goals for user
   */
  public static async getLearningGoals(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      const learningGoals = await this.personalizationService.getLearningGoals(userId);

      res.json({
        success: true,
        data: learningGoals
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error getting learning goals',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to get learning goals' });
    }
  }

  /**
   * Set learning goals for user
   */
  public static async setLearningGoals(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const goals = req.body;
      
      const learningGoals = await this.personalizationService.setLearningGoals(userId, goals);

      this.logger.info({
        message: 'Learning goals set',
        userId
      });

      res.json({
        success: true,
        data: learningGoals
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error setting learning goals',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to set learning goals' });
    }
  }

  /**
   * Update learning goals for user
   */
  public static async updateLearningGoals(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const goals = req.body;
      
      const updatedGoals = await this.personalizationService.updateLearningGoals(userId, goals);

      this.logger.info({
        message: 'Learning goals updated',
        userId
      });

      res.json({
        success: true,
        data: updatedGoals
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Error updating learning goals',
        userId: req.params.userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Failed to update learning goals' });
    }
  }
} 