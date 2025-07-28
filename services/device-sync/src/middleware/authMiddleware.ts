import { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AppError, logger } from '@pageflow/utils';

const authLogger = logger.child({ component: 'AuthMiddleware' });

// Create Cognito JWT verifier
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID || '',
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID || '',
});

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);

    try {
      const payload = await verifier.verify(token);
      
      req.user = {
        id: payload.sub as string,
        email: (payload.email as string) || '',
        username: (payload.username as string) || (payload['cognito:username'] as string) || '',
      };

      next();
    } catch (error) {
      authLogger.error({ message: 'Token verification failed', error: error instanceof Error ? error.message : String(error) });
      throw new AppError('Invalid token', 401);
    }
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    } else {
      authLogger.error({ message: 'Authentication middleware error', error });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Authentication failed',
        },
      });
    }
  }
};