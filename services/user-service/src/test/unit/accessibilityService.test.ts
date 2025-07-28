import { AccessibilityService } from '../../services/accessibilityService';
import { UserProfileService } from '../../services/userProfileService';
import { AppError } from '@pageflow/utils';
import { User, AccessibilitySettings } from '@pageflow/types';
import { UserRole } from '@pageflow/types';

// Mock the UserProfileService
jest.mock('../../services/userProfileService');

describe('AccessibilityService', () => {
  let accessibilityService: AccessibilityService;
  let mockUserProfileService: jest.Mocked<UserProfileService>;

  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.LEARNER,
    preferences: {
      theme: 'light',
      fontSize: 'medium',
      reducedMotion: false,
      screenReaderOptimized: false,
      readingLevel: 'intermediate',
      preferredInputMethod: 'standard',
      pageCompanionSettings: {
        interactionStyle: 'visual',
        personality: 'encouraging',
        verbosity: 'balanced',
      },
    },
    accessibilitySettings: {
      theme: 'light',
      fontSize: 'medium',
      reducedMotion: false,
      screenReaderOptimized: false,
      readingLevel: 'intermediate',
      preferredInputMethod: 'standard',
      colorBlindnessSupport: false,
      dyslexiaSupport: false,
      hearingImpairmentSupport: false,
      motorImpairmentSupport: false,
      cognitiveSupport: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    mockUserProfileService = new UserProfileService() as jest.Mocked<UserProfileService>;
    accessibilityService = new AccessibilityService();
    (accessibilityService as any).userProfileService = mockUserProfileService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAccessibilityProfile', () => {
    it('should successfully retrieve accessibility profile', async () => {
      mockUserProfileService.getUserProfile.mockResolvedValue(mockUser);

      const result = await accessibilityService.getAccessibilityProfile('test-user-id');

      expect(result).toBeDefined();
      expect(result?.userId).toBe('test-user-id');
      expect(result?.settings).toEqual(mockUser.accessibilitySettings);
      expect(mockUserProfileService.getUserProfile).toHaveBeenCalledWith('test-user-id');
    });

    it('should return null when user not found', async () => {
      mockUserProfileService.getUserProfile.mockResolvedValue(null);

      const result = await accessibilityService.getAccessibilityProfile('non-existent-user');

      expect(result).toBeNull();
    });

    it('should handle service errors', async () => {
      mockUserProfileService.getUserProfile.mockRejectedValue(new Error('Service error'));

      await expect(accessibilityService.getAccessibilityProfile('test-user-id')).rejects.toThrow(AppError);
    });
  });

  describe('updateAccessibilitySettings', () => {
    it('should successfully update accessibility settings', async () => {
      const updates: Partial<AccessibilitySettings> = {
        screenReader: true,
        fontSize: 'large',
      };

      const updatedUser = {
        ...mockUser,
        accessibilitySettings: {
          theme: 'light' as const,
          fontSize: 'large' as const,
          reducedMotion: false,
          screenReaderOptimized: true,
          readingLevel: 'intermediate' as const,
          preferredInputMethod: 'standard' as const,
          colorBlindnessSupport: false,
          dyslexiaSupport: false,
          hearingImpairmentSupport: false,
          motorImpairmentSupport: false,
          cognitiveSupport: false,
          ...updates,
        },
      };

      mockUserProfileService.getUserProfile.mockResolvedValue(mockUser);
      mockUserProfileService.updateUserProfile.mockResolvedValue(updatedUser);

      const result = await accessibilityService.updateAccessibilitySettings('test-user-id', updates);

      expect(result.screenReaderOptimized).toBe(true);
      expect(result.fontSize).toBe('large');
      expect(mockUserProfileService.updateUserProfile).toHaveBeenCalledWith('test-user-id', {
        accessibilitySettings: expect.objectContaining(updates),
      });
    });

    it('should validate accessibility settings', async () => {
      const invalidUpdates = {
        fontSize: 'invalid-size' as any,
      };

      await expect(
        accessibilityService.updateAccessibilitySettings('test-user-id', invalidUpdates)
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Invalid accessibility settings',
          statusCode: 400,
          code: 'VALIDATION_ERROR',
        })
      );
    });

    it('should handle alternative input settings', async () => {
      const updates: Partial<AccessibilitySettings> = {
        alternativeInputEnabled: true,
        alternativeInputType: 'voice',
      };

      const updatedUser = {
        ...mockUser,
        accessibilitySettings: {
          theme: 'light' as const,
          fontSize: 'medium' as const,
          reducedMotion: false,
          screenReaderOptimized: false,
          readingLevel: 'intermediate' as const,
          preferredInputMethod: 'standard' as const,
          colorBlindnessSupport: false,
          dyslexiaSupport: false,
          hearingImpairmentSupport: false,
          motorImpairmentSupport: false,
          cognitiveSupport: false,
          alternativeInputEnabled: true,
          alternativeInputType: 'voice' as const,
        },
      };

      mockUserProfileService.getUserProfile.mockResolvedValue(mockUser);
      mockUserProfileService.updateUserProfile.mockResolvedValue(updatedUser);

      const result = await accessibilityService.updateAccessibilitySettings('test-user-id', updates);

      expect(result.alternativeInputEnabled).toBe(true);
      expect(result.alternativeInputType).toBe('voice');
    });

    it('should handle user not found', async () => {
      mockUserProfileService.getUserProfile.mockResolvedValue(null);

      await expect(
        accessibilityService.updateAccessibilitySettings('non-existent-user', { screenReader: true })
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'User profile not found',
          statusCode: 404,
          code: 'PROFILE_NOT_FOUND',
        })
      );
    });
  });

  describe('detectReadingLevel', () => {
    it('should detect elementary reading level', async () => {
      const textSamples = [
        'The cat sat on the mat. It was a big cat.',
        'I like to play. We can run and jump.',
      ];

      mockUserProfileService.getUserProfile.mockResolvedValue(mockUser);
      mockUserProfileService.updateUserProfile.mockResolvedValue(mockUser);

      const result = await accessibilityService.detectReadingLevel('test-user-id', textSamples);

      expect(result.detectedLevel).toBe('elementary');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.factors).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it('should detect advanced reading level', async () => {
      const textSamples = [
        'The implementation of sophisticated algorithms requires comprehensive understanding of computational complexity theory.',
        'Interdisciplinary collaboration facilitates innovative solutions to multifaceted challenges in contemporary research.',
      ];

      mockUserProfileService.getUserProfile.mockResolvedValue(mockUser);
      mockUserProfileService.updateUserProfile.mockResolvedValue(mockUser);

      const result = await accessibilityService.detectReadingLevel('test-user-id', textSamples);

      expect(['advanced', 'expert']).toContain(result.detectedLevel);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle empty text samples', async () => {
      await expect(
        accessibilityService.detectReadingLevel('test-user-id', [])
      ).rejects.toThrow(AppError);
    });
  });

  describe('configureAlternativeInput', () => {
    it('should successfully configure voice input', async () => {
      const configuration = {
        sensitivity: 0.8,
        language: 'en-US',
      };

      const updatedUser = {
        ...mockUser,
        accessibilitySettings: {
          ...mockUser.accessibilitySettings,
          alternativeInputEnabled: true,
          alternativeInputType: 'voice' as const,
        },
      };

      mockUserProfileService.getUserProfile.mockResolvedValue(mockUser);
      mockUserProfileService.updateUserProfile.mockResolvedValue(updatedUser);

      await accessibilityService.configureAlternativeInput('test-user-id', 'voice', configuration);

      expect(mockUserProfileService.updateUserProfile).toHaveBeenCalledWith('test-user-id', {
        accessibilitySettings: expect.objectContaining({
          alternativeInputEnabled: true,
          alternativeInputType: 'voice',
        }),
      });
    });

    it('should reject invalid input type', async () => {
      await expect(
        accessibilityService.configureAlternativeInput('test-user-id', 'invalid-type' as any, {})
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Invalid alternative input type',
          statusCode: 400,
          code: 'INVALID_INPUT_TYPE',
        })
      );
    });
  });

  describe('detectAssistiveTechnologies', () => {
    it('should detect screen reader from user agent', async () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NVDA/2021.1';
      const capabilities = {};

      const result = await accessibilityService.detectAssistiveTechnologies('test-user-id', userAgent, capabilities);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('screen-reader');
      expect(result[0].name).toBe('NVDA');
      expect(result[0].detected).toBe(true);
    });

    it('should detect multiple assistive technologies', async () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JAWS/2021';
      const capabilities = {
        prefersHighContrast: true,
        speechRecognition: true,
      };

      const result = await accessibilityService.detectAssistiveTechnologies('test-user-id', userAgent, capabilities);

      expect(result.length).toBeGreaterThan(1);
      expect(result.some(tech => tech.type === 'screen-reader')).toBe(true);
      expect(result.some(tech => tech.type === 'magnifier')).toBe(true);
      expect(result.some(tech => tech.type === 'voice-recognition')).toBe(true);
    });
  });

  describe('generateAccessibilityRecommendations', () => {
    it('should generate recommendations for screen reader users', async () => {
      const userWithScreenReader = {
        ...mockUser,
        accessibilitySettings: {
          ...mockUser.accessibilitySettings,
          screenReaderOptimized: true,
        },
      };

      mockUserProfileService.getUserProfile.mockResolvedValue(userWithScreenReader);

      const result = await accessibilityService.generateAccessibilityRecommendations('test-user-id');

      expect(result).toContain('Enable detailed alt text for all images');
      expect(result).toContain('Use heading structure for better navigation');
    });

    it('should generate recommendations for high contrast users', async () => {
      const userWithHighContrast = {
        ...mockUser,
        accessibilitySettings: {
          ...mockUser.accessibilitySettings,
          colorBlindnessSupport: true,
        },
      };

      mockUserProfileService.getUserProfile.mockResolvedValue(userWithHighContrast);

      const result = await accessibilityService.generateAccessibilityRecommendations('test-user-id');

      expect(result).toContain('Use high contrast color schemes');
      expect(result).toContain('Increase border thickness for better visibility');
    });

    it('should handle user not found', async () => {
      mockUserProfileService.getUserProfile.mockResolvedValue(null);

      await expect(
        accessibilityService.generateAccessibilityRecommendations('non-existent-user')
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Accessibility profile not found',
          statusCode: 404,
          code: 'PROFILE_NOT_FOUND',
        })
      );
    });
  });
});