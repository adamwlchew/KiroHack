import { Request, Response, NextFunction } from 'express';
import { AppError, logger } from '@pageflow/utils';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitLogger = logger.child({ component: 'RateLimitMiddleware' });

class InMemoryRateLimitStore {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  get(key: string): { count: number; resetTime: number } | null {
    const entry = this.store[key];
    if (!entry) return null;
    
    if (Date.now() > entry.resetTime) {
      delete this.store[key];
      return null;
    }
    
    return entry;
  }

  set(key: string, count: number, resetTime: number): void {
    this.store[key] = { count, resetTime };
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const entry = this.get(key);
    
    if (!entry) {
      const newEntry = { count: 1, resetTime: now + windowMs };
      this.set(key, 1, now + windowMs);
      return newEntry;
    }
    
    entry.count++;
    this.set(key, entry.count, entry.resetTime);
    return entry;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store = {};
  }
}

const store = new InMemoryRateLimitStore();

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

const defaultOptions: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please try again later',
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

export const createRateLimitMiddleware = (options: Partial<RateLimitOptions> = {}) => {
  const opts = { ...defaultOptions, ...options };

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Use IP address as the key, but could be enhanced to use user ID for authenticated requests
      const key = req.ip || req.connection.remoteAddress || 'unknown';
      
      const result = store.increment(key, opts.windowMs);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': opts.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, opts.maxRequests - result.count).toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      });

      if (result.count > opts.maxRequests) {
        rateLimitLogger.warn({
          message: 'Rate limit exceeded',
          key, 
          count: result.count, 
          limit: opts.maxRequests,
          resetTime: new Date(result.resetTime).toISOString()
        });
        
        throw new AppError(opts.message!, 429, 'RATE_LIMIT_EXCEEDED', {
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        });
      }

      rateLimitLogger.debug({
        message: 'Rate limit check passed',
        key, 
        count: result.count, 
        limit: opts.maxRequests 
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Pre-configured middleware for different endpoints
export const rateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
});

export const strictRateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 requests per 15 minutes (for sensitive operations)
  message: 'Too many attempts, please try again later',
});

export const authRateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 auth attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later',
});