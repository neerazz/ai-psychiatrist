// src/session/watchdog.ts
// Component watchdog timers
// Reference: system_architecture.md Section 7 (Watchdog Timers)
// Implements: AGENTS.md Article VI (Determinism - timers are code, not AI)

import { logger } from '../utils/logger.js';

/**
 * Watchdog timer configurations from system_architecture.md Section 7
 * All values in milliseconds
 */
export const WATCHDOG_TIMEOUTS = {
    STT_PROCESSING: 5000,      // 5s - switch to offline
    LLM_RESPONSE: 30000,       // 30s - force end
    TTS_GENERATION: 15000,     // 15s - skip audio
    LIP_SYNC: 1000,            // 1s - use static avatar
    CONTEXT_FETCH: 3000,       // 3s - proceed without context
    STATE_PERSISTENCE: 5000,   // 5s - retry in background
    AGENT_COMMUNICATION: 2000, // 2s - direct call fallback
    CRISIS_DETECTION: 500      // 500ms - async (never blocks)
} as const;

export type WatchdogComponent = keyof typeof WATCHDOG_TIMEOUTS;

export interface WatchdogEvent {
    component: WatchdogComponent;
    id: string;
    timeout: number;
    timestamp: Date;
}

type WatchdogCallback = (event: WatchdogEvent) => void;

/**
 * Watchdog timer for component timeout monitoring
 * Tracks individual operations and triggers callbacks on timeout
 */
export class Watchdog {
    private timers: Map<string, NodeJS.Timeout> = new Map();
    private callbacks: Map<string, WatchdogCallback> = new Map();
    private startTimes: Map<string, number> = new Map();
    private onGlobalTimeout: WatchdogCallback | null = null;

    /**
     * Set a global timeout handler
     */
    public setGlobalTimeoutHandler(handler: WatchdogCallback): void {
        this.onGlobalTimeout = handler;
    }

    /**
     * Start a watchdog timer for a component
     * @param component - Component type from WATCHDOG_TIMEOUTS
     * @param id - Unique identifier for this operation
     * @param onTimeout - Callback when timeout occurs
     * @returns The timer key for reference
     */
    public start(
        component: WatchdogComponent,
        id: string,
        onTimeout: WatchdogCallback
    ): string {
        const key = `${component}:${id}`;
        const timeout = WATCHDOG_TIMEOUTS[component];

        // Clear existing timer if any
        this.stop(component, id);

        this.callbacks.set(key, onTimeout);
        this.startTimes.set(key, Date.now());

        this.timers.set(key, setTimeout(() => {
            const event: WatchdogEvent = {
                component,
                id,
                timeout,
                timestamp: new Date()
            };

            logger.warn('Watchdog timeout triggered', {
                component,
                id,
                timeout,
                elapsed: Date.now() - (this.startTimes.get(key) || 0)
            });

            // Call specific callback
            const callback = this.callbacks.get(key);
            if (callback) {
                try {
                    callback(event);
                } catch (error) {
                    logger.error('Watchdog callback error', { component, id, error });
                }
            }

            // Call global handler
            if (this.onGlobalTimeout) {
                try {
                    this.onGlobalTimeout(event);
                } catch (error) {
                    logger.error('Global watchdog callback error', { error });
                }
            }

            // Cleanup
            this.timers.delete(key);
            this.callbacks.delete(key);
            this.startTimes.delete(key);
        }, timeout));

        logger.debug('Watchdog started', { component, id, timeout });
        return key;
    }

    /**
     * Stop a watchdog timer (component completed successfully)
     * @returns Elapsed time in ms, or null if not found
     */
    public stop(component: WatchdogComponent, id: string): number | null {
        const key = `${component}:${id}`;
        const timer = this.timers.get(key);
        const startTime = this.startTimes.get(key);

        if (timer) {
            clearTimeout(timer);
            this.timers.delete(key);
            this.callbacks.delete(key);
            this.startTimes.delete(key);

            const elapsed = startTime ? Date.now() - startTime : null;
            logger.debug('Watchdog stopped', { component, id, elapsed });
            return elapsed;
        }

        return null;
    }

    /**
     * Check if a watchdog is currently active
     */
    public isActive(component: WatchdogComponent, id: string): boolean {
        const key = `${component}:${id}`;
        return this.timers.has(key);
    }

    /**
     * Get elapsed time for an active watchdog
     */
    public getElapsed(component: WatchdogComponent, id: string): number | null {
        const key = `${component}:${id}`;
        const startTime = this.startTimes.get(key);
        return startTime ? Date.now() - startTime : null;
    }

    /**
     * Get remaining time for an active watchdog
     */
    public getRemaining(component: WatchdogComponent, id: string): number | null {
        const key = `${component}:${id}`;
        const startTime = this.startTimes.get(key);
        if (!startTime) return null;

        const timeout = WATCHDOG_TIMEOUTS[component];
        const elapsed = Date.now() - startTime;
        return Math.max(0, timeout - elapsed);
    }

    /**
     * Get count of active watchdogs
     */
    public getActiveCount(): number {
        return this.timers.size;
    }

    /**
     * Get all active watchdog keys
     */
    public getActiveKeys(): string[] {
        return Array.from(this.timers.keys());
    }

    /**
     * Stop all watchdog timers
     */
    public stopAll(): void {
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.timers.clear();
        this.callbacks.clear();
        this.startTimes.clear();
        logger.info('All watchdogs stopped', { count: this.timers.size });
    }

    /**
     * Create a promise that rejects on timeout
     * Useful for wrapping async operations with timeout
     */
    public wrapWithTimeout<T>(
        component: WatchdogComponent,
        id: string,
        operation: Promise<T>
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const key = this.start(component, id, (event) => {
                reject(new Error(`Watchdog timeout: ${component} exceeded ${event.timeout}ms`));
            });

            operation
                .then(result => {
                    this.stop(component, id);
                    resolve(result);
                })
                .catch(error => {
                    this.stop(component, id);
                    reject(error);
                });
        });
    }
}

// Export singleton
export const watchdog = new Watchdog();
