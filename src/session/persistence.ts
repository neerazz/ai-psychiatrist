// src/session/persistence.ts
// Session state persistence system
// Reference: Requirements R1 (30s auto-save), R24 (session state persistence)

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { SessionStateMachine } from './state-machine.js';
import { TranscriptCRDT, CRDTTranscriptEntry } from './crdt.js';
import { logger, logAuditEvent } from '../utils/logger.js';
import { SESSION_TIMER_CONFIG } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Persisted session state structure
 */
export interface PersistedSessionState {
    version: string;
    sessionId: string;
    patientId: string;
    state: string;
    context: Record<string, unknown>;
    transcript: CRDTTranscriptEntry[];
    persistedAt: string;
    checkpointNumber: number;
    elapsedSeconds: number;
    turnCount: number;
    emotionalTrajectory: { state: string; timestamp: string }[];
}

/**
 * Session Persistence Manager
 * Auto-saves session state every 30 seconds per Requirements R1
 */
export class SessionPersistence {
    private stateMachine: SessionStateMachine;
    private transcript: TranscriptCRDT;
    private intervalHandle: NodeJS.Timeout | null = null;
    private checkpointNumber = 0;
    private emotionalTrajectory: { state: string; timestamp: string }[] = [];
    private basePath: string;

    constructor(stateMachine: SessionStateMachine, basePath?: string) {
        this.stateMachine = stateMachine;
        this.transcript = new TranscriptCRDT();
        this.basePath = basePath || path.join(__dirname, '../../memory_directory/patients');
    }

    /**
     * Start auto-persistence (every 30 seconds)
     */
    public startAutoPersist(): void {
        if (this.intervalHandle) return;

        this.intervalHandle = setInterval(async () => {
            try {
                await this.persist();
            } catch (error) {
                logger.error('Auto-persist failed', { error });
            }
        }, SESSION_TIMER_CONFIG.AUTO_SAVE_INTERVAL_MS);

        logger.info('Session auto-persistence started', {
            intervalMs: SESSION_TIMER_CONFIG.AUTO_SAVE_INTERVAL_MS
        });
    }

    /**
     * Stop auto-persistence
     */
    public stopAutoPersist(): void {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
            logger.info('Session auto-persistence stopped');
        }
    }

    /**
     * Add a transcript entry
     */
    public addTranscriptEntry(
        speaker: 'patient' | 'dr_sterling' | 'system',
        content: string
    ): string {
        const id = this.transcript.add(speaker, content, 'local');
        logger.debug('Transcript entry added', { speaker, length: content.length });
        return id;
    }

    /**
     * Get transcript entries for display
     */
    public getTranscriptEntries(): Array<{ speaker: string; content: string; timestamp: string }> {
        return this.transcript.toDisplayArray();
    }

    /**
     * Record emotional state change
     */
    public recordEmotionalState(state: string): void {
        this.emotionalTrajectory.push({
            state,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get session directory path
     */
    private getSessionDir(patientId: string, sessionId: string): string {
        return path.join(this.basePath, patientId, 'sessions', sessionId);
    }

    /**
     * Persist current session state
     * @returns Path to the state file, or null if no active session
     */
    public async persist(): Promise<string | null> {
        const context = this.stateMachine.getContext();
        if (!context.sessionId || !context.patientId) {
            return null;
        }

        this.checkpointNumber++;

        const state: PersistedSessionState = {
            version: '1.0.0',
            sessionId: context.sessionId,
            patientId: context.patientId,
            state: this.stateMachine.getState(),
            context: JSON.parse(JSON.stringify(context)) as Record<string, unknown>,
            transcript: this.transcript.toArray(),
            persistedAt: new Date().toISOString(),
            checkpointNumber: this.checkpointNumber,
            elapsedSeconds: context.elapsedSeconds,
            turnCount: context.turnNumber,
            emotionalTrajectory: this.emotionalTrajectory
        };

        const sessionDir = this.getSessionDir(context.patientId, context.sessionId);
        await fs.mkdir(sessionDir, { recursive: true });

        // Save state.json (current state - always overwritten)
        const statePath = path.join(sessionDir, 'state.json');
        await fs.writeFile(statePath, JSON.stringify(state, null, 2));

        // Save checkpoint (backup - numbered for recovery)
        const checkpointPath = path.join(
            sessionDir,
            `checkpoint_${this.checkpointNumber.toString().padStart(4, '0')}.json`
        );
        await fs.writeFile(checkpointPath, JSON.stringify(state, null, 2));

        logger.debug('Session state persisted', {
            sessionId: context.sessionId,
            checkpoint: this.checkpointNumber,
            transcriptSize: this.transcript.size()
        });

        logAuditEvent('session_event', context.patientId, context.sessionId,
            `checkpoint_${this.checkpointNumber}`);

        return statePath;
    }

    /**
     * Load persisted session state
     */
    public async loadPersistedState(
        patientId: string,
        sessionId: string
    ): Promise<PersistedSessionState | null> {
        const statePath = path.join(
            this.getSessionDir(patientId, sessionId),
            'state.json'
        );

        try {
            const content = await fs.readFile(statePath, 'utf-8');
            return JSON.parse(content) as PersistedSessionState;
        } catch {
            return null;
        }
    }

    /**
     * Load the latest checkpoint for a session
     */
    public async loadLatestCheckpoint(
        patientId: string,
        sessionId: string
    ): Promise<PersistedSessionState | null> {
        const sessionDir = this.getSessionDir(patientId, sessionId);

        try {
            const files = await fs.readdir(sessionDir);
            const checkpoints = files
                .filter(f => f.startsWith('checkpoint_') && f.endsWith('.json'))
                .sort()
                .reverse();

            if (checkpoints.length === 0) {
                return null;
            }

            const latestPath = path.join(sessionDir, checkpoints[0]);
            const content = await fs.readFile(latestPath, 'utf-8');
            return JSON.parse(content) as PersistedSessionState;
        } catch {
            return null;
        }
    }

    /**
     * Restore session from persisted state
     */
    public restoreFromState(persistedState: PersistedSessionState): void {
        // Restore transcript
        this.transcript = TranscriptCRDT.fromArray(persistedState.transcript);

        // Restore checkpoint number
        this.checkpointNumber = persistedState.checkpointNumber;

        // Restore emotional trajectory
        this.emotionalTrajectory = persistedState.emotionalTrajectory || [];

        // Update state machine context
        this.stateMachine.updateContext({
            sessionId: persistedState.sessionId,
            patientId: persistedState.patientId,
            turnNumber: persistedState.turnCount,
            elapsedSeconds: persistedState.elapsedSeconds
        });

        logger.info('Session restored from persisted state', {
            sessionId: persistedState.sessionId,
            checkpoint: persistedState.checkpointNumber,
            transcriptSize: this.transcript.size()
        });
    }

    /**
     * Get transcript CRDT for direct access
     */
    public getTranscript(): TranscriptCRDT {
        return this.transcript;
    }

    /**
     * Merge with another transcript (for cloud sync)
     */
    public mergeTranscript(other: TranscriptCRDT): void {
        this.transcript.merge(other);
        logger.debug('Transcript merged', { newSize: this.transcript.size() });
    }

    /**
     * Reset persistence state for new session
     */
    public reset(): void {
        this.checkpointNumber = 0;
        this.transcript = new TranscriptCRDT();
        this.emotionalTrajectory = [];
        logger.debug('Persistence state reset');
    }

    /**
     * Get current checkpoint number
     */
    public getCheckpointNumber(): number {
        return this.checkpointNumber;
    }

    /**
     * Calculate data integrity (percentage of data preserved)
     */
    public getDataIntegrity(): number {
        return this.transcript.getIntegrity();
    }

    /**
     * Cleanup - stop auto-persist and clear state
     */
    public destroy(): void {
        this.stopAutoPersist();
        this.reset();
    }
}
