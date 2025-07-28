/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED, // Normal operation, requests pass through
  OPEN,   // Failure threshold exceeded, requests fail fast
  HALF_OPEN // Testing if service has recovered
}

/**
 * Circuit breaker options
 */
interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitorInterval?: number;
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
}

/**
 * Circuit breaker implementation for handling service failures
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly options: CircuitBreakerOptions;
  private monitorInterval?: any; // NodeJS.Timeout

  /**
   * Create a new circuit breaker
   * @param options Circuit breaker options
   */
  constructor(options: CircuitBreakerOptions) {
    const defaults = {
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      monitorInterval: 5000, // 5 seconds
    };
    
    this.options = {
      ...defaults,
      ...options
    };

    // Start monitoring if interval is provided
    if (this.options.monitorInterval) {
      this.startMonitoring();
    }
  }

  /**
   * Execute a function with circuit breaker protection
   * @param fn Function to execute
   * @returns Result of the function
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      // Check if reset timeout has elapsed
      const now = Date.now();
      if (now - this.lastFailureTime > this.options.resetTimeout) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new Error('Circuit is open');
      }
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Record a successful operation
   */
  private recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.failureThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }

  /**
   * Record a failed operation
   */
  private recordFailure(): void {
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      if (this.failureCount >= this.options.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  /**
   * Transition to a new state
   * @param newState New circuit state
   */
  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;

      // Reset counters
      if (newState === CircuitState.CLOSED) {
        this.failureCount = 0;
        this.successCount = 0;
      } else if (newState === CircuitState.HALF_OPEN) {
        this.successCount = 0;
      }

      // Notify state change
      if (this.options.onStateChange) {
        this.options.onStateChange(oldState, newState);
      }
    }
  }

  /**
   * Start monitoring the circuit
   */
  private startMonitoring(): void {
    this.monitorInterval = setInterval(() => {
      if (this.state === CircuitState.OPEN) {
        const now = Date.now();
        if (now - this.lastFailureTime > this.options.resetTimeout) {
          this.transitionTo(CircuitState.HALF_OPEN);
        }
      }
    }, this.options.monitorInterval);
  }

  /**
   * Stop monitoring the circuit
   */
  public stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
  }

  /**
   * Get the current state of the circuit
   */
  public getState(): string {
    return CircuitState[this.state];
  }

  /**
   * Reset the circuit to closed state
   */
  public reset(): void {
    this.transitionTo(CircuitState.CLOSED);
  }
}