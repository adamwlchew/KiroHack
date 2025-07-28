import { Request, Response, NextFunction } from 'express';
import { logger } from '@pageflow/utils';

export interface ApiError extends Error {
  statusCode?: number;
  errorCode?: string;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errorCode = error.errorCode || 'INTERNAL_ERROR';

  logger.error({
    message: 'API Gateway Error',
    error: message,
    errorCode,
    statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(statusCode).json({
    error: {
      message,
      code: errorCode,
      statusCode,
    },
  });
}; 