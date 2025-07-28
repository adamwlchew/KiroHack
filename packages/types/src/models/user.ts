/**
 * User model representing a PageFlow platform user
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  preferences: UserPreferences;
  accessibilitySettings?: AccessibilitySettings;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User roles in the system
 */
export enum UserRole {
  LEARNER = 'LEARNER',
  EDUCATOR = 'EDUCATOR',
  ADMIN = 'ADMIN'
}

/**
 * User preferences including accessibility settings
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'high-contrast';
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredInputMethod: 'standard' | 'voice' | 'switch' | 'eye-tracking';
  pageCompanionSettings: {
    interactionStyle: 'visual' | 'audio' | 'text-only';
    personality: 'encouraging' | 'neutral' | 'technical';
    verbosity: 'minimal' | 'balanced' | 'detailed';
  };
}

/**
 * Accessibility settings for users with special needs
 */
export interface AccessibilitySettings {
  theme: 'light' | 'dark' | 'high-contrast';
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  readingLevel: 'beginner' | 'intermediate' | 'advanced' | 'elementary';
  preferredInputMethod: 'standard' | 'voice' | 'switch' | 'eye-tracking';
  colorBlindnessSupport: boolean;
  dyslexiaSupport: boolean;
  hearingImpairmentSupport: boolean;
  motorImpairmentSupport: boolean;
  cognitiveSupport: boolean;
  // Additional properties that services are using
  screenReader?: boolean;
  highContrast?: boolean;
  alternativeInputEnabled?: boolean;
  alternativeInputType?: 'voice' | 'switch' | 'eye-tracking';
  enabled?: boolean;
}