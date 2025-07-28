"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = void 0;
/**
 * Circuit breaker states
 */
var CircuitState;
(function (CircuitState) {
    CircuitState[CircuitState["CLOSED"] = 0] = "CLOSED";
    CircuitState[CircuitState["OPEN"] = 1] = "OPEN";
    CircuitState[CircuitState["HALF_OPEN"] = 2] = "HALF_OPEN"; // Testing if service has recovered
})(CircuitState || (CircuitState = {}));
/**
 * Circuit breaker implementation for handling service failures
 */
class CircuitBreaker {
    /**
     * Create a new circuit breaker
     * @param options Circuit breaker options
     */
    constructor(options) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = 0;
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
    async execute(fn) {
        if (this.state === CircuitState.OPEN) {
            // Check if reset timeout has elapsed
            const now = Date.now();
            if (now - this.lastFailureTime > this.options.resetTimeout) {
                this.transitionTo(CircuitState.HALF_OPEN);
            }
            else {
                throw new Error('Circuit is open');
            }
        }
        try {
            const result = await fn();
            this.recordSuccess();
            return result;
        }
        catch (error) {
            this.recordFailure();
            throw error;
        }
    }
    /**
     * Record a successful operation
     */
    recordSuccess() {
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.options.failureThreshold) {
                this.transitionTo(CircuitState.CLOSED);
            }
        }
        else if (this.state === CircuitState.CLOSED) {
            // Reset failure count on success in closed state
            this.failureCount = 0;
        }
    }
    /**
     * Record a failed operation
     */
    recordFailure() {
        this.lastFailureTime = Date.now();
        if (this.state === CircuitState.HALF_OPEN) {
            this.transitionTo(CircuitState.OPEN);
        }
        else if (this.state === CircuitState.CLOSED) {
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
    transitionTo(newState) {
        if (this.state !== newState) {
            const oldState = this.state;
            this.state = newState;
            // Reset counters
            if (newState === CircuitState.CLOSED) {
                this.failureCount = 0;
                this.successCount = 0;
            }
            else if (newState === CircuitState.HALF_OPEN) {
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
    startMonitoring() {
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
    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
    }
    /**
     * Get the current state of the circuit
     */
    getState() {
        return CircuitState[this.state];
    }
    /**
     * Reset the circuit to closed state
     */
    reset() {
        this.transitionTo(CircuitState.CLOSED);
    }
}
exports.CircuitBreaker = CircuitBreaker;
//# sourceMappingURL=circuitBreaker.js.map