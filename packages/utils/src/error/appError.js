"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.createBadRequestError = createBadRequestError;
exports.createUnauthorizedError = createUnauthorizedError;
exports.createForbiddenError = createForbiddenError;
exports.createNotFoundError = createNotFoundError;
exports.createConflictError = createConflictError;
exports.createValidationError = createValidationError;
exports.createServerError = createServerError;
exports.createServiceUnavailableError = createServiceUnavailableError;
/**
 * Custom application error class
 * Extends the built-in Error class with additional properties
 */
class AppError extends Error {
    /**
     * Create a new AppError
     * @param message Error message
     * @param statusCode HTTP status code
     * @param code Error code
     * @param details Additional error details
     * @param isOperational Whether the error is operational (expected) or programming
     */
    constructor(message, statusCode = 500, code, details, isOperational = true) {
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
    toResponse(path) {
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
exports.AppError = AppError;
/**
 * Create a bad request error (400)
 */
function createBadRequestError(message, code, details) {
    return new AppError(message, 400, code || 'BAD_REQUEST', details);
}
/**
 * Create an unauthorized error (401)
 */
function createUnauthorizedError(message, code, details) {
    return new AppError(message, 401, code || 'UNAUTHORIZED', details);
}
/**
 * Create a forbidden error (403)
 */
function createForbiddenError(message, code, details) {
    return new AppError(message, 403, code || 'FORBIDDEN', details);
}
/**
 * Create a not found error (404)
 */
function createNotFoundError(message, code, details) {
    return new AppError(message, 404, code || 'NOT_FOUND', details);
}
/**
 * Create a conflict error (409)
 */
function createConflictError(message, code, details) {
    return new AppError(message, 409, code || 'CONFLICT', details);
}
/**
 * Create a validation error (422)
 */
function createValidationError(message, code, details) {
    return new AppError(message, 422, code || 'VALIDATION_ERROR', details);
}
/**
 * Create a server error (500)
 */
function createServerError(message, code, details) {
    return new AppError(message, 500, code || 'SERVER_ERROR', details);
}
/**
 * Create a service unavailable error (503)
 */
function createServiceUnavailableError(message, code, details) {
    return new AppError(message, 503, code || 'SERVICE_UNAVAILABLE', details);
}
//# sourceMappingURL=appError.js.map