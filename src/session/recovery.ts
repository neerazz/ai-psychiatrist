// src/session/recovery.ts
// Session crash recovery
// Reference: Requirements R24 (preserve 95% of data on crash)

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PersistedSessionState, SessionPersistence } from './persistence.js';
import { SessionStateMachine } from './state-machine.js';
import { logger, logAuditEvent } from '../utils/logger.js';
import { sessionRepository } from '../database/repositories/session.repository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Result of a session recovery attempt
 */
export interface RecoveryResult {
    success: boolean;
    sessionId: string;
    recoveredTurns: number;
    dataIntegrity: number;  // Percentage of data recovered (target: 95%)
    resumeState: string;
    error?: string;
}

/**
 * Find the most recent session for a patient that was interrupted
 */
export async function findRecoverableSession(
    patientId: string,
    basePath?: string
): Promise<{ sessionId: string; state: PersistedSessionState } | null> {
    const patientsDir = basePath || path.join(__dirname, '../../memory_directory/patients');
    const sessionsDir = path.join(patientsDir, patientId, 'sessions');

    try {
        const sessionDirs = await fs.readdir(sessionsDir);

        // Sort by modification time (most recent first)
        const sessionStats = await Promise.all(
            sessionDirs.map(async (sessionId) => {
                const statePath = path.join(sessionsDir, sessionId, 'state.json');
                try {
                    const stat = await fs.stat(statePath);
                    return { sessionId, mtime: stat.mtime.getTime() };
                } catch {
                    return { sessionId, mtime: 0 };
                }
            })
        );

        const sortedSessions = sessionStats
            .filter(s => s.mtime > 0)
            .sort((a, b) => b.mtime - a.mtime);

        for (const { sessionId } of sortedSessions) {
            const statePath = path.join(sessionsDir, sessionId, 'state.json');

            try {
                const content = await fs.readFile(statePath, 'utf-8');
                const state = JSON.parse(content) as PersistedSessionState;

                // Check if session was interrupted (not completed)
                const isRecoverable = [
                    'ACTIVE_LISTENING',
                    'PROCESSING_STT',
                    'PROCESSING_LLM',
                    'SPEAKING',
                    'WARNING_5MIN',
                    'CRISIS_PROTOCOL',
                    'ERROR_RECOVERY'
                ].includes(state.state);

                if (isRecoverable) {
                    logger.info('Found recoverable session', {
                        sessionId,
                        state: state.state,
                        checkpoint: state.checkpointNumber
                    });
                    return { sessionId, state };
                }
            } catch {
                // Continue to next session
            }
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Recover a session from persisted state
 */
export async function recoverSession(
    patientId: string,
    sessionId: string,
    stateMachine: SessionStateMachine,
    persistence: SessionPersistence,
    basePath?: string
): Promise<RecoveryResult> {
    logger.info('Attempting session recovery', { patientId, sessionId });
    logAuditEvent('session_event', patientId, sessionId, 'recovery_started');

    const patientsDir = basePath || path.join(__dirname, '../../memory_directory/patients');

    try {
        // 1. Try to load state.json first
        let persistedState = await persistence.loadPersistedState(patientId, sessionId);

        // 2. If state.json fails, try latest checkpoint
        if (!persistedState) {
            persistedState = await persistence.loadLatestCheckpoint(patientId, sessionId);
        }

        if (!persistedState) {
            // 3. Last resort: Try to recover from individual checkpoint files
            const sessionDir = path.join(patientsDir, patientId, 'sessions', sessionId);
            const files = await fs.readdir(sessionDir).catch(() => []);

            const checkpoints = files
                .filter(f => f.startsWith('checkpoint_') && f.endsWith('.json'))
                .sort()
                .reverse();

            for (const checkpoint of checkpoints) {
                try {
                    const content = await fs.readFile(path.join(sessionDir, checkpoint), 'utf-8');
                    persistedState = JSON.parse(content);
                    break;
                } catch {
                    continue;
                }
            }
        }

        if (!persistedState) {
            logger.error('No recoverable state found', { patientId, sessionId });
            logAuditEvent('session_event', patientId, sessionId, 'recovery_failed_no_state');

            return {
                success: false,
                sessionId,
                recoveredTurns: 0,
                dataIntegrity: 0,
                resumeState: 'ERROR',
                error: 'No recoverable state found'
            };
        }

        // 4. Restore state
        persistence.restoreFromState(persistedState);

        // 5. Force state machine to recoverable state
        stateMachine.forceState('ACTIVE_LISTENING', 'Session recovery');

        // 6. Update database record
        try {
            sessionRepository.updateStatus(sessionId, 'active');
        } catch (error) {
            logger.warn('Failed to update session status in database', { error });
        }

        // 7. Calculate data integrity
        const dataIntegrity = persistence.getDataIntegrity();

        logger.info('Session recovered successfully', {
            sessionId,
            recoveredTurns: persistedState.turnCount,
            dataIntegrity,
            checkpoint: persistedState.checkpointNumber
        });

        logAuditEvent('session_event', patientId, sessionId, 'recovery_completed', {
            recoveredTurns: persistedState.turnCount,
            dataIntegrity
        });

        return {
            success: true,
            sessionId,
            recoveredTurns: persistedState.turnCount,
            dataIntegrity,
            resumeState: 'ACTIVE_LISTENING'
        };

    } catch (error) {
        logger.error('Session recovery failed', { patientId, sessionId, error });
        logAuditEvent('session_event', patientId, sessionId, 'recovery_failed', {
            error: String(error)
        });

        return {
            success: false,
            sessionId,
            recoveredTurns: 0,
            dataIntegrity: 0,
            resumeState: 'ERROR',
            error: String(error)
        };
    }
}

/**
 * Mark a crashed session as interrupted in the database
 */
export async function markSessionInterrupted(sessionId: string): Promise<void> {
    try {
        sessionRepository.updateStatus(sessionId, 'interrupted');
        logger.info('Session marked as interrupted', { sessionId });
    } catch (error) {
        logger.error('Failed to mark session as interrupted', { sessionId, error });
    }
}

/**
 * Check if recovery is needed for a patient
 */
export async function needsRecovery(patientId: string): Promise<boolean> {
    const recoverable = await findRecoverableSession(patientId);
    return recoverable !== null;
}

/**
 * Get all sessions that need recovery across all patients
 */
export async function getAllRecoverableSessions(
    basePath?: string
): Promise<Array<{ patientId: string; sessionId: string; state: PersistedSessionState }>> {
    const patientsDir = basePath || path.join(__dirname, '../../memory_directory/patients');
    const recoverableSessions: Array<{ patientId: string; sessionId: string; state: PersistedSessionState }> = [];

    try {
        const patientDirs = await fs.readdir(patientsDir);

        for (const patientId of patientDirs) {
            const recoverable = await findRecoverableSession(patientId, basePath);
            if (recoverable) {
                recoverableSessions.push({
                    patientId,
                    sessionId: recoverable.sessionId,
                    state: recoverable.state
                });
            }
        }
    } catch {
        // Patients directory doesn't exist
    }

    return recoverableSessions;
}

/**
 * Cleanup old checkpoints (keep last N)
 */
export async function cleanupOldCheckpoints(
    patientId: string,
    sessionId: string,
    keepCount: number = 10,
    basePath?: string
): Promise<number> {
    const patientsDir = basePath || path.join(__dirname, '../../memory_directory/patients');
    const sessionDir = path.join(patientsDir, patientId, 'sessions', sessionId);
    let deletedCount = 0;

    try {
        const files = await fs.readdir(sessionDir);
        const checkpoints = files
            .filter(f => f.startsWith('checkpoint_') && f.endsWith('.json'))
            .sort();

        if (checkpoints.length <= keepCount) {
            return 0;
        }

        const toDelete = checkpoints.slice(0, checkpoints.length - keepCount);

        for (const file of toDelete) {
            await fs.unlink(path.join(sessionDir, file));
            deletedCount++;
        }

        logger.debug('Cleaned up old checkpoints', {
            sessionId,
            deleted: deletedCount,
            remaining: keepCount
        });
    } catch (error) {
        logger.warn('Failed to cleanup checkpoints', { sessionId, error });
    }

    return deletedCount;
}
