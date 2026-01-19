// scripts/verify-session-module.ts
// Verification script for Task 4: Session State Machine
// Reference: AGENTS.md Article X (Task Completion Verification)

import {
    SessionStateMachine,
    getSessionStateMachine,
    resetSessionStateMachine,
    TranscriptCRDT,
    SessionPersistence,
    Watchdog,
    watchdog,
    WATCHDOG_TIMEOUTS,
    SessionState,
    SessionTrigger,
    STATE_TIMEOUTS,
    SESSION_TIMER_CONFIG
} from '../src/session/index.js';
import { logger } from '../src/utils/logger.js';

async function runVerification(): Promise<void> {
    console.log('============================================');
    console.log('  Task 4: Session State Machine Verification');
    console.log('============================================\n');

    let passed = 0;
    let failed = 0;

    // Test 1: State Machine Initialization
    console.log('Test 1: State Machine Initialization');
    try {
        const sm = getSessionStateMachine();
        if (sm.getState() === 'INIT') {
            console.log('  ✓ Initial state is INIT');
            passed++;
        } else {
            console.log('  ✗ Initial state should be INIT, got:', sm.getState());
            failed++;
        }
        resetSessionStateMachine();
    } catch (error) {
        console.log('  ✗ Error:', error);
        failed++;
    }

    // Test 2: State Transitions
    console.log('\nTest 2: State Transitions');
    try {
        const sm = new SessionStateMachine();

        // INIT → LOADING
        let result = sm.trigger('load_application');
        if (result && sm.getState() === 'LOADING') {
            console.log('  ✓ INIT → LOADING transition successful');
            passed++;
        } else {
            console.log('  ✗ INIT → LOADING failed');
            failed++;
        }

        // LOADING → AWAITING_PATIENT
        result = sm.trigger('config_loaded');
        if (result && sm.getState() === 'AWAITING_PATIENT') {
            console.log('  ✓ LOADING → AWAITING_PATIENT transition successful');
            passed++;
        } else {
            console.log('  ✗ LOADING → AWAITING_PATIENT failed');
            failed++;
        }
    } catch (error) {
        console.log('  ✗ Error:', error);
        failed++;
    }

    // Test 3: Invalid Transitions
    console.log('\nTest 3: Invalid Transitions (should return false)');
    try {
        const sm = new SessionStateMachine();
        const result = sm.trigger('session_started'); // Invalid from INIT
        if (!result) {
            console.log('  ✓ Invalid transition correctly rejected');
            passed++;
        } else {
            console.log('  ✗ Invalid transition should have been rejected');
            failed++;
        }
    } catch (error) {
        console.log('  ✗ Error:', error);
        failed++;
    }

    // Test 4: State History
    console.log('\nTest 4: State History');
    try {
        const sm = new SessionStateMachine();
        sm.trigger('load_application');
        sm.trigger('config_loaded');
        const history = sm.getStateHistory();
        if (history.length === 3 && history[0].state === 'INIT') {
            console.log('  ✓ State history correctly tracked (3 entries)');
            passed++;
        } else {
            console.log('  ✗ State history incorrect, length:', history.length);
            failed++;
        }
    } catch (error) {
        console.log('  ✗ Error:', error);
        failed++;
    }

    // Test 5: Context Updates
    console.log('\nTest 5: Context Updates');
    try {
        const sm = new SessionStateMachine();
        sm.updateContext({ patientId: 'test-patient-123' });
        const context = sm.getContext();
        if (context.patientId === 'test-patient-123') {
            console.log('  ✓ Context updates correctly');
            passed++;
        } else {
            console.log('  ✗ Context update failed');
            failed++;
        }
    } catch (error) {
        console.log('  ✗ Error:', error);
        failed++;
    }

    // Test 6: Valid Triggers
    console.log('\nTest 6: Valid Triggers Query');
    try {
        const sm = new SessionStateMachine();
        const triggers = sm.getValidTriggers();
        if (triggers.includes('load_application') && triggers.length === 1) {
            console.log('  ✓ getValidTriggers() returns correct triggers from INIT');
            passed++;
        } else {
            console.log('  ✗ Unexpected triggers:', triggers);
            failed++;
        }
    } catch (error) {
        console.log('  ✗ Error:', error);
        failed++;
    }

    // Test 7: CRDT Transcript
    console.log('\nTest 7: CRDT Transcript');
    try {
        const crdt = new TranscriptCRDT();
        const id1 = crdt.add('patient', 'Hello, doctor');
        const id2 = crdt.add('dr_sterling', 'Hello, how are you feeling today?');

        if (crdt.size() === 2) {
            console.log('  ✓ CRDT add works correctly');
            passed++;
        } else {
            console.log('  ✗ CRDT size should be 2, got:', crdt.size());
            failed++;
        }

        const entries = crdt.getEntries();
        if (entries[0].speaker === 'patient' && entries[1].speaker === 'dr_sterling') {
            console.log('  ✓ CRDT entries ordered correctly');
            passed++;
        } else {
            console.log('  ✗ CRDT entries not ordered correctly');
            failed++;
        }
    } catch (error) {
        console.log('  ✗ Error:', error);
        failed++;
    }

    // Test 8: CRDT Merge
    console.log('\nTest 8: CRDT Merge');
    try {
        const crdt1 = new TranscriptCRDT('node1');
        const crdt2 = new TranscriptCRDT('node2');

        crdt1.add('patient', 'Message from node 1');
        crdt2.add('dr_sterling', 'Message from node 2');

        crdt1.merge(crdt2);

        if (crdt1.size() === 2) {
            console.log('  ✓ CRDT merge combines entries correctly');
            passed++;
        } else {
            console.log('  ✗ CRDT merge failed, size:', crdt1.size());
            failed++;
        }
    } catch (error) {
        console.log('  ✗ Error:', error);
        failed++;
    }

    // Test 9: Watchdog Timers
    console.log('\nTest 9: Watchdog Timers');
    try {
        const wd = new Watchdog();
        let timeoutCalled = false;

        wd.start('CRISIS_DETECTION', 'test-1', () => {
            timeoutCalled = true;
        });

        // Check if watchdog is active
        if (wd.isActive('CRISIS_DETECTION', 'test-1')) {
            console.log('  ✓ Watchdog correctly reports active status');
            passed++;
        } else {
            console.log('  ✗ Watchdog should be active');
            failed++;
        }

        // Stop watchdog
        const elapsed = wd.stop('CRISIS_DETECTION', 'test-1');
        if (elapsed !== null && elapsed < 100) {
            console.log('  ✓ Watchdog stop returns elapsed time');
            passed++;
        } else {
            console.log('  ✗ Watchdog stop should return elapsed time');
            failed++;
        }

        wd.stopAll();
    } catch (error) {
        console.log('  ✗ Error:', error);
        failed++;
    }

    // Test 10: Watchdog Promise Wrapper
    console.log('\nTest 10: Watchdog Promise Wrapper');
    try {
        const wd = new Watchdog();

        // This should complete before timeout
        const result = await wd.wrapWithTimeout(
            'CONTEXT_FETCH',
            'test-wrap',
            new Promise<string>(resolve => setTimeout(() => resolve('success'), 100))
        );

        if (result === 'success') {
            console.log('  ✓ Watchdog wrapWithTimeout resolves correctly');
            passed++;
        } else {
            console.log('  ✗ Unexpected result:', result);
            failed++;
        }
    } catch (error) {
        console.log('  ✗ Error:', error);
        failed++;
    }

    // Test 11: State Timeout Constants
    console.log('\nTest 11: State Timeout Constants');
    try {
        if (STATE_TIMEOUTS.PROCESSING_STT === 5000 &&
            STATE_TIMEOUTS.PROCESSING_LLM === 30000 &&
            STATE_TIMEOUTS.LOADING === 30000) {
            console.log('  ✓ State timeout constants correct');
            passed++;
        } else {
            console.log('  ✗ State timeout constants incorrect');
            failed++;
        }
    } catch (error) {
        console.log('  ✗ Error:', error);
        failed++;
    }

    // Test 12: Session Timer Config
    console.log('\nTest 12: Session Timer Config');
    try {
        if (SESSION_TIMER_CONFIG.MAX_DURATION_MS === 25 * 60 * 1000 &&
            SESSION_TIMER_CONFIG.WARNING_AT_MS === 20 * 60 * 1000 &&
            SESSION_TIMER_CONFIG.AUTO_SAVE_INTERVAL_MS === 30 * 1000) {
            console.log('  ✓ Session timer config correct (25 min max, 5 min warning, 30s save)');
            passed++;
        } else {
            console.log('  ✗ Session timer config incorrect');
            failed++;
        }
    } catch (error) {
        console.log('  ✗ Error:', error);
        failed++;
    }

    // Test 13: Crisis Detection State Check
    console.log('\nTest 13: Crisis Detection State Check');
    try {
        const sm = new SessionStateMachine();
        sm.trigger('load_application');
        sm.trigger('config_loaded');
        sm.updateContext({ patientId: 'test-patient' });
        sm.trigger('patient_overview_loaded');
        sm.updateContext({ sessionId: 'test-session' });
        sm.trigger('session_started');

        if (sm.shouldRunCrisisDetection()) {
            console.log('  ✓ Crisis detection enabled in ACTIVE_LISTENING');
            passed++;
        } else {
            console.log('  ✗ Crisis detection should be enabled');
            failed++;
        }

        if (sm.isInActiveSession()) {
            console.log('  ✓ isInActiveSession() returns true');
            passed++;
        } else {
            console.log('  ✗ Should be in active session');
            failed++;
        }
    } catch (error) {
        console.log('  ✗ Error:', error);
        failed++;
    }

    // Summary
    console.log('\n============================================');
    console.log('  VERIFICATION RESULTS');
    console.log('============================================');
    console.log(`  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Total:  ${passed + failed}`);
    console.log('============================================\n');

    if (failed === 0) {
        console.log('✅ Task 4 VERIFICATION PASSED');
    } else {
        console.log('❌ Task 4 VERIFICATION FAILED');
        process.exit(1);
    }
}

runVerification().catch(error => {
    console.error('Verification failed with error:', error);
    process.exit(1);
});
