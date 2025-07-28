/**
 * Error type definitions
 */

/**
 * Error response interface
 */
export interface ErrorResponse {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Additional error details */
  details?: any;
  /** Error timestamp */
  timestamp: string;
  /** Request ID */
  requestId: string;
  /** Request path */
  path: string;
}

/**
 * Error with retry information
 */
export interface RetryableError {
  /** Error object */
  error: Error;
  /** Whether the error is retryable */
  isRetryable: boolean;
  /** Recommended retry delay in milliseconds */
  retryDelay?: number;
  /** Number of retries attempted */
  retryCount: number;
  /** Maximum number of retries allowed */
  maxRetries: number;
}

/**
 * Circuit breaker state
 */
export enum CircuitState {
  /** Circuit is closed and allowing requests */
  CLOSED = 'CLOSED',
  /** Circuit is open and blocking requests */
  OPEN = 'OPEN',
  /** Circuit is allowing a limited number of test requests */
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit breaker options
 */
export interface CircuitBreakerOptions {
  /** Failure threshold before opening circuit (percentage) */
  failureThreshold: number;
  /** Time in milliseconds to wait before trying half-open state */
  resetTimeout: number;
  /** Number of successful calls in half-open state to close circuit */
  successThreshold: number;
  /** Maximum number of requests in half-open state */
  maxHalfOpenRequests: number;
  /** Timeout for requests in milliseconds */
  requestTimeout?: number;
}