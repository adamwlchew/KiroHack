import { 
  PageCompanion, 
  PersonalityTrait, 
  EmotionalState, 
  InteractionRecord,
  AppearanceSettings 
} from '@pageflow/types';
import { logger } from '@pageflow/utils';
import { v4 as uuidv4 } from 'uuid';

import { EmotionalStateService, EmotionalContext } from './emotionalStateService';
import { 
  InteractionHistoryService, 
  InteractionContext, 
  InteractionAnalysis 
} from './interactionHistoryService';
import { 
  KnowledgeBaseService, 
  KnowledgeItem, 
  KnowledgeCategory,
  KnowledgeSource 
} from './knowledgeBaseService';
import { 
  calculatePersonalityInfluence,
  DEFAULT_PERSONALITY_CONFIGS 
} from '../models/personalityTraits';

/**
 * Page companion interaction request
 */
export interface CompanionInteractionRequest {
  userId: string;
  userInput: string;
  context: InteractionContext;
  emotionalContext?: Partial<EmotionalContext>;
}

/**
 * Page companion interaction response
 */
export interface CompanionInteractionResponse {
  response: string;
  emotionalState: EmotionalState;
  suggestions?: string[];
  actions?: CompanionAction[];
  personalityInfluence: {
    tone: string;
    verbosity: string;
    encouragement: string;
    examples: boolean;
  };
}

/**
 * Actions the companion can suggest or perform
 */
export interface CompanionAction {
  type: 'offer_help' | 'celebrate' | 'suggest_content' | 'recommend_break' | 'provide_encouragement';
  message: string;
  data?: any;
}

/**
 * Main service for Page Companion functionality
 */
export class PageCompanionService {
  /**
   * Create a new Page companion for a user
   */
  public static async createCompanion(
    userId: string,
    initialPersonality: PersonalityTrait[] = [PersonalityTrait.FRIENDLY, PersonalityTrait.ENCOURAGING],
    initialAppearance?: Partial<AppearanceSettings>
  ): Promise<PageCompanion> {
    const now = new Date().toISOString();
    
    const companion: PageCompanion = {
      id: uuidv4(),
      userId,
      name: 'Page',
      personality: initialPersonality,
      emotionalState: EmotionalStateService.createDefaultEmotionalState(),
      appearance: {
        avatarType: 'cartoon',
        colorScheme: 'blue',
        animationLevel: 'standard',
        platformSpecific: {
          web: { position: 'corner', size: 'medium' },
          mobile: { arMode: true, size: 'medium' },
          vr: { presence: 'full-body', distance: 'medium' }
        },
        ...initialAppearance
      },
      interactionHistory: [],
      createdAt: now,
      updatedAt: now
    };

    logger.info({
      message: 'Page companion created',
      userId,
      companionId: companion.id,
      personality: initialPersonality
    });

    return companion;
  }

  /**
   * Handle interaction with Page companion
   */
  public static async handleInteraction(
    companion: PageCompanion,
    request: CompanionInteractionRequest,
    knowledgeBase: KnowledgeItem[] = []
  ): Promise<{
    updatedCompanion: PageCompanion;
    response: CompanionInteractionResponse;
  }> {
    try {
      // Analyze user context and knowledge
      const contextualKnowledge = KnowledgeBaseService.getContextualKnowledge(
        knowledgeBase,
        {
          location: request.context.location,
          activity: request.context.activity
        }
      );

      // Calculate personality influence on response
      const personalityInfluence = calculatePersonalityInfluence(
        companion.personality,
        `${request.context.activity}_${request.userInput.toLowerCase()}`
      );

      // Update emotional state based on interaction
      const emotionalContext: EmotionalContext = {
        userBehavior: this.analyzeUserBehavior(request.userInput, request.context),
        interactionType: this.determineInteractionType(request.userInput),
        ...request.emotionalContext
      };

      const updatedEmotionalState = EmotionalStateService.updateEmotionalState(
        companion.emotionalState,
        emotionalContext,
        companion.personality
      );

      // Generate response based on personality, emotional state, and context
      const response = await this.generateResponse(
        request.userInput,
        companion.personality,
        updatedEmotionalState,
        personalityInfluence,
        contextualKnowledge,
        request.context
      );

      // Record interaction
      const interactionRecord = InteractionHistoryService.recordInteraction(
        request.userId,
        request.userInput,
        response,
        request.context,
        updatedEmotionalState
      );

      // Update companion with new interaction and emotional state
      const updatedCompanion: PageCompanion = {
        ...companion,
        emotionalState: updatedEmotionalState,
        interactionHistory: [
          interactionRecord,
          ...companion.interactionHistory.slice(0, 999) // Keep last 1000 interactions
        ],
        updatedAt: new Date().toISOString()
      };

      // Generate suggestions and actions
      const suggestions = this.generateSuggestions(
        contextualKnowledge,
        updatedEmotionalState,
        request.context
      );

      const actions = this.generateActions(
        updatedEmotionalState,
        contextualKnowledge,
        request.context
      );

      const interactionResponse: CompanionInteractionResponse = {
        response,
        emotionalState: updatedEmotionalState,
        suggestions,
        actions,
        personalityInfluence
      };

      logger.info({
        message: 'Page companion interaction completed',
        userId: request.userId,
        companionId: companion.id,
        emotionalState: updatedEmotionalState.primary,
        responseLength: response.length
      });

      return {
        updatedCompanion,
        response: interactionResponse
      };

    } catch (error) {
      logger.error({
        message: 'Error handling companion interaction',
        error: error instanceof Error ? error.message : String(error),
        userId: request.userId,
        companionId: companion.id
      });

      // Return safe fallback response
      return {
        updatedCompanion: companion,
        response: {
          response: "I'm here to help! Could you tell me more about what you'd like to learn?",
          emotionalState: companion.emotionalState,
          personalityInfluence: {
            tone: 'friendly',
            verbosity: 'moderate',
            encouragement: 'medium',
            examples: false
          }
        }
      };
    }
  }

  /**
   * Update companion personality
   */
  public static updatePersonality(
    companion: PageCompanion,
    newPersonality: PersonalityTrait[]
  ): PageCompanion {
    const updatedCompanion: PageCompanion = {
      ...companion,
      personality: newPersonality,
      updatedAt: new Date().toISOString()
    };

    logger.info({
      message: 'Page companion personality updated',
      userId: companion.userId,
      companionId: companion.id,
      oldPersonality: companion.personality,
      newPersonality
    });

    return updatedCompanion;
  }

  /**
   * Update companion appearance
   */
  public static updateAppearance(
    companion: PageCompanion,
    newAppearance: Partial<AppearanceSettings>
  ): PageCompanion {
    const updatedCompanion: PageCompanion = {
      ...companion,
      appearance: {
        ...companion.appearance,
        ...newAppearance
      },
      updatedAt: new Date().toISOString()
    };

    logger.info({
      message: 'Page companion appearance updated',
      userId: companion.userId,
      companionId: companion.id,
      changes: Object.keys(newAppearance)
    });

    return updatedCompanion;
  }

  /**
   * Analyze interaction history for insights
   */
  public static analyzeInteractionHistory(
    companion: PageCompanion
  ): InteractionAnalysis {
    return InteractionHistoryService.analyzeInteractionHistory(
      companion.interactionHistory
    );
  }

  /**
   * Get companion status and insights
   */
  public static getCompanionStatus(
    companion: PageCompanion,
    knowledgeBase: KnowledgeItem[]
  ): {
    emotionalDescription: string;
    personalityDescription: string;
    recentInsights: string[];
    recommendations: string[];
  } {
    const emotionalDescription = EmotionalStateService.getEmotionalStateDescription(
      companion.emotionalState
    );

    const personalityDescription = this.getPersonalityDescription(companion.personality);
    
    const analysis = this.analyzeInteractionHistory(companion);
    
    return {
      emotionalDescription,
      personalityDescription,
      recentInsights: [
        `Learning style appears to be ${analysis.insights.learningStyle}`,
        `Engagement level is ${analysis.insights.engagementLevel}`,
        `Prefers ${analysis.insights.preferredFeedbackStyle} feedback`
      ],
      recommendations: analysis.recommendations
    };
  }

  /**
   * Analyze user behavior from input and context
   */
  private static analyzeUserBehavior(userInput: string, context: InteractionContext): string {
    const input = userInput.toLowerCase();
    
    if (input.includes('help') || input.includes('stuck') || input.includes('confused')) {
      return 'user_struggling';
    }
    
    if (input.includes('great') || input.includes('awesome') || input.includes('love')) {
      return 'user_succeeding';
    }
    
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return 'greeting';
    }
    
    if (context.activity === 'taking_quiz' || context.activity === 'assessment') {
      return 'taking_assessment';
    }
    
    if (context.activity === 'viewing_content') {
      return 'learning_content';
    }
    
    return 'general_interaction';
  }

  /**
   * Determine interaction type from user input
   */
  private static determineInteractionType(userInput: string): EmotionalContext['interactionType'] {
    const input = userInput.toLowerCase();
    
    if (input.includes('?') || input.startsWith('how') || input.startsWith('what') || input.startsWith('why')) {
      return 'question';
    }
    
    if (input.includes('help') || input.includes('stuck')) {
      return 'struggle';
    }
    
    if (input.includes('great') || input.includes('done') || input.includes('finished')) {
      return 'success';
    }
    
    if (input.includes('hello') || input.includes('hi')) {
      return 'greeting';
    }
    
    if (input.includes('bye') || input.includes('goodbye')) {
      return 'goodbye';
    }
    
    return 'response';
  }

  /**
   * Generate response based on all factors
   */
  private static async generateResponse(
    userInput: string,
    personality: PersonalityTrait[],
    emotionalState: EmotionalState,
    personalityInfluence: any,
    knowledgeBase: KnowledgeItem[],
    context: InteractionContext
  ): Promise<string> {
    // This is a simplified response generation
    // In a full implementation, this would integrate with the Bedrock service
    // for more sophisticated AI-generated responses
    
    const baseResponses = this.getBaseResponses(userInput, context);
    let response = baseResponses[Math.floor(Math.random() * baseResponses.length)];
    
    // Modify response based on personality influence
    response = this.applyPersonalityToResponse(response, personalityInfluence);
    
    // Modify response based on emotional state
    response = this.applyEmotionalStateToResponse(response, emotionalState);
    
    // Add contextual information from knowledge base
    response = this.addContextualInformation(response, knowledgeBase, context);
    
    return response;
  }

  /**
   * Get base responses for different types of input
   */
  private static getBaseResponses(userInput: string, context: InteractionContext): string[] {
    const input = userInput.toLowerCase();
    
    if (input.includes('hello') || input.includes('hi')) {
      return [
        "Hi there! I'm Page, your learning companion. How can I help you today?",
        "Hello! Ready to explore something new together?",
        "Hey! What would you like to learn about today?"
      ];
    }
    
    if (input.includes('help') || input.includes('stuck')) {
      return [
        "I'm here to help! Let's work through this together. What specifically is challenging you?",
        "No worries, we all get stuck sometimes. Can you tell me more about what's confusing?",
        "I'd love to help you figure this out. What part would you like me to explain?"
      ];
    }
    
    if (input.includes('?')) {
      return [
        "That's a great question! Let me help you understand this better.",
        "I love your curiosity! Here's what I think about that...",
        "Excellent question! Let's explore this together."
      ];
    }
    
    return [
      "That's interesting! Tell me more about what you're thinking.",
      "I'm here to support your learning journey. What would you like to explore?",
      "Thanks for sharing that with me. How can I help you learn more?"
    ];
  }

  /**
   * Apply personality influence to response
   */
  private static applyPersonalityToResponse(
    response: string,
    influence: any
  ): string {
    // Adjust tone
    if (influence.tone === 'enthusiastic') {
      response = response.replace(/\./g, '!').replace(/\?/g, '?!');
    } else if (influence.tone === 'calm') {
      response = response.replace(/!/g, '.');
    }
    
    // Adjust encouragement
    if (influence.encouragement === 'high') {
      const encouragingPhrases = ['You have got this!', 'Great job!', 'Keep going!'];
      response += ' ' + encouragingPhrases[Math.floor(Math.random() * encouragingPhrases.length)];
    }
    
    return response;
  }

  /**
   * Apply emotional state to response
   */
  private static applyEmotionalStateToResponse(
    response: string,
    emotionalState: EmotionalState
  ): string {
    const emotionalPrefixes = {
      EXCITED: "I'm so excited to help! ",
      HAPPY: "I'm happy to assist! ",
      CONCERNED: "I want to make sure you understand this well. ",
      THOUGHTFUL: "Let me think about the best way to explain this. ",
      SURPRISED: "Oh, that's interesting! "
    };
    
    const prefix = emotionalPrefixes[emotionalState.primary as keyof typeof emotionalPrefixes];
    if (prefix && emotionalState.intensity > 60) {
      response = prefix + response;
    }
    
    return response;
  }

  /**
   * Add contextual information from knowledge base
   */
  private static addContextualInformation(
    response: string,
    knowledgeBase: KnowledgeItem[],
    context: InteractionContext
  ): string {
    // Find relevant user preferences
    const preferences = knowledgeBase.filter(item => 
      item.category === KnowledgeCategory.LEARNING_PREFERENCES
    );
    
    // Add personalized touches based on known preferences
    if (preferences.length > 0) {
      const feedbackStyle = preferences.find(p => p.key === 'feedback_style');
      if (feedbackStyle?.value === 'detailed' && response.length < 100) {
        response += " Would you like me to explain this in more detail?";
      }
    }
    
    return response;
  }

  /**
   * Generate suggestions based on context
   */
  private static generateSuggestions(
    knowledgeBase: KnowledgeItem[],
    emotionalState: EmotionalState,
    context: InteractionContext
  ): string[] {
    const suggestions: string[] = [];
    
    // Suggest based on emotional state
    if (EmotionalStateService.shouldTriggerBehavior(emotionalState, 'offer_help')) {
      suggestions.push("Would you like me to break this down into smaller steps?");
      suggestions.push("Should we try a different approach to this topic?");
    }
    
    if (EmotionalStateService.shouldTriggerBehavior(emotionalState, 'celebrate')) {
      suggestions.push("Ready for the next challenge?");
      suggestions.push("Want to explore something related to this?");
    }
    
    // Context-based suggestions
    if (context.activity === 'viewing_content') {
      suggestions.push("Try the interactive quiz for this topic");
      suggestions.push("Explore related learning paths");
    }
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Generate actions based on context
   */
  private static generateActions(
    emotionalState: EmotionalState,
    knowledgeBase: KnowledgeItem[],
    context: InteractionContext
  ): CompanionAction[] {
    const actions: CompanionAction[] = [];
    
    if (EmotionalStateService.shouldTriggerBehavior(emotionalState, 'offer_help')) {
      actions.push({
        type: 'offer_help',
        message: "I notice you might be struggling. Would you like some additional support?",
        data: { supportType: 'scaffolding' }
      });
    }
    
    if (EmotionalStateService.shouldTriggerBehavior(emotionalState, 'celebrate')) {
      actions.push({
        type: 'celebrate',
        message: "Fantastic work! You're making great progress!",
        data: { celebrationType: 'achievement' }
      });
    }
    
    if (EmotionalStateService.shouldTriggerBehavior(emotionalState, 'suggest_break')) {
      actions.push({
        type: 'recommend_break',
        message: "You've been working hard! Maybe it's time for a short break?",
        data: { breakDuration: 10 }
      });
    }
    
    return actions;
  }

  /**
   * Get personality description
   */
  private static getPersonalityDescription(personality: PersonalityTrait[]): string {
    const descriptions = {
      [PersonalityTrait.ENCOURAGING]: 'supportive and motivating',
      [PersonalityTrait.PATIENT]: 'patient and understanding',
      [PersonalityTrait.ENTHUSIASTIC]: 'energetic and excited',
      [PersonalityTrait.CALM]: 'calm and steady',
      [PersonalityTrait.TECHNICAL]: 'precise and detailed',
      [PersonalityTrait.FRIENDLY]: 'warm and approachable',
      [PersonalityTrait.HUMOROUS]: 'playful and fun',
      [PersonalityTrait.SERIOUS]: 'focused and professional'
    };
    
    const traits = personality.map(trait => descriptions[trait]).filter(Boolean);
    
    if (traits.length === 0) return 'helpful and adaptive';
    if (traits.length === 1) return traits[0];
    if (traits.length === 2) return `${traits[0]} and ${traits[1]}`;
    
    return `${traits.slice(0, -1).join(', ')}, and ${traits[traits.length - 1]}`;
  }
}