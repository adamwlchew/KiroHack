import { logger } from '@pageflow/utils';
import {
  Progress,
  ProgressStatus
} from '@pageflow/types';
import { ProgressRepository } from '../repositories/progressRepository';

export interface ProgressStagnationAlert {
  userId: string;
  pathId: string;
  alertType: 'stagnation' | 'regression' | 'low_engagement' | 'difficulty_spike';
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
  description: string;
  affectedAreas: string[];
  suggestedInterventions: LearningIntervention[];
  metadata: Record<string, any>;
}

export interface LearningIntervention {
  id: string;
  type: 'content_adjustment' | 'pacing_change' | 'learning_style' | 'motivation' | 'support';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: 'high' | 'medium' | 'low';
  actionItems: string[];
  alternativeApproaches: AlternativeLearningApproach[];
  metadata: Record<string, any>;
}

export interface AlternativeLearningApproach {
  id: string;
  name: string;
  description: string;
  contentType: 'video' | 'interactive' | 'text' | 'audio' | 'hands_on' | 'social';
  difficulty: 'easier' | 'same' | 'harder';
  estimatedTime: number; // in minutes
  prerequisites: string[];
  benefits: string[];
  suitableFor: string[]; // learning styles, preferences, etc.
}

export interface ProgressMonitoringConfig {
  stagnationThresholdDays: number;
  lowEngagementThreshold: number; // percentage
  regressionThreshold: number; // percentage
  difficultySpikeSensitivity: number;
  monitoringFrequency: 'daily' | 'weekly' | 'real_time';
}

export class ProgressMonitoringService {
  private progressRepository: ProgressRepository;
  private logger = logger.child({ component: 'ProgressMonitoringService' });
  private defaultConfig: ProgressMonitoringConfig = {
    stagnationThresholdDays: 7,
    lowEngagementThreshold: 30,
    regressionThreshold: 10,
    difficultySpikeSensitivity: 0.5,
    monitoringFrequency: 'daily'
  };

  constructor(progressRepository: ProgressRepository) {
    this.progressRepository = progressRepository;
  }

  /**
   * Monitor user progress and detect stagnation or issues
   */
  async monitorUserProgress(
    userId: string,
    pathId?: string,
    config: Partial<ProgressMonitoringConfig> = {}
  ): Promise<ProgressStagnationAlert[]> {
    try {
      const monitoringConfig = { ...this.defaultConfig, ...config };
      this.logger.info({ message: 'Monitoring user progress', userId, pathId, config: monitoringConfig });

      const alerts: ProgressStagnationAlert[] = [];

      // Get user progress data
      const progressData = pathId
        ? [await this.progressRepository.getProgress(userId, pathId)].filter(Boolean)
        : (await this.progressRepository.getUserProgress({ userId })).progress;

      for (const progress of progressData) {
        if (!progress) continue;
        
        // Check for stagnation
        const stagnationAlert = await this.detectStagnation(progress, monitoringConfig);
        if (stagnationAlert) {
          alerts.push(stagnationAlert);
        }

        // Check for regression
        const regressionAlert = await this.detectRegression(progress, monitoringConfig);
        if (regressionAlert) {
          alerts.push(regressionAlert);
        }

        // Check for low engagement
        const engagementAlert = await this.detectLowEngagement(progress, monitoringConfig);
        if (engagementAlert) {
          alerts.push(engagementAlert);
        }

        // Check for difficulty spikes
        const difficultyAlert = await this.detectDifficultySpike(progress, monitoringConfig);
        if (difficultyAlert) {
          alerts.push(difficultyAlert);
        }
      }

      this.logger.info({ message: 'Progress monitoring completed', userId, pathId, alertsGenerated: alerts.length });

      return alerts;
    } catch (error) {
      this.logger.error({ message: 'Failed to monitor user progress', userId, pathId, error: error instanceof Error ? error.message : String(error) });
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
      this.logger.info({ message: 'Generating alternative learning approaches', userId, pathId, strugglingAreas });

      const progress = await this.progressRepository.getProgress(userId, pathId);
      if (!progress) {
        throw new Error('Progress not found');
      }

      const approaches: AlternativeLearningApproach[] = [];

      // Analyze current learning patterns
      const currentPatterns = this.analyzeCurrentLearningPatterns(progress);

      // Generate approaches based on struggling areas
      for (const area of strugglingAreas) {
        const areaApproaches = this.generateApproachesForArea(area, currentPatterns);
        approaches.push(...areaApproaches);
      }

      // Remove duplicates and prioritize
      const uniqueApproaches = this.deduplicateAndPrioritizeApproaches(approaches);

      this.logger.info({ message: 'Alternative learning approaches generated', userId, pathId, approachesGenerated: uniqueApproaches.length });

      return uniqueApproaches;
    } catch (error) {
      this.logger.error({ message: 'Failed to generate alternative learning approaches', userId, pathId, strugglingAreas, error: error instanceof Error ? error.message : String(error) });
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
      this.logger.info({ message: 'Creating learning interventions', alertsCount: alerts.length });

      const interventions: LearningIntervention[] = [];

      for (const alert of alerts) {
        const alertInterventions = await this.createInterventionsForAlert(alert);
        interventions.push(...alertInterventions);
      }

      // Prioritize and deduplicate interventions
      const prioritizedInterventions = this.prioritizeInterventions(interventions);

      this.logger.info({ message: 'Learning interventions created', interventionsGenerated: prioritizedInterventions.length });

      return prioritizedInterventions;
    } catch (error) {
      this.logger.error({ message: 'Failed to create learning interventions', error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Detect progress stagnation
   */
  private async detectStagnation(
    progress: Progress,
    config: ProgressMonitoringConfig
  ): Promise<ProgressStagnationAlert | null> {
    const daysSinceLastAccess = Math.floor(
      (Date.now() - progress.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastAccess >= config.stagnationThresholdDays) {
      const affectedAreas = this.identifyStagnantAreas(progress);
      const interventions = await this.generateStagnationInterventions(progress, affectedAreas);

      return {
        userId: progress.userId,
        pathId: progress.pathId,
        alertType: 'stagnation',
        severity: daysSinceLastAccess > config.stagnationThresholdDays * 2 ? 'high' : 'medium',
        detectedAt: new Date(),
        description: `No learning activity detected for ${daysSinceLastAccess} days`,
        affectedAreas,
        suggestedInterventions: interventions,
        metadata: {
          daysSinceLastAccess,
          lastAccessedAt: progress.lastAccessedAt,
          overallCompletion: progress.overallCompletion
        }
      };
    }

    return null;
  }

  /**
   * Detect progress regression
   */
  private async detectRegression(
    progress: Progress,
    config: ProgressMonitoringConfig
  ): Promise<ProgressStagnationAlert | null> {
    // This would typically compare with historical progress data
    // For now, we'll use a simplified approach based on incomplete modules
    const incompleteModules = progress.moduleProgress.filter(m => 
      m.completion > 0 && m.completion < 100
    );

    if (incompleteModules.length > 0) {
      // Check if there are modules that seem to have regressed
      const regressedModules = incompleteModules.filter(module => {
        // Simplified regression detection - would need historical data
        return module.completion < 50 && this.hasLowRecentActivity(module);
      });

      if (regressedModules.length > 0) {
        const affectedAreas = regressedModules.map(m => m.moduleId);
        const interventions = await this.generateRegressionInterventions(progress, affectedAreas);

        return {
          userId: progress.userId,
          pathId: progress.pathId,
          alertType: 'regression',
          severity: 'medium',
          detectedAt: new Date(),
          description: `Potential regression detected in ${regressedModules.length} modules`,
          affectedAreas,
          suggestedInterventions: interventions,
          metadata: {
            regressedModulesCount: regressedModules.length,
            regressedModules: regressedModules.map(m => m.moduleId)
          }
        };
      }
    }

    return null;
  }

  /**
   * Detect low engagement
   */
  private async detectLowEngagement(
    progress: Progress,
    config: ProgressMonitoringConfig
  ): Promise<ProgressStagnationAlert | null> {
    const totalTimeSpent = this.calculateTotalTimeSpent(progress);
    const totalContent = this.getTotalContentCount(progress);
    const averageTimePerContent = totalContent > 0 ? totalTimeSpent / totalContent : 0;

    // Low engagement if average time per content is very low
    const minimumEngagementTime = 120; // 2 minutes
    
    if (averageTimePerContent < minimumEngagementTime && totalContent > 0) {
      const affectedAreas = this.identifyLowEngagementAreas(progress);
      const interventions = await this.generateEngagementInterventions(progress, affectedAreas);

      return {
        userId: progress.userId,
        pathId: progress.pathId,
        alertType: 'low_engagement',
        severity: averageTimePerContent < minimumEngagementTime / 2 ? 'high' : 'medium',
        detectedAt: new Date(),
        description: `Low engagement detected - average ${Math.round(averageTimePerContent)}s per content item`,
        affectedAreas,
        suggestedInterventions: interventions,
        metadata: {
          averageTimePerContent,
          totalTimeSpent,
          totalContent,
          minimumEngagementTime
        }
      };
    }

    return null;
  }

  /**
   * Detect difficulty spikes
   */
  private async detectDifficultySpike(
    progress: Progress,
    config: ProgressMonitoringConfig
  ): Promise<ProgressStagnationAlert | null> {
    // Look for modules where progress drops significantly
    const moduleCompletions = progress.moduleProgress.map(m => m.completion);
    
    for (let i = 1; i < moduleCompletions.length; i++) {
      const previousCompletion = moduleCompletions[i - 1];
      const currentCompletion = moduleCompletions[i];
      
      // Detect significant drop in completion rate
      if (previousCompletion > 70 && currentCompletion < 30) {
        const affectedModule = progress.moduleProgress[i];
        const interventions = await this.generateDifficultyInterventions(progress, [affectedModule.moduleId]);

        return {
          userId: progress.userId,
          pathId: progress.pathId,
          alertType: 'difficulty_spike',
          severity: 'medium',
          detectedAt: new Date(),
          description: `Difficulty spike detected in module ${affectedModule.moduleId}`,
          affectedAreas: [affectedModule.moduleId],
          suggestedInterventions: interventions,
          metadata: {
            previousCompletion,
            currentCompletion,
            moduleId: affectedModule.moduleId
          }
        };
      }
    }

    return null;
  }

  /**
   * Generate interventions for stagnation
   */
  private async generateStagnationInterventions(
    progress: Progress,
    affectedAreas: string[]
  ): Promise<LearningIntervention[]> {
    return [
      {
        id: `stagnation-${progress.userId}-${Date.now()}`,
        type: 'motivation',
        title: 'Re-engage with Learning',
        description: 'Get back on track with personalized motivation strategies',
        priority: 'high',
        estimatedImpact: 'high',
        actionItems: [
          'Send personalized encouragement message',
          'Suggest shorter learning sessions to rebuild habit',
          'Highlight previous achievements and progress',
          'Offer learning buddy or community support'
        ],
        alternativeApproaches: await this.generateMotivationalApproaches(),
        metadata: { affectedAreas }
      },
      {
        id: `content-${progress.userId}-${Date.now()}`,
        type: 'content_adjustment',
        title: 'Adjust Content Difficulty',
        description: 'Provide easier entry points to rebuild confidence',
        priority: 'medium',
        estimatedImpact: 'medium',
        actionItems: [
          'Offer review materials for previously covered topics',
          'Provide prerequisite content if needed',
          'Suggest practice exercises before continuing',
          'Break down complex topics into smaller chunks'
        ],
        alternativeApproaches: await this.generateContentAdjustmentApproaches(),
        metadata: { affectedAreas }
      }
    ];
  }

  /**
   * Generate interventions for regression
   */
  private async generateRegressionInterventions(
    progress: Progress,
    affectedAreas: string[]
  ): Promise<LearningIntervention[]> {
    return [
      {
        id: `regression-${progress.userId}-${Date.now()}`,
        type: 'content_adjustment',
        title: 'Reinforce Learning',
        description: 'Strengthen understanding in areas showing regression',
        priority: 'high',
        estimatedImpact: 'high',
        actionItems: [
          'Provide additional practice exercises',
          'Offer different explanations of the same concepts',
          'Suggest spaced repetition for key topics',
          'Include real-world examples and applications'
        ],
        alternativeApproaches: await this.generateReinforcementApproaches(),
        metadata: { affectedAreas }
      }
    ];
  }

  /**
   * Generate interventions for low engagement
   */
  private async generateEngagementInterventions(
    progress: Progress,
    affectedAreas: string[]
  ): Promise<LearningIntervention[]> {
    return [
      {
        id: `engagement-${progress.userId}-${Date.now()}`,
        type: 'learning_style',
        title: 'Enhance Engagement',
        description: 'Try different learning formats to increase engagement',
        priority: 'high',
        estimatedImpact: 'high',
        actionItems: [
          'Offer interactive content instead of passive reading',
          'Include gamification elements',
          'Provide multimedia alternatives (video, audio)',
          'Add social learning opportunities'
        ],
        alternativeApproaches: await this.generateEngagementApproaches(),
        metadata: { affectedAreas }
      }
    ];
  }

  /**
   * Generate interventions for difficulty spikes
   */
  private async generateDifficultyInterventions(
    progress: Progress,
    affectedAreas: string[]
  ): Promise<LearningIntervention[]> {
    return [
      {
        id: `difficulty-${progress.userId}-${Date.now()}`,
        type: 'pacing_change',
        title: 'Adjust Learning Pace',
        description: 'Slow down and provide additional support for challenging topics',
        priority: 'high',
        estimatedImpact: 'high',
        actionItems: [
          'Break down complex topics into smaller steps',
          'Provide additional examples and explanations',
          'Offer prerequisite review if needed',
          'Suggest one-on-one tutoring or support'
        ],
        alternativeApproaches: await this.generateDifficultyAdjustmentApproaches(),
        metadata: { affectedAreas }
      }
    ];
  }

  /**
   * Helper methods for generating alternative approaches
   */
  private async generateMotivationalApproaches(): Promise<AlternativeLearningApproach[]> {
    return [
      {
        id: 'motivational-1',
        name: 'Micro-Learning Sessions',
        description: 'Short 5-10 minute learning bursts to rebuild habits',
        contentType: 'interactive',
        difficulty: 'easier',
        estimatedTime: 10,
        prerequisites: [],
        benefits: ['Low commitment', 'Easy to fit into schedule', 'Builds momentum'],
        suitableFor: ['busy learners', 'habit rebuilding', 'low motivation']
      },
      {
        id: 'motivational-2',
        name: 'Achievement Showcase',
        description: 'Review and celebrate past learning achievements',
        contentType: 'interactive',
        difficulty: 'same',
        estimatedTime: 15,
        prerequisites: [],
        benefits: ['Boosts confidence', 'Reminds of progress', 'Increases motivation'],
        suitableFor: ['discouraged learners', 'confidence building']
      }
    ];
  }

  private async generateContentAdjustmentApproaches(): Promise<AlternativeLearningApproach[]> {
    return [
      {
        id: 'content-1',
        name: 'Visual Learning Path',
        description: 'Learn through diagrams, infographics, and visual aids',
        contentType: 'interactive',
        difficulty: 'easier',
        estimatedTime: 20,
        prerequisites: [],
        benefits: ['Visual understanding', 'Easier comprehension', 'Engaging format'],
        suitableFor: ['visual learners', 'complex topics', 'struggling students']
      }
    ];
  }

  private async generateReinforcementApproaches(): Promise<AlternativeLearningApproach[]> {
    return [
      {
        id: 'reinforcement-1',
        name: 'Spaced Repetition Practice',
        description: 'Review key concepts at increasing intervals',
        contentType: 'interactive',
        difficulty: 'same',
        estimatedTime: 15,
        prerequisites: [],
        benefits: ['Long-term retention', 'Strengthens memory', 'Efficient review'],
        suitableFor: ['memory reinforcement', 'exam preparation', 'concept mastery']
      }
    ];
  }

  private async generateEngagementApproaches(): Promise<AlternativeLearningApproach[]> {
    return [
      {
        id: 'engagement-1',
        name: 'Gamified Learning',
        description: 'Learn through games, challenges, and competitions',
        contentType: 'interactive',
        difficulty: 'same',
        estimatedTime: 25,
        prerequisites: [],
        benefits: ['High engagement', 'Fun learning', 'Competitive motivation'],
        suitableFor: ['low engagement', 'competitive learners', 'younger audiences']
      }
    ];
  }

  private async generateDifficultyAdjustmentApproaches(): Promise<AlternativeLearningApproach[]> {
    return [
      {
        id: 'difficulty-1',
        name: 'Scaffolded Learning',
        description: 'Step-by-step guidance with increasing independence',
        contentType: 'interactive',
        difficulty: 'easier',
        estimatedTime: 30,
        prerequisites: [],
        benefits: ['Gradual difficulty increase', 'Builds confidence', 'Structured support'],
        suitableFor: ['struggling learners', 'complex topics', 'skill building']
      }
    ];
  }

  /**
   * Helper methods for analysis
   */
  private identifyStagnantAreas(progress: Progress): string[] {
    return progress.moduleProgress
      .filter(module => module.completion > 0 && module.completion < 100)
      .map(module => module.moduleId);
  }

  private identifyLowEngagementAreas(progress: Progress): string[] {
    return progress.moduleProgress
      .filter(module => {
        const avgTime = this.calculateModuleAverageTime(module);
        return avgTime < 120; // Less than 2 minutes average
      })
      .map(module => module.moduleId);
  }

  private hasLowRecentActivity(module: any): boolean {
    // Simplified check - would need actual activity timestamps
    return module.completion < 50;
  }

  private calculateTotalTimeSpent(progress: Progress): number {
    return progress.moduleProgress.reduce((total, module) => {
      return total + module.unitProgress.reduce((moduleTotal, unit) => {
        return moduleTotal + unit.contentProgress.reduce((unitTotal, content) => {
          return unitTotal + content.timeSpent;
        }, 0);
      }, 0);
    }, 0);
  }

  private getTotalContentCount(progress: Progress): number {
    return progress.moduleProgress.reduce((total, module) => {
      return total + module.unitProgress.reduce((moduleTotal, unit) => {
        return moduleTotal + unit.contentProgress.length;
      }, 0);
    }, 0);
  }

  private calculateModuleAverageTime(module: any): number {
    let totalTime = 0;
    let contentCount = 0;

    module.unitProgress.forEach((unit: any) => {
      unit.contentProgress.forEach((content: any) => {
        totalTime += content.timeSpent;
        contentCount++;
      });
    });

    return contentCount > 0 ? totalTime / contentCount : 0;
  }

  private analyzeCurrentLearningPatterns(progress: Progress): any {
    // Analyze current learning patterns to inform alternative approaches
    return {
      preferredContentTypes: ['interactive'], // Would analyze actual preferences
      averageSessionLength: this.calculateTotalTimeSpent(progress) / this.getTotalContentCount(progress),
      completionRate: progress.overallCompletion,
      strugglingAreas: progress.moduleProgress.filter(m => m.completion < 50).map(m => m.moduleId)
    };
  }

  private generateApproachesForArea(area: string, patterns: any): AlternativeLearningApproach[] {
    // Generate specific approaches based on the struggling area and current patterns
    return [
      {
        id: `area-${area}-1`,
        name: `Alternative Approach for ${area}`,
        description: `Customized learning approach for ${area}`,
        contentType: 'interactive',
        difficulty: 'easier',
        estimatedTime: 20,
        prerequisites: [],
        benefits: ['Targeted support', 'Alternative explanation', 'Different perspective'],
        suitableFor: ['struggling in ' + area]
      }
    ];
  }

  private deduplicateAndPrioritizeApproaches(approaches: AlternativeLearningApproach[]): AlternativeLearningApproach[] {
    // Remove duplicates and prioritize based on estimated impact
    const unique = approaches.filter((approach, index, self) => 
      index === self.findIndex(a => a.id === approach.id)
    );

    return unique.sort((a, b) => {
      // Prioritize by difficulty (easier first) and estimated time (shorter first)
      if (a.difficulty !== b.difficulty) {
        const difficultyOrder = { easier: 0, same: 1, harder: 2 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      }
      return a.estimatedTime - b.estimatedTime;
    });
  }

  private async createInterventionsForAlert(alert: ProgressStagnationAlert): Promise<LearningIntervention[]> {
    switch (alert.alertType) {
      case 'stagnation':
        return this.generateStagnationInterventions(
          { userId: alert.userId, pathId: alert.pathId } as Progress,
          alert.affectedAreas
        );
      case 'low_engagement':
        return this.generateEngagementInterventions(
          { userId: alert.userId, pathId: alert.pathId } as Progress,
          alert.affectedAreas
        );
      case 'difficulty_spike':
        return this.generateDifficultyInterventions(
          { userId: alert.userId, pathId: alert.pathId } as Progress,
          alert.affectedAreas
        );
      default:
        return [];
    }
  }

  private prioritizeInterventions(interventions: LearningIntervention[]): LearningIntervention[] {
    return interventions.sort((a, b) => {
      // Sort by priority first, then by estimated impact
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const impactOrder = { high: 3, medium: 2, low: 1 };
      
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return impactOrder[b.estimatedImpact] - impactOrder[a.estimatedImpact];
    });
  }
}