// src/agents/agent-coordinator.ts
// Agent Coordinator - Orchestrates multi-agent interactions
// Reference: system_architecture.md Section 4 (AI Agent Layer)

import { EventEmitter } from 'events';
import { BaseAgent, MockAgent } from './base-agent.js';
import { DrSterlingAgent, createDrSterlingAgent } from './dr-sterling.js';
import { crisisDetector, CrisisDetector } from './crisis-detector.js';
import {
    AgentId,
    AgentRequest,
    AgentResponse,
    CrisisDetectionResult,
    ContextRetrievalResult,
    DEFAULT_AGENT_CONFIGS
} from './types.js';
import { logger, logAuditEvent } from '../utils/logger.js';
import { watchdog } from '../session/watchdog.js';

/**
 * Agent coordinator events
 */
export interface AgentCoordinatorEvents {
    'agent:response': AgentResponse;
    'agent:error': { agentId: AgentId; error: Error };
    'crisis:detected': CrisisDetectionResult;
    'context:retrieved': ContextRetrievalResult;
}

/**
 * Agent Coordinator
 * Manages all AI agents and coordinates their interactions
 */
export class AgentCoordinator extends EventEmitter {
    private agents: Map<AgentId, BaseAgent> = new Map();
    private crisisDetector: CrisisDetector;
    private initialized: boolean = false;
    private useMockAgents: boolean = false;

    constructor(useMockAgents: boolean = false) {
        super();
        this.crisisDetector = crisisDetector;
        this.useMockAgents = useMockAgents;
    }

    /**
     * Initialize all agents
     */
    public async initialize(): Promise<void> {
        logger.info('Initializing agent coordinator', { useMockAgents: this.useMockAgents });

        // Initialize Dr. Sterling
        const drSterling = this.useMockAgents
            ? new MockAgent('dr_sterling', DEFAULT_AGENT_CONFIGS.dr_sterling)
            : createDrSterlingAgent();
        await drSterling.initialize();
        this.agents.set('dr_sterling', drSterling);

        // Initialize other agents as mocks for now
        // TODO: Implement real context_fetcher, deep_researcher, analyst_ai
        for (const agentId of ['context_fetcher', 'deep_researcher', 'analyst_ai'] as AgentId[]) {
            const agent = new MockAgent(agentId, DEFAULT_AGENT_CONFIGS[agentId]);
            await agent.initialize();
            this.agents.set(agentId, agent);
        }

        this.initialized = true;
        logger.info('Agent coordinator initialized', {
            agentCount: this.agents.size
        });
    }

    /**
     * Process patient input through the agent pipeline
     * This is the main entry point for generating AI responses
     */
    public async processPatientInput(
        patientId: string,
        sessionId: string,
        input: string,
        context?: AgentRequest['context']
    ): Promise<{
        response: AgentResponse;
        crisisDetection: CrisisDetectionResult;
    }> {
        const startTime = Date.now();

        // Step 1: Crisis detection (ALWAYS runs first, in parallel)
        const crisisDetection = this.crisisDetector.analyze(input);

        if (crisisDetection.detected) {
            this.emit('crisis:detected', crisisDetection);
            logAuditEvent('crisis_detection', patientId, sessionId,
                `tier_${crisisDetection.tier}`, { indicators: crisisDetection.indicators });
        }

        // Step 2: Context retrieval (in parallel with LLM if Tier < 3)
        let enrichedContext = context || {};

        if (crisisDetection.tier !== 3) {
            try {
                const contextAgent = this.agents.get('context_fetcher');
                if (contextAgent) {
                    const contextRequest: AgentRequest = {
                        agentId: 'context_fetcher',
                        patientId,
                        sessionId,
                        input,
                        context
                    };

                    const contextResponse = await watchdog.wrapWithTimeout(
                        'CONTEXT_FETCH',
                        sessionId,
                        contextAgent.process(contextRequest)
                    );

                    if (!contextResponse.error) {
                        try {
                            const parsed = JSON.parse(contextResponse.content);
                            enrichedContext = {
                                ...enrichedContext,
                                retrievedMemories: parsed.relevantMemories?.map((m: { content: string }) => m.content) || [],
                                emotionalState: parsed.emotionalContext
                            };
                        } catch {
                            // Failed to parse context response
                        }
                    }
                }
            } catch (error) {
                logger.warn('Context retrieval failed, proceeding without', { error });
            }
        }

        // Step 3: Generate response with Dr. Sterling
        const drSterling = this.agents.get('dr_sterling');
        if (!drSterling) {
            throw new Error('Dr. Sterling agent not initialized');
        }

        const request: AgentRequest = {
            agentId: 'dr_sterling',
            patientId,
            sessionId,
            input,
            context: enrichedContext
        };

        // Use LLM watchdog for timeout
        const response = await watchdog.wrapWithTimeout(
            'LLM_RESPONSE',
            sessionId,
            drSterling.process(request)
        );

        const totalLatency = Date.now() - startTime;
        logger.info('Agent pipeline complete', {
            patientId,
            sessionId,
            totalLatencyMs: totalLatency,
            crisisDetected: crisisDetection.detected
        });

        this.emit('agent:response', response);

        return {
            response,
            crisisDetection
        };
    }

    /**
     * Generate session summary using Analyst AI
     */
    public async generateSessionSummary(
        patientId: string,
        sessionId: string,
        transcript: Array<{ speaker: string; content: string }>
    ): Promise<AgentResponse> {
        const analyst = this.agents.get('analyst_ai');
        if (!analyst) {
            throw new Error('Analyst AI agent not initialized');
        }

        const request: AgentRequest = {
            agentId: 'analyst_ai',
            patientId,
            sessionId,
            input: 'Generate a comprehensive session summary',
            context: {
                recentTranscript: transcript
            }
        };

        return analyst.process(request);
    }

    /**
     * Request deep research on a topic
     */
    public async requestDeepResearch(
        patientId: string,
        sessionId: string,
        topic: string
    ): Promise<AgentResponse> {
        const researcher = this.agents.get('deep_researcher');
        if (!researcher) {
            throw new Error('Deep Researcher agent not initialized');
        }

        const request: AgentRequest = {
            agentId: 'deep_researcher',
            patientId,
            sessionId,
            input: topic
        };

        return researcher.process(request);
    }

    /**
     * Get crisis detection result for text
     */
    public checkForCrisis(text: string): CrisisDetectionResult {
        return this.crisisDetector.analyze(text);
    }

    /**
     * Get agent by ID
     */
    public getAgent(agentId: AgentId): BaseAgent | undefined {
        return this.agents.get(agentId);
    }

    /**
     * Check if all agents are initialized
     */
    public isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Get agent availability status
     */
    public async getAgentStatus(): Promise<Record<AgentId, { available: boolean; model: string }>> {
        const status: Record<string, { available: boolean; model: string }> = {};

        for (const [id, agent] of this.agents) {
            status[id] = {
                available: await agent.isAvailable(),
                model: agent.getConfig().model
            };
        }

        return status as Record<AgentId, { available: boolean; model: string }>;
    }

    /**
     * Destroy all agents
     */
    public destroy(): void {
        for (const agent of this.agents.values()) {
            agent.destroy();
        }
        this.agents.clear();
        this.initialized = false;
        this.removeAllListeners();
    }
}

// Singleton instance
let instance: AgentCoordinator | null = null;

export function getAgentCoordinator(useMockAgents: boolean = false): AgentCoordinator {
    if (!instance) {
        instance = new AgentCoordinator(useMockAgents);
    }
    return instance;
}

export function resetAgentCoordinator(): void {
    if (instance) {
        instance.destroy();
        instance = null;
    }
}
