// src/index.ts
// AI Psychiatrist Application Entry Point
// Reference: AGENTS.md, Requirements R1 (Primary Entry Point)

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import { logger } from './utils/logger.js';
import { getConfig } from './config/environment.js';
import { initializeDatabases, checkDatabaseHealth } from './database/index.js';
import { createApiRouter, errorHandler } from './api/index.js';
import { initializeWebSocket } from './websocket/index.js';
import { getAgentCoordinator } from './agents/index.js';
import { getSessionManager } from './session/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main application startup
 */
async function main(): Promise<void> {
    const config = getConfig();

    logger.info('====================================');
    logger.info('  AI Psychiatrist Starting...');
    logger.info('====================================');
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Model Mode: ${config.modelMode}`);
    logger.info(`Port: ${config.port}`);

    // Initialize databases
    logger.info('Initializing databases...');
    try {
        await initializeDatabases();
        const health = await checkDatabaseHealth();
        logger.info('Database health:', {
            sqlite: health.sqlite.healthy,
            qdrant: health.qdrant.healthy
        });
    } catch (error) {
        logger.error('Database initialization failed', { error });
        process.exit(1);
    }

    // Initialize agent coordinator
    logger.info('Initializing AI agents...');
    try {
        const agentCoordinator = getAgentCoordinator(config.modelMode === 'offline');
        await agentCoordinator.initialize();
        logger.info('AI agents initialized');
    } catch (error) {
        logger.error('Agent initialization failed', { error });
        // Continue - mock mode will be used
    }

    // Create Express app
    const app = express();

    // Security middleware
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
                imgSrc: ["'self'", "data:", "blob:"],
                connectSrc: ["'self'", "ws:", "wss:", "https://cdn.socket.io"]
            }
        }
    }));

    // CORS
    app.use(cors({
        origin: config.nodeEnv === 'development' ? '*' : process.env.ALLOWED_ORIGINS?.split(','),
        credentials: true
    }));

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Static files
    app.use(express.static(path.join(__dirname, '../public')));

    // API routes
    app.use('/api', createApiRouter());

    // Fallback to index.html for SPA routes (Express 5 compatible)
    app.use((_req, res, next) => {
        // Only serve index.html if not an API route and accepts HTML
        if (!_req.path.startsWith('/api')) {
            const indexPath = path.join(__dirname, '../public/index.html');
            res.sendFile(indexPath, (err) => {
                if (err) {
                    next(); // Let error handler deal with it
                }
            });
        } else {
            next();
        }
    });

    // Error handler (must be last)
    app.use(errorHandler);


    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize WebSocket
    initializeWebSocket(httpServer);

    // Start server
    httpServer.listen(config.port, () => {
        logger.info('====================================');
        logger.info(`  Server running on http://localhost:${config.port}`);
        logger.info(`  API: http://localhost:${config.port}/api/health`);
        logger.info('====================================');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
        logger.info(`Received ${signal}, shutting down gracefully...`);

        // Close session manager
        const sessionManager = getSessionManager();
        sessionManager.destroy();

        // Close server
        httpServer.close(() => {
            logger.info('HTTP server closed');
            process.exit(0);
        });

        // Force exit after 10 seconds
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

// Run
main().catch((error) => {
    logger.error('Application failed to start', { error });
    process.exit(1);
});
