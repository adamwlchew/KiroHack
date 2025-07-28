import { MockCompanionService, getCompanionForPlatform, adaptCompanionForAccessibility } from '../companionService';
import { PersonalityTrait, Emotion } from '@pageflow/types';

describe('CompanionService', () => {
  let service: MockCompanionService;

  beforeEach(() => {
    service = new MockCompanionService();
  });

  describe('fetchCompanion', () => {
    it('should return a valid companion object', async () => {
      const companion = await service.fetchCompanion();
      
      expect(companion).toBeDefined();
      expect(companion.id).toBeDefined();
      expect(companion.userId).toBeDefined();
      expect(companion.name).toBe('Page');
      expect(companion.personality).toContain(PersonalityTrait.ENCOURAGING);
      expect(companion.personality).toContain(PersonalityTrait.FRIENDLY);
      expect(companion.emotionalState.primary).toBe(Emotion.HAPPY);
      expect(companion.appearance).toBeDefined();
      expect(companion.appearance.platformSpecific).toBeDefined();
    });

    it('should include platform-specific appearance settings', async () => {
      const companion = await service.fetchCompanion();
      
      expect(companion.appearance.platformSpecific.web).toBeDefined();
      expect(companion.appearance.platformSpecific.mobile).toBeDefined();
      expect(companion.appearance.platformSpecific.vr).toBeDefined();
      
      expect(companion.appearance.platformSpecific.web.position).toBe('corner');
      expect(companion.appearance.platformSpecific.mobile.arMode).toBe(true);
      expect(companion.appearance.platformSpecific.vr.presence).toBe('full-body');
    });
  });

  describe('interactWithCompanion', () => {
    it('should return a valid interaction response', async () => {
      const response = await service.interactWithCompanion('Hello Page!');
      
      expect(response).toBeDefined();
      expect(response.response).toBeDefined();
      expect(response.emotionalState).toBeDefined();
      expect(response.emotionalState.primary).toBe(Emotion.EXCITED);
      expect(response.emotionalState.intensity).toBe(90);
      expect(response.suggestions).toBeDefined();
      expect(Array.isArray(response.suggestions)).toBe(true);
    });

    it('should provide helpful suggestions', async () => {
      const response = await service.interactWithCompanion('Help me learn');
      
      expect(response.suggestions).toBeDefined();
      expect(response.suggestions!.length).toBeGreaterThan(0);
      expect(response.suggestions!.length).toBeLessThanOrEqual(3);
    });
  });

  describe('updateCompanionPersonality', () => {
    it('should update personality traits', async () => {
      const newPersonality = [PersonalityTrait.TECHNICAL, PersonalityTrait.SERIOUS];
      const updatedCompanion = await service.updateCompanionPersonality(newPersonality);
      
      expect(updatedCompanion.personality).toEqual(newPersonality);
      expect(updatedCompanion.updatedAt).toBeDefined();
    });
  });

  describe('updateCompanionAppearance', () => {
    it('should update appearance settings', async () => {
      const newAppearance = {
        avatarType: 'realistic' as const,
        colorScheme: 'green'
      };
      
      const updatedCompanion = await service.updateCompanionAppearance(newAppearance);
      
      expect(updatedCompanion.appearance.avatarType).toBe('realistic');
      expect(updatedCompanion.appearance.colorScheme).toBe('green');
      expect(updatedCompanion.updatedAt).toBeDefined();
    });
  });
});

describe('Platform Adaptations', () => {
  let baseCompanion: any;

  beforeEach(async () => {
    const service = new MockCompanionService();
    baseCompanion = await service.fetchCompanion();
  });

  describe('getCompanionForPlatform', () => {
    it('should adapt companion for web platform', () => {
      const webCompanion = getCompanionForPlatform(baseCompanion, 'web');
      
      expect(webCompanion.appearance.position).toBe('corner');
      expect(webCompanion.appearance.size).toBe('medium');
    });

    it('should adapt companion for mobile platform', () => {
      const mobileCompanion = getCompanionForPlatform(baseCompanion, 'mobile');
      
      expect(mobileCompanion.appearance.arMode).toBe(true);
      expect(mobileCompanion.appearance.size).toBe('medium');
    });

    it('should adapt companion for VR platform', () => {
      const vrCompanion = getCompanionForPlatform(baseCompanion, 'vr');
      
      expect(vrCompanion.appearance.presence).toBe('full-body');
      expect(vrCompanion.appearance.distance).toBe('medium');
    });
  });

  describe('adaptCompanionForAccessibility', () => {
    it('should adapt for screen reader optimization', () => {
      const adaptedCompanion = adaptCompanionForAccessibility(baseCompanion, {
        screenReaderOptimized: true
      });
      
      expect(adaptedCompanion.appearance.avatarType).toBe('text-only');
    });

    it('should adapt for reduced motion', () => {
      const adaptedCompanion = adaptCompanionForAccessibility(baseCompanion, {
        reducedMotion: true
      });
      
      expect(adaptedCompanion.appearance.animationLevel).toBe('none');
    });

    it('should handle multiple accessibility preferences', () => {
      const adaptedCompanion = adaptCompanionForAccessibility(baseCompanion, {
        screenReaderOptimized: true,
        reducedMotion: true
      });
      
      expect(adaptedCompanion.appearance.avatarType).toBe('text-only');
      expect(adaptedCompanion.appearance.animationLevel).toBe('none');
    });
  });
});