import { AppError, createServerError } from './appError';
import { logger } from '../logging/logger';

// Use the logger directly

/**
 * Express error handler middleware
 */
export function errorHandler(err: any, req: any, res: any, next: any): void {
  const error = transformError(err);
  
  logger.error({
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    url: req?.url,
    method: req?.method,
    userId: req?.user?.id
  });

  res.status(error.statusCode).json({
    success: false,
    error: {
      message: error.message,
      code: error.code,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
}

/**
 * Global error handler
 * @param error Error to handle
 */
export function handleError(error: Error | AppError): void {
  if (error instanceof AppError && error.isOperational) {
    // Log operational errors
    logger.warn({
      message: `Operational error: ${error.message}`,
      statusCode: error.statusCode,
      code: error.code,
      details: error.details
    });
  } else {
    // Log programming or unknown errors
    logger.error({
      message: `Unhandled error: ${error.message}`,
      error: error.stack || error.message
    });
    
    // For non-operational errors in production, you might want to:
    // 1. Send to error monitoring service (e.g., Sentry)
    // 2. Restart the process in extreme cases
    // 3. Notify developers
  }
}

/**
 * Transforms a raw error into an AppError
 * @param error Raw error
 * @returns AppError
 */
export function transformError(error: any): AppError {
  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return error;
  }
  
  // Handle common error types
  if (error.name === 'ValidationError') {
    return new AppError(
      error.message || 'Validation error',
      400,
      'VALIDATION_ERROR',
      error.details
    );
  }
  
  if (error.name === 'CastError') {
    return new AppError(
      error.message || 'Invalid ID format',
      400,
      'INVALID_ID',
      { path: error.path, value: error.value }
    );
  }
  
  if (error.code === 11000) { // MongoDB duplicate key error
    return new AppError(
      'Duplicate field value',
      409,
      'DUPLICATE_VALUE',
      error.keyValue
    );
  }
  
  // AWS SDK errors
  if (error.name === 'ServiceException') {
    return new AppError(
      error.message || 'AWS service error',
      500,
      'AWS_SERVICE_ERROR',
      { service: error.service }
    );
  }
  
  // Default to internal server error
  return new AppError(
    error.message || 'Something went wrong',
    500,
    'INTERNAL_SERVER_ERROR'
  );
}