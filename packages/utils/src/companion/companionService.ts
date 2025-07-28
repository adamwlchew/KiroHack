import { PageCompanion, PersonalityTrait, Emotion, AppearanceSettings } from '@pageflow/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock companion service for development and testing
 */
export class MockCompanionService {
  private companion: PageCompanion | null = null;

  /**
   * Fetch the companion for the current user
   */
  async fetchCompanion(): Promise<PageCompanion> {
    if (!this.companion) {
      this.companion = this.createDefaultCompanion();
    }
    return { ...this.companion };
  }

  /**
   * Interact with the companion
   */
  async interactWithCompanion(userInput: string): Promise<{
    response: string;
    emotionalState: {
      primary: Emotion;
      intensity: number;
    };
    suggestions?: string[];
  }> {
    // Mock response based on input
    const responses = {
      greeting: "Hi there! I'm Page, your learning companion. How can I help you today?",
      help: "I'm here to guide you through your learning journey! What would you like to explore?",
      default: "That's interesting! Tell me more about what you'd like to learn."
    };

    let response = responses.default;
    if (userInput.toLowerCase().includes('hello') || userInput.toLowerCase().includes('hi')) {
      response = responses.greeting;
    } else if (userInput.toLowerCase().includes('help') || userInput.toLowerCase().includes('learn')) {
      response = responses.help;
    }

    const suggestions = [
      "Explore a new learning path",
      "Review your progress",
      "Try an interactive quiz"
    ];

    return {
      response,
      emotionalState: {
        primary: Emotion.EXCITED,
        intensity: 90
      },
      suggestions: suggestions.slice(0, Math.floor(Math.random() * 3) + 1)
    };
  }

  /**
   * Update companion personality
   */
  async updateCompanionPersonality(personality: PersonalityTrait[]): Promise<PageCompanion> {
    if (!this.companion) {
      this.companion = this.createDefaultCompanion();
    }

    this.companion.personality = personality;
    this.companion.updatedAt = new Date().toISOString();

    return { ...this.companion };
  }

  /**
   * Update companion appearance
   */
  async updateCompanionAppearance(appearance: Partial<AppearanceSettings>): Promise<PageCompanion> {
    if (!this.companion) {
      this.companion = this.createDefaultCompanion();
    }

    this.companion.appearance = {
      ...this.companion.appearance,
      ...appearance
    };
    this.companion.updatedAt = new Date().toISOString();

    return { ...this.companion };
  }

  /**
   * Create a default companion
   */
  private createDefaultCompanion(): PageCompanion {
    const now = new Date().toISOString();

    return {
      id: uuidv4(),
      userId: 'mock-user-id',
      name: 'Page',
      personality: [PersonalityTrait.ENCOURAGING, PersonalityTrait.FRIENDLY],
      emotionalState: {
        primary: Emotion.HAPPY,
        intensity: 80,
        lastUpdated: now
      },
      appearance: {
        avatarType: 'cartoon',
        colorScheme: 'blue',
        animationLevel: 'standard',
        platformSpecific: {
          web: {
            position: 'corner',
            size: 'medium'
          },
          mobile: {
            arMode: true,
            size: 'medium'
          },
          vr: {
            presence: 'full-body',
            distance: 'medium'
          }
        }
      },
      interactionHistory: [],
      createdAt: now,
      updatedAt: now
    };
  }
}

/**
 * Adapt companion for specific platform
 */
export function getCompanionForPlatform(
  companion: PageCompanion,
  platform: 'web' | 'mobile' | 'vr'
): any {
  const platformAppearance = companion.appearance.platformSpecific[platform];
  
  return {
    ...companion,
    appearance: {
      ...companion.appearance,
      ...platformAppearance
    }
  };
}

/**
 * Adapt companion for accessibility preferences
 */
export function adaptCompanionForAccessibility(
  companion: PageCompanion,
  preferences: {
    screenReaderOptimized?: boolean;
    reducedMotion?: boolean;
  }
): PageCompanion {
  const adaptedCompanion = { ...companion };

  if (preferences.screenReaderOptimized) {
    adaptedCompanion.appearance.avatarType = 'text-only';
  }

  if (preferences.reducedMotion) {
    adaptedCompanion.appearance.animationLevel = 'none';
  }

  return adaptedCompanion;
}