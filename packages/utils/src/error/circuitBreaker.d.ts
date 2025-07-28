/**
 * Circuit breaker states
 */
declare enum CircuitState {
    CLOSED = 0,// Normal operation, requests pass through
    OPEN = 1,// Failure threshold exceeded, requests fail fast
    HALF_OPEN = 2
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
export declare class CircuitBreaker {
    private state;
    private failureCount;
    private successCount;
    private lastFailureTime;
    private readonly options;
    private monitorInterval?;
    /**
     * Create a new circuit breaker
     * @param options Circuit breaker options
     */
    constructor(options: CircuitBreakerOptions);
    /**
     * Execute a function with circuit breaker protection
     * @param fn Function to execute
     * @returns Result of the function
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * Record a successful operation
     */
    private recordSuccess;
    /**
     * Record a failed operation
     */
    private recordFailure;
    /**
     * Transition to a new state
     * @param newState New circuit state
     */
    private transitionTo;
    /**
     * Start monitoring the circuit
     */
    private startMonitoring;
    /**
     * Stop monitoring the circuit
     */
    stopMonitoring(): void;
    /**
     * Get the current state of the circuit
     */
    getState(): string;
    /**
     * Reset the circuit to closed state
     */
    reset(): void;
}
export {};
//# sourceMappingURL=circuitBreaker.d.ts.map