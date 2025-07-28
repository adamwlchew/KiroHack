import { Request, Response, NextFunction } from 'express';
import { CognitoAuthService } from '../services/cognitoAuthService';
import { AppError, logger } from '@pageflow/utils';
import {
  CognitoAuthRequest,
  CognitoRegisterRequest,
  CognitoPasswordResetRequest,
  CognitoPasswordResetConfirmRequest,
  CognitoConfirmSignUpRequest,
  CognitoMFASetupRequest,
  CognitoMFAVerifyRequest,
} from '../models/auth';
import { validateAuthRequest, validateRegisterRequest, validatePasswordResetRequest } from '../utils/validation';

export class AuthController {
  private cognitoService: CognitoAuthService;
  private logger = logger.child({ component: 'AuthController' });

  constructor() {
    this.cognitoService = new CognitoAuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = validateRegisterRequest(req.body);
      if (error) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', error.details);
      }

      const registerRequest: CognitoRegisterRequest = value;
      const result = await this.cognitoService.register(registerRequest);

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email for verification code.',
        data: {
          userSub: result.userSub,
          codeDeliveryDetails: result.codeDeliveryDetails,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  confirmSignUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, confirmationCode } = req.body;
      
      if (!email || !confirmationCode) {
        throw new AppError('Email and confirmation code are required', 400, 'VALIDATION_ERROR');
      }

      const confirmRequest: CognitoConfirmSignUpRequest = { email, confirmationCode };
      await this.cognitoService.confirmSignUp(confirmRequest);

      res.json({
        success: true,
        message: 'Account confirmed successfully. You can now sign in.',
      });
    } catch (error) {
      next(error);
    }
  };

  signIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = validateAuthRequest(req.body);
      if (error) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', error.details);
      }

      const authRequest: CognitoAuthRequest = value;
      const result = await this.cognitoService.signIn(authRequest);

      // Set secure HTTP-only cookie for refresh token
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json({
        success: true,
        message: 'Sign in successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          idToken: result.idToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400, 'VALIDATION_ERROR');
      }

      const result = await this.cognitoService.refreshToken(refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          idToken: result.idToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  signOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Sign out successful',
      });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = validatePasswordResetRequest(req.body);
      if (error) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', error.details);
      }

      const resetRequest: CognitoPasswordResetRequest = value;
      const result = await this.cognitoService.forgotPassword(resetRequest);

      res.json({
        success: true,
        message: 'Password reset code sent to your email',
        data: {
          codeDeliveryDetails: result.codeDeliveryDetails,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  confirmForgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, confirmationCode, newPassword } = req.body;
      
      if (!email || !confirmationCode || !newPassword) {
        throw new AppError('Email, confirmation code, and new password are required', 400, 'VALIDATION_ERROR');
      }

      const confirmRequest: CognitoPasswordResetConfirmRequest = {
        email,
        confirmationCode,
        newPassword,
      };
      
      await this.cognitoService.confirmForgotPassword(confirmRequest);

      res.json({
        success: true,
        message: 'Password reset successful. You can now sign in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  };

  setupMFA = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mfaType, phoneNumber } = req.body;
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      
      if (!accessToken) {
        throw new AppError('Access token is required', 401, 'UNAUTHORIZED');
      }

      if (!mfaType || !['SMS_MFA', 'SOFTWARE_TOKEN_MFA'].includes(mfaType)) {
        throw new AppError('Valid MFA type is required', 400, 'VALIDATION_ERROR');
      }

      const setupRequest: CognitoMFASetupRequest = {
        accessToken,
        mfaType,
        phoneNumber,
      };

      const result = await this.cognitoService.setupMFA(setupRequest);

      res.json({
        success: true,
        message: 'MFA setup initiated',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  verifyMFA = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { session, challengeName, challengeResponses } = req.body;
      
      if (!session || !challengeName || !challengeResponses) {
        throw new AppError('Session, challenge name, and challenge responses are required', 400, 'VALIDATION_ERROR');
      }

      const verifyRequest: CognitoMFAVerifyRequest = {
        session,
        challengeName,
        challengeResponses,
      };

      const result = await this.cognitoService.verifyMFA(verifyRequest);

      // Set secure HTTP-only cookie for refresh token
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json({
        success: true,
        message: 'MFA verification successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          idToken: result.idToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      
      if (!accessToken) {
        throw new AppError('Access token is required', 401, 'UNAUTHORIZED');
      }

      const user = await this.cognitoService.getUserFromToken(accessToken);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };
}