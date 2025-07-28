import { AppError } from './appError';
/**
 * Express error handler middleware
 */
export declare function errorHandler(err: any, req: any, res: any, next: any): void;
/**
 * Global error handler
 * @param error Error to handle
 */
export declare function handleError(error: Error | AppError): void;
/**
 * Transforms a raw error into an AppError
 * @param error Raw error
 * @returns AppError
 */
export declare function transformError(error: any): AppError;
//# sourceMappingURL=errorHandler.d.ts.map