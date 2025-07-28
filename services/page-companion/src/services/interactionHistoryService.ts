import { InteractionRecord, EmotionalState } from '@pageflow/types';
import { logger } from '@pageflow/utils';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interaction context for tracking
 */
export interface InteractionContext {
  location: string; // e.g., "dashboard", "learning_path", "assessment"
  activity: string; // e.g., "viewing_content", "taking_quiz", "asking_question"
  contentId?: string;
  sessionId?: string;
  platform: 'web' | 'mobile' | 'vr';
  userAgent?: string;
}

/**
 * Interaction analysis result
 */
export interface InteractionAnalysis {
  patterns: {
    frequentQuestions: string[];
    strugglingAreas: string[];
    preferredInteractionTypes: string[];
    timeOfDayPatterns: { hour: number; count: number }[];
  };
  insights: {
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
    helpSeekingBehavior: 'proactive' | 'reactive' | 'independent';
    engagementLevel: 'high' | 'medium' | 'low';
    preferredFeedbackStyle: 'detailed' | 'brief' | 'encouraging';
  };
  recommendations: string[];
}

/**
 * Service for managing interaction history and analysis
 */
export class InteractionHistoryService {
  private static readonly MAX_HISTORY_SIZE = 1000;
  private static readonly ANALYSIS_WINDOW_DAYS = 30;

  /**
   * Record a new interaction
   */
  public static recordInteraction(
    userId: string,
    userInput: string,
    companionResponse: string,
    context: InteractionContext,
    emotionalState: EmotionalState
  ): InteractionRecord {
    const interaction: InteractionRecord = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      userInput: userInput.trim(),
      companionResponse: companionResponse.trim(),
      context: {
        location: context.location,
        activity: context.activity,
        emotionalState: { ...emotionalState }
      }
    };

    logger.info({
      message: 'Interaction recorded',
      userId,
      interactionId: interaction.id,
      context: context.location,
      activity: context.activity,
      platform: context.platform
    });

    return interaction;
  }

  /**
   * Analyze interaction history for patterns and insights
   */
  public static analyzeInteractionHistory(
    interactions: InteractionRecord[]
  ): InteractionAnalysis {
    try {
      const recentInteractions = this.getRecentInteractions(interactions);
      
      return {
        patterns: this.extractPatterns(recentInteractions),
        insights: this.generateInsights(recentInteractions),
        recommendations: this.generateRecommendations(recentInteractions)
      };
    } catch (error: any) {
      logger.error({
        message: 'Error analyzing interaction history',
        error: error.message
      });
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Get recent interactions within the analysis window
   */
  private static getRecentInteractions(interactions: InteractionRecord[]): InteractionRecord[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.ANALYSIS_WINDOW_DAYS);

    return interactions
      .filter(interaction => new Date(interaction.timestamp) >= cutoffDate)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Extract patterns from interaction history
   */
  private static extractPatterns(interactions: InteractionRecord[]): InteractionAnalysis['patterns'] {
    // Frequent questions analysis
    const questionWords = interactions
      .map(i => i.userInput.toLowerCase())
      .filter(input => input.includes('?') || input.startsWith('how') || input.startsWith('what') || input.startsWith('why'))
      .flatMap(input => input.split(' '))
      .filter(word => word.length > 3);

    const questionFrequency = this.countFrequency(questionWords);
    const frequentQuestions = Object.entries(questionFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    // Struggling areas analysis
    const strugglingContexts = interactions
      .filter(i => 
        i.context.emotionalState.primary === 'CONCERNED' ||
        i.userInput.toLowerCase().includes('help') ||
        i.userInput.toLowerCase().includes('confused') ||
        i.userInput.toLowerCase().includes('don\'t understand')
      )
      .map(i => i.context.location);

    const strugglingFrequency = this.countFrequency(strugglingContexts);
    const strugglingAreas = Object.entries(strugglingFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([area]) => area);

    // Preferred interaction types
    const interactionTypes = interactions.map(i => i.context.activity);
    const interactionFrequency = this.countFrequency(interactionTypes);
    const preferredInteractionTypes = Object.entries(interactionFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);

    // Time of day patterns
    const timePatterns = interactions.reduce((acc, interaction) => {
      const hour = new Date(interaction.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const timeOfDayPatterns = Object.entries(timePatterns)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count);

    return {
      frequentQuestions,
      strugglingAreas,
      preferredInteractionTypes,
      timeOfDayPatterns
    };
  }

  /**
   * Generate insights from interaction patterns
   */
  private static generateInsights(interactions: InteractionRecord[]): InteractionAnalysis['insights'] {
    // Learning style analysis
    const visualKeywords = ['show', 'see', 'look', 'picture', 'diagram', 'chart'];
    const auditoryKeywords = ['hear', 'listen', 'sound', 'explain', 'tell', 'say'];
    const kinestheticKeywords = ['do', 'try', 'practice', 'hands-on', 'interactive'];

    const allInput = interactions.map(i => i.userInput.toLowerCase()).join(' ');
    const visualScore = visualKeywords.reduce((score, word) => 
      score + (allInput.split(word).length - 1), 0);
    const auditoryScore = auditoryKeywords.reduce((score, word) => 
      score + (allInput.split(word).length - 1), 0);
    const kinestheticScore = kinestheticKeywords.reduce((score, word) => 
      score + (allInput.split(word).length - 1), 0);

    let learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed' = 'mixed';
    const maxScore = Math.max(visualScore, auditoryScore, kinestheticScore);
    if (maxScore > 0) {
      if (visualScore === maxScore) learningStyle = 'visual';
      else if (auditoryScore === maxScore) learningStyle = 'auditory';
      else if (kinestheticScore === maxScore) learningStyle = 'kinesthetic';
    }

    // Help-seeking behavior
    const helpRequests = interactions.filter(i => 
      i.userInput.toLowerCase().includes('help') ||
      i.userInput.toLowerCase().includes('stuck') ||
      i.userInput.toLowerCase().includes('confused')
    ).length;

    const totalInteractions = interactions.length;
    const helpRatio = totalInteractions > 0 ? helpRequests / totalInteractions : 0;

    let helpSeekingBehavior: 'proactive' | 'reactive' | 'independent' = 'independent';
    if (helpRatio > 0.3) helpSeekingBehavior = 'proactive';
    else if (helpRatio > 0.1) helpSeekingBehavior = 'reactive';

    // Engagement level
    const avgInteractionsPerDay = totalInteractions / this.ANALYSIS_WINDOW_DAYS;
    let engagementLevel: 'high' | 'medium' | 'low' = 'low';
    if (avgInteractionsPerDay > 10) engagementLevel = 'high';
    else if (avgInteractionsPerDay > 3) engagementLevel = 'medium';

    // Preferred feedback style
    const longResponses = interactions.filter(i => i.companionResponse.length > 200).length;
    const shortResponses = interactions.filter(i => i.companionResponse.length < 100).length;
    const encouragingResponses = interactions.filter(i => 
      i.companionResponse.toLowerCase().includes('great') ||
      i.companionResponse.toLowerCase().includes('excellent') ||
      i.companionResponse.toLowerCase().includes('well done')
    ).length;

    let preferredFeedbackStyle: 'detailed' | 'brief' | 'encouraging' = 'brief';
    if (encouragingResponses > longResponses && encouragingResponses > shortResponses) {
      preferredFeedbackStyle = 'encouraging';
    } else if (longResponses > shortResponses) {
      preferredFeedbackStyle = 'detailed';
    }

    return {
      learningStyle,
      helpSeekingBehavior,
      engagementLevel,
      preferredFeedbackStyle
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private static generateRecommendations(interactions: InteractionRecord[]): string[] {
    const recommendations: string[] = [];

    // Check for struggling patterns
    const strugglingInteractions = interactions.filter(i => 
      i.context.emotionalState.primary === 'CONCERNED'
    );

    if (strugglingInteractions.length > interactions.length * 0.3) {
      recommendations.push('Consider providing more scaffolding and breaking down complex concepts');
      recommendations.push('Offer alternative explanations and examples');
    }

    // Check for engagement patterns
    const recentInteractions = interactions.slice(0, 10);
    const lowEngagement = recentInteractions.filter(i => 
      i.userInput.length < 10 || i.userInput.toLowerCase().includes('ok') || i.userInput.toLowerCase().includes('yes')
    );

    if (lowEngagement.length > recentInteractions.length * 0.6) {
      recommendations.push('Try more interactive and engaging content');
      recommendations.push('Ask open-ended questions to encourage participation');
    }

    // Check for time patterns
    const lateNightInteractions = interactions.filter(i => {
      const hour = new Date(i.timestamp).getHours();
      return hour >= 22 || hour <= 6;
    });

    if (lateNightInteractions.length > interactions.length * 0.3) {
      recommendations.push('Suggest optimal study times for better learning outcomes');
    }

    // Default recommendations if no specific patterns found
    if (recommendations.length === 0) {
      recommendations.push('Continue providing personalized support');
      recommendations.push('Monitor learning progress and adjust difficulty as needed');
    }

    return recommendations;
  }

  /**
   * Count frequency of items in an array
   */
  private static countFrequency<T>(items: T[]): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = String(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get default analysis when no data is available
   */
  private static getDefaultAnalysis(): InteractionAnalysis {
    return {
      patterns: {
        frequentQuestions: [],
        strugglingAreas: [],
        preferredInteractionTypes: [],
        timeOfDayPatterns: []
      },
      insights: {
        learningStyle: 'mixed',
        helpSeekingBehavior: 'independent',
        engagementLevel: 'medium',
        preferredFeedbackStyle: 'brief'
      },
      recommendations: [
        'Continue building interaction history for better personalization',
        'Encourage more engagement to understand learning preferences'
      ]
    };
  }

  /**
   * Clean up old interactions to maintain performance
   */
  public static cleanupOldInteractions(interactions: InteractionRecord[]): InteractionRecord[] {
    if (interactions.length <= this.MAX_HISTORY_SIZE) {
      return interactions;
    }

    // Keep most recent interactions and some representative older ones
    const recent = interactions.slice(0, Math.floor(this.MAX_HISTORY_SIZE * 0.8));
    const older = interactions.slice(Math.floor(this.MAX_HISTORY_SIZE * 0.8));
    
    // Sample older interactions to maintain diversity
    const sampledOlder = older.filter((_, index) => index % 5 === 0);
    
    return [...recent, ...sampledOlder].slice(0, this.MAX_HISTORY_SIZE);
  }
}