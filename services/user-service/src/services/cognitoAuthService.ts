import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand,
  UpdateUserAttributesCommand,
  AssociateSoftwareTokenCommand,
  VerifySoftwareTokenCommand,
  SetUserMFAPreferenceCommand,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AuthFlowType,
  ChallengeNameType,
} from '@aws-sdk/client-cognito-identity-provider';
import { logger } from '@pageflow/utils';
import { AppError } from '@pageflow/utils';
import {
  CognitoAuthRequest,
  CognitoRegisterRequest,
  CognitoAuthResponse,
  CognitoPasswordResetRequest,
  CognitoPasswordResetConfirmRequest,
  CognitoConfirmSignUpRequest,
  CognitoMFASetupRequest,
  CognitoMFAVerifyRequest,
  CognitoSocialAuthRequest,
  CognitoTokenPayload,
  CognitoUserAttributes,
} from '../models/auth';
import { User, UserRole } from '@pageflow/types';

export class CognitoAuthService {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;
  private logger = logger.child({ component: 'CognitoAuthService' });

  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.userPoolId = process.env.COGNITO_USER_POOL_ID!;
    this.clientId = process.env.COGNITO_CLIENT_ID!;

    if (!this.userPoolId || !this.clientId) {
      throw new AppError('Cognito configuration missing', 500, 'CONFIG_ERROR');
    }
  }

  async register(request: CognitoRegisterRequest): Promise<{ userSub: string; codeDeliveryDetails: any }> {
    try {
      const command = new SignUpCommand({
        ClientId: this.clientId,
        Username: request.email,
        Password: request.password,
        UserAttributes: [
          {
            Name: 'email',
            Value: request.email,
          },
          {
            Name: 'name',
            Value: request.displayName,
          },
          ...(request.attributes ? Object.entries(request.attributes).map(([key, value]) => ({
            Name: key,
            Value: value,
          })) : []),
        ],
      });

      const response = await this.client.send(command);
      
      this.logger.info({ message: 'User registered successfully', email: request.email });
      
      return {
        userSub: response.UserSub!,
        codeDeliveryDetails: response.CodeDeliveryDetails,
      };
    } catch (error: any) {
      this.logger.error({ message: 'Registration failed', error: error instanceof Error ? error.message : String(error), email: request.email });
      throw this.handleCognitoError(error);
    }
  }

  async confirmSignUp(request: CognitoConfirmSignUpRequest): Promise<void> {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: request.email,
        ConfirmationCode: request.confirmationCode,
      });

      await this.client.send(command);
      this.logger.info({ message: 'Sign up confirmed successfully', email: request.email });
    } catch (error: any) {
      this.logger.error({ message: 'Sign up confirmation failed', error: error instanceof Error ? error.message : String(error), email: request.email });
      throw this.handleCognitoError(error);
    }
  }

  async signIn(request: CognitoAuthRequest): Promise<CognitoAuthResponse> {
    try {
      const command = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        AuthParameters: {
          USERNAME: request.email,
          PASSWORD: request.password,
        },
      });

      const response = await this.client.send(command);

      if (response.ChallengeName) {
        // Handle MFA or other challenges
        throw new AppError('Authentication challenge required', 200, 'AUTH_CHALLENGE', {
          challengeName: response.ChallengeName,
          session: response.Session,
          challengeParameters: response.ChallengeParameters,
        });
      }

      if (!response.AuthenticationResult) {
        throw new AppError('Authentication failed', 401, 'AUTH_FAILED');
      }

      const { AccessToken, IdToken, RefreshToken, ExpiresIn } = response.AuthenticationResult;
      
      // Get user details
      const user = await this.getUserFromToken(AccessToken!);

      this.logger.info({ message: 'User signed in successfully', email: request.email });

      return {
        user,
        accessToken: AccessToken!,
        idToken: IdToken!,
        refreshToken: RefreshToken!,
        expiresIn: ExpiresIn!,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      this.logger.error({ message: 'Sign in failed', error: error.message, email: request.email });
      throw this.handleCognitoError(error);
    }
  }

  async refreshToken(refreshToken: string): Promise<CognitoAuthResponse> {
    try {
      const command = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });

      const response = await this.client.send(command);

      if (!response.AuthenticationResult) {
        throw new AppError('Token refresh failed', 401, 'TOKEN_REFRESH_FAILED');
      }

      const { AccessToken, IdToken, ExpiresIn } = response.AuthenticationResult;
      
      // Get user details
      const user = await this.getUserFromToken(AccessToken!);

      this.logger.info({ message: 'Token refreshed successfully', userId: user.id });

      return {
        user,
        accessToken: AccessToken!,
        idToken: IdToken!,
        refreshToken, // Refresh token doesn't change
        expiresIn: ExpiresIn!,
      };
    } catch (error: any) {
      this.logger.error({ message: 'Token refresh failed', error: error.message });
      throw this.handleCognitoError(error);
    }
  }

  async forgotPassword(request: CognitoPasswordResetRequest): Promise<{ codeDeliveryDetails: any }> {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: request.email,
      });

      const response = await this.client.send(command);
      
      this.logger.info({ message: 'Password reset initiated', email: request.email });
      
      return {
        codeDeliveryDetails: response.CodeDeliveryDetails,
      };
    } catch (error: any) {
      this.logger.error({ message: 'Password reset initiation failed', error: error.message, email: request.email });
      throw this.handleCognitoError(error);
    }
  }

  async confirmForgotPassword(request: CognitoPasswordResetConfirmRequest): Promise<void> {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        Username: request.email,
        ConfirmationCode: request.confirmationCode,
        Password: request.newPassword,
      });

      await this.client.send(command);
      this.logger.info({ message: 'Password reset confirmed', email: request.email });
    } catch (error: any) {
      this.logger.error({ message: 'Password reset confirmation failed', error: error.message, email: request.email });
      throw this.handleCognitoError(error);
    }
  }

  async setupMFA(request: CognitoMFASetupRequest): Promise<{ secretCode?: string; session?: string }> {
    try {
      if (request.mfaType === 'SOFTWARE_TOKEN_MFA') {
        const command = new AssociateSoftwareTokenCommand({
          AccessToken: request.accessToken,
        });

        const response = await this.client.send(command);
        
        this.logger.info({ message: 'MFA setup initiated', mfaType: request.mfaType });
        
        return {
          secretCode: response.SecretCode,
          session: response.Session,
        };
      } else {
        // SMS MFA setup
        const command = new SetUserMFAPreferenceCommand({
          AccessToken: request.accessToken,
          SMSMfaSettings: {
            Enabled: true,
            PreferredMfa: true,
          },
        });

        await this.client.send(command);
        
        this.logger.info({ message: 'SMS MFA enabled' });
        
        return {};
      }
    } catch (error: any) {
      this.logger.error({ message: 'MFA setup failed', error: error.message, mfaType: request.mfaType });
      throw this.handleCognitoError(error);
    }
  }

  async verifyMFA(request: CognitoMFAVerifyRequest): Promise<CognitoAuthResponse> {
    try {
      const command = new RespondToAuthChallengeCommand({
        ClientId: this.clientId,
        ChallengeName: request.challengeName as ChallengeNameType,
        Session: request.session,
        ChallengeResponses: request.challengeResponses,
      });

      const response = await this.client.send(command);

      if (!response.AuthenticationResult) {
        throw new AppError('MFA verification failed', 401, 'MFA_VERIFICATION_FAILED');
      }

      const { AccessToken, IdToken, RefreshToken, ExpiresIn } = response.AuthenticationResult;
      
      // Get user details
      const user = await this.getUserFromToken(AccessToken!);

      this.logger.info({ message: 'MFA verified successfully', userId: user.id });

      return {
        user,
        accessToken: AccessToken!,
        idToken: IdToken!,
        refreshToken: RefreshToken!,
        expiresIn: ExpiresIn!,
      };
    } catch (error: any) {
      this.logger.error({ message: 'MFA verification failed', error: error.message });
      throw this.handleCognitoError(error);
    }
  }

  async getUserFromToken(accessToken: string): Promise<User> {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response = await this.client.send(command);
      
      const attributes = this.parseUserAttributes(response.UserAttributes || []);
      
      return {
        id: attributes.sub,
        email: attributes.email,
        firstName: attributes.name?.split(' ')[0] || '',
        lastName: attributes.name?.split(' ').slice(1).join(' ') || '',
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
    } catch (error: any) {
      this.logger.error({ message: 'Failed to get user from token', error: error.message });
      throw this.handleCognitoError(error);
    }
  }

  private parseUserAttributes(attributes: any[]): CognitoUserAttributes {
    const parsed: any = {};
    attributes.forEach(attr => {
      parsed[attr.Name] = attr.Value;
    });
    return parsed as CognitoUserAttributes;
  }

  private handleCognitoError(error: any): AppError {
    const errorCode = error.name || error.__type;
    
    switch (errorCode) {
      case 'UsernameExistsException':
        return new AppError('User already exists', 409, 'USER_EXISTS');
      case 'UserNotFoundException':
        return new AppError('User not found', 404, 'USER_NOT_FOUND');
      case 'NotAuthorizedException':
        return new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      case 'UserNotConfirmedException':
        return new AppError('User not confirmed', 400, 'USER_NOT_CONFIRMED');
      case 'CodeMismatchException':
        return new AppError('Invalid verification code', 400, 'INVALID_CODE');
      case 'ExpiredCodeException':
        return new AppError('Verification code expired', 400, 'EXPIRED_CODE');
      case 'InvalidPasswordException':
        return new AppError('Password does not meet requirements', 400, 'INVALID_PASSWORD');
      case 'LimitExceededException':
        return new AppError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
      case 'TooManyRequestsException':
        return new AppError('Too many requests', 429, 'TOO_MANY_REQUESTS');
      default:
        return new AppError('Authentication service error', 500, 'AUTH_SERVICE_ERROR', { originalError: error.message });
    }
  }
}