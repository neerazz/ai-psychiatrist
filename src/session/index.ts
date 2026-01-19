// src/session/index.ts
// Session module exports
// Reference: AGENTS.md Article I (Library-First - modular components)

// Type definitions
export * from './types.js';

// Core state machine
export {
    SessionStateMachine,
    getSessionStateMachine,
    resetSessionStateMachine
} from './state-machine.js';

// Watchdog timers
export {
    Watchdog,
    watchdog,
    WATCHDOG_TIMEOUTS,
    type WatchdogComponent,
    type WatchdogEvent
} from './watchdog.js';

// CRDT transcript
export {
    TranscriptCRDT,
    type CRDTTranscriptEntry
} from './crdt.js';

// Session persistence
export {
    SessionPersistence,
    type PersistedSessionState
} from './persistence.js';

// Session recovery
export {
    findRecoverableSession,
    recoverSession,
    markSessionInterrupted,
    needsRecovery,
    getAllRecoverableSessions,
    cleanupOldCheckpoints,
    type RecoveryResult
} from './recovery.js';

// Session manager (unified orchestrator)
export {
    SessionManager,
    getSessionManager,
    resetSessionManager,
    type SessionManagerEvents
} from './session-manager.js';
