import { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AppError, logger } from '@pageflow/utils';
import { CognitoTokenPayload } from '../models/auth';

interface AuthenticatedRequest extends Request {
  user?: CognitoTokenPayload;
}

const authLogger = logger.child({ component: 'AuthMiddleware' });

// Create JWT verifier for access tokens
const accessTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID!,
});

// Create JWT verifier for ID tokens
const idTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID!,
});

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token is required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify the access token
      const payload = await accessTokenVerifier.verify(token);
      
      // Add user information to request
      req.user = payload as unknown as CognitoTokenPayload;
      
      authLogger.info({
        message: 'User authenticated successfully',
        userId: payload.sub
      });
      next();
    } catch (verifyError: any) {
      authLogger.error({
        message: 'Token verification failed',
        error: verifyError.message
      });
      throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }
  } catch (error) {
    next(error);
  }
};

export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const payload = await accessTokenVerifier.verify(token);
        req.user = payload as unknown as CognitoTokenPayload;
        authLogger.info({
          message: 'Optional auth: User authenticated',
          userId: payload.sub
        });
      } catch (verifyError) {
        authLogger.warn({
          message: 'Optional auth: Token verification failed',
          error: verifyError
        });
        // Don't throw error for optional auth, just continue without user
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    // Check if user has required role (this would be stored in custom attributes)
    const userRoles = (req.user as any)['custom:roles']?.split(',') || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }

    next();
  };
};