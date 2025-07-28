import { logger } from '@pageflow/utils';
import { v4 as uuidv4 } from 'uuid';

/**
 * Knowledge item in the user context knowledge base
 */
export interface KnowledgeItem {
  id: string;
  userId: string;
  category: KnowledgeCategory;
  key: string;
  value: any;
  confidence: number; // 0-100, how confident we are in this knowledge
  source: KnowledgeSource;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string; // Optional expiration for temporary knowledge
}

/**
 * Categories of knowledge about the user
 */
export enum KnowledgeCategory {
  LEARNING_PREFERENCES = 'LEARNING_PREFERENCES',
  ACADEMIC_BACKGROUND = 'ACADEMIC_BACKGROUND',
  INTERESTS = 'INTERESTS',
  GOALS = 'GOALS',
  CHALLENGES = 'CHALLENGES',
  ACHIEVEMENTS = 'ACHIEVEMENTS',
  BEHAVIORAL_PATTERNS = 'BEHAVIORAL_PATTERNS',
  ACCESSIBILITY_NEEDS = 'ACCESSIBILITY_NEEDS',
  CONTEXT_PREFERENCES = 'CONTEXT_PREFERENCES'
}

/**
 * Sources of knowledge
 */
export enum KnowledgeSource {
  USER_STATED = 'USER_STATED', // Explicitly told by user
  INFERRED = 'INFERRED', // Inferred from behavior
  ASSESSMENT = 'ASSESSMENT', // From assessment results
  PROGRESS_TRACKING = 'PROGRESS_TRACKING', // From progress data
  INTERACTION_ANALYSIS = 'INTERACTION_ANALYSIS' // From interaction patterns
}

/**
 * Knowledge query parameters
 */
export interface KnowledgeQuery {
  categories?: KnowledgeCategory[];
  keys?: string[];
  minConfidence?: number;
  includeExpired?: boolean;
  limit?: number;
}

/**
 * Service for managing user context knowledge base
 */
export class KnowledgeBaseService {
  private static readonly DEFAULT_CONFIDENCE = 70;
  private static readonly MIN_CONFIDENCE_THRESHOLD = 30;
  private static readonly MAX_ITEMS_PER_CATEGORY = 50;

  /**
   * Add or update knowledge about a user
   */
  public static addKnowledge(
    userId: string,
    category: KnowledgeCategory,
    key: string,
    value: any,
    source: KnowledgeSource,
    confidence: number = this.DEFAULT_CONFIDENCE,
    expiresAt?: Date
  ): KnowledgeItem {
    const now = new Date().toISOString();
    
    const knowledgeItem: KnowledgeItem = {
      id: uuidv4(),
      userId,
      category,
      key,
      value,
      confidence: Math.max(0, Math.min(100, confidence)),
      source,
      createdAt: now,
      updatedAt: now,
      expiresAt: expiresAt?.toISOString()
    };

    logger.info({
      message: 'Knowledge added to user context',
      userId,
      category,
      key,
      source,
      confidence
    });

    return knowledgeItem;
  }

  /**
   * Update existing knowledge item
   */
  public static updateKnowledge(
    existingItem: KnowledgeItem,
    newValue: any,
    newConfidence?: number,
    newSource?: KnowledgeSource
  ): KnowledgeItem {
    const updatedItem: KnowledgeItem = {
      ...existingItem,
      value: newValue,
      confidence: newConfidence !== undefined ? 
        Math.max(0, Math.min(100, newConfidence)) : existingItem.confidence,
      source: newSource || existingItem.source,
      updatedAt: new Date().toISOString()
    };

    logger.info({
      message: 'Knowledge updated in user context',
      userId: existingItem.userId,
      category: existingItem.category,
      key: existingItem.key,
      oldConfidence: existingItem.confidence,
      newConfidence: updatedItem.confidence
    });

    return updatedItem;
  }

  /**
   * Query knowledge base
   */
  public static queryKnowledge(
    knowledgeBase: KnowledgeItem[],
    query: KnowledgeQuery
  ): KnowledgeItem[] {
    let results = knowledgeBase.filter(item => {
      // Filter by categories
      if (query.categories && !query.categories.includes(item.category)) {
        return false;
      }

      // Filter by keys
      if (query.keys && !query.keys.includes(item.key)) {
        return false;
      }

      // Filter by confidence
      if (query.minConfidence && item.confidence < query.minConfidence) {
        return false;
      }

      // Filter expired items
      if (!query.includeExpired && item.expiresAt) {
        const now = new Date();
        const expiresAt = new Date(item.expiresAt);
        if (now > expiresAt) {
          return false;
        }
      }

      return true;
    });

    // Sort by confidence (highest first) and recency
    results.sort((a, b) => {
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get user's learning preferences
   */
  public static getLearningPreferences(knowledgeBase: KnowledgeItem[]): {
    preferredContentTypes: string[];
    difficultyPreference: string;
    pacePreference: string;
    feedbackStyle: string;
    interactionStyle: string;
  } {
    const preferences = this.queryKnowledge(knowledgeBase, {
      categories: [KnowledgeCategory.LEARNING_PREFERENCES],
      minConfidence: 50
    });

    const getPreferenceValue = (key: string, defaultValue: string): string => {
      const item = preferences.find(p => p.key === key);
      return item ? item.value : defaultValue;
    };

    const getPreferenceArray = (key: string, defaultValue: string[]): string[] => {
      const item = preferences.find(p => p.key === key);
      return item ? (Array.isArray(item.value) ? item.value : [item.value]) : defaultValue;
    };

    return {
      preferredContentTypes: getPreferenceArray('content_types', ['text', 'visual']),
      difficultyPreference: getPreferenceValue('difficulty', 'adaptive'),
      pacePreference: getPreferenceValue('pace', 'self_paced'),
      feedbackStyle: getPreferenceValue('feedback_style', 'encouraging'),
      interactionStyle: getPreferenceValue('interaction_style', 'conversational')
    };
  }

  /**
   * Get user's current goals
   */
  public static getCurrentGoals(knowledgeBase: KnowledgeItem[]): string[] {
    const goals = this.queryKnowledge(knowledgeBase, {
      categories: [KnowledgeCategory.GOALS],
      minConfidence: 60
    });

    return goals.map(goal => goal.value).filter(value => typeof value === 'string');
  }

  /**
   * Get user's known challenges
   */
  public static getKnownChallenges(knowledgeBase: KnowledgeItem[]): {
    challenge: string;
    severity: number;
    strategies: string[];
  }[] {
    const challenges = this.queryKnowledge(knowledgeBase, {
      categories: [KnowledgeCategory.CHALLENGES],
      minConfidence: 40
    });

    return challenges.map(item => ({
      challenge: item.key,
      severity: item.confidence,
      strategies: Array.isArray(item.value) ? item.value : [item.value]
    }));
  }

  /**
   * Get user's interests for personalization
   */
  public static getUserInterests(knowledgeBase: KnowledgeItem[]): {
    topic: string;
    strength: number;
  }[] {
    const interests = this.queryKnowledge(knowledgeBase, {
      categories: [KnowledgeCategory.INTERESTS],
      minConfidence: 50
    });

    return interests.map(item => ({
      topic: item.key,
      strength: item.confidence
    }));
  }

  /**
   * Infer new knowledge from user behavior
   */
  public static inferKnowledgeFromBehavior(
    userId: string,
    behaviorData: {
      contentInteractions: { type: string; engagement: number }[];
      difficultyPerformance: { level: string; success: number }[];
      timePatterns: { hour: number; activity: string }[];
      helpSeekingFrequency: number;
    }
  ): KnowledgeItem[] {
    const inferredKnowledge: KnowledgeItem[] = [];

    // Infer content type preferences
    const contentPreferences = behaviorData.contentInteractions
      .reduce((acc, interaction) => {
        acc[interaction.type] = (acc[interaction.type] || 0) + interaction.engagement;
        return acc;
      }, {} as Record<string, number>);

    const preferredContentTypes = Object.entries(contentPreferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);

    if (preferredContentTypes.length > 0) {
      inferredKnowledge.push(this.addKnowledge(
        userId,
        KnowledgeCategory.LEARNING_PREFERENCES,
        'content_types',
        preferredContentTypes,
        KnowledgeSource.INFERRED,
        75
      ));
    }

    // Infer difficulty preference
    const difficultySuccess = behaviorData.difficultyPerformance
      .reduce((acc, perf) => {
        acc[perf.level] = perf.success;
        return acc;
      }, {} as Record<string, number>);

    const optimalDifficulty = Object.entries(difficultySuccess)
      .find(([, success]) => success >= 0.7 && success <= 0.9);

    if (optimalDifficulty) {
      inferredKnowledge.push(this.addKnowledge(
        userId,
        KnowledgeCategory.LEARNING_PREFERENCES,
        'difficulty',
        optimalDifficulty[0],
        KnowledgeSource.INFERRED,
        80
      ));
    }

    // Infer help-seeking behavior
    let helpSeekingStyle = 'independent';
    if (behaviorData.helpSeekingFrequency > 0.3) {
      helpSeekingStyle = 'collaborative';
    } else if (behaviorData.helpSeekingFrequency > 0.1) {
      helpSeekingStyle = 'selective';
    }

    inferredKnowledge.push(this.addKnowledge(
      userId,
      KnowledgeCategory.BEHAVIORAL_PATTERNS,
      'help_seeking_style',
      helpSeekingStyle,
      KnowledgeSource.INFERRED,
      70
    ));

    // Infer optimal study times
    const timePreferences = behaviorData.timePatterns
      .reduce((acc, pattern) => {
        const timeSlot = this.getTimeSlot(pattern.hour);
        acc[timeSlot] = (acc[timeSlot] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const preferredTimeSlot = Object.entries(timePreferences)
      .sort(([,a], [,b]) => b - a)[0];

    if (preferredTimeSlot) {
      inferredKnowledge.push(this.addKnowledge(
        userId,
        KnowledgeCategory.BEHAVIORAL_PATTERNS,
        'preferred_study_time',
        preferredTimeSlot[0],
        KnowledgeSource.INFERRED,
        65
      ));
    }

    return inferredKnowledge;
  }

  /**
   * Clean up expired and low-confidence knowledge
   */
  public static cleanupKnowledgeBase(knowledgeBase: KnowledgeItem[]): KnowledgeItem[] {
    const now = new Date();
    
    return knowledgeBase.filter(item => {
      // Remove expired items
      if (item.expiresAt && new Date(item.expiresAt) < now) {
        return false;
      }

      // Remove very low confidence items
      if (item.confidence < this.MIN_CONFIDENCE_THRESHOLD) {
        return false;
      }

      return true;
    });
  }

  /**
   * Merge conflicting knowledge items
   */
  public static mergeConflictingKnowledge(
    knowledgeBase: KnowledgeItem[]
  ): KnowledgeItem[] {
    const grouped = knowledgeBase.reduce((acc, item) => {
      const key = `${item.category}-${item.key}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, KnowledgeItem[]>);

    const merged: KnowledgeItem[] = [];

    Object.values(grouped).forEach(items => {
      if (items.length === 1) {
        merged.push(items[0]);
      } else {
        // Merge multiple items for the same key
        const highestConfidence = items.reduce((max, item) => 
          item.confidence > max.confidence ? item : max
        );

        // If there are conflicting values, prefer the most recent high-confidence one
        const recentHighConfidence = items
          .filter(item => item.confidence >= 70)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

        merged.push(recentHighConfidence || highestConfidence);
      }
    });

    return merged;
  }

  /**
   * Get contextual knowledge for current interaction
   */
  public static getContextualKnowledge(
    knowledgeBase: KnowledgeItem[],
    context: {
      location: string;
      activity: string;
      contentType?: string;
      difficulty?: string;
    }
  ): KnowledgeItem[] {
    // Get relevant knowledge based on current context
    const relevantCategories = [
      KnowledgeCategory.LEARNING_PREFERENCES,
      KnowledgeCategory.CHALLENGES,
      KnowledgeCategory.GOALS
    ];

    if (context.activity === 'assessment') {
      relevantCategories.push(KnowledgeCategory.ACHIEVEMENTS);
    }

    return this.queryKnowledge(knowledgeBase, {
      categories: relevantCategories,
      minConfidence: 50,
      limit: 10
    });
  }

  /**
   * Convert hour to time slot
   */
  private static getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }
}