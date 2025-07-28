/**
 * Custom application error class
 * Extends the built-in Error class with additional properties
 */
export declare class AppError extends Error {
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
    constructor(message: string, statusCode?: number, code?: string, details?: any, isOperational?: boolean);
    /**
     * Converts the error to a response object
     *
     * @param path Request path
     */
    toResponse(path: string): {
        code: string;
        message: string;
        details: any;
        timestamp: string;
        requestId: string;
        path: string;
    };
}
/**
 * Create a bad request error (400)
 */
export declare function createBadRequestError(message: string, code?: string, details?: any): AppError;
/**
 * Create an unauthorized error (401)
 */
export declare function createUnauthorizedError(message: string, code?: string, details?: any): AppError;
/**
 * Create a forbidden error (403)
 */
export declare function createForbiddenError(message: string, code?: string, details?: any): AppError;
/**
 * Create a not found error (404)
 */
export declare function createNotFoundError(message: string, code?: string, details?: any): AppError;
/**
 * Create a conflict error (409)
 */
export declare function createConflictError(message: string, code?: string, details?: any): AppError;
/**
 * Create a validation error (422)
 */
export declare function createValidationError(message: string, code?: string, details?: any): AppError;
/**
 * Create a server error (500)
 */
export declare function createServerError(message: string, code?: string, details?: any): AppError;
/**
 * Create a service unavailable error (503)
 */
export declare function createServiceUnavailableError(message: string, code?: string, details?: any): AppError;
//# sourceMappingURL=appError.d.ts.map