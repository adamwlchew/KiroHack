import { Request, Response, NextFunction } from 'express';
import { AppError } from '@pageflow/utils';

/**
 * Global error handling middleware
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || 'APP_ERROR',
        message: err.message,
        details: err.details
      }
    });
  }

  // Handle AWS SDK errors
  if (err.name === 'ServiceException' || err.name === 'ValidationException') {
    return res.status(400).json({
      success: false,
      error: {
        code: err.name,
        message: err.message
      }
    });
  }

  // Handle other errors
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
}