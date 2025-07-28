import { EmotionalState, Emotion, PersonalityTrait } from '@pageflow/types';
import { EmotionalStateService, EmotionalContext } from '../services/emotionalStateService';

describe('EmotionalStateService', () => {
  const createMockEmotionalState = (
    emotion: Emotion = Emotion.NEUTRAL,
    intensity: number = 50
  ): EmotionalState => ({
    primary: emotion,
    intensity,
    lastUpdated: new Date().toISOString()
  });

  const createMockContext = (
    userBehavior: string = 'general_interaction',
    interactionType: EmotionalContext['interactionType'] = 'response'
  ): EmotionalContext => ({
    userBehavior,
    interactionType,
    userProgress: 50,
    timeSpent: 120
  });

  describe('updateEmotionalState', () => {
    it('should update emotional state based on user success', () => {
      const currentState = createMockEmotionalState(Emotion.NEUTRAL, 50);
      const context = createMockContext('user_success', 'success');
      context.userProgress = 80;
      const personality = [PersonalityTrait.ENCOURAGING];

      const result = EmotionalStateService.updateEmotionalState(
        currentState,
        context,
        personality
      );

      expect(result.primary).toBe(Emotion.HAPPY);
      expect(result.intensity).toBeGreaterThan(50);
      expect(result.lastUpdated).not.toBe(currentState.lastUpdated);
    });

    it('should transition to concerned state when user is struggling', () => {
      const currentState = createMockEmotionalState(Emotion.NEUTRAL, 60);
      const context = createMockContext('user_struggling', 'struggle');
      const personality = [PersonalityTrait.PATIENT];

      const result = EmotionalStateService.updateEmotionalState(
        currentState,
        context,
        personality
      );

      expect(result.primary).toBe(Emotion.CONCERNED);
      expect(result.intensity).toBeGreaterThanOrEqual(60);
    });

    it('should transition to excited state for major achievements', () => {
      const currentState = createMockEmotionalState(Emotion.HAPPY, 70);
      const context = createMockContext('major_achievement', 'success');
      context.userProgress = 95;
      const personality = [PersonalityTrait.ENTHUSIASTIC];

      const result = EmotionalStateService.updateEmotionalState(
        currentState,
        context,
        personality
      );

      expect(result.primary).toBe(Emotion.EXCITED);
      expect(result.intensity).toBeGreaterThan(70);
    });

    it('should apply natural decay over time', () => {
      const oldTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago
      const currentState: EmotionalState = {
        primary: Emotion.EXCITED,
        intensity: 90,
        lastUpdated: oldTimestamp
      };
      const context = createMockContext('general_interaction', 'response');
      const personality = [PersonalityTrait.FRIENDLY];

      const result = EmotionalStateService.updateEmotionalState(
        currentState,
        context,
        personality
      );

      expect(result.intensity).toBeLessThan(90);
      expect(result.intensity).toBeGreaterThanOrEqual(20); // Minimum intensity
    });

    it('should handle errors gracefully', () => {
      const currentState = createMockEmotionalState();
      const invalidContext = {} as EmotionalContext;
      const personality = [PersonalityTrait.FRIENDLY];

      const result = EmotionalStateService.updateEmotionalState(
        currentState,
        invalidContext,
        personality
      );

      // Should return unchanged state on error
      expect(result).toEqual(currentState);
    });
  });

  describe('getEmotionalStateDescription', () => {
    it('should describe high intensity happy state', () => {
      const state = createMockEmotionalState(Emotion.HAPPY, 85);
      const description = EmotionalStateService.getEmotionalStateDescription(state);
      expect(description).toBe('very happy');
    });

    it('should describe medium intensity concerned state', () => {
      const state = createMockEmotionalState(Emotion.CONCERNED, 65);
      const description = EmotionalStateService.getEmotionalStateDescription(state);
      expect(description).toBe('quite concerned');
    });

    it('should describe low intensity excited state', () => {
      const state = createMockEmotionalState(Emotion.EXCITED, 35);
      const description = EmotionalStateService.getEmotionalStateDescription(state);
      expect(description).toBe('slightly excited');
    });

    it('should describe neutral state', () => {
      const state = createMockEmotionalState(Emotion.NEUTRAL, 50);
      const description = EmotionalStateService.getEmotionalStateDescription(state);
      expect(description).toBe('calm and ready to help');
    });
  });

  describe('shouldTriggerBehavior', () => {
    it('should trigger offer_help for high intensity concerned state', () => {
      const state = createMockEmotionalState(Emotion.CONCERNED, 70);
      const shouldTrigger = EmotionalStateService.shouldTriggerBehavior(state, 'offer_help');
      expect(shouldTrigger).toBe(true);
    });

    it('should not trigger offer_help for low intensity concerned state', () => {
      const state = createMockEmotionalState(Emotion.CONCERNED, 50);
      const shouldTrigger = EmotionalStateService.shouldTriggerBehavior(state, 'offer_help');
      expect(shouldTrigger).toBe(false);
    });

    it('should trigger celebrate for high intensity excited state', () => {
      const state = createMockEmotionalState(Emotion.EXCITED, 80);
      const shouldTrigger = EmotionalStateService.shouldTriggerBehavior(state, 'celebrate');
      expect(shouldTrigger).toBe(true);
    });

    it('should trigger provide_encouragement for medium intensity concerned state', () => {
      const state = createMockEmotionalState(Emotion.CONCERNED, 50);
      const shouldTrigger = EmotionalStateService.shouldTriggerBehavior(state, 'provide_encouragement');
      expect(shouldTrigger).toBe(true);
    });

    it('should trigger suggest_break for very high intensity concerned state', () => {
      const state = createMockEmotionalState(Emotion.CONCERNED, 85);
      const shouldTrigger = EmotionalStateService.shouldTriggerBehavior(state, 'suggest_break');
      expect(shouldTrigger).toBe(true);
    });

    it('should not trigger unknown behavior', () => {
      const state = createMockEmotionalState(Emotion.HAPPY, 80);
      const shouldTrigger = EmotionalStateService.shouldTriggerBehavior(
        state, 
        'unknown_behavior' as any
      );
      expect(shouldTrigger).toBe(false);
    });
  });

  describe('createDefaultEmotionalState', () => {
    it('should create a default happy emotional state', () => {
      const defaultState = EmotionalStateService.createDefaultEmotionalState();
      
      expect(defaultState.primary).toBe(Emotion.HAPPY);
      expect(defaultState.intensity).toBe(75);
      expect(defaultState.lastUpdated).toBeTruthy();
      expect(new Date(defaultState.lastUpdated)).toBeInstanceOf(Date);
    });
  });
});