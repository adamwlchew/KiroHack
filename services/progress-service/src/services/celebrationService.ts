import { logger } from '@pageflow/utils';
import {
  Milestone,
  Achievement,
  MilestoneType,
  AchievementType
} from '@pageflow/types';

export interface CelebrationNotification {
  id: string;
  userId: string;
  type: 'milestone' | 'achievement';
  title: string;
  message: string;
  iconUrl?: string;
  animationType: 'confetti' | 'fireworks' | 'sparkles' | 'gentle';
  soundEffect?: string;
  duration: number; // in milliseconds
  priority: 'high' | 'medium' | 'low';
  metadata: Record<string, any>;
}

export interface CelebrationConfig {
  enableAnimations: boolean;
  enableSounds: boolean;
  reducedMotion: boolean;
  celebrationDuration: number;
  maxConcurrentCelebrations: number;
}

export class CelebrationService {
  private logger = logger.child({ component: 'CelebrationService' });
  private defaultConfig: CelebrationConfig = {
    enableAnimations: true,
    enableSounds: true,
    reducedMotion: false,
    celebrationDuration: 3000,
    maxConcurrentCelebrations: 3
  };

  constructor() {
    // Logger initialized above
  }

  /**
   * Create celebration notifications for milestones
   */
  createMilestoneCelebrations(
    milestones: Milestone[],
    config: Partial<CelebrationConfig> = {}
  ): CelebrationNotification[] {
    const celebrationConfig = { ...this.defaultConfig, ...config };
    const celebrations: CelebrationNotification[] = [];

    try {
      for (const milestone of milestones) {
        const celebration = this.createMilestoneCelebration(milestone, celebrationConfig);
        celebrations.push(celebration);
      }

      // Sort by priority and limit concurrent celebrations
      const sortedCelebrations = this.prioritizeCelebrations(celebrations);
      const limitedCelebrations = sortedCelebrations.slice(0, celebrationConfig.maxConcurrentCelebrations);

      this.logger.info({ 
        message: 'Created milestone celebrations',
        totalMilestones: milestones.length,
        celebrationsCreated: limitedCelebrations.length
      });

      return limitedCelebrations;
    } catch (error: any) {
      this.logger.error({ 
        message: 'Failed to create milestone celebrations',
        milestonesCount: milestones.length,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Create celebration notifications for achievements
   */
  createAchievementCelebrations(
    achievements: Achievement[],
    config: Partial<CelebrationConfig> = {}
  ): CelebrationNotification[] {
    const celebrationConfig = { ...this.defaultConfig, ...config };
    const celebrations: CelebrationNotification[] = [];

    try {
      for (const achievement of achievements) {
        const celebration = this.createAchievementCelebration(achievement, celebrationConfig);
        celebrations.push(celebration);
      }

      // Sort by priority and limit concurrent celebrations
      const sortedCelebrations = this.prioritizeCelebrations(celebrations);
      const limitedCelebrations = sortedCelebrations.slice(0, celebrationConfig.maxConcurrentCelebrations);

      this.logger.info({ 
        message: 'Created achievement celebrations',
        totalAchievements: achievements.length,
        celebrationsCreated: limitedCelebrations.length
      });

      return limitedCelebrations;
    } catch (error: any) {
      this.logger.error({ 
        message: 'Failed to create achievement celebrations',
        achievementsCount: achievements.length,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Create a single milestone celebration
   */
  private createMilestoneCelebration(
    milestone: Milestone,
    config: CelebrationConfig
  ): CelebrationNotification {
    const animationType = config.reducedMotion ? 'gentle' : this.getMilestoneAnimationType(milestone.type);
    const priority = this.getMilestonePriority(milestone.type);
    const soundEffect = config.enableSounds ? this.getMilestoneSoundEffect(milestone.type) : undefined;

    return {
      id: `milestone-${milestone.id}`,
      userId: milestone.userId,
      type: 'milestone',
      title: milestone.title,
      message: milestone.description,
      animationType,
      soundEffect,
      duration: config.celebrationDuration,
      priority,
      metadata: {
        milestoneId: milestone.id,
        milestoneType: milestone.type,
        pathId: milestone.pathId,
        achievedAt: milestone.achievedAt,
        ...milestone.metadata
      }
    };
  }

  /**
   * Create a single achievement celebration
   */
  private createAchievementCelebration(
    achievement: Achievement,
    config: CelebrationConfig
  ): CelebrationNotification {
    const animationType = config.reducedMotion ? 'gentle' : this.getAchievementAnimationType(achievement.type);
    const priority = this.getAchievementPriority(achievement.type);
    const soundEffect = config.enableSounds ? this.getAchievementSoundEffect(achievement.type) : undefined;

    return {
      id: `achievement-${achievement.id}`,
      userId: achievement.userId,
      type: 'achievement',
      title: achievement.title,
      message: achievement.description,
      iconUrl: achievement.iconUrl,
      animationType,
      soundEffect,
      duration: config.celebrationDuration,
      priority,
      metadata: {
        achievementId: achievement.id,
        achievementType: achievement.type,
        awardedAt: achievement.awardedAt,
        ...achievement.metadata
      }
    };
  }

  /**
   * Get animation type for milestone
   */
  private getMilestoneAnimationType(type: MilestoneType): CelebrationNotification['animationType'] {
    const animationMap: Record<string, CelebrationNotification['animationType']> = {
      [MilestoneType.PATH_STARTED]: 'sparkles',
      [MilestoneType.MODULE_COMPLETED]: 'confetti',
      [MilestoneType.PATH_COMPLETED]: 'fireworks',
      [MilestoneType.STREAK_ACHIEVED]: 'sparkles',
      [MilestoneType.MASTERY_DEMONSTRATED]: 'fireworks',
      [MilestoneType.PERSEVERANCE_SHOWN]: 'confetti'
    };

    return animationMap[type] || 'sparkles';
  }

  /**
   * Get animation type for achievement
   */
  private getAchievementAnimationType(type: AchievementType): CelebrationNotification['animationType'] {
    const animationMap: Record<string, CelebrationNotification['animationType']> = {
      [AchievementType.COMPLETION]: 'confetti',
      [AchievementType.MASTERY]: 'fireworks',
      [AchievementType.STREAK]: 'sparkles',
      [AchievementType.MILESTONE]: 'confetti',
      [AchievementType.EXPLORATION]: 'sparkles'
    };

    return animationMap[type] || 'confetti';
  }

  /**
   * Get priority for milestone
   */
  private getMilestonePriority(type: MilestoneType): CelebrationNotification['priority'] {
    const priorityMap: Record<string, CelebrationNotification['priority']> = {
      [MilestoneType.PATH_STARTED]: 'medium',
      [MilestoneType.MODULE_COMPLETED]: 'medium',
      [MilestoneType.PATH_COMPLETED]: 'high',
      [MilestoneType.STREAK_ACHIEVED]: 'medium',
      [MilestoneType.MASTERY_DEMONSTRATED]: 'high',
      [MilestoneType.PERSEVERANCE_SHOWN]: 'medium'
    };

    return priorityMap[type] || 'low';
  }

  /**
   * Get priority for achievement
   */
  private getAchievementPriority(type: AchievementType): CelebrationNotification['priority'] {
    const priorityMap: Record<string, CelebrationNotification['priority']> = {
      [AchievementType.COMPLETION]: 'medium',
      [AchievementType.MASTERY]: 'high',
      [AchievementType.STREAK]: 'medium',
      [AchievementType.MILESTONE]: 'medium',
      [AchievementType.EXPLORATION]: 'low'
    };

    return priorityMap[type] || 'low';
  }

  /**
   * Get sound effect for milestone
   */
  private getMilestoneSoundEffect(type: MilestoneType): string {
    const soundMap: Record<string, string> = {
      [MilestoneType.PATH_STARTED]: '/sounds/celebrations/welcome-chime.mp3',
      [MilestoneType.MODULE_COMPLETED]: '/sounds/celebrations/success-bell.mp3',
      [MilestoneType.PATH_COMPLETED]: '/sounds/celebrations/victory-fanfare.mp3',
      [MilestoneType.STREAK_ACHIEVED]: '/sounds/celebrations/streak-chime.mp3',
      [MilestoneType.MASTERY_DEMONSTRATED]: '/sounds/celebrations/mastery-chord.mp3',
      [MilestoneType.PERSEVERANCE_SHOWN]: '/sounds/celebrations/perseverance-bell.mp3'
    };

    return soundMap[type] || '/sounds/celebrations/default-chime.mp3';
  }

  /**
   * Get sound effect for achievement
   */
  private getAchievementSoundEffect(type: AchievementType): string {
    const soundMap: Record<string, string> = {
      [AchievementType.COMPLETION]: '/sounds/celebrations/achievement-unlock.mp3',
      [AchievementType.MASTERY]: '/sounds/celebrations/mastery-fanfare.mp3',
      [AchievementType.STREAK]: '/sounds/celebrations/streak-unlock.mp3',
      [AchievementType.MILESTONE]: '/sounds/celebrations/milestone-chime.mp3',
      [AchievementType.EXPLORATION]: '/sounds/celebrations/discovery-bell.mp3'
    };

    return soundMap[type] || '/sounds/celebrations/default-achievement.mp3';
  }

  /**
   * Prioritize celebrations by importance and type
   */
  private prioritizeCelebrations(celebrations: CelebrationNotification[]): CelebrationNotification[] {
    return celebrations.sort((a, b) => {
      // First sort by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // Then sort by type (achievements before milestones)
      if (a.type !== b.type) {
        return a.type === 'achievement' ? -1 : 1;
      }

      // Finally sort by creation order (metadata timestamp)
      const aTime = new Date(a.metadata.achievedAt || a.metadata.awardedAt || 0).getTime();
      const bTime = new Date(b.metadata.achievedAt || b.metadata.awardedAt || 0).getTime();
      
      return bTime - aTime; // Most recent first
    });
  }

  /**
   * Create celebration sequence for multiple celebrations
   */
  createCelebrationSequence(
    celebrations: CelebrationNotification[],
    delayBetween: number = 500
  ): CelebrationNotification[] {
    return celebrations.map((celebration, index) => ({
      ...celebration,
      metadata: {
        ...celebration.metadata,
        sequenceIndex: index,
        sequenceDelay: index * delayBetween,
        totalInSequence: celebrations.length
      }
    }));
  }

  /**
   * Adapt celebrations for accessibility
   */
  adaptForAccessibility(
    celebrations: CelebrationNotification[],
    accessibilitySettings: {
      reducedMotion?: boolean;
      noSounds?: boolean;
      screenReader?: boolean;
      highContrast?: boolean;
    }
  ): CelebrationNotification[] {
    return celebrations.map(celebration => {
      const adapted = { ...celebration };

      // Reduce motion if requested
      if (accessibilitySettings.reducedMotion) {
        adapted.animationType = 'gentle';
        adapted.duration = Math.min(adapted.duration, 1500); // Shorter duration
      }

      // Remove sounds if requested
      if (accessibilitySettings.noSounds) {
        adapted.soundEffect = undefined;
      }

      // Add screen reader announcements
      if (accessibilitySettings.screenReader) {
        adapted.metadata.screenReaderAnnouncement = `${adapted.title}. ${adapted.message}`;
        adapted.metadata.ariaLive = 'polite';
      }

      // Adapt for high contrast
      if (accessibilitySettings.highContrast) {
        adapted.metadata.highContrastMode = true;
      }

      return adapted;
    });
  }
}