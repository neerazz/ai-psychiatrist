// src/session/types.ts
// Session type definitions
// Reference: system_architecture.md Section 2.2

/**
 * Session States from system_architecture.md Section 2.2
 * 
 * State flow:
 * INIT → LOADING → AWAITING_PATIENT → READY → ACTIVE_LISTENING ↔ PROCESSING_STT ↔ PROCESSING_LLM ↔ SPEAKING
 * Any active state → CRISIS_PROTOCOL (on crisis detection)
 * Active states → WARNING_5MIN (at 20 min) → SESSION_ENDING (at 25 min) → SESSION_COMPLETE
 */
export type SessionState =
    | 'INIT'
    | 'LOADING'
    | 'AWAITING_PATIENT'
    | 'READY'
    | 'ACTIVE_LISTENING'
    | 'PROCESSING_STT'
    | 'PROCESSING_LLM'
    | 'SPEAKING'
    | 'CRISIS_PROTOCOL'
    | 'WARNING_5MIN'
    | 'SESSION_ENDING'
    | 'SESSION_COMPLETE'
    | 'ERROR_RECOVERY'
    | 'ERROR';

/**
 * State transition triggers from system_architecture.md Section 2.3
 */
export type SessionTrigger =
    | 'load_application'
    | 'config_loaded'
    | 'config_error'
    | 'patient_overview_loaded'
    | 'validation_failed'
    | 'session_started'
    | 'speech_detected'
    | 'transcription_complete'
    | 'stt_timeout'
    | 'response_ready'
    | 'llm_timeout'
    | 'speech_complete'
    | 'user_interrupt'
    | 'timer_20min'
    | 'timer_25min'
    | 'summary_complete'
    | 'crisis_detected'
    | 'crisis_resolved'
    | 'escalation_required'
    | 'recovery_success'
    | 'recovery_failed'
    | 'new_session'
    | 'end_session';

/**
 * State timeout configurations from system_architecture.md Section 2.2
 * Values in milliseconds
 */
export const STATE_TIMEOUTS: Partial<Record<SessionState, number>> = {
    LOADING: 30000,           // 30s → ERROR
    ACTIVE_LISTENING: 120000, // 120s → gentle prompt
    PROCESSING_STT: 5000,     // 5s → ERROR_RECOVERY
    PROCESSING_LLM: 30000,    // 30s → ERROR_RECOVERY
    SPEAKING: 60000,          // 60s → force stop
    SESSION_ENDING: 60000,    // 60s → force complete
    ERROR_RECOVERY: 10000     // 10s → ERROR
};

/**
 * Session context - data associated with current session
 * Implements: Requirements R1 (session lifecycle data)
 */
export interface SessionContext {
    sessionId: string | null;
    patientId: string | null;
    startTime: Date | null;
    turnNumber: number;
    lastTranscript: string;
    lastResponse: string;
    emotionalState: string;
    crisisTier: 1 | 2 | 3 | null;
    warningShown: boolean;
    elapsedSeconds: number;
}

/**
 * State transition definition
 */
export interface StateTransition {
    from: SessionState;
    to: SessionState;
    trigger: SessionTrigger;
    guard?: () => boolean;
    action?: () => void | Promise<void>;
}

/**
 * State change event payload
 */
export interface StateChangeEvent {
    from: SessionState;
    to: SessionState;
    trigger: SessionTrigger;
    timestamp: Date;
    context: SessionContext;
}

/**
 * Timeout event payload
 */
export interface TimeoutEvent {
    state: SessionState;
    timeout: number;
    timestamp: Date;
}

/**
 * Session timer configuration
 * Implements: Requirements R1 (25 min session, 5 min warning)
 */
export const SESSION_TIMER_CONFIG = {
    MAX_DURATION_MS: 25 * 60 * 1000,     // 25 minutes
    WARNING_AT_MS: 20 * 60 * 1000,       // 20 minutes (5 min warning)
    MIN_DURATION_MS: 5 * 60 * 1000,      // 5 minutes minimum
    AUTO_SAVE_INTERVAL_MS: 30 * 1000,    // 30 seconds
    TICK_INTERVAL_MS: 1000               // 1 second timer tick
};

/**
 * Crisis tier definitions from requirements.md R31
 */
export type CrisisTier = 1 | 2 | 3;

export interface CrisisAssessment {
    detected: boolean;
    tier: CrisisTier | null;
    indicators: string[];
    confidence: number;
    recommendedAction: 'IMMEDIATE_INTERVENTION' | 'ELEVATED_MONITORING' | 'INCREASED_ATTENTION' | 'CONTINUE_NORMAL';
}
