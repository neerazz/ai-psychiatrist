// src/session/session-manager.ts
// Session Manager - Unified session orchestration
// Reference: Requirements R1 (Session Lifecycle), system_architecture.md Section 2

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { SessionStateMachine, getSessionStateMachine, resetSessionStateMachine } from './state-machine.js';
import { SessionPersistence } from './persistence.js';
import { Watchdog, watchdog } from './watchdog.js';
import { findRecoverableSession, recoverSession } from './recovery.js';
import { SessionContext, SessionState, SESSION_TIMER_CONFIG, CrisisAssessment } from './types.js';
import { logger, logAuditEvent } from '../utils/logger.js';
import { sessionRepository, CreateSessionInput } from '../database/repositories/session.repository.js';
import { patientRepository } from '../database/repositories/patient.repository.js';

/**
 * Session timer state
 */
interface SessionTimer {
    startTime: Date;
    elapsedMs: number;
    intervalHandle: NodeJS.Timeout | null;
    warningTriggered: boolean;
    endTriggered: boolean;
}

/**
 * Session events emitted by SessionManager
 */
export interface SessionManagerEvents {
    'session:started': { sessionId: string; patientId: string };
    'session:ended': { sessionId: string; duration: number; summary?: string };
    'session:warning': { remainingMs: number };
    'session:timer': { elapsedMs: number; remainingMs: number };
    'turn:started': { turnNumber: number };
    'turn:completed': { turnNumber: number; transcript: string; response: string };
    'crisis:detected': CrisisAssessment;
    'crisis:resolved': { tier: number };
    'state:changed': { from: SessionState; to: SessionState };
    'error': { code: string; message: string; recoverable: boolean };
}

/**
 * Session Manager
 * Central orchestrator for therapy sessions
 * Implements: Requirements R1 (Session Lifecycle), R31 (Crisis Protocol)
 */
export class SessionManager extends EventEmitter {
    private stateMachine: SessionStateMachine;
    private persistence: SessionPersistence;
    private watchdog: Watchdog;
    private timer: SessionTimer | null = null;
    private currentPatientId: string | null = null;

    constructor() {
        super();
        this.stateMachine = getSessionStateMachine();
        this.persistence = new SessionPersistence(this.stateMachine);
        this.watchdog = watchdog;

        this.setupEventForwarding();
    }

    /**
     * Forward state machine events
     */
    private setupEventForwarding(): void {
        this.stateMachine.on('stateChange', (event) => {
            this.emit('state:changed', {
                from: event.from,
                to: event.to
            });
        });

        this.stateMachine.on('error', (error) => {
            this.emit('error', {
                code: 'STATE_MACHINE_ERROR',
                message: error.error?.message || 'Unknown state machine error',
                recoverable: true
            });
        });
    }

    /**
     * Initialize application (INIT → LOADING → AWAITING_PATIENT)
     */
    public async initialize(): Promise<void> {
        logger.info('Initializing session manager');

        this.stateMachine.trigger('load_application');

        // Simulate config loading (in real app, this would load config)
        await new Promise(resolve => setTimeout(resolve, 100));

        this.stateMachine.trigger('config_loaded');

        logger.info('Session manager initialized', {
            state: this.stateMachine.getState()
        });
    }

    /**
     * Load patient (AWAITING_PATIENT → READY)
     */
    public async loadPatient(patientId: string): Promise<boolean> {
        const currentState = this.stateMachine.getState();
        logger.info(`Loading patient ${patientId}. Current state: ${currentState}`);

        // If we're in ERROR state, reset the state machine to recover
        if (currentState === 'ERROR') {
            logger.info('Recovering from ERROR state');
            this.reset();
            // Re-initialize to get back to proper state
            await this.initialize();
            logger.info(`State after recovery: ${this.stateMachine.getState()}`);
        }

        // Verify patient exists
        const patient = patientRepository.getById(patientId);
        if (!patient) {
            logger.error('Patient not found', { patientId });
            this.stateMachine.trigger('validation_failed');
            return false;
        }

        // Check for recoverable session
        const recoverable = await findRecoverableSession(patientId);
        if (recoverable) {
            logger.info('Found recoverable session', {
                sessionId: recoverable.sessionId
            });
            // Offer recovery option (handled by caller)
        }

        this.currentPatientId = patientId;
        this.stateMachine.updateContext({ patientId });
        this.stateMachine.trigger('patient_overview_loaded');

        logAuditEvent('session_event', patientId, null, 'patient_loaded');

        return true;
    }

    /**
     * Start a new session (READY → ACTIVE_LISTENING)
     */
    public async startSession(): Promise<string | null> {
        try {
            logger.info('Starting session...');
            if (!this.currentPatientId) {
                logger.error('Cannot start session: no patient loaded');
                return null;
            }

            if (!this.stateMachine.canTrigger('session_started')) {
                logger.error('Cannot start session from current state', {
                    state: this.stateMachine.getState()
                });
                return null;
            }

            // Create session record
            const sessionInput: CreateSessionInput = {
                patient_id: this.currentPatientId,
                risk_level_start: 'low'
            };

            logger.info('Creating session record...');
            const sessionId = sessionRepository.create(sessionInput);
            logger.info('Session record created', { sessionId });

            // Update state machine context
            this.stateMachine.updateContext({
                sessionId,
                startTime: new Date(),
                turnNumber: 0
            });
            logger.info('Context updated');

            // Start session timer
            this.startSessionTimer();
            logger.info('Timer started');

            // Start auto-persistence
            this.persistence.startAutoPersist();
            logger.info('Auto-persist started');

            // Trigger state transition
            this.stateMachine.trigger('session_started');
            logger.info('State machine triggered session_started');

            // Update patient session info
            patientRepository.updateSessionInfo(this.currentPatientId);
            logger.info('Patient session info updated');

            logger.info('Session started', { sessionId, patientId: this.currentPatientId });
            logAuditEvent('session_event', this.currentPatientId, sessionId, 'session_started');

            this.emit('session:started', {
                sessionId,
                patientId: this.currentPatientId
            });

            return sessionId;
        } catch (error) {
            logger.error('CRITICAL: Error in startSession', { error });
            // FORCE RESET
            this.stateMachine.forceState('ERROR', (error as Error).message);
            throw error;
        }
    }

    /**
     * Resume a previously interrupted session
     */
    public async resumeSession(sessionId: string): Promise<boolean> {
        if (!this.currentPatientId) {
            return false;
        }

        const result = await recoverSession(
            this.currentPatientId,
            sessionId,
            this.stateMachine,
            this.persistence
        );

        if (result.success) {
            // Restart timer from recovered position
            const context = this.stateMachine.getContext();
            this.startSessionTimer(context.elapsedSeconds * 1000);
            this.persistence.startAutoPersist();

            logger.info('Session resumed', {
                sessionId,
                recoveredTurns: result.recoveredTurns,
                dataIntegrity: result.dataIntegrity
            });
        }

        return result.success;
    }

    /**
     * Start session timer
     */
    private startSessionTimer(startFromMs: number = 0): void {
        this.timer = {
            startTime: new Date(Date.now() - startFromMs),
            elapsedMs: startFromMs,
            intervalHandle: null,
            warningTriggered: false,
            endTriggered: false
        };

        this.timer.intervalHandle = setInterval(() => {
            if (!this.timer) return;

            this.timer.elapsedMs = Date.now() - this.timer.startTime.getTime();
            const remainingMs = SESSION_TIMER_CONFIG.MAX_DURATION_MS - this.timer.elapsedMs;

            // Update context
            this.stateMachine.updateContext({
                elapsedSeconds: Math.floor(this.timer.elapsedMs / 1000)
            });

            // Emit timer event
            this.emit('session:timer', {
                elapsedMs: this.timer.elapsedMs,
                remainingMs: Math.max(0, remainingMs)
            });

            // Check for 5-minute warning (at 20 min)
            if (!this.timer.warningTriggered &&
                this.timer.elapsedMs >= SESSION_TIMER_CONFIG.WARNING_AT_MS) {
                this.timer.warningTriggered = true;
                this.stateMachine.trigger('timer_20min');
                this.emit('session:warning', { remainingMs });
                logger.info('5-minute warning triggered');
            }

            // Check for session end (at 25 min)
            if (!this.timer.endTriggered &&
                this.timer.elapsedMs >= SESSION_TIMER_CONFIG.MAX_DURATION_MS) {
                this.timer.endTriggered = true;
                this.stateMachine.trigger('timer_25min');
                logger.info('Session time limit reached');
            }
        }, SESSION_TIMER_CONFIG.TICK_INTERVAL_MS);
    }

    /**
     * Stop session timer
     */
    private stopSessionTimer(): void {
        if (this.timer?.intervalHandle) {
            clearInterval(this.timer.intervalHandle);
            this.timer.intervalHandle = null;
        }
    }

    /**
     * Process patient speech input
     */
    public async processPatientInput(transcript: string): Promise<string | null> {
        const context = this.stateMachine.getContext();
        if (!context.sessionId) {
            return null;
        }

        // Increment turn
        const turnNumber = context.turnNumber + 1;
        this.stateMachine.updateContext({
            turnNumber,
            lastTranscript: transcript
        });

        // Add to persistence
        this.persistence.addTranscriptEntry('patient', transcript);

        // Emit turn started
        this.emit('turn:started', { turnNumber });

        // Trigger speech detected
        this.stateMachine.trigger('speech_detected');

        // Simulate STT → LLM → Response flow
        this.watchdog.start('STT_PROCESSING', context.sessionId, () => {
            logger.warn('STT timeout');
        });

        // In real implementation, this would process through STT
        this.watchdog.stop('STT_PROCESSING', context.sessionId);
        this.stateMachine.trigger('transcription_complete');

        // Start LLM watchdog
        this.watchdog.start('LLM_RESPONSE', context.sessionId, () => {
            this.stateMachine.trigger('llm_timeout');
        });

        // TODO: Call AI agent for response
        const response = `[AI Response placeholder for turn ${turnNumber}]`;

        this.watchdog.stop('LLM_RESPONSE', context.sessionId);

        // Update context and persistence
        this.stateMachine.updateContext({ lastResponse: response });
        this.persistence.addTranscriptEntry('dr_sterling', response);

        // Trigger response ready
        this.stateMachine.trigger('response_ready');

        // Emit turn completed
        this.emit('turn:completed', {
            turnNumber,
            transcript,
            response
        });

        return response;
    }

    /**
     * Mark speaking complete
     */
    public markSpeechComplete(): void {
        this.stateMachine.trigger('speech_complete');
    }

    /**
     * Handle crisis detection
     */
    public handleCrisisDetected(assessment: CrisisAssessment): void {
        const context = this.stateMachine.getContext();

        this.stateMachine.updateContext({ crisisTier: assessment.tier });
        this.stateMachine.trigger('crisis_detected');

        logAuditEvent('crisis_detection', context.patientId, context.sessionId,
            `crisis_tier_${assessment.tier}`, { indicators: assessment.indicators });

        this.emit('crisis:detected', assessment);
    }

    /**
     * Resolve crisis protocol
     */
    public resolveCrisis(): void {
        const context = this.stateMachine.getContext();
        const tier = context.crisisTier;

        this.stateMachine.updateContext({ crisisTier: null });
        this.stateMachine.trigger('crisis_resolved');

        logAuditEvent('crisis_detection', context.patientId, context.sessionId,
            'crisis_resolved');

        this.emit('crisis:resolved', { tier: tier || 0 });
    }

    /**
     * End session (generates summary and completes)
     */
    public async endSession(): Promise<{ summary: string; duration: number }> {
        const context = this.stateMachine.getContext();
        if (!context.sessionId) {
            throw new Error('No active session');
        }

        // Stop timer
        this.stopSessionTimer();

        // Stop auto-persistence
        this.persistence.stopAutoPersist();

        // Final persist
        await this.persistence.persist();

        // Calculate duration
        const duration = this.timer?.elapsedMs || 0;

        // TODO: Generate summary using AI
        const summary = `Session completed. Duration: ${Math.floor(duration / 60000)} minutes. Turns: ${context.turnNumber}.`;

        // Complete session in database
        sessionRepository.complete(
            context.sessionId,
            'low', // risk level end
            null,  // quality score
            `memory_directory/patients/${context.patientId}/sessions/${context.sessionId}/transcript.json`,
            `memory_directory/patients/${context.patientId}/sessions/${context.sessionId}/summary.json`
        );

        // Trigger summary complete
        this.stateMachine.trigger('summary_complete');

        logAuditEvent('session_event', context.patientId, context.sessionId,
            'session_completed', { duration, turns: context.turnNumber });

        this.emit('session:ended', {
            sessionId: context.sessionId,
            duration,
            summary
        });

        return { summary, duration };
    }

    /**
     * Get current session state
     */
    public getState(): SessionState {
        return this.stateMachine.getState();
    }

    /**
     * Get current context
     */
    public getContext(): SessionContext {
        return this.stateMachine.getContext();
    }

    /**
     * Get transcript entries
     */
    public getTranscript(): Array<{ speaker: string; content: string; timestamp: string }> {
        return this.persistence.getTranscriptEntries();
    }

    /**
     * Check if in active session
     */
    public isInSession(): boolean {
        return this.stateMachine.isInActiveSession();
    }

    /**
     * Get timer status
     */
    public getTimerStatus(): { elapsedMs: number; remainingMs: number } | null {
        if (!this.timer) return null;

        return {
            elapsedMs: this.timer.elapsedMs,
            remainingMs: Math.max(0, SESSION_TIMER_CONFIG.MAX_DURATION_MS - this.timer.elapsedMs)
        };
    }

    /**
     * Reset for new session (after session complete)
     */
    public reset(): void {
        this.stopSessionTimer();
        this.persistence.reset();
        this.watchdog.stopAll();
        resetSessionStateMachine();
        this.stateMachine = getSessionStateMachine();
        this.setupEventForwarding();
        this.timer = null;
        this.currentPatientId = null;
    }

    /**
     * Cleanup resources
     */
    public destroy(): void {
        this.stopSessionTimer();
        this.persistence.destroy();
        this.watchdog.stopAll();
        this.removeAllListeners();
    }
}

// Singleton instance
let instance: SessionManager | null = null;

export function getSessionManager(): SessionManager {
    if (!instance) {
        instance = new SessionManager();
    }
    return instance;
}

export function resetSessionManager(): void {
    if (instance) {
        instance.destroy();
        instance = null;
    }
}
