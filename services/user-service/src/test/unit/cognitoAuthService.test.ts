import { CognitoAuthService } from '../../services/cognitoAuthService';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { AppError } from '@pageflow/utils';

// Mock AWS SDK
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  SignUpCommand: jest.fn(),
  ConfirmSignUpCommand: jest.fn(),
  InitiateAuthCommand: jest.fn(),
  ForgotPasswordCommand: jest.fn(),
  ConfirmForgotPasswordCommand: jest.fn(),
  GetUserCommand: jest.fn(),
  AssociateSoftwareTokenCommand: jest.fn(),
  VerifySoftwareTokenCommand: jest.fn(),
  SetUserMFAPreferenceCommand: jest.fn(),
  RespondToAuthChallengeCommand: jest.fn(),
}));

describe('CognitoAuthService', () => {
  let cognitoAuthService: CognitoAuthService;

  beforeEach(() => {
    // Set required environment variables
    process.env.COGNITO_USER_POOL_ID = 'test-user-pool-id';
    process.env.COGNITO_CLIENT_ID = 'test-client-id';
    process.env.AWS_REGION = 'us-east-1';

    cognitoAuthService = new CognitoAuthService();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockSend.mockClear();
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      const mockResponse = {
        UserSub: 'test-user-sub',
        CodeDeliveryDetails: {
          Destination: 'test@example.com',
          DeliveryMedium: 'EMAIL',
        },
      };

      mockSend.mockResolvedValue(mockResponse);

      const registerRequest = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        displayName: 'Test User',
      };

      const result = await cognitoAuthService.register(registerRequest);

      expect(result).toEqual({
        userSub: 'test-user-sub',
        codeDeliveryDetails: mockResponse.CodeDeliveryDetails,
      });
    });

    it('should handle registration errors', async () => {
      const mockError = {
        name: 'UsernameExistsException',
        message: 'User already exists',
      };

      mockSend.mockRejectedValue(mockError);

      const registerRequest = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        displayName: 'Test User',
      };

      await expect(cognitoAuthService.register(registerRequest)).rejects.toThrow(AppError);
    });
  });

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockAuthResponse = {
        AuthenticationResult: {
          AccessToken: 'mock-access-token',
          IdToken: 'mock-id-token',
          RefreshToken: 'mock-refresh-token',
          ExpiresIn: 3600,
        },
      };

      const mockUserResponse = {
        UserAttributes: [
          { Name: 'sub', Value: 'test-user-id' },
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'name', Value: 'Test User' },
        ],
      };

      mockSend
        .mockResolvedValueOnce(mockAuthResponse)
        .mockResolvedValueOnce(mockUserResponse);

      const signInRequest = {
        email: 'test@example.com',
        password: 'TestPassword123!',
      };

      const result = await cognitoAuthService.signIn(signInRequest);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('idToken', 'mock-id-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
      expect(result).toHaveProperty('expiresIn', 3600);
    });

    it('should handle MFA challenge', async () => {
      const mockAuthResponse = {
        ChallengeName: 'SMS_MFA',
        Session: 'mock-session',
        ChallengeParameters: {
          CODE_DELIVERY_DELIVERY_MEDIUM: 'SMS',
        },
      };

      mockSend.mockResolvedValue(mockAuthResponse);

      const signInRequest = {
        email: 'test@example.com',
        password: 'TestPassword123!',
      };

      await expect(cognitoAuthService.signIn(signInRequest)).rejects.toThrow(AppError);
    });
  });

  describe('forgotPassword', () => {
    it('should successfully initiate password reset', async () => {
      const mockResponse = {
        CodeDeliveryDetails: {
          Destination: 'test@example.com',
          DeliveryMedium: 'EMAIL',
        },
      };

      mockSend.mockResolvedValue(mockResponse);

      const resetRequest = {
        email: 'test@example.com',
      };

      const result = await cognitoAuthService.forgotPassword(resetRequest);

      expect(result).toEqual({
        codeDeliveryDetails: mockResponse.CodeDeliveryDetails,
      });
    });
  });

  describe('error handling', () => {
    it('should handle various Cognito errors correctly', async () => {
      const testCases = [
        { error: { name: 'UserNotFoundException' }, expectedCode: 'USER_NOT_FOUND' },
        { error: { name: 'NotAuthorizedException' }, expectedCode: 'INVALID_CREDENTIALS' },
        { error: { name: 'UserNotConfirmedException' }, expectedCode: 'USER_NOT_CONFIRMED' },
        { error: { name: 'CodeMismatchException' }, expectedCode: 'INVALID_CODE' },
        { error: { name: 'ExpiredCodeException' }, expectedCode: 'EXPIRED_CODE' },
      ];

      for (const testCase of testCases) {
        mockSend.mockRejectedValue(testCase.error);

        const signInRequest = {
          email: 'test@example.com',
          password: 'TestPassword123!',
        };

        try {
          await cognitoAuthService.signIn(signInRequest);
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).code).toBe(testCase.expectedCode);
        }
      }
    });
  });
});