import { logger } from '@pageflow/utils';
import {
  Progress,
  Milestone,
  MilestoneType,
  ProgressStatus
} from '@pageflow/types';
import { MilestoneRepository } from '../repositories/milestoneRepository';
import { MilestoneDetectionContext } from '../models/progress';

export class MilestoneDetectionService {
  private milestoneRepository: MilestoneRepository;
  private logger = logger.child({ component: 'MilestoneDetectionService' });

  constructor(milestoneRepository: MilestoneRepository) {
    this.milestoneRepository = milestoneRepository;
  }

  /**
   * Detect and achieve milestones based on progress changes
   */
  async detectAndAchieveMilestones(context: MilestoneDetectionContext): Promise<Milestone[]> {
    const achievedMilestones: Milestone[] = [];

    try {
      this.logger.info({ 
        message: 'Starting milestone detection',
        userId: context.userId,
        pathId: context.pathId
      });

      // Get existing milestones for the user and path
      const existingMilestones = await this.milestoneRepository.getUserMilestones(
        context.userId,
        context.pathId
      );

      // Check each milestone type
      const detectionResults = await Promise.allSettled([
        this.checkPathStartedMilestone(context, existingMilestones),
        this.checkModuleCompletedMilestone(context, existingMilestones),
        this.checkPathCompletedMilestone(context, existingMilestones),
        this.checkStreakAchievedMilestone(context, existingMilestones),
        this.checkMasteryDemonstratedMilestone(context, existingMilestones),
        this.checkPerseveranceShownMilestone(context, existingMilestones)
      ]);

      // Collect achieved milestones
      for (const result of detectionResults) {
        if (result.status === 'fulfilled' && result.value) {
          achievedMilestones.push(result.value);
        } else if (result.status === 'rejected') {
          this.logger.warn({ 
            message: 'Milestone detection failed',
            error: result.reason,
            userId: context.userId,
            pathId: context.pathId
          });
        }
      }

      this.logger.info({ 
        message: 'Milestone detection completed',
        userId: context.userId,
        pathId: context.pathId,
        achievedCount: achievedMilestones.length
      });

      return achievedMilestones;
    } catch (error: any) {
      this.logger.error({ 
        message: 'Failed to detect milestones',
        context,
        error: error.message
      });
      return achievedMilestones; // Return what we have so far
    }
  }

  /**
   * Check for path started milestone
   */
  private async checkPathStartedMilestone(
    context: MilestoneDetectionContext,
    existingMilestones: Milestone[]
  ): Promise<Milestone | null> {
    // Check if user just started the path (no previous progress)
    if (!context.previousProgress && context.currentProgress.moduleProgress.length > 0) {
      const milestone = existingMilestones.find(m => 
        m.type === MilestoneType.PATH_STARTED && !m.achievedAt
      );

      if (milestone) {
        this.logger.info({ message: 'Path started milestone detected', userId: context.userId, pathId: context.pathId, milestoneId: milestone.id });
        return await this.milestoneRepository.achieveMilestone(context.userId, milestone.id);
      }
    }

    return null;
  }

  /**
   * Check for module completed milestone
   */
  private async checkModuleCompletedMilestone(
    context: MilestoneDetectionContext,
    existingMilestones: Milestone[]
  ): Promise<Milestone | null> {
    const currentCompletedModules = context.currentProgress.moduleProgress.filter(m => m.completion === 100);
    const previousCompletedModules = context.previousProgress?.moduleProgress.filter(m => m.completion === 100) || [];

    // Check if a new module was completed
    if (currentCompletedModules.length > previousCompletedModules.length) {
      const milestone = existingMilestones.find(m => 
        m.type === MilestoneType.MODULE_COMPLETED && !m.achievedAt
      );

      if (milestone) {
        // Check if this is the first module completion or meets threshold
        const threshold = milestone.criteria.threshold || 1;
        if (currentCompletedModules.length >= threshold) {
          this.logger.info({ message: 'Module completed milestone detected', userId: context.userId, pathId: context.pathId, milestoneId: milestone.id, completedModules: currentCompletedModules.length });
          return await this.milestoneRepository.achieveMilestone(context.userId, milestone.id);
        }
      }
    }

    return null;
  }

  /**
   * Check for path completed milestone
   */
  private async checkPathCompletedMilestone(
    context: MilestoneDetectionContext,
    existingMilestones: Milestone[]
  ): Promise<Milestone | null> {
    // Check if path was just completed
    if (context.currentProgress.overallCompletion === 100 && 
        (context.previousProgress?.overallCompletion || 0) < 100) {
      const milestone = existingMilestones.find(m => 
        m.type === MilestoneType.PATH_COMPLETED && !m.achievedAt
      );

      if (milestone) {
        this.logger.info({ message: 'Path completed milestone detected', userId: context.userId, pathId: context.pathId, milestoneId: milestone.id });
        return await this.milestoneRepository.achieveMilestone(context.userId, milestone.id);
      }
    }

    return null;
  }

  /**
   * Check for streak achieved milestone
   */
  private async checkStreakAchievedMilestone(
    context: MilestoneDetectionContext,
    existingMilestones: Milestone[]
  ): Promise<Milestone | null> {
    const milestone = existingMilestones.find(m => 
      m.type === MilestoneType.STREAK_ACHIEVED && !m.achievedAt
    );

    if (milestone) {
      // Check if user has consistent activity (simplified implementation)
      const hasStreak = await this.checkLearningStreak(
        context.userId,
        context.pathId,
        milestone.criteria.threshold || 7,
        milestone.criteria.timeframe || 7
      );

      if (hasStreak) {
        this.logger.info({ message: 'Streak achieved milestone detected', userId: context.userId, pathId: context.pathId, milestoneId: milestone.id });
        return await this.milestoneRepository.achieveMilestone(context.userId, milestone.id);
      }
    }

    return null;
  }

  /**
   * Check for mastery demonstrated milestone
   */
  private async checkMasteryDemonstratedMilestone(
    context: MilestoneDetectionContext,
    existingMilestones: Milestone[]
  ): Promise<Milestone | null> {
    const milestone = existingMilestones.find(m => 
      m.type === MilestoneType.MASTERY_DEMONSTRATED && !m.achievedAt
    );

    if (milestone) {
      const hasMastery = this.checkMasteryIndicators(context.currentProgress);
      
      if (hasMastery) {
        this.logger.info({ message: 'Mastery demonstrated milestone detected', userId: context.userId, pathId: context.pathId, milestoneId: milestone.id });
        return await this.milestoneRepository.achieveMilestone(context.userId, milestone.id);
      }
    }

    return null;
  }

  /**
   * Check for perseverance shown milestone
   */
  private async checkPerseveranceShownMilestone(
    context: MilestoneDetectionContext,
    existingMilestones: Milestone[]
  ): Promise<Milestone | null> {
    const milestone = existingMilestones.find(m => 
      m.type === MilestoneType.PERSEVERANCE_SHOWN && !m.achievedAt
    );

    if (milestone) {
      const hasPerseverance = this.checkPerseveranceIndicators(context);
      
      if (hasPerseverance) {
        this.logger.info({ message: 'Perseverance shown milestone detected', userId: context.userId, pathId: context.pathId, milestoneId: milestone.id });
        return await this.milestoneRepository.achieveMilestone(context.userId, milestone.id);
      }
    }

    return null;
  }

  /**
   * Check if user has maintained a learning streak
   */
  private async checkLearningStreak(
    userId: string,
    pathId: string,
    streakDays: number,
    timeframeDays: number
  ): Promise<boolean> {
    // This is a simplified implementation
    // In a real system, you would check activity across multiple days
    
    // For now, we'll consider recent activity as indication of streak
    const now = new Date();
    const timeframeStart = new Date(now.getTime() - timeframeDays * 24 * 60 * 60 * 1000);
    
    // This would typically involve querying activity logs or progress updates
    // For this implementation, we'll use a simplified check
    return true; // Placeholder - would implement actual streak detection
  }

  /**
   * Check mastery indicators in progress
   */
  private checkMasteryIndicators(progress: Progress): boolean {
    // Check for high completion rates and consistent performance
    const completedModules = progress.moduleProgress.filter(m => m.completion === 100);
    const totalModules = progress.moduleProgress.length;
    
    if (totalModules === 0) return false;
    
    const completionRate = completedModules.length / totalModules;
    
    // Consider mastery if user has completed 80% or more of modules
    return completionRate >= 0.8;
  }

  /**
   * Check perseverance indicators
   */
  private checkPerseveranceIndicators(context: MilestoneDetectionContext): boolean {
    // Check for continued engagement despite challenges
    // This could include:
    // - Returning after periods of inactivity
    // - Completing difficult content
    // - Spending significant time on challenging topics
    
    const totalTimeSpent = this.calculateTotalTimeSpent(context.currentProgress);
    const averageTimePerContent = this.calculateAverageTimePerContent(context.currentProgress);
    
    // Consider perseverance if user has spent significant time learning
    // This is a simplified heuristic
    return totalTimeSpent > 3600 && averageTimePerContent > 300; // 1 hour total, 5 min average
  }

  /**
   * Calculate total time spent across all content
   */
  private calculateTotalTimeSpent(progress: Progress): number {
    return progress.moduleProgress.reduce((total, module) => {
      return total + module.unitProgress.reduce((moduleTotal, unit) => {
        return moduleTotal + unit.contentProgress.reduce((unitTotal, content) => {
          return unitTotal + content.timeSpent;
        }, 0);
      }, 0);
    }, 0);
  }

  /**
   * Calculate average time spent per content item
   */
  private calculateAverageTimePerContent(progress: Progress): number {
    let totalTime = 0;
    let contentCount = 0;

    progress.moduleProgress.forEach(module => {
      module.unitProgress.forEach(unit => {
        unit.contentProgress.forEach(content => {
          totalTime += content.timeSpent;
          contentCount++;
        });
      });
    });

    return contentCount > 0 ? totalTime / contentCount : 0;
  }
}