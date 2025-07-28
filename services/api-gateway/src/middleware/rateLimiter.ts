import { Request, Response, NextFunction } from 'express';
import { logger } from '@pageflow/utils';
import config from '../config';

// Simple in-memory rate limiting (in production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = config.rateLimit.windowMs;
  const max = config.rateLimit.max;

  const clientData = requestCounts.get(clientIp);

  if (!clientData || now > clientData.resetTime) {
    // First request or window expired
    requestCounts.set(clientIp, {
      count: 1,
      resetTime: now + windowMs,
    });
    next();
    return;
  }

  if (clientData.count >= max) {
    logger.warn({
      message: 'Rate limit exceeded',
      clientIp,
      count: clientData.count,
      max,
    });

    res.status(429).json({
      error: {
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      },
    });
    return;
  }

  // Increment count
  clientData.count++;
  next();
}; 