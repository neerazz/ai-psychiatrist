// src/session/state-machine.ts
// Session State Machine Implementation
// Reference: system_architecture.md Section 2 (Complete state machine)
// Implements: AGENTS.md Article VI (Determinism - state machines are code, not AI)

import { EventEmitter } from 'events';
import {
    SessionState,
    SessionTrigger,
    SessionContext,
    StateTransition,
    STATE_TIMEOUTS,
    StateChangeEvent,
    TimeoutEvent
} from './types.js';
import { logger } from '../utils/logger.js';

/**
 * Session State Machine
 * Implements the state machine from system_architecture.md Section 2
 *
 * Events emitted:
 * - 'stateChange': StateChangeEvent
 * - 'timeout': TimeoutEvent
 * - 'error': { state: SessionState, error: Error }
 */
export class SessionStateMachine extends EventEmitter {
    private currentState: SessionState = 'INIT';
    private context: SessionContext;
    private transitions: StateTransition[] = [];
    private timeoutHandle: NodeJS.Timeout | null = null;
    private stateHistory: Array<{ state: SessionState; timestamp: Date }> = [];

    constructor() {
        super();
        this.context = this.createInitialContext();
        this.setupTransitions();
        this.stateHistory.push({ state: 'INIT', timestamp: new Date() });
    }

    /**
     * Create initial session context
     */
    private createInitialContext(): SessionContext {
        return {
            sessionId: null,
            patientId: null,
            startTime: null,
            turnNumber: 0,
            lastTranscript: '',
            lastResponse: '',
            emotionalState: 'neutral',
            crisisTier: null,
            warningShown: false,
            elapsedSeconds: 0
        };
    }

    /**
     * Setup all valid state transitions
     * Reference: system_architecture.md Section 2.3
     */
    private setupTransitions(): void {
        this.transitions = [
            // Startup flow
            { from: 'INIT', to: 'LOADING', trigger: 'load_application' },
            { from: 'LOADING', to: 'AWAITING_PATIENT', trigger: 'config_loaded' },
            { from: 'LOADING', to: 'ERROR', trigger: 'config_error' },
            { from: 'AWAITING_PATIENT', to: 'READY', trigger: 'patient_overview_loaded' },
            { from: 'AWAITING_PATIENT', to: 'ERROR', trigger: 'validation_failed' },

            // Session flow
            { from: 'READY', to: 'ACTIVE_LISTENING', trigger: 'session_started' },
            { from: 'ACTIVE_LISTENING', to: 'PROCESSING_STT', trigger: 'speech_detected' },
            { from: 'PROCESSING_STT', to: 'PROCESSING_LLM', trigger: 'transcription_complete' },
            { from: 'PROCESSING_STT', to: 'ERROR_RECOVERY', trigger: 'stt_timeout' },
            { from: 'PROCESSING_LLM', to: 'SPEAKING', trigger: 'response_ready' },
            { from: 'PROCESSING_LLM', to: 'ERROR_RECOVERY', trigger: 'llm_timeout' },
            { from: 'SPEAKING', to: 'ACTIVE_LISTENING', trigger: 'speech_complete' },
            { from: 'SPEAKING', to: 'PROCESSING_STT', trigger: 'user_interrupt' },

            // Timer flow
            { from: 'ACTIVE_LISTENING', to: 'WARNING_5MIN', trigger: 'timer_20min' },
            { from: 'PROCESSING_LLM', to: 'WARNING_5MIN', trigger: 'timer_20min' },
            { from: 'SPEAKING', to: 'WARNING_5MIN', trigger: 'timer_20min' },
            { from: 'WARNING_5MIN', to: 'ACTIVE_LISTENING', trigger: 'speech_detected' },
            { from: 'WARNING_5MIN', to: 'SESSION_ENDING', trigger: 'timer_25min' },
            { from: 'SESSION_ENDING', to: 'SESSION_COMPLETE', trigger: 'summary_complete' },

            // Crisis flow (can be triggered from any active state)
            { from: 'ACTIVE_LISTENING', to: 'CRISIS_PROTOCOL', trigger: 'crisis_detected' },
            { from: 'PROCESSING_STT', to: 'CRISIS_PROTOCOL', trigger: 'crisis_detected' },
            { from: 'PROCESSING_LLM', to: 'CRISIS_PROTOCOL', trigger: 'crisis_detected' },
            { from: 'SPEAKING', to: 'CRISIS_PROTOCOL', trigger: 'crisis_detected' },
            { from: 'WARNING_5MIN', to: 'CRISIS_PROTOCOL', trigger: 'crisis_detected' },
            { from: 'CRISIS_PROTOCOL', to: 'ACTIVE_LISTENING', trigger: 'crisis_resolved' },
            { from: 'CRISIS_PROTOCOL', to: 'SESSION_ENDING', trigger: 'escalation_required' },

            // Error recovery
            { from: 'ERROR_RECOVERY', to: 'ACTIVE_LISTENING', trigger: 'recovery_success' },
            { from: 'ERROR_RECOVERY', to: 'ERROR', trigger: 'recovery_failed' },

            // Session end options
            { from: 'SESSION_COMPLETE', to: 'READY', trigger: 'new_session' },
            { from: 'SESSION_COMPLETE', to: 'AWAITING_PATIENT', trigger: 'end_session' }
        ];
    }

    /**
     * Get current state
     */
    public getState(): SessionState {
        return this.currentState;
    }

    /**
     * Get current context (returns a copy)
     */
    public getContext(): SessionContext {
        return { ...this.context };
    }

    /**
     * Update context
     */
    public updateContext(updates: Partial<SessionContext>): void {
        this.context = { ...this.context, ...updates };
        logger.debug('Session context updated', { updates });
    }

    /**
     * Get state history
     */
    public getStateHistory(): Array<{ state: SessionState; timestamp: Date }> {
        return [...this.stateHistory];
    }

    /**
     * Trigger a state transition
     * @returns true if transition was valid and executed
     */
    public trigger(triggerName: SessionTrigger): boolean {
        const transition = this.transitions.find(
            t => t.from === this.currentState && t.trigger === triggerName
        );

        if (!transition) {
            logger.warn('Invalid state transition attempted', {
                currentState: this.currentState,
                trigger: triggerName,
                validTriggers: this.getValidTriggers()
            });
            return false;
        }

        // Check guard if present
        if (transition.guard && !transition.guard()) {
            logger.debug('Transition guard prevented transition', {
                from: transition.from,
                to: transition.to,
                trigger: triggerName
            });
            return false;
        }

        // Clear any existing timeout
        this.clearTimeout();

        const previousState = this.currentState;
        this.currentState = transition.to;

        // Record state history
        this.stateHistory.push({ state: this.currentState, timestamp: new Date() });

        logger.info('State transition', {
            from: previousState,
            to: this.currentState,
            trigger: triggerName,
            sessionId: this.context.sessionId
        });

        // Execute action if present
        if (transition.action) {
            try {
                const result = transition.action();
                if (result instanceof Promise) {
                    result.catch(err => {
                        logger.error('Transition action failed', { error: err });
                        this.emit('error', { state: this.currentState, error: err });
                    });
                }
            } catch (err) {
                logger.error('Transition action failed synchronously', { error: err });
                this.emit('error', { state: this.currentState, error: err });
            }
        }

        // Set timeout for new state
        this.setTimeoutForState(this.currentState);

        // Emit state change event
        const event: StateChangeEvent = {
            from: previousState,
            to: this.currentState,
            trigger: triggerName,
            timestamp: new Date(),
            context: this.getContext()
        };
        this.emit('stateChange', event);

        return true;
    }

    /**
     * Set timeout for a state
     */
    private setTimeoutForState(state: SessionState): void {
        const timeout = STATE_TIMEOUTS[state];
        if (!timeout) return;

        this.timeoutHandle = setTimeout(() => {
            logger.warn('State timeout triggered', { state, timeout });

            const timeoutEvent: TimeoutEvent = {
                state,
                timeout,
                timestamp: new Date()
            };
            this.emit('timeout', timeoutEvent);

            // Auto-trigger timeout transitions
            if (state === 'PROCESSING_STT') {
                this.trigger('stt_timeout');
            } else if (state === 'PROCESSING_LLM') {
                this.trigger('llm_timeout');
            } else if (state === 'ERROR_RECOVERY') {
                this.trigger('recovery_failed');
            } else if (state === 'LOADING') {
                this.trigger('config_error');
            }
        }, timeout);
    }

    /**
     * Clear current timeout
     */
    private clearTimeout(): void {
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
            this.timeoutHandle = null;
        }
    }

    /**
     * Check if a trigger is valid from current state
     */
    public canTrigger(triggerName: SessionTrigger): boolean {
        return this.transitions.some(
            t => t.from === this.currentState && t.trigger === triggerName
        );
    }

    /**
     * Get all valid triggers from current state
     */
    public getValidTriggers(): SessionTrigger[] {
        return this.transitions
            .filter(t => t.from === this.currentState)
            .map(t => t.trigger);
    }

    /**
     * Check if in an active session state
     */
    public isInActiveSession(): boolean {
        const activeStates: SessionState[] = [
            'ACTIVE_LISTENING', 'PROCESSING_STT', 'PROCESSING_LLM',
            'SPEAKING', 'WARNING_5MIN', 'CRISIS_PROTOCOL'
        ];
        return activeStates.includes(this.currentState);
    }

    /**
     * Check if crisis detection should run (in any active state)
     */
    public shouldRunCrisisDetection(): boolean {
        return this.isInActiveSession() && this.currentState !== 'CRISIS_PROTOCOL';
    }

    /**
     * Reset state machine to initial state
     */
    public reset(): void {
        this.clearTimeout();
        this.currentState = 'INIT';
        this.context = this.createInitialContext();
        this.stateHistory = [{ state: 'INIT', timestamp: new Date() }];
        logger.info('State machine reset');
    }

    /**
     * Force transition to a specific state (for recovery scenarios only)
     * WARNING: This bypasses normal transition rules
     */
    public forceState(state: SessionState, reason: string): void {
        logger.warn('Forcing state transition (recovery)', {
            from: this.currentState,
            to: state,
            reason
        });

        this.clearTimeout();
        const previousState = this.currentState;
        this.currentState = state;
        this.stateHistory.push({ state, timestamp: new Date() });

        this.emit('stateChange', {
            from: previousState,
            to: state,
            trigger: 'recovery_success' as SessionTrigger,
            timestamp: new Date(),
            context: this.getContext()
        });
    }

    /**
     * Add a custom transition with guard
     */
    public addTransitionGuard(
        from: SessionState,
        to: SessionState,
        trigger: SessionTrigger,
        guard: () => boolean
    ): void {
        const existingIndex = this.transitions.findIndex(
            t => t.from === from && t.to === to && t.trigger === trigger
        );

        if (existingIndex >= 0) {
            this.transitions[existingIndex].guard = guard;
        }
    }

    /**
     * Cleanup resources
     */
    public destroy(): void {
        this.clearTimeout();
        this.removeAllListeners();
        logger.info('State machine destroyed');
    }
}

// Export singleton factory
let instance: SessionStateMachine | null = null;

export function getSessionStateMachine(): SessionStateMachine {
    if (!instance) {
        instance = new SessionStateMachine();
    }
    return instance;
}

export function resetSessionStateMachine(): void {
    if (instance) {
        instance.destroy();
        instance = null;
    }
}
