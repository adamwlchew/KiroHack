import { Request, Response, NextFunction } from 'express';
import { AppError, logger } from '@pageflow/utils';
import { ProgressService } from '../services/progressService';
import {
  ProgressUpdateRequest,
  ProgressQueryParams
} from '../models/progress';

export class ProgressController {
  private progressService: ProgressService;
  private logger = logger.child({ component: 'ProgressController' });

  constructor(progressService: ProgressService) {
    this.progressService = progressService;
  }

  /**
   * Get user progress for a specific learning path
   */
  getProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, pathId } = req.params;

      if (!userId || !pathId) {
        throw new AppError('User ID and Path ID are required', 400, 'MISSING_PARAMETERS');
      }

      const progress = await this.progressService.getProgress(userId, pathId);

      if (!progress) {
        res.status(404).json({
          success: false,
          message: 'Progress not found',
          data: null
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Progress retrieved successfully',
        data: progress
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all progress for a user
   */
  getUserProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { includeCompleted, limit, lastEvaluatedKey } = req.query;

      if (!userId) {
        throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
      }

      const params: ProgressQueryParams = {
        userId,
        includeCompleted: includeCompleted === 'true',
        limit: limit ? parseInt(limit as string, 10) : undefined,
        lastEvaluatedKey: lastEvaluatedKey ? JSON.parse(lastEvaluatedKey as string) : undefined
      };

      const result = await this.progressService.getUserProgress(params);

      res.status(200).json({
        success: true,
        message: 'User progress retrieved successfully',
        data: result.progress,
        pagination: {
          lastEvaluatedKey: result.lastEvaluatedKey
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update progress for a content item
   */
  updateProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, pathId } = req.params;
      const { moduleId, unitId, contentItemId, status, timeSpent, lastPosition, deviceId } = req.body;

      if (!userId || !pathId) {
        throw new AppError('User ID and Path ID are required', 400, 'MISSING_PARAMETERS');
      }

      if (!moduleId || !unitId || !contentItemId || !status || timeSpent === undefined) {
        throw new AppError(
          'Module ID, Unit ID, Content Item ID, status, and timeSpent are required',
          400,
          'MISSING_REQUIRED_FIELDS'
        );
      }

      const request: ProgressUpdateRequest = {
        userId,
        pathId,
        moduleId,
        unitId,
        contentItemId,
        status,
        timeSpent,
        lastPosition,
        deviceId: deviceId || 'unknown'
      };

      const result = await this.progressService.updateProgress(request);

      res.status(200).json({
        success: true,
        message: 'Progress updated successfully',
        data: {
          progress: result.progress,
          newMilestones: result.newMilestones,
          newAchievements: result.newAchievements,
          celebrations: result.celebrations
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user milestones
   */
  getUserMilestones = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { pathId } = req.query;

      if (!userId) {
        throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
      }

      const milestones = await this.progressService.getUserMilestones(
        userId,
        pathId as string
      );

      res.status(200).json({
        success: true,
        message: 'User milestones retrieved successfully',
        data: milestones
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user achievements
   */
  getUserAchievements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
      }

      const achievements = await this.progressService.getUserAchievements(userId);

      res.status(200).json({
        success: true,
        message: 'User achievements retrieved successfully',
        data: achievements
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark milestone celebration as shown
   */
  markMilestoneCelebrationShown = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, milestoneId } = req.params;

      if (!userId || !milestoneId) {
        throw new AppError('User ID and Milestone ID are required', 400, 'MISSING_PARAMETERS');
      }

      await this.progressService.markMilestoneCelebrationShown(userId, milestoneId);

      res.status(200).json({
        success: true,
        message: 'Milestone celebration marked as shown',
        data: null
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark achievement celebration as shown
   */
  markAchievementCelebrationShown = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, achievementId } = req.params;

      if (!userId || !achievementId) {
        throw new AppError('User ID and Achievement ID are required', 400, 'MISSING_PARAMETERS');
      }

      await this.progressService.markAchievementCelebrationShown(userId, achievementId);

      res.status(200).json({
        success: true,
        message: 'Achievement celebration marked as shown',
        data: null
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get recent achievements for celebration
   */
  getRecentAchievements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { hours } = req.query;

      if (!userId) {
        throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
      }

      const hoursNumber = hours ? parseInt(hours as string, 10) : 24;
      const achievements = await this.progressService.getRecentAchievements(userId, hoursNumber);

      res.status(200).json({
        success: true,
        message: 'Recent achievements retrieved successfully',
        data: achievements
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get recent celebrations for milestones and achievements
   */
  getRecentCelebrations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { 
        hours, 
        enableAnimations, 
        enableSounds, 
        reducedMotion, 
        noSounds, 
        screenReader, 
        highContrast 
      } = req.query;

      if (!userId) {
        throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
      }

      const hoursNumber = hours ? parseInt(hours as string, 10) : 24;
      
      const celebrationConfig = {
        enableAnimations: enableAnimations !== 'false',
        enableSounds: enableSounds !== 'false' && noSounds !== 'true',
        reducedMotion: reducedMotion === 'true'
      };

      const accessibilitySettings = {
        reducedMotion: reducedMotion === 'true',
        noSounds: noSounds === 'true',
        screenReader: screenReader === 'true',
        highContrast: highContrast === 'true'
      };

      const celebrations = await this.progressService.getRecentCelebrations(
        userId,
        hoursNumber,
        celebrationConfig,
        accessibilitySettings
      );

      res.status(200).json({
        success: true,
        message: 'Recent celebrations retrieved successfully',
        data: celebrations
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate progress visualization data
   */
  generateProgressVisualization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, pathId } = req.params;
      const { timeframeDays } = req.query;

      if (!userId || !pathId) {
        throw new AppError('User ID and Path ID are required', 400, 'MISSING_PARAMETERS');
      }

      const timeframe = timeframeDays ? parseInt(timeframeDays as string, 10) : 30;
      const visualization = await this.progressService.generateProgressVisualization(
        userId,
        pathId,
        timeframe
      );

      res.status(200).json({
        success: true,
        message: 'Progress visualization generated successfully',
        data: visualization
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate comprehensive analysis report
   */
  generateComprehensiveReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { reportType, pathId, startDate, endDate } = req.query;

      if (!userId) {
        throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
      }

      if (!reportType) {
        throw new AppError('Report type is required', 400, 'MISSING_REPORT_TYPE');
      }

      const customTimeframe = startDate && endDate ? {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      } : undefined;

      const report = await this.progressService.generateComprehensiveReport(
        userId,
        reportType as string,
        pathId as string,
        customTimeframe
      );

      res.status(200).json({
        success: true,
        message: 'Comprehensive analysis report generated successfully',
        data: report
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Detect strengths and improvement areas
   */
  detectStrengthsAndImprovements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { pathId } = req.query;

      if (!userId) {
        throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
      }

      const analysis = await this.progressService.detectStrengthsAndImprovements(
        userId,
        pathId as string
      );

      res.status(200).json({
        success: true,
        message: 'Strengths and improvement areas detected successfully',
        data: analysis
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Monitor user progress for stagnation and issues
   */
  monitorUserProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { pathId, stagnationThresholdDays, lowEngagementThreshold } = req.query;

      if (!userId) {
        throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
      }

      const config = {
        ...(stagnationThresholdDays && { stagnationThresholdDays: parseInt(stagnationThresholdDays as string, 10) }),
        ...(lowEngagementThreshold && { lowEngagementThreshold: parseInt(lowEngagementThreshold as string, 10) })
      };

      const alerts = await this.progressService.monitorUserProgress(
        userId,
        pathId as string,
        config
      );

      res.status(200).json({
        success: true,
        message: 'Progress monitoring completed successfully',
        data: alerts
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate alternative learning approaches
   */
  generateAlternativeLearningApproaches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, pathId } = req.params;
      const { strugglingAreas } = req.body;

      if (!userId || !pathId) {
        throw new AppError('User ID and Path ID are required', 400, 'MISSING_PARAMETERS');
      }

      if (!strugglingAreas || !Array.isArray(strugglingAreas)) {
        throw new AppError('Struggling areas must be provided as an array', 400, 'INVALID_STRUGGLING_AREAS');
      }

      const approaches = await this.progressService.generateAlternativeLearningApproaches(
        userId,
        pathId,
        strugglingAreas
      );

      res.status(200).json({
        success: true,
        message: 'Alternative learning approaches generated successfully',
        data: approaches
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Perform comprehensive progress monitoring with interventions
   */
  performComprehensiveMonitoring = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { pathId, stagnationThresholdDays, lowEngagementThreshold, monitoringFrequency } = req.query;

      if (!userId) {
        throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
      }

      const config = {
        ...(stagnationThresholdDays && { stagnationThresholdDays: parseInt(stagnationThresholdDays as string, 10) }),
        ...(lowEngagementThreshold && { lowEngagementThreshold: parseInt(lowEngagementThreshold as string, 10) }),
        ...(monitoringFrequency && { monitoringFrequency: monitoringFrequency as any })
      };

      const result = await this.progressService.performComprehensiveMonitoring(
        userId,
        pathId as string,
        config
      );

      res.status(200).json({
        success: true,
        message: 'Comprehensive progress monitoring completed successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}