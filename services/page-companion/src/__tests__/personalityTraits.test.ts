import { PersonalityTrait } from '@pageflow/types';
import { 
  calculatePersonalityInfluence, 
  calculateEmotionalResponse,
  DEFAULT_PERSONALITY_CONFIGS 
} from '../models/personalityTraits';

describe('PersonalityTraits', () => {
  describe('calculatePersonalityInfluence', () => {
    it('should return default values when no matching context', () => {
      const traits = [PersonalityTrait.FRIENDLY];
      const context = 'unmatched_context';
      
      const result = calculatePersonalityInfluence(traits, context);
      
      expect(result).toEqual({
        tone: 'casual',
        verbosity: 'moderate',
        encouragement: 'medium',
        examples: false
      });
    });

    it('should apply encouraging personality for struggling user', () => {
      const traits = [PersonalityTrait.ENCOURAGING];
      const context = 'user_struggling';
      
      const result = calculatePersonalityInfluence(traits, context);
      
      expect(result.tone).toBe('enthusiastic');
      expect(result.encouragement).toBe('high');
      expect(result.examples).toBe(true);
    });

    it('should apply patient personality for confused user', () => {
      const traits = [PersonalityTrait.PATIENT];
      const context = 'user_confused';
      
      const result = calculatePersonalityInfluence(traits, context);
      
      expect(result.tone).toBe('calm');
      expect(result.verbosity).toBe('detailed');
      expect(result.encouragement).toBe('medium');
    });

    it('should handle multiple personality traits', () => {
      const traits = [PersonalityTrait.ENCOURAGING, PersonalityTrait.PATIENT];
      const context = 'user_struggling';
      
      const result = calculatePersonalityInfluence(traits, context);
      
      // Should apply the most relevant modifier
      expect(result.tone).toBe('enthusiastic');
      expect(result.encouragement).toBe('high');
    });
  });

  describe('calculateEmotionalResponse', () => {
    it('should return neutral emotion for no matching triggers', () => {
      const traits = [PersonalityTrait.FRIENDLY];
      const userBehavior = 'unmatched_behavior';
      const currentIntensity = 50;
      
      const result = calculateEmotionalResponse(traits, userBehavior, currentIntensity);
      
      expect(result.emotion).toBe('NEUTRAL');
      expect(result.intensity).toBeLessThanOrEqual(50);
    });

    it('should increase intensity for positive behavior with encouraging trait', () => {
      const traits = [PersonalityTrait.ENCOURAGING];
      const userBehavior = 'succeeding';
      const currentIntensity = 50;
      
      const result = calculateEmotionalResponse(traits, userBehavior, currentIntensity);
      
      expect(result.emotion).toBe('EXCITED');
      expect(result.intensity).toBeGreaterThan(50);
    });

    it('should handle struggling behavior with patient trait', () => {
      const traits = [PersonalityTrait.PATIENT];
      const userBehavior = 'repeated_mistakes';
      const currentIntensity = 60;
      
      const result = calculateEmotionalResponse(traits, userBehavior, currentIntensity);
      
      expect(result.emotion).toBe('THOUGHTFUL');
      expect(result.intensity).toBeGreaterThanOrEqual(60);
    });

    it('should cap intensity at 100', () => {
      const traits = [PersonalityTrait.ENTHUSIASTIC];
      const userBehavior = 'completing_challenge';
      const currentIntensity = 90;
      
      const result = calculateEmotionalResponse(traits, userBehavior, currentIntensity);
      
      expect(result.intensity).toBeLessThanOrEqual(100);
    });

    it('should not go below 0 intensity', () => {
      const traits = [PersonalityTrait.CALM];
      const userBehavior = 'showing_frustration';
      const currentIntensity = 5;
      
      const result = calculateEmotionalResponse(traits, userBehavior, currentIntensity);
      
      expect(result.intensity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('DEFAULT_PERSONALITY_CONFIGS', () => {
    it('should have configurations for all personality traits', () => {
      const allTraits = Object.values(PersonalityTrait);
      
      allTraits.forEach(trait => {
        expect(DEFAULT_PERSONALITY_CONFIGS[trait]).toBeDefined();
        expect(DEFAULT_PERSONALITY_CONFIGS[trait].trait).toBe(trait);
        expect(DEFAULT_PERSONALITY_CONFIGS[trait].weight).toBeGreaterThan(0);
        expect(DEFAULT_PERSONALITY_CONFIGS[trait].weight).toBeLessThanOrEqual(100);
      });
    });

    it('should have valid response modifiers', () => {
      Object.values(DEFAULT_PERSONALITY_CONFIGS).forEach(config => {
        expect(config.responseModifiers).toBeInstanceOf(Array);
        config.responseModifiers.forEach(modifier => {
          expect(modifier.condition).toBeTruthy();
          expect(modifier.modification).toBeDefined();
        });
      });
    });

    it('should have valid emotional triggers', () => {
      Object.values(DEFAULT_PERSONALITY_CONFIGS).forEach(config => {
        expect(config.emotionalTriggers).toBeInstanceOf(Array);
        config.emotionalTriggers.forEach(trigger => {
          expect(trigger.userBehavior).toBeTruthy();
          expect(trigger.emotionalResponse.emotion).toBeTruthy();
          expect(typeof trigger.emotionalResponse.intensityModifier).toBe('number');
        });
      });
    });
  });
});