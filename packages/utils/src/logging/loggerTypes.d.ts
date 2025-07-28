/**
 * Log levels
 */
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    HTTP = "http",
    DEBUG = "debug"
}
/**
 * Log message interface
 */
export interface LogMessage {
    level: LogLevel;
    message: string;
    timestamp?: string;
    correlationId?: string;
    userId?: string;
    service?: string;
    [key: string]: any;
}
/**
 * Logger interface
 */
export interface Logger {
    error(message: string | Record<string, any>): void;
    warn(message: string | Record<string, any>): void;
    info(message: string | Record<string, any>): void;
    http(message: string | Record<string, any>): void;
    debug(message: string | Record<string, any>): void;
    log(level: LogLevel, message: string | Record<string, any>): void;
    setCorrelationId(correlationId: string): void;
    setUserId(userId: string): void;
    child(options: Record<string, any>): Logger;
}
//# sourceMappingURL=loggerTypes.d.ts.map