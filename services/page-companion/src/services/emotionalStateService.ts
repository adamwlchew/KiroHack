import { EmotionalState, Emotion, PersonalityTrait } from '@pageflow/types';
import { calculateEmotionalResponse } from '../models/personalityTraits';
import { logger } from '@pageflow/utils';

/**
 * Context for emotional state updates
 */
export interface EmotionalContext {
  userBehavior: string;
  interactionType: 'question' | 'response' | 'struggle' | 'success' | 'greeting' | 'goodbye';
  contentDifficulty?: 'easy' | 'medium' | 'hard';
  userProgress?: number; // 0-100
  timeSpent?: number; // seconds
  previousInteractions?: number; // count of recent interactions
}

/**
 * Emotional state transition rules
 */
interface EmotionalTransition {
  from: Emotion;
  to: Emotion;
  trigger: string;
  intensityChange: number;
  conditions?: (context: EmotionalContext) => boolean;
}

/**
 * Service for managing Page's emotional state
 */
export class EmotionalStateService {
  private static readonly EMOTIONAL_TRANSITIONS: EmotionalTransition[] = [
    // Happy transitions
    {
      from: Emotion.NEUTRAL,
      to: Emotion.HAPPY,
      trigger: 'user_success',
      intensityChange: 25,
      conditions: (ctx) => ctx.userProgress !== undefined && ctx.userProgress > 70
    },
    {
      from: Emotion.CONCERNED,
      to: Emotion.HAPPY,
      trigger: 'user_improvement',
      intensityChange: 30,
      conditions: (ctx) => ctx.interactionType === 'success'
    },

    // Excited transitions
    {
      from: Emotion.HAPPY,
      to: Emotion.EXCITED,
      trigger: 'major_achievement',
      intensityChange: 20,
      conditions: (ctx) => ctx.userProgress !== undefined && ctx.userProgress >= 90
    },
    {
      from: Emotion.NEUTRAL,
      to: Emotion.EXCITED,
      trigger: 'new_challenge',
      intensityChange: 35,
      conditions: (ctx) => ctx.contentDifficulty === 'hard'
    },

    // Concerned transitions
    {
      from: Emotion.NEUTRAL,
      to: Emotion.CONCERNED,
      trigger: 'user_struggling',
      intensityChange: 20,
      conditions: (ctx) => ctx.interactionType === 'struggle'
    },
    {
      from: Emotion.HAPPY,
      to: Emotion.CONCERNED,
      trigger: 'sudden_difficulty',
      intensityChange: 15,
      conditions: (ctx) => ctx.timeSpent !== undefined && ctx.timeSpent > 300 // 5 minutes
    },

    // Thoughtful transitions
    {
      from: Emotion.NEUTRAL,
      to: Emotion.THOUGHTFUL,
      trigger: 'complex_question',
      intensityChange: 15,
      conditions: (ctx) => ctx.interactionType === 'question'
    },
    {
      from: Emotion.CONCERNED,
      to: Emotion.THOUGHTFUL,
      trigger: 'analyzing_struggle',
      intensityChange: 10,
      conditions: (ctx) => ctx.previousInteractions !== undefined && ctx.previousInteractions > 3
    },

    // Surprised transitions
    {
      from: Emotion.NEUTRAL,
      to: Emotion.SURPRISED,
      trigger: 'unexpected_success',
      intensityChange: 25,
      conditions: (ctx) => ctx.contentDifficulty === 'hard' && ctx.interactionType === 'success'
    },

    // Return to neutral
    {
      from: Emotion.EXCITED,
      to: Emotion.NEUTRAL,
      trigger: 'time_decay',
      intensityChange: -10,
      conditions: () => true
    },
    {
      from: Emotion.CONCERNED,
      to: Emotion.NEUTRAL,
      trigger: 'situation_resolved',
      intensityChange: -15,
      conditions: (ctx) => ctx.interactionType === 'response'
    }
  ];

  /**
   * Update emotional state based on context and personality
   */
  public static updateEmotionalState(
    currentState: EmotionalState,
    context: EmotionalContext,
    personalityTraits: PersonalityTrait[]
  ): EmotionalState {
    try {
      // Calculate personality-based emotional response
      const personalityResponse = calculateEmotionalResponse(
        personalityTraits,
        context.userBehavior,
        currentState.intensity
      );

      // Find applicable transitions
      const applicableTransitions = this.EMOTIONAL_TRANSITIONS.filter(transition => 
        transition.from === currentState.primary &&
        context.userBehavior.includes(transition.trigger) &&
        (!transition.conditions || transition.conditions(context))
      );

      let newEmotion = currentState.primary;
      let newIntensity = currentState.intensity;

      // Apply the most relevant transition
      if (applicableTransitions.length > 0) {
        const transition = applicableTransitions[0]; // Take first matching transition
        newEmotion = transition.to;
        newIntensity = Math.max(0, Math.min(100, 
          currentState.intensity + transition.intensityChange
        ));
      }

      // Blend with personality-based response
      if (personalityResponse.emotion !== 'NEUTRAL') {
        newEmotion = personalityResponse.emotion as Emotion;
        newIntensity = Math.round((newIntensity + personalityResponse.intensity) / 2);
      }

      // Apply natural decay over time
      newIntensity = this.applyNaturalDecay(newIntensity, currentState.lastUpdated);

      const updatedState: EmotionalState = {
        primary: newEmotion,
        intensity: newIntensity,
        lastUpdated: new Date().toISOString()
      };

      logger.info({
        message: 'Emotional state updated',
        previous: currentState,
        new: updatedState,
        context,
        personalityTraits
      });

      return updatedState;
    } catch (error) {
      logger.error({
        message: 'Error updating emotional state',
        error: error instanceof Error ? error.message : String(error),
        context
      });
      return currentState; // Return unchanged state on error
    }
  }

  /**
   * Apply natural decay to emotional intensity over time
   */
  private static applyNaturalDecay(intensity: number, lastUpdated: string): number {
    const now = new Date();
    const lastUpdate = new Date(lastUpdated);
    const timeDiffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

    // Decay rate: 1 point per minute for high intensity, slower for lower
    const decayRate = intensity > 70 ? 1 : intensity > 40 ? 0.5 : 0.2;
    const decay = Math.floor(timeDiffMinutes * decayRate);

    return Math.max(20, intensity - decay); // Minimum intensity of 20
  }

  /**
   * Get emotional state description for UI/responses
   */
  public static getEmotionalStateDescription(state: EmotionalState): string {
    const intensityLevel = state.intensity > 80 ? 'very' : 
                          state.intensity > 60 ? 'quite' : 
                          state.intensity > 40 ? 'somewhat' : 'slightly';

    switch (state.primary) {
      case Emotion.HAPPY:
        return `${intensityLevel} happy`;
      case Emotion.EXCITED:
        return `${intensityLevel} excited`;
      case Emotion.CONCERNED:
        return `${intensityLevel} concerned`;
      case Emotion.THOUGHTFUL:
        return `${intensityLevel} thoughtful`;
      case Emotion.SURPRISED:
        return `${intensityLevel} surprised`;
      case Emotion.NEUTRAL:
      default:
        return 'calm and ready to help';
    }
  }

  /**
   * Determine if emotional state should trigger specific behaviors
   */
  public static shouldTriggerBehavior(
    state: EmotionalState,
    behavior: 'offer_help' | 'celebrate' | 'provide_encouragement' | 'suggest_break'
  ): boolean {
    switch (behavior) {
      case 'offer_help':
        return state.primary === Emotion.CONCERNED && state.intensity > 60;
      
      case 'celebrate':
        return (state.primary === Emotion.EXCITED || state.primary === Emotion.HAPPY) && 
               state.intensity > 70;
      
      case 'provide_encouragement':
        return state.primary === Emotion.CONCERNED && state.intensity > 40;
      
      case 'suggest_break':
        return state.primary === Emotion.CONCERNED && state.intensity > 80;
      
      default:
        return false;
    }
  }

  /**
   * Create default emotional state
   */
  public static createDefaultEmotionalState(): EmotionalState {
    return {
      primary: Emotion.HAPPY,
      intensity: 75,
      lastUpdated: new Date().toISOString()
    };
  }
}