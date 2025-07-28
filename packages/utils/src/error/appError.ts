/**
 * Custom application error class
 * Extends the built-in Error class with additional properties
 */
export class AppError extends Error {
  statusCode: number;
  code?: string;
  details?: any;
  isOperational: boolean;

  /**
   * Create a new AppError
   * @param message Error message
   * @param statusCode HTTP status code
   * @param code Error code
   * @param details Additional error details
   * @param isOperational Whether the error is operational (expected) or programming
   */
  constructor(
    message: string,
    statusCode = 500,
    code?: string,
    details?: any,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    
    // Capture stack trace if available (Node.js environment)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
    
    // Set the prototype explicitly
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Converts the error to a response object
   * 
   * @param path Request path
   */
  toResponse(path: string) {
    return {
      code: this.code || 'ERROR',
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
      requestId: 'unknown',
      path,
    };
  }
}

/**
 * Create a bad request error (400)
 */
export function createBadRequestError(message: string, code?: string, details?: any): AppError {
  return new AppError(message, 400, code || 'BAD_REQUEST', details);
}

/**
 * Create an unauthorized error (401)
 */
export function createUnauthorizedError(message: string, code?: string, details?: any): AppError {
  return new AppError(message, 401, code || 'UNAUTHORIZED', details);
}

/**
 * Create a forbidden error (403)
 */
export function createForbiddenError(message: string, code?: string, details?: any): AppError {
  return new AppError(message, 403, code || 'FORBIDDEN', details);
}

/**
 * Create a not found error (404)
 */
export function createNotFoundError(message: string, code?: string, details?: any): AppError {
  return new AppError(message, 404, code || 'NOT_FOUND', details);
}

/**
 * Create a conflict error (409)
 */
export function createConflictError(message: string, code?: string, details?: any): AppError {
  return new AppError(message, 409, code || 'CONFLICT', details);
}

/**
 * Create a validation error (422)
 */
export function createValidationError(message: string, code?: string, details?: any): AppError {
  return new AppError(message, 422, code || 'VALIDATION_ERROR', details);
}

/**
 * Create a server error (500)
 */
export function createServerError(message: string, code?: string, details?: any): AppError {
  return new AppError(message, 500, code || 'SERVER_ERROR', details);
}

/**
 * Create a service unavailable error (503)
 */
export function createServiceUnavailableError(message: string, code?: string, details?: any): AppError {
  return new AppError(message, 503, code || 'SERVICE_UNAVAILABLE', details);
}