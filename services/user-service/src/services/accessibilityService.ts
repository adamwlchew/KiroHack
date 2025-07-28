import { AppError, logger } from '@pageflow/utils';
import { AccessibilitySettings } from '@pageflow/types';
import { UserProfileService } from './userProfileService';

export interface AccessibilityProfile {
  userId: string;
  settings: AccessibilitySettings;
  detectedReadingLevel?: string;
  alternativeInputCapabilities: AlternativeInputCapability[];
  assistiveTechnologies: AssistiveTechnology[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AlternativeInputCapability {
  type: 'voice' | 'switch' | 'eye-tracking' | 'head-tracking' | 'sip-puff';
  enabled: boolean;
  configuration?: Record<string, any>;
  calibrationData?: Record<string, any>;
}

export interface AssistiveTechnology {
  type: 'screen-reader' | 'magnifier' | 'voice-recognition' | 'switch-device' | 'eye-tracker';
  name: string;
  version?: string;
  detected: boolean;
  supported: boolean;
  configuration?: Record<string, any>;
}

export interface ReadingLevelAnalysis {
  detectedLevel: 'elementary' | 'intermediate' | 'advanced' | 'expert';
  confidence: number;
  factors: {
    vocabularyComplexity: number;
    sentenceLength: number;
    comprehensionSpeed: number;
    errorRate: number;
  };
  recommendations: string[];
}

export interface AccessibilityAssessment {
  userId: string;
  visualImpairment: {
    severity: 'none' | 'mild' | 'moderate' | 'severe' | 'blind';
    type: 'low-vision' | 'color-blindness' | 'blindness' | 'none';
    assistiveNeeds: string[];
  };
  hearingImpairment: {
    severity: 'none' | 'mild' | 'moderate' | 'severe' | 'deaf';
    assistiveNeeds: string[];
  };
  motorImpairment: {
    severity: 'none' | 'mild' | 'moderate' | 'severe';
    affectedAreas: string[];
    assistiveNeeds: string[];
  };
  cognitiveNeeds: {
    attentionSupport: boolean;
    memorySupport: boolean;
    processingTimeNeeds: boolean;
    simplificationNeeds: boolean;
  };
  preferredInteractionMethods: string[];
  assessmentDate: Date;
}

export class AccessibilityService {
  private userProfileService: UserProfileService;
  private logger = logger.child({ component: 'AccessibilityService' });

  constructor() {
    this.userProfileService = new UserProfileService();
  }

  async getAccessibilityProfile(userId: string): Promise<AccessibilityProfile | null> {
    try {
      const user = await this.userProfileService.getUserProfile(userId);
      
      if (!user) {
        return null;
      }

      // For now, we'll construct the accessibility profile from the user's preferences
      // In a full implementation, this might be stored separately
      const settings: AccessibilitySettings = {
        ...user.preferences,
        colorBlindnessSupport: false,
        dyslexiaSupport: false,
        hearingImpairmentSupport: false,
        motorImpairmentSupport: false,
        cognitiveSupport: false,
      };
      
      const profile: AccessibilityProfile = {
        userId,
        settings,
        detectedReadingLevel: user.preferences.readingLevel,
        alternativeInputCapabilities: this.getAlternativeInputCapabilities(settings),
        assistiveTechnologies: [], // Would be populated from detection
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      };

      this.logger.info({
        message: 'Accessibility profile retrieved',
        userId
      });
      return profile;
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to get accessibility profile',
        error: error.message,
        userId
      });
      throw new AppError('Failed to retrieve accessibility profile', 500, 'ACCESSIBILITY_PROFILE_ERROR');
    }
  }

  async updateAccessibilitySettings(userId: string, settings: Partial<AccessibilitySettings>): Promise<AccessibilitySettings> {
    try {
      // Validate accessibility settings
      const validation = this.validateAccessibilitySettings(settings);
      
      if (!validation.isValid) {
        throw new AppError('Invalid accessibility settings', 400, 'VALIDATION_ERROR', validation.errors);
      }

      // Get current user profile
      const currentUser = await this.userProfileService.getUserProfile(userId);
      
      if (!currentUser) {
        throw new AppError('User profile not found', 404, 'PROFILE_NOT_FOUND');
      }

      // Merge accessibility settings into preferences
      const updatedPreferences = {
        ...currentUser.preferences,
        ...settings,
        readingLevel: settings.readingLevel === 'elementary' ? 'beginner' : settings.readingLevel as 'beginner' | 'intermediate' | 'advanced'
      };

      // Update user profile
      const updatedUser = await this.userProfileService.updateUserProfile(userId, {
        preferences: updatedPreferences,
      });

      this.logger.info({
        message: 'Accessibility settings updated',
        userId,
        updatedFields: Object.keys(settings)
      });
      
      // Return the updated settings
      const updatedSettings: AccessibilitySettings = {
        ...updatedUser.preferences,
        colorBlindnessSupport: false,
        dyslexiaSupport: false,
        hearingImpairmentSupport: false,
        motorImpairmentSupport: false,
        cognitiveSupport: false,
      };
      
      return updatedSettings;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      
      this.logger.error({
        message: 'Failed to update accessibility settings',
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      throw new AppError('Failed to update accessibility settings', 500, 'ACCESSIBILITY_UPDATE_ERROR');
    }
  }

  async detectReadingLevel(userId: string, textSamples: string[]): Promise<ReadingLevelAnalysis> {
    try {
      // This is a simplified reading level detection algorithm
      // In a real implementation, this would use more sophisticated NLP techniques
      
      let totalWords = 0;
      let totalSentences = 0;
      let complexWords = 0;
      
      for (const sample of textSamples) {
        const words = sample.split(/\s+/).filter(word => word.length > 0);
        const sentences = sample.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
        
        totalWords += words.length;
        totalSentences += sentences.length;
        
        // Count complex words (more than 2 syllables - simplified)
        complexWords += words.filter(word => this.estimateSyllables(word) > 2).length;
      }
      
      const avgWordsPerSentence = totalWords / totalSentences;
      const complexWordRatio = complexWords / totalWords;
      
      // Simplified Flesch-Kincaid-like calculation
      const readabilityScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * complexWordRatio);
      
      let detectedLevel: 'elementary' | 'intermediate' | 'advanced' | 'expert';
      let confidence: number;
      
      if (readabilityScore >= 90) {
        detectedLevel = 'elementary';
        confidence = 0.8;
      } else if (readabilityScore >= 70) {
        detectedLevel = 'intermediate';
        confidence = 0.85;
      } else if (readabilityScore >= 50) {
        detectedLevel = 'advanced';
        confidence = 0.9;
      } else {
        detectedLevel = 'expert';
        confidence = 0.75;
      }
      
      const analysis: ReadingLevelAnalysis = {
        detectedLevel,
        confidence,
        factors: {
          vocabularyComplexity: complexWordRatio,
          sentenceLength: avgWordsPerSentence,
          comprehensionSpeed: 1.0, // Would be measured from user interaction
          errorRate: 0.0, // Would be measured from user responses
        },
        recommendations: this.generateReadingLevelRecommendations(detectedLevel, {
          vocabularyComplexity: complexWordRatio,
          sentenceLength: avgWordsPerSentence,
          comprehensionSpeed: 1.0,
          errorRate: 0.0,
        }),
      };

      // Update user's reading level if confidence is high enough
      if (confidence > 0.8) {
        let mappedLevel: 'beginner' | 'intermediate' | 'advanced';
        if (detectedLevel === 'elementary') {
          mappedLevel = 'beginner';
        } else if (detectedLevel === 'intermediate') {
          mappedLevel = 'intermediate';
        } else {
          mappedLevel = 'advanced';
        }
        await this.updateAccessibilitySettings(userId, { readingLevel: mappedLevel });
      }

      this.logger.info({
        message: 'Reading level detected',
        userId,
        detectedLevel,
        confidence
      });
      return analysis;
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to detect reading level',
        error: error.message,
        userId
      });
      throw new AppError('Failed to detect reading level', 500, 'READING_LEVEL_DETECTION_ERROR');
    }
  }

  async configureAlternativeInput(userId: string, inputType: 'voice' | 'switch' | 'eye-tracking', configuration: Record<string, any>): Promise<void> {
    try {
      // Validate input type and configuration
      if (!['voice', 'switch', 'eye-tracking'].includes(inputType)) {
        throw new AppError('Invalid alternative input type', 400, 'INVALID_INPUT_TYPE');
      }

      // Get current accessibility settings
      const currentUser = await this.userProfileService.getUserProfile(userId);
      
      if (!currentUser) {
        throw new AppError('User profile not found', 404, 'PROFILE_NOT_FOUND');
      }

      // Update preferences to enable alternative input
      const updatedPreferences = {
        ...currentUser.preferences,
        preferredInputMethod: inputType as any,
      };

      await this.userProfileService.updateUserProfile(userId, {
        preferences: updatedPreferences,
      });

      // In a full implementation, we would store the configuration separately
      // and handle device-specific calibration

      this.logger.info({
        message: 'Alternative input configured',
        userId,
        inputType
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      
      this.logger.error({ message: 'Failed to configure alternative input', error: error instanceof Error ? error.message : String(error), userId, inputType });
      throw new AppError('Failed to configure alternative input', 500, 'ALTERNATIVE_INPUT_CONFIG_ERROR');
    }
  }

  async detectAssistiveTechnologies(userId: string, userAgent: string, capabilities: Record<string, any>): Promise<AssistiveTechnology[]> {
    try {
      const detectedTechnologies: AssistiveTechnology[] = [];

      // Screen reader detection (simplified)
      if (userAgent.includes('NVDA') || userAgent.includes('JAWS') || userAgent.includes('VoiceOver')) {
        detectedTechnologies.push({
          type: 'screen-reader',
          name: this.extractScreenReaderName(userAgent),
          detected: true,
          supported: true,
        });
      }

      // Check for high contrast preference (indicates potential vision needs)
      if (capabilities.prefersReducedMotion || capabilities.prefersHighContrast) {
        detectedTechnologies.push({
          type: 'magnifier',
          name: 'System Magnifier',
          detected: true,
          supported: true,
        });
      }

      // Voice recognition detection
      if (capabilities.speechRecognition) {
        detectedTechnologies.push({
          type: 'voice-recognition',
          name: 'Speech Recognition',
          detected: true,
          supported: true,
        });
      }

      this.logger.info({ message: 'Assistive technologies detected', userId, count: detectedTechnologies.length });
      return detectedTechnologies;
    } catch (error: any) {
      this.logger.error({ message: 'Failed to detect assistive technologies', error: error instanceof Error ? error.message : String(error), userId });
      throw new AppError('Failed to detect assistive technologies', 500, 'ASSISTIVE_TECH_DETECTION_ERROR');
    }
  }

  async generateAccessibilityRecommendations(userId: string): Promise<string[]> {
    try {
      const profile = await this.getAccessibilityProfile(userId);
      
      if (!profile) {
        throw new AppError('Accessibility profile not found', 404, 'PROFILE_NOT_FOUND');
      }

      const recommendations: string[] = [];
      const settings = profile.settings;

      // Screen reader recommendations
      if (settings.screenReader) {
        recommendations.push('Enable detailed alt text for all images');
        recommendations.push('Use heading structure for better navigation');
        recommendations.push('Enable audio descriptions for video content');
      }

      // High contrast recommendations
      if (settings.highContrast) {
        recommendations.push('Use high contrast color schemes');
        recommendations.push('Increase border thickness for better visibility');
        recommendations.push('Use solid backgrounds instead of patterns');
      }

      // Reduced motion recommendations
      if (settings.reducedMotion) {
        recommendations.push('Disable auto-playing animations');
        recommendations.push('Use static images instead of GIFs');
        recommendations.push('Provide controls for any necessary animations');
      }

      // Font size recommendations
      if (settings.fontSize === 'large' || settings.fontSize === 'x-large') {
        recommendations.push('Ensure responsive layout for larger text');
        recommendations.push('Use scalable vector graphics for icons');
        recommendations.push('Provide horizontal scrolling for wide content');
      }

      // Reading level recommendations
      if (settings.readingLevel === 'elementary') {
        recommendations.push('Use simple vocabulary and short sentences');
        recommendations.push('Provide definitions for complex terms');
        recommendations.push('Use bullet points and numbered lists');
      }

      // Alternative input recommendations
      if (settings.alternativeInputEnabled) {
        recommendations.push('Ensure all interactive elements are keyboard accessible');
        recommendations.push('Provide voice command alternatives');
        recommendations.push('Use large click targets for easier interaction');
      }

      this.logger.info({ message: 'Accessibility recommendations generated', userId, count: recommendations.length });
      return recommendations;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      
      this.logger.error({
        message: 'Failed to generate accessibility recommendations',
        error: error.message,
        userId
      });
      throw new AppError('Failed to generate accessibility recommendations', 500, 'RECOMMENDATIONS_ERROR');
    }
  }

  private validateAccessibilitySettings(settings: Partial<AccessibilitySettings>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate font size
    if (settings.fontSize && !['small', 'medium', 'large', 'x-large'].includes(settings.fontSize)) {
      errors.push('Invalid font size. Must be one of: small, medium, large, x-large');
    }

    // Validate reading level
    if (settings.readingLevel && !['elementary', 'intermediate', 'advanced', 'expert'].includes(settings.readingLevel)) {
      errors.push('Invalid reading level. Must be one of: elementary, intermediate, advanced, expert');
    }

    // Validate alternative input type
    if (settings.alternativeInputType && !['voice', 'switch', 'eye-tracking'].includes(settings.alternativeInputType)) {
      errors.push('Invalid alternative input type. Must be one of: voice, switch, eye-tracking');
    }

    // Validate boolean fields
    const booleanFields = ['screenReader', 'reducedMotion', 'highContrast', 'alternativeInputEnabled'];
    for (const field of booleanFields) {
      if (settings[field as keyof AccessibilitySettings] !== undefined && typeof settings[field as keyof AccessibilitySettings] !== 'boolean') {
        errors.push(`${field} must be a boolean value`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private getAlternativeInputCapabilities(settings: AccessibilitySettings): AlternativeInputCapability[] {
    const capabilities: AlternativeInputCapability[] = [];

    if (settings.alternativeInputEnabled && settings.alternativeInputType) {
      capabilities.push({
        type: settings.alternativeInputType,
        enabled: true,
        configuration: {}, // Would contain device-specific settings
      });
    }

    return capabilities;
  }

  private estimateSyllables(word: string): number {
    // Simplified syllable counting algorithm
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let syllableCount = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        syllableCount++;
      }
      previousWasVowel = isVowel;
    }
    
    // Adjust for silent 'e'
    if (word.endsWith('e')) {
      syllableCount--;
    }
    
    return Math.max(1, syllableCount);
  }

  private extractScreenReaderName(userAgent: string): string {
    if (userAgent.includes('NVDA')) return 'NVDA';
    if (userAgent.includes('JAWS')) return 'JAWS';
    if (userAgent.includes('VoiceOver')) return 'VoiceOver';
    return 'Unknown Screen Reader';
  }

  private generateReadingLevelRecommendations(level: string, factors: any): string[] {
    const recommendations: string[] = [];

    switch (level) {
      case 'elementary':
        recommendations.push('Use simple, common words');
        recommendations.push('Keep sentences short (under 15 words)');
        recommendations.push('Provide visual aids and examples');
        recommendations.push('Use active voice instead of passive');
        break;
      case 'intermediate':
        recommendations.push('Balance simple and complex vocabulary');
        recommendations.push('Use moderate sentence length (15-20 words)');
        recommendations.push('Provide context for technical terms');
        break;
      case 'advanced':
        recommendations.push('Use varied vocabulary appropriately');
        recommendations.push('Complex sentences are acceptable');
        recommendations.push('Provide detailed explanations when needed');
        break;
      case 'expert':
        recommendations.push('Technical vocabulary is appropriate');
        recommendations.push('Complex sentence structures are fine');
        recommendations.push('Assume familiarity with domain concepts');
        break;
    }

    return recommendations;
  }
}