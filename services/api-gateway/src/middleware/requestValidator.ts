import { Request, Response, NextFunction } from 'express';
import { logger } from '@pageflow/utils';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}

export const validateRequest = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];
    const data = { ...req.body, ...req.query, ...req.params };

    for (const rule of rules) {
      const value = data[rule.field];

      // Check if required
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      // Skip validation if value is not present and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Check type
      if (rule.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rule.type) {
          errors.push(`${rule.field} must be of type ${rule.type}`);
          continue;
        }
      }

      // Check string length
      if (rule.type === 'string' || typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${rule.field} must be at least ${rule.minLength} characters long`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${rule.field} must be no more than ${rule.maxLength} characters long`);
        }
      }

      // Check pattern
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(`${rule.field} format is invalid`);
      }

      // Custom validation
      if (rule.custom && !rule.custom(value)) {
        errors.push(`${rule.field} validation failed`);
      }
    }

    if (errors.length > 0) {
      logger.warn({
        message: 'Request validation failed',
        errors,
        path: req.path,
        method: req.method,
      });

      res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors,
        },
      });
      return;
    }

    next();
  };
};

// Common validation rules
export const commonValidations = {
  userId: { field: 'userId', required: true, type: 'string' as const },
  email: { 
    field: 'email', 
    required: true, 
    type: 'string' as const, 
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
  },
  password: { 
    field: 'password', 
    required: true, 
    type: 'string' as const, 
    minLength: 8 
  },
}; 