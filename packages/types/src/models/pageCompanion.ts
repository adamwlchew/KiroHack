/**
 * Page Companion model representing the AI assistant
 */
export interface PageCompanion {
  id: string;
  userId: string;
  name: string;
  personality: PersonalityTrait[];
  emotionalState: EmotionalState;
  appearance: AppearanceSettings;
  interactionHistory: InteractionRecord[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Personality traits for Page Companion
 */
export enum PersonalityTrait {
  ENCOURAGING = 'ENCOURAGING',
  PATIENT = 'PATIENT',
  ENTHUSIASTIC = 'ENTHUSIASTIC',
  CALM = 'CALM',
  TECHNICAL = 'TECHNICAL',
  FRIENDLY = 'FRIENDLY',
  HUMOROUS = 'HUMOROUS',
  SERIOUS = 'SERIOUS'
}

/**
 * Emotional state of Page Companion
 */
export interface EmotionalState {
  primary: Emotion;
  intensity: number; // 0-100
  lastUpdated: string;
}

/**
 * Emotions for Page Companion
 */
export enum Emotion {
  HAPPY = 'HAPPY',
  EXCITED = 'EXCITED',
  NEUTRAL = 'NEUTRAL',
  THOUGHTFUL = 'THOUGHTFUL',
  CONCERNED = 'CONCERNED',
  SURPRISED = 'SURPRISED'
}

/**
 * Appearance settings for Page Companion
 */
export interface AppearanceSettings {
  avatarType: 'realistic' | 'cartoon' | 'abstract' | 'text-only';
  colorScheme: string;
  animationLevel: 'none' | 'minimal' | 'standard' | 'expressive';
  platformSpecific: {
    web: WebAppearance;
    mobile: MobileAppearance;
    vr: VRAppearance;
  };
}

export interface WebAppearance {
  position: 'corner' | 'floating' | 'sidebar';
  size: 'small' | 'medium' | 'large';
}

export interface MobileAppearance {
  arMode: boolean;
  size: 'small' | 'medium' | 'large';
}

export interface VRAppearance {
  presence: 'full-body' | 'head-only' | 'voice-only';
  distance: 'close' | 'medium' | 'far';
}

/**
 * Interaction record for Page Companion
 */
export interface InteractionRecord {
  id: string;
  timestamp: string;
  userInput: string;
  companionResponse: string;
  context: {
    location: string;
    activity: string;
    emotionalState: EmotionalState;
  };
}