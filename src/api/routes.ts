// src/api/routes.ts
// API Routes for AI Psychiatrist
// Reference: Requirements R1 (Session Management), R37 (Security)

import express, { Request, Response, Router, NextFunction } from 'express';
import fs from 'fs/promises';
import { logger, logAuditEvent } from '../utils/logger.js';
import { getSessionManager } from '../session/session-manager.js';
import { getAgentCoordinator } from '../agents/agent-coordinator.js';
import { patientRepository } from '../database/repositories/patient.repository.js';
import { sessionRepository } from '../database/repositories/session.repository.js';
import { checkDatabaseHealth } from '../database/index.js';

/**
 * Create all API routes
 */
export function createApiRouter(): Router {
    const router = Router();

    // Health check endpoint
    router.get('/health', async (_req: Request, res: Response) => {
        try {
            const dbHealth = await checkDatabaseHealth();
            const agentCoordinator = getAgentCoordinator(true);

            const status = {
                status: dbHealth.overall ? 'healthy' : 'degraded',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database: {
                    sqlite: dbHealth.sqlite,
                    qdrant: dbHealth.qdrant
                },
                agents: agentCoordinator.isInitialized() ? 'ready' : 'not_initialized'
            };

            res.json(status);
        } catch (error) {
            res.status(500).json({
                status: 'error',
                error: (error as Error).message
            });
        }
    });

    // Patient routes
    router.get('/patients', (_req: Request, res: Response) => {
        try {
            const patients = patientRepository.getAllActive();
            res.json({ patients, count: patients.length });
        } catch (error) {
            logger.error('Failed to get patients', { error });
            res.status(500).json({ error: 'Failed to retrieve patients' });
        }
    });

    router.get('/patients/:patientId', (req: Request, res: Response) => {
        try {
            const patientId = req.params.patientId as string;
            const patient = patientRepository.getById(patientId);
            if (!patient) {
                return res.status(404).json({ error: 'Patient not found' });
            }

            // Parse JSON fields for frontend
            const parsedPatient = {
                ...patient,
                focus_areas: patient.focus_areas ? JSON.parse(patient.focus_areas) : [],
                todos: patient.todos ? JSON.parse(patient.todos) : []
            };

            logAuditEvent('data_access', patientId, null, 'patient_viewed');
            res.json({ patient: parsedPatient });
        } catch (error) {
            const patientId = req.params.patientId as string;
            logger.error('Failed to get patient', { error, patientId });
            res.status(500).json({ error: 'Failed to retrieve patient' });
        }
    });

    router.post('/patients', (req: Request, res: Response) => {
        try {
            const { encryption_key_id, focus_areas, todos } = req.body;
            if (!encryption_key_id) {
                return res.status(400).json({ error: 'encryption_key_id is required' });
            }

            const patientId = patientRepository.create({
                encryption_key_id,
                current_risk_level: 'low',
                focus_areas,
                todos
            });

            logAuditEvent('data_modify', patientId, null, 'patient_created');
            res.status(201).json({ patientId, message: 'Patient created successfully' });
        } catch (error) {
            logger.error('Failed to create patient', { error });
            res.status(500).json({ error: 'Failed to create patient' });
        }
    });

    // Session routes
    router.get('/patients/:patientId/sessions', (req: Request, res: Response) => {
        try {
            const patientId = req.params.patientId as string;
            const sessions = sessionRepository.getRecentForPatient(patientId);
            res.json({ sessions, count: sessions.length });
        } catch (error) {
            const patientId = req.params.patientId as string;
            logger.error('Failed to get sessions', { error, patientId });
            res.status(500).json({ error: 'Failed to retrieve sessions' });
        }
    });

    router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
        try {
            const sessionId = req.params.sessionId as string;
            const session = sessionRepository.getById(sessionId);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            let transcript = null;
            let summary = null;

            if (session.transcript_path) {
                try {
                    transcript = await fs.readFile(session.transcript_path, 'utf-8');
                } catch (e) {
                    logger.warn('Failed to read transcript', { path: session.transcript_path, error: e });
                }
            }

            if (session.summary_path) {
                try {
                    summary = await fs.readFile(session.summary_path, 'utf-8');
                } catch (e) {
                    logger.warn('Failed to read summary', { path: session.summary_path, error: e });
                }
            }

            logAuditEvent('data_access', session.patient_id ?? 'unknown', sessionId, 'session_viewed');
            res.json({ session: { ...session, transcript_content: transcript, summary_content: summary } });
        } catch (error) {
            const sessionId = req.params.sessionId as string;
            logger.error('Failed to get session', { error, sessionId });
            res.status(500).json({ error: 'Failed to retrieve session' });
        }
    });

    // Session manager routes
    router.get('/session/status', (_req: Request, res: Response) => {
        try {
            const sessionManager = getSessionManager();
            const state = sessionManager.getState();
            const context = sessionManager.getContext();
            const timer = sessionManager.getTimerStatus();

            res.json({
                state,
                context: {
                    sessionId: context.sessionId,
                    patientId: context.patientId,
                    turnNumber: context.turnNumber,
                    elapsedSeconds: context.elapsedSeconds
                },
                timer,
                isInSession: sessionManager.isInSession()
            });
        } catch (error) {
            logger.error('Failed to get session status', { error });
            res.status(500).json({ error: 'Failed to get session status' });
        }
    });

    router.post('/session/start', async (req: Request, res: Response) => {
        try {
            const { patientId } = req.body;
            if (!patientId) {
                return res.status(400).json({ error: 'patientId is required' });
            }

            const sessionManager = getSessionManager();

            // Initialize if needed
            if (sessionManager.getState() === 'INIT') {
                await sessionManager.initialize();
            }

            // Load patient
            const loaded = await sessionManager.loadPatient(patientId);
            if (!loaded) {
                return res.status(404).json({ error: 'Patient not found or validation failed' });
            }

            // Start session
            const sessionId = await sessionManager.startSession();
            if (!sessionId) {
                return res.status(500).json({ error: 'Failed to start session' });
            }

            res.status(201).json({
                sessionId,
                message: 'Session started successfully',
                state: sessionManager.getState()
            });
        } catch (error) {
            logger.error('Failed to start session', { error });
            res.status(500).json({ error: 'Failed to start session' });
        }
    });

    router.post('/session/end', async (_req: Request, res: Response) => {
        try {
            const sessionManager = getSessionManager();

            if (!sessionManager.isInSession()) {
                return res.status(400).json({ error: 'No active session' });
            }

            const result = await sessionManager.endSession();
            res.json({
                message: 'Session ended successfully',
                summary: result.summary,
                duration: result.duration
            });
        } catch (error) {
            logger.error('Failed to end session', { error });
            res.status(500).json({ error: 'Failed to end session' });
        }
    });

    // Reset session (force reset state machine)
    router.post('/session/reset', (_req: Request, res: Response) => {
        try {
            const sessionManager = getSessionManager();
            sessionManager.reset();
            res.json({ message: 'Session reset successfully', state: sessionManager.getState() });
        } catch (error) {
            logger.error('Failed to reset session', { error });
            res.status(500).json({ error: 'Failed to reset session' });
        }
    });

    router.get('/session/transcript', (_req: Request, res: Response) => {
        try {
            const sessionManager = getSessionManager();
            const transcript = sessionManager.getTranscript();
            res.json({ transcript });
        } catch (error) {
            logger.error('Failed to get transcript', { error });
            res.status(500).json({ error: 'Failed to get transcript' });
        }
    });

    // Agent routes
    router.get('/agents/status', async (_req: Request, res: Response) => {
        try {
            const coordinator = getAgentCoordinator(true);
            if (!coordinator.isInitialized()) {
                await coordinator.initialize();
            }

            const status = await coordinator.getAgentStatus();
            res.json({ initialized: true, agents: status });
        } catch (error) {
            logger.error('Failed to get agent status', { error });
            res.status(500).json({ error: 'Failed to get agent status' });
        }
    });

    router.post('/agents/crisis-check', (req: Request, res: Response) => {
        try {
            const { text } = req.body;
            if (!text) {
                return res.status(400).json({ error: 'text is required' });
            }

            const coordinator = getAgentCoordinator(true);
            const result = coordinator.checkForCrisis(text);
            res.json(result);
        } catch (error) {
            logger.error('Failed to check for crisis', { error });
            res.status(500).json({ error: 'Failed to check for crisis' });
        }
    });

    // Data compliance routes (GDPR/CCPA)
    router.post('/patients/:patientId/export', async (req: Request, res: Response) => {
        try {
            const patientId = req.params.patientId as string;
            const options = req.body || {};

            // Dynamic import to avoid circular dependencies
            const { exportPatientData } = await import('../utils/data-export.js');
            const result = await exportPatientData(patientId, options);

            res.json(result);
        } catch (error) {
            logger.error('Failed to export patient data', { error });
            res.status(500).json({ error: 'Failed to export data' });
        }
    });

    router.delete('/patients/:patientId', async (req: Request, res: Response) => {
        try {
            const patientId = req.params.patientId as string;
            const options = req.body || {};

            // Dynamic import to avoid circular dependencies
            const { deletePatientData } = await import('../utils/data-deletion.js');
            const result = await deletePatientData(patientId, options);

            res.json(result);
        } catch (error) {
            logger.error('Failed to delete patient data', { error });
            res.status(500).json({ error: 'Failed to delete data' });
        }
    });

    // Audio/TTS status
    router.get('/audio/status', async (_req: Request, res: Response) => {
        try {
            const { getTTSManager } = await import('../audio/tts.js');
            const { getSTTManager } = await import('../audio/stt.js');

            const tts = getTTSManager();
            const stt = getSTTManager();

            res.json({
                tts: {
                    available: tts.isAvailable(),
                    provider: 'elevenlabs'
                },
                stt: {
                    available: stt.isAvailable(),
                    provider: 'deepgram'
                }
            });
        } catch (error) {
            logger.error('Failed to get audio status', { error });
            res.status(500).json({ error: 'Failed to get audio status' });
        }
    });

    return router;
}

/**
 * Error handling middleware
 */
export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    logger.error('Unhandled API error', { error: err.message, stack: err.stack });
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
}
