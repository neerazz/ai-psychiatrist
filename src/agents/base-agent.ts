// src/agents/base-agent.ts
// Base agent interface and abstract class
// Reference: AGENTS.md Article VI (Determinism - clear agent contracts)

import { EventEmitter } from 'events';
import { AgentId, AgentModelConfig, AgentRequest, AgentResponse } from './types.js';
import { logger } from '../utils/logger.js';
import { watchdog, WatchdogComponent } from '../session/watchdog.js';

/**
 * Base Agent abstract class
 * All AI agents extend this class for consistent interface
 */
export abstract class BaseAgent extends EventEmitter {
    protected agentId: AgentId;
    protected config: AgentModelConfig;
    protected initialized: boolean = false;

    constructor(agentId: AgentId, config: AgentModelConfig) {
        super();
        this.agentId = agentId;
        this.config = config;
    }

    /**
     * Initialize the agent (load models, connect to APIs, etc.)
     */
    public abstract initialize(): Promise<void>;

    /**
     * Process a request and generate a response
     */
    public abstract process(request: AgentRequest): Promise<AgentResponse>;

    /**
     * Check if agent is available (API key exists, model accessible)
     */
    public abstract isAvailable(): Promise<boolean>;

    /**
     * Get agent ID
     */
    public getAgentId(): AgentId {
        return this.agentId;
    }

    /**
     * Get agent configuration
     */
    public getConfig(): AgentModelConfig {
        return { ...this.config };
    }

    /**
     * Check if initialized
     */
    public isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Update configuration
     */
    public updateConfig(updates: Partial<AgentModelConfig>): void {
        this.config = { ...this.config, ...updates };
        logger.info('Agent config updated', { agentId: this.agentId, updates });
    }

    /**
     * Process with timeout using watchdog
     */
    protected async processWithTimeout(
        request: AgentRequest,
        watchdogComponent: WatchdogComponent
    ): Promise<AgentResponse> {
        const startTime = Date.now();
        const operationId = `${request.sessionId}-${Date.now()}`;

        try {
            return await watchdog.wrapWithTimeout(
                watchdogComponent,
                operationId,
                this.process(request)
            );
        } catch (error) {
            const latencyMs = Date.now() - startTime;

            if ((error as Error).message?.includes('Watchdog timeout')) {
                logger.warn('Agent timeout', {
                    agentId: this.agentId,
                    operationId,
                    latencyMs
                });

                return {
                    agentId: this.agentId,
                    content: '',
                    metadata: {
                        model: this.config.model,
                        latencyMs
                    },
                    error: {
                        code: 'TIMEOUT',
                        message: `Agent ${this.agentId} timed out after ${latencyMs}ms`,
                        recoverable: true
                    }
                };
            }

            throw error;
        }
    }

    /**
     * Create a base response object
     */
    protected createResponse(
        content: string,
        latencyMs: number,
        tokenCount?: number,
        thinking?: string
    ): AgentResponse {
        return {
            agentId: this.agentId,
            content,
            metadata: {
                model: this.config.model,
                latencyMs,
                tokenCount,
                thinking
            }
        };
    }

    /**
     * Create an error response
     */
    protected createErrorResponse(
        code: string,
        message: string,
        latencyMs: number,
        recoverable: boolean = true
    ): AgentResponse {
        return {
            agentId: this.agentId,
            content: '',
            metadata: {
                model: this.config.model,
                latencyMs
            },
            error: {
                code,
                message,
                recoverable
            }
        };
    }

    /**
     * Destroy agent resources
     */
    public destroy(): void {
        this.removeAllListeners();
        this.initialized = false;
        logger.info('Agent destroyed', { agentId: this.agentId });
    }
}

/**
 * Mock agent for testing or offline mode
 */
export class MockAgent extends BaseAgent {
    private mockResponses: Map<string, string> = new Map();

    constructor(agentId: AgentId, config: AgentModelConfig) {
        super(agentId, config);
    }

    public async initialize(): Promise<void> {
        this.initialized = true;
        logger.info('Mock agent initialized', { agentId: this.agentId });
    }

    public async process(request: AgentRequest): Promise<AgentResponse> {
        const startTime = Date.now();

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

        const latencyMs = Date.now() - startTime;

        // Check for mock response
        const mockKey = `${request.agentId}:${request.input.slice(0, 50)}`;
        const mockContent = this.mockResponses.get(mockKey);

        if (mockContent) {
            return this.createResponse(mockContent, latencyMs);
        }

        // Generate default mock response
        const defaultResponse = this.generateDefaultResponse(request);
        return this.createResponse(defaultResponse, latencyMs);
    }

    public async isAvailable(): Promise<boolean> {
        return true; // Mock is always available
    }

    /**
     * Set mock response for testing
     */
    public setMockResponse(inputPrefix: string, response: string): void {
        this.mockResponses.set(`${this.agentId}:${inputPrefix}`, response);
    }

    private generateDefaultResponse(request: AgentRequest): string {
        switch (this.agentId) {
            case 'dr_sterling':
                return `I hear what you're saying about "${request.input.slice(0, 50)}...". Can you tell me more about how that makes you feel?`;

            case 'context_fetcher':
                return JSON.stringify({
                    relevantMemories: [],
                    suggestedTopics: ['emotions', 'coping'],
                    emotionalContext: 'neutral'
                });

            case 'crisis_detector':
                return JSON.stringify({
                    detected: false,
                    tier: null,
                    indicators: [],
                    confidence: 0.95
                });

            case 'analyst_ai':
                return JSON.stringify({
                    mainTopics: ['general discussion'],
                    emotionalJourney: 'stable',
                    keyInsights: []
                });

            default:
                return `[Mock response from ${this.agentId}]`;
        }
    }
}
