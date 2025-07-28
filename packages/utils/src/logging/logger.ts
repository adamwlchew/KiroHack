import winston from 'winston';
import { LogLevel, Logger as LoggerInterface } from './loggerTypes';
import { v4 as uuidv4 } from 'uuid';

// Default context for all logs
const defaultContext = {
  service: process.env.SERVICE_NAME || 'pageflow-service',
  environment: process.env.NODE_ENV || 'development'
};

// Create Winston logger instance
const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: defaultContext,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  winstonLogger.add(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  );
  winstonLogger.add(
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

/**
 * Logger implementation using Winston
 */
class Logger implements LoggerInterface {
  private context: Record<string, any>;

  constructor(context: Record<string, any> = {}) {
    this.context = {
      ...context,
      correlationId: context.correlationId || uuidv4()
    };
  }

  /**
   * Log an error message
   */
  error(message: string | Record<string, any>): void {
    this.log(LogLevel.ERROR, message);
  }

  /**
   * Log a warning message
   */
  warn(message: string | Record<string, any>): void {
    this.log(LogLevel.WARN, message);
  }

  /**
   * Log an info message
   */
  info(message: string | Record<string, any>): void {
    this.log(LogLevel.INFO, message);
  }

  /**
   * Log an HTTP message
   */
  http(message: string | Record<string, any>): void {
    this.log(LogLevel.HTTP, message);
  }

  /**
   * Log a debug message
   */
  debug(message: string | Record<string, any>): void {
    this.log(LogLevel.DEBUG, message);
  }

  /**
   * Log a message with the specified level
   */
  log(level: LogLevel, message: string | Record<string, any>): void {
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
  setCorrelationId(correlationId: string): void {
    this.context.correlationId = correlationId;
  }

  /**
   * Set the user ID for subsequent logs
   */
  setUserId(userId: string): void {
    this.context.userId = userId;
  }

  /**
   * Create a child logger with additional context
   */
  child(options: Record<string, any>): LoggerInterface {
    return new Logger({
      ...this.context,
      ...options
    });
  }
}

// Export a singleton logger instance
export const logger = new Logger();

// Export the Logger class for services that need to instantiate it
export default Logger;