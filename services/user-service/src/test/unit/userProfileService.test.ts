import { UserProfileService } from '../../services/userProfileService';
import { AppError } from '@pageflow/utils';
import { User, UserRole } from '@pageflow/types';

// Mock AWS SDK
const mockDynamoSend = jest.fn();
const mockS3Send = jest.fn();

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({
      send: mockDynamoSend,
    }),
  },
  GetCommand: jest.fn(),
  PutCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  DeleteCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockS3Send,
  })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.com'),
}));

describe('UserProfileService', () => {
  let userProfileService: UserProfileService;

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
    // Set required environment variables
    process.env.DYNAMODB_USERS_TABLE = 'test-users-table';
    process.env.S3_PROFILE_PICTURES_BUCKET = 'test-profile-pictures-bucket';
    process.env.AWS_REGION = 'us-east-1';

    userProfileService = new UserProfileService();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockDynamoSend.mockClear();
    mockS3Send.mockClear();
  });

  describe('getUserProfile', () => {
    it('should successfully retrieve user profile', async () => {
      mockDynamoSend.mockResolvedValue({
        Item: mockUser,
      });

      const result = await userProfileService.getUserProfile('test-user-id');

      expect(result).toEqual(mockUser);
      expect(mockDynamoSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-users-table',
            Key: { id: 'test-user-id' },
          }),
        })
      );
    });

    it('should return null when user not found', async () => {
      mockDynamoSend.mockResolvedValue({});

      const result = await userProfileService.getUserProfile('non-existent-user');

      expect(result).toBeNull();
    });

    it('should handle DynamoDB errors', async () => {
      mockDynamoSend.mockRejectedValue(new Error('DynamoDB error'));

      await expect(userProfileService.getUserProfile('test-user-id')).rejects.toThrow(AppError);
    });
  });

  describe('createUserProfile', () => {
    it('should successfully create user profile', async () => {
      mockDynamoSend.mockResolvedValue({});

      const result = await userProfileService.createUserProfile(mockUser);

      expect(result).toMatchObject(mockUser);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockDynamoSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-users-table',
            Item: expect.objectContaining(mockUser),
            ConditionExpression: 'attribute_not_exists(id)',
          }),
        })
      );
    });

    it('should handle profile already exists error', async () => {
      const error = new Error('ConditionalCheckFailedException');
      error.name = 'ConditionalCheckFailedException';
      mockDynamoSend.mockRejectedValue(error);

      await expect(userProfileService.createUserProfile(mockUser)).rejects.toThrow(
        expect.objectContaining({
          message: 'User profile already exists',
          statusCode: 409,
          code: 'PROFILE_EXISTS',
        })
      );
    });
  });

  describe('updateUserProfile', () => {
    it('should successfully update user profile', async () => {
      const updates = {
        displayName: 'Updated Name',
        preferences: {
          theme: 'dark' as const,
        },
      };

      const updatedUser = { ...mockUser, ...updates };
      mockDynamoSend.mockResolvedValue({
        Attributes: updatedUser,
      });

      const result = await userProfileService.updateUserProfile('test-user-id', updates);

      expect(result).toEqual(updatedUser);
      expect(mockDynamoSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-users-table',
            Key: { id: 'test-user-id' },
            ConditionExpression: 'attribute_exists(id)',
            ReturnValues: 'ALL_NEW',
          }),
        })
      );
    });

    it('should handle user not found error', async () => {
      const error = new Error('ConditionalCheckFailedException');
      error.name = 'ConditionalCheckFailedException';
      mockDynamoSend.mockRejectedValue(error);

      await expect(
        userProfileService.updateUserProfile('non-existent-user', { displayName: 'New Name' })
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'User profile not found',
          statusCode: 404,
          code: 'PROFILE_NOT_FOUND',
        })
      );
    });

    it('should handle no updates provided', async () => {
      await expect(
        userProfileService.updateUserProfile('test-user-id', {})
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'No valid updates provided',
          statusCode: 400,
          code: 'NO_UPDATES',
        })
      );
    });
  });

  describe('validateUserSettings', () => {
    it('should validate correct settings', async () => {
      const settings = {
        preferences: {
          theme: 'dark',
        },
        accessibilitySettings: {
          fontSize: 'large',
          readingLevel: 'advanced',
        },
      };

      const result = await userProfileService.validateUserSettings(settings);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid theme', async () => {
      const settings = {
        preferences: {
          theme: 'invalid-theme',
        },
      };

      const result = await userProfileService.validateUserSettings(settings);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid theme. Must be one of: light, dark, high-contrast');
    });

    it('should detect invalid font size', async () => {
      const settings = {
        accessibilitySettings: {
          fontSize: 'invalid-size',
        },
      };

      const result = await userProfileService.validateUserSettings(settings);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid font size. Must be one of: small, medium, large, x-large');
    });

    it('should detect multiple validation errors', async () => {
      const settings = {
        preferences: {
          theme: 'invalid-theme',
        },
        accessibilitySettings: {
          fontSize: 'invalid-size',
          readingLevel: 'invalid-level',
        },
      };

      const result = await userProfileService.validateUserSettings(settings);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });
});