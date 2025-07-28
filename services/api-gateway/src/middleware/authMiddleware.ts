import { Request, Response, NextFunction } from 'express';
import { logger } from '@pageflow/utils';
import config from '../config';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      },
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    // In a real implementation, verify JWT token here
    // For now, we'll use a simple mock verification
    if (token === 'valid-token') {
      req.user = {
        id: 'user-123',
        email: 'user@example.com',
        roles: ['user'],
      };
      next();
    } else {
      throw new Error('Invalid token');
    }
  } catch (error: any) {
    logger.warn({
      message: 'Authentication failed',
      error: error.message,
      ip: req.ip,
    });

    res.status(401).json({
      error: {
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
      },
    });
  }
};

export const requireRole = (requiredRole: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED',
        },
      });
      return;
    }

    if (!req.user.roles.includes(requiredRole)) {
      res.status(403).json({
        error: {
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
        },
      });
      return;
    }

    next();
  };
}; 