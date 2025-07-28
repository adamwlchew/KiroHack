"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const loggerTypes_1 = require("./loggerTypes");
const uuid_1 = require("uuid");
// Default context for all logs
const defaultContext = {
    service: process.env.SERVICE_NAME || 'pageflow-service',
    environment: process.env.NODE_ENV || 'development'
};
// Create Winston logger instance
const winstonLogger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    defaultMeta: defaultContext,
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
        })
    ]
});
// Add file transport in production
if (process.env.NODE_ENV === 'production') {
    winstonLogger.add(new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }));
    winstonLogger.add(new winston_1.default.transports.File({ filename: 'logs/combined.log' }));
}
/**
 * Logger implementation using Winston
 */
class Logger {
    constructor(context = {}) {
        this.context = {
            ...context,
            correlationId: context.correlationId || (0, uuid_1.v4)()
        };
    }
    /**
     * Log an error message
     */
    error(message) {
        this.log(loggerTypes_1.LogLevel.ERROR, message);
    }
    /**
     * Log a warning message
     */
    warn(message) {
        this.log(loggerTypes_1.LogLevel.WARN, message);
    }
    /**
     * Log an info message
     */
    info(message) {
        this.log(loggerTypes_1.LogLevel.INFO, message);
    }
    /**
     * Log an HTTP message
     */
    http(message) {
        this.log(loggerTypes_1.LogLevel.HTTP, message);
    }
    /**
     * Log a debug message
     */
    debug(message) {
        this.log(loggerTypes_1.LogLevel.DEBUG, message);
    }
    /**
     * Log a message with the specified level
     */
    log(level, message) {
        const logObject = typeof message === 'string'
            ? { message }
            : message;
        winstonLogger.log(level, {
            ...this.context,
            ...logObject,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Set the correlation ID for subsequent logs
     */
    setCorrelationId(correlationId) {
        this.context.correlationId = correlationId;
    }
    /**
     * Set the user ID for subsequent logs
     */
    setUserId(userId) {
        this.context.userId = userId;
    }
    /**
     * Create a child logger with additional context
     */
    child(options) {
        return new Logger({
            ...this.context,
            ...options
        });
    }
}
// Export a singleton logger instance
exports.logger = new Logger();
// Export the Logger class for services that need to instantiate it
exports.default = Logger;
//# sourceMappingURL=logger.js.map