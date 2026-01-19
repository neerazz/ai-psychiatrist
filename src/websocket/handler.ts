// src/websocket/handler.ts
// WebSocket handler for real-time session communication
// Reference: Requirements R4 (Real-time bidirectional communication)

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger, logAuditEvent } from '../utils/logger.js';
import { getSessionManager } from '../session/session-manager.js';
import { getAgentCoordinator } from '../agents/agent-coordinator.js';

/**
 * WebSocket events
 */
export interface WebSocketEvents {
    // Client to Server
    'session:join': { sessionId: string };
    'session:leave': { sessionId: string };
    'patient:input': { text: string };
    'speech:start': void;
    'speech:end': { transcript: string };

    // Server to Client
    'session:state': { state: string; context: Record<string, unknown> };
    'session:timer': { elapsedMs: number; remainingMs: number };
    'session:warning': { message: string; remainingMs: number };
    'therapist:response': { text: string; turnNumber: number };
    'therapist:speaking': { text: string };
    'therapist:done': void;
    'crisis:detected': { tier: number; resources: unknown };
    'error': { code: string; message: string };
}

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer: HttpServer): Server {
    const io = new Server(httpServer, {
        cors: {
            origin: '*', // Configure properly for production
            methods: ['GET', 'POST']
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    io.on('connection', (socket: Socket) => {
        logger.info('WebSocket client connected', { socketId: socket.id });

        let currentSessionId: string | null = null;
        const sessionManager = getSessionManager();
        const agentCoordinator = getAgentCoordinator(true);

        // Join session room
        socket.on('session:join', ({ sessionId }) => {
            if (currentSessionId) {
                socket.leave(currentSessionId);
            }
            socket.join(sessionId);
            currentSessionId = sessionId;

            // Send current state
            socket.emit('session:state', {
                state: sessionManager.getState(),
                context: sessionManager.getContext()
            });

            logger.info('Client joined session', { socketId: socket.id, sessionId });
        });

        // Leave session room
        socket.on('session:leave', ({ sessionId }) => {
            socket.leave(sessionId);
            currentSessionId = null;
            logger.info('Client left session', { socketId: socket.id, sessionId });
        });

        // Handle patient input
        socket.on('patient:input', async ({ text }) => {
            try {
                if (!sessionManager.isInSession()) {
                    socket.emit('error', { code: 'NO_SESSION', message: 'No active session' });
                    return;
                }

                const context = sessionManager.getContext();

                // Initialize agent coordinator if needed
                if (!agentCoordinator.isInitialized()) {
                    await agentCoordinator.initialize();
                }

                // Process through agent pipeline
                const result = await agentCoordinator.processPatientInput(
                    context.patientId!,
                    context.sessionId!,
                    text,
                    {
                        recentTranscript: sessionManager.getTranscript()
                    }
                );

                // Check for crisis
                if (result.crisisDetection.detected) {
                    socket.emit('crisis:detected', {
                        tier: result.crisisDetection.tier,
                        resources: result.crisisDetection.recommendedAction
                    });
                }

                // Send response
                if (!result.response.error) {
                    socket.emit('therapist:speaking', {
                        text: result.response.content
                    });

                    // Add to transcript via session manager
                    await sessionManager.processPatientInput(text);

                    socket.emit('therapist:response', {
                        text: result.response.content,
                        turnNumber: context.turnNumber + 1
                    });
                } else {
                    socket.emit('error', result.response.error);
                }
            } catch (error) {
                logger.error('Failed to process patient input', { error });
                socket.emit('error', {
                    code: 'PROCESSING_ERROR',
                    message: 'Failed to process input'
                });
            }
        });

        // Speech recognition events
        socket.on('speech:start', () => {
            logger.debug('Speech started', { socketId: socket.id });
        });

        socket.on('speech:end', async ({ transcript }) => {
            // Forward to patient:input handler
            socket.emit('patient:input', { text: transcript });
        });

        // Forward session manager events
        sessionManager.on('session:timer', (data) => {
            if (currentSessionId) {
                socket.emit('session:timer', data);
            }
        });

        sessionManager.on('session:warning', (data) => {
            if (currentSessionId) {
                socket.emit('session:warning', {
                    message: '5 minutes remaining in session',
                    remainingMs: data.remainingMs
                });
            }
        });

        sessionManager.on('state:changed', (data) => {
            if (currentSessionId) {
                socket.emit('session:state', {
                    state: data.to,
                    context: sessionManager.getContext()
                });
            }
        });

        // Disconnect
        socket.on('disconnect', () => {
            logger.info('WebSocket client disconnected', { socketId: socket.id });
        });

        // Error handling
        socket.on('error', (error) => {
            logger.error('WebSocket error', { socketId: socket.id, error });
        });
    });

    logger.info('WebSocket server initialized');
    return io;
}
