import { LogLevel, Logger as LoggerInterface } from './loggerTypes';
/**
 * Logger implementation using Winston
 */
declare class Logger implements LoggerInterface {
    private context;
    constructor(context?: Record<string, any>);
    /**
     * Log an error message
     */
    error(message: string | Record<string, any>): void;
    /**
     * Log a warning message
     */
    warn(message: string | Record<string, any>): void;
    /**
     * Log an info message
     */
    info(message: string | Record<string, any>): void;
    /**
     * Log an HTTP message
     */
    http(message: string | Record<string, any>): void;
    /**
     * Log a debug message
     */
    debug(message: string | Record<string, any>): void;
    /**
     * Log a message with the specified level
     */
    log(level: LogLevel, message: string | Record<string, any>): void;
    /**
     * Set the correlation ID for subsequent logs
     */
    setCorrelationId(correlationId: string): void;
    /**
     * Set the user ID for subsequent logs
     */
    setUserId(userId: string): void;
    /**
     * Create a child logger with additional context
     */
    child(options: Record<string, any>): LoggerInterface;
}
export declare const logger: Logger;
export default Logger;
//# sourceMappingURL=logger.d.ts.map