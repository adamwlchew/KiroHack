import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { AppError, logger } from '@pageflow/utils';
import {
  Progress,
  ProgressStatus,
  Milestone,
  Achievement
} from '@pageflow/types';
import { ProgressRepository } from '../repositories/progressRepository';
import { MilestoneRepository } from '../repositories/milestoneRepository';
import { AchievementRepository } from '../repositories/achievementRepository';
import { MilestoneDetectionService } from './milestoneDetectionService';
import { CelebrationService, CelebrationNotification, CelebrationConfig } from './celebrationService';
import { 
  ProgressReportingService, 
  ProgressVisualizationData, 
  ComprehensiveAnalysisReport 
} from './progressReportingService';
import { 
  ProgressMonitoringService,
  ProgressStagnationAlert,
  LearningIntervention,
  AlternativeLearningApproach,
  ProgressMonitoringConfig
} from './progressMonitoringService';
import {
  ProgressUpdateRequest,
  ProgressQueryParams,
  MilestoneDetectionContext
} from '../models/progress';
import progressServiceConfig from '../config';

export class ProgressService {
  private progressRepository: ProgressRepository;
  private milestoneRepository: MilestoneRepository;
  private achievementRepository: AchievementRepository;
  private milestoneDetectionService: MilestoneDetectionService;
  private celebrationService: CelebrationService;
  private progressReportingService: ProgressReportingService;
  private progressMonitoringService: ProgressMonitoringService;
  private logger: any;

  constructor(dynamoDbClient: DynamoDBClient) {
    this.progressRepository = new ProgressRepository(
      dynamoDbClient,
      progressServiceConfig.aws.dynamoDbTableName
    );
    this.milestoneRepository = new MilestoneRepository(
      progressServiceConfig.aws.dynamoDbTableName,
      DynamoDBDocumentClient.from(dynamoDbClient)
    );
    this.achievementRepository = new AchievementRepository(
      progressServiceConfig.aws.dynamoDbTableName,
      DynamoDBDocumentClient.from(dynamoDbClient)
    );
    this.milestoneDetectionService = new MilestoneDetectionService(this.milestoneRepository);
    this.celebrationService = new CelebrationService();
    this.progressReportingService = new ProgressReportingService(
      this.progressRepository,
      this.milestoneRepository,
      this.achievementRepository
    );
    this.progressMonitoringService = new ProgressMonitoringService(this.progressRepository);
    this.logger = logger.child({ service: 'ProgressService' });
  }

  /**
   * Get user progress for a specific learning path
   */
  async getProgress(userId: string, pathId: string): Promise<Progress | null> {
    try {
      this.logger.info(`Getting progress for user ${userId}, path ${pathId}`);
      return await this.progressRepository.getProgress(userId, pathId);
    } catch (error) {
      this.logger.error(`Failed to get progress for user ${userId}, path ${pathId}: ${error}`);
      throw error;
    }
  }

  /**
   * Get all progress for a user
   */
  async getUserProgress(params: ProgressQueryParams): Promise<{
    progress: Progress[];
    lastEvaluatedKey?: Record<string, any>;
  }> {
    try {
      this.logger.info('Getting user progress', { params });
      return await this.progressRepository.getUserProgress(params);
    } catch (error) {
      this.logger.error('Failed to get user progress', { params, error });
      throw error;
    }
  }

  /**
   * Update progress and trigger milestone/achievement detection
   */
  async updateProgress(request: ProgressUpdateRequest): Promise<{
    progress: Progress;
    newMilestones: Milestone[];
    newAchievements: Achievement[];
    celebrations: CelebrationNotification[];
  }> {
    try {
      this.logger.info('Updating progress', { request });

      // Get previous progress for comparison
      const previousProgress = await this.progressRepository.getProgress(
        request.userId,
        request.pathId
      );

      // Update progress
      const updatedProgress = await this.progressRepository.updateProgress(request);

      // Create default milestones if this is the first progress update
      if (!previousProgress) {
        await this.milestoneRepository.createDefaultMilestones(
          request.userId,
          request.pathId
        );
      }

      // Detect and create new milestones
      const newMilestones = await this.milestoneDetectionService.detectAndAchieveMilestones({
        userId: request.userId,
        pathId: request.pathId,
        currentProgress: updatedProgress,
        previousProgress: previousProgress || undefined,
        recentActivity: this.extractRecentActivity(updatedProgress, request)
      });

      // Detect and create new achievements
      const newAchievements = await this.detectAndCreateAchievements(
        request.userId,
        request.pathId,
        newMilestones
      );

      // Create celebration notifications
      const milestoneCelebrations = this.celebrationService.createMilestoneCelebrations(newMilestones);
      const achievementCelebrations = this.celebrationService.createAchievementCelebrations(newAchievements);
      const allCelebrations = [...milestoneCelebrations, ...achievementCelebrations];
      const celebrations = this.celebrationService.createCelebrationSequence(allCelebrations);

      this.logger.info('Progress updated successfully', {
        userId: request.userId,
        pathId: request.pathId,
        newMilestonesCount: newMilestones.length,
        newAchievementsCount: newAchievements.length
      });

      return {
        progress: updatedProgress,
        newMilestones,
        newAchievements,
        celebrations
      };
    } catch (error) {
      this.logger.error('Failed to update progress', { request, error });
      throw error;
    }
  }

  /**
   * Get user milestones
   */
  async getUserMilestones(userId: string, pathId?: string): Promise<Milestone[]> {
    try {
      this.logger.info('Getting user milestones', { userId, pathId });
      return await this.milestoneRepository.getUserMilestones(userId, pathId);
    } catch (error) {
      this.logger.error('Failed to get user milestones', { userId, pathId, error });
      throw error;
    }
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      this.logger.info('Getting user achievements', { userId });
      return await this.achievementRepository.getUserAchievements(userId);
    } catch (error) {
      this.logger.error('Failed to get user achievements', { userId, error });
      throw error;
    }
  }

  /**
   * Mark milestone celebration as shown
   */
  async markMilestoneCelebrationShown(userId: string, milestoneId: string): Promise<void> {
    try {
      this.logger.info('Marking milestone celebration as shown', { userId, milestoneId });
      await this.milestoneRepository.markCelebrationShown(userId, milestoneId);
    } catch (error) {
      this.logger.error('Failed to mark milestone celebration as shown', { userId, milestoneId, error });
      throw error;
    }
  }

  /**
   * Mark achievement celebration as shown
   */
  async markAchievementCelebrationShown(userId: string, achievementId: string): Promise<void> {
    try {
      this.logger.info('Marking achievement celebration as shown', { userId, achievementId });
      await this.achievementRepository.markCelebrationShown(userId, achievementId);
    } catch (error) {
      this.logger.error('Failed to mark achievement celebration as shown', { userId, achievementId, error });
      throw error;
    }
  }

  /**
   * Get recent achievements for celebration
   */
  async getRecentAchievements(userId: string, hours: number = 24): Promise<Achievement[]> {
    try {
      this.logger.info('Getting recent achievements', { userId, hours });
      return await this.achievementRepository.getRecentAchievements(userId, hours);
    } catch (error) {
      this.logger.error('Failed to get recent achievements', { userId, hours, error });
      throw error;
    }
  }

  /**
   * Get celebrations for recent milestones and achievements
   */
  async getRecentCelebrations(
    userId: string,
    hours: number = 24,
    celebrationConfig?: Partial<CelebrationConfig>,
    accessibilitySettings?: {
      reducedMotion?: boolean;
      noSounds?: boolean;
      screenReader?: boolean;
      highContrast?: boolean;
    }
  ): Promise<CelebrationNotification[]> {
    try {
      this.logger.info('Getting recent celebrations', { userId, hours });

      // Get recent milestones and achievements
      const recentMilestones = await this.getRecentMilestones(userId, hours);
      const recentAchievements = await this.getRecentAchievements(userId, hours);

      // Create celebrations
      const milestoneCelebrations = this.celebrationService.createMilestoneCelebrations(
        recentMilestones,
        celebrationConfig
      );
      const achievementCelebrations = this.celebrationService.createAchievementCelebrations(
        recentAchievements,
        celebrationConfig
      );

      let allCelebrations = [...milestoneCelebrations, ...achievementCelebrations];

      // Adapt for accessibility if settings provided
      if (accessibilitySettings) {
        allCelebrations = this.celebrationService.adaptForAccessibility(
          allCelebrations,
          accessibilitySettings
        );
      }

      // Create celebration sequence
      const celebrations = this.celebrationService.createCelebrationSequence(allCelebrations);

      this.logger.info('Recent celebrations retrieved', {
        userId,
        celebrationsCount: celebrations.length
      });

      return celebrations;
    } catch (error) {
      this.logger.error('Failed to get recent celebrations', { userId, hours, error });
      throw error;
    }
  }

  /**
   * Generate progress visualization data
   */
  async generateProgressVisualization(
    userId: string,
    pathId: string,
    timeframeDays: number = 30
  ): Promise<ProgressVisualizationData> {
    try {
      this.logger.info('Generating progress visualization', { userId, pathId, timeframeDays });
      return await this.progressReportingService.generateProgressVisualization(
        userId,
        pathId,
        timeframeDays
      );
    } catch (error) {
      this.logger.error('Failed to generate progress visualization', { userId, pathId, error });
      throw error;
    }
  }

  /**
   * Generate comprehensive analysis report
   */
  async generateComprehensiveReport(
    userId: string,
    reportType: any,
    pathId?: string,
    customTimeframe?: { startDate: Date; endDate: Date }
  ): Promise<ComprehensiveAnalysisReport> {
    try {
      this.logger.info('Generating comprehensive report', { userId, reportType, pathId });
      return await this.progressReportingService.generateComprehensiveReport(
        userId,
        reportType,
        pathId,
        customTimeframe
      );
    } catch (error) {
      this.logger.error('Failed to generate comprehensive report', { userId, reportType, error });
      throw error;
    }
  }

  /**
   * Detect strengths and improvement areas
   */
  async detectStrengthsAndImprovements(
    userId: string,
    pathId?: string
  ): Promise<{
    strengths: string[];
    improvementAreas: string[];
    recommendations: string[];
  }> {
    try {
      this.logger.info('Detecting strengths and improvements', { userId, pathId });
      return await this.progressReportingService.detectStrengthsAndImprovements(userId, pathId);
    } catch (error) {
      this.logger.error('Failed to detect strengths and improvements', { userId, pathId, error });
      throw error;
    }
  }

  /**
   * Monitor user progress and detect stagnation or issues
   */
  async monitorUserProgress(
    userId: string,
    pathId?: string,
    config?: Partial<ProgressMonitoringConfig>
  ): Promise<ProgressStagnationAlert[]> {
    try {
      this.logger.info('Monitoring user progress for issues', { userId, pathId });
      return await this.progressMonitoringService.monitorUserProgress(userId, pathId, config);
    } catch (error) {
      this.logger.error('Failed to monitor user progress', { userId, pathId, error });
      throw error;
    }
  }

  /**
   * Generate alternative learning approaches for struggling users
   */
  async generateAlternativeLearningApproaches(
    userId: string,
    pathId: string,
    strugglingAreas: string[]
  ): Promise<AlternativeLearningApproach[]> {
    try {
      this.logger.info('Generating alternative learning approaches', { userId, pathId, strugglingAreas });
      return await this.progressMonitoringService.generateAlternativeLearningApproaches(
        userId,
        pathId,
        strugglingAreas
      );
    } catch (error) {
      this.logger.error('Failed to generate alternative learning approaches', { userId, pathId, error });
      throw error;
    }
  }

  /**
   * Create learning interventions based on detected issues
   */
  async createLearningInterventions(
    alerts: ProgressStagnationAlert[]
  ): Promise<LearningIntervention[]> {
    try {
      this.logger.info('Creating learning interventions', { alertsCount: alerts.length });
      return await this.progressMonitoringService.createLearningInterventions(alerts);
    } catch (error) {
      this.logger.error('Failed to create learning interventions', { error });
      throw error;
    }
  }

  /**
   * Comprehensive progress monitoring with interventions
   */
  async performComprehensiveMonitoring(
    userId: string,
    pathId?: string,
    config?: Partial<ProgressMonitoringConfig>
  ): Promise<{
    alerts: ProgressStagnationAlert[];
    interventions: LearningIntervention[];
    alternativeApproaches: AlternativeLearningApproach[];
  }> {
    try {
      this.logger.info('Performing comprehensive progress monitoring', { userId, pathId });

      // Monitor for issues
      const alerts = await this.monitorUserProgress(userId, pathId, config);

      // Create interventions for detected issues
      const interventions = await this.createLearningInterventions(alerts);

      // Generate alternative approaches for struggling areas
      const strugglingAreas = [...new Set(alerts.flatMap(alert => alert.affectedAreas))];
      const alternativeApproaches = pathId && strugglingAreas.length > 0
        ? await this.generateAlternativeLearningApproaches(userId, pathId, strugglingAreas)
        : [];

      this.logger.info('Comprehensive monitoring completed', {
        userId,
        pathId,
        alertsCount: alerts.length,
        interventionsCount: interventions.length,
        alternativeApproachesCount: alternativeApproaches.length
      });

      return {
        alerts,
        interventions,
        alternativeApproaches
      };
    } catch (error) {
      this.logger.error('Failed to perform comprehensive monitoring', { userId, pathId, error });
      throw error;
    }
  }

  /**
   * Get recent milestones for a user
   */
  private async getRecentMilestones(userId: string, hours: number): Promise<Milestone[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const allMilestones = await this.milestoneRepository.getUserMilestones(userId);
    
    return allMilestones.filter(milestone => 
      milestone.achievedAt && 
      milestone.achievedAt >= cutoffTime &&
      !milestone.celebrationShown
    );
  }



  /**
   * Detect and create new achievements based on milestones
   */
  private async detectAndCreateAchievements(
    userId: string,
    pathId: string,
    newMilestones: Milestone[]
  ): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];

    try {
      for (const milestone of newMilestones) {
        // Check if achievement already exists for this milestone type
        const hasExisting = await this.achievementRepository.hasAchievementType(
          userId,
          this.mapMilestoneToAchievementType(milestone.type),
          { milestoneId: milestone.id }
        );

        if (!hasExisting) {
          const achievement = await this.achievementRepository.createAchievement(
            userId,
            this.mapMilestoneToAchievementType(milestone.type),
            this.getAchievementTitle(milestone.type),
            this.getAchievementDescription(milestone.type),
            this.getAchievementIconUrl(milestone.type),
            { milestoneId: milestone.id, pathId }
          );
          newAchievements.push(achievement);
        }
      }

      return newAchievements;
    } catch (error) {
      this.logger.error('Failed to detect achievements', { userId, pathId, error });
      return newAchievements; // Return what we have so far
    }
  }

  /**
   * Extract recent activity from progress update
   */
  private extractRecentActivity(progress: Progress, request: ProgressUpdateRequest): any[] {
    // Find the specific content that was just updated
    const moduleProgress = progress.moduleProgress.find(m => m.moduleId === request.moduleId);
    const unitProgress = moduleProgress?.unitProgress.find(u => u.unitId === request.unitId);
    const contentProgress = unitProgress?.contentProgress.find(c => c.contentItemId === request.contentItemId);

    return contentProgress ? [contentProgress] : [];
  }



  /**
   * Map milestone type to achievement type
   */
  private mapMilestoneToAchievementType(milestoneType: string): any {
    const mapping: Record<string, string> = {
      'path_started': 'milestone',
      'module_completed': 'completion',
      'path_completed': 'completion',
      'streak_achieved': 'streak',
      'mastery_demonstrated': 'mastery',
      'perseverance_shown': 'milestone'
    };
    return mapping[milestoneType] || 'milestone';
  }

  /**
   * Get achievement title based on milestone type
   */
  private getAchievementTitle(milestoneType: string): string {
    const titles: Record<string, string> = {
      'path_started': 'First Steps',
      'module_completed': 'Module Master',
      'path_completed': 'Path Champion',
      'streak_achieved': 'Consistency Star',
      'mastery_demonstrated': 'Subject Expert',
      'perseverance_shown': 'Never Give Up'
    };
    return titles[milestoneType] || 'Achievement Unlocked';
  }

  /**
   * Get achievement description based on milestone type
   */
  private getAchievementDescription(milestoneType: string): string {
    const descriptions: Record<string, string> = {
      'path_started': 'You\'ve taken the first step on your learning journey!',
      'module_completed': 'You\'ve successfully completed a learning module!',
      'path_completed': 'You\'ve completed an entire learning path!',
      'streak_achieved': 'You\'ve maintained consistent learning habits!',
      'mastery_demonstrated': 'You\'ve demonstrated mastery of the subject!',
      'perseverance_shown': 'You\'ve shown great perseverance in your learning!'
    };
    return descriptions[milestoneType] || 'You\'ve achieved something great!';
  }

  /**
   * Get achievement icon URL based on milestone type
   */
  private getAchievementIconUrl(milestoneType: string): string {
    const icons: Record<string, string> = {
      'path_started': '/icons/achievements/first-steps.svg',
      'module_completed': '/icons/achievements/module-master.svg',
      'path_completed': '/icons/achievements/path-champion.svg',
      'streak_achieved': '/icons/achievements/consistency-star.svg',
      'mastery_demonstrated': '/icons/achievements/subject-expert.svg',
      'perseverance_shown': '/icons/achievements/never-give-up.svg'
    };
    return icons[milestoneType] || '/icons/achievements/default.svg';
  }
}