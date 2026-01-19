// src/agents/context-fetcher.ts
// Context Fetcher Agent - Retrieves relevant context from patient history
// Reference: AGENTS.md Article VII (Agent Hierarchy)

import { BaseAgent } from './base-agent.js';
import { AgentId, AgentModelConfig, AgentRequest, AgentResponse, ContextRetrievalResult, DEFAULT_AGENT_CONFIGS } from './types.js';
import { qdrantManager } from '../database/qdrant.js';
import { sessionRepository } from '../database/repositories/session.repository.js';
import { patientRepository } from '../database/repositories/patient.repository.js';
import { logger } from '../utils/logger.js';
import { watchdog } from '../session/watchdog.js';

/**
 * Context Fetcher Agent
 * Retrieves patient history, relevant memories from Qdrant
 */
export class ContextFetcherAgent extends BaseAgent {
    constructor() {
        const config = DEFAULT_AGENT_CONFIGS.context_fetcher;
        super('context_fetcher', config);
    }

    public async initialize(): Promise<void> {
        this.initialized = true;
        logger.info('Context fetcher agent initialized');
    }

    public async isAvailable(): Promise<boolean> {
        // Always available - uses local database
        return true;
    }

    /**
     * Process context retrieval request
     */
    public async process(request: AgentRequest): Promise<AgentResponse> {
        const startTime = Date.now();

        // Start watchdog (3s timeout per spec)
        watchdog.start('CONTEXT_FETCH', request.sessionId, () => {
            logger.warn('Context fetch timeout');
        });

        try {
            // Fetch patient info
            const patient = patientRepository.getById(request.patientId);

            // Fetch recent sessions
            const recentSessions = sessionRepository.getRecentForPatient(request.patientId, 5);

            // Fetch relevant memories from Qdrant (if available)
            let relevantMemories: Array<{
                content: string;
                similarity: number;
                sessionId: string;
                timestamp: string;
            }> = [];

            try {
                relevantMemories = await this.fetchRelevantMemories(
                    request.patientId,
                    request.input,
                    5
                );
            } catch (error) {
                logger.warn('Memory retrieval skipped', { error });
            }

            watchdog.stop('CONTEXT_FETCH', request.sessionId);

            // Build result
            const result: ContextRetrievalResult = {
                relevantMemories,
                suggestedTopics: this.extractTopics(request.input),
                emotionalContext: request.context?.emotionalState || 'neutral',
                latencyMs: Date.now() - startTime
            };

            // Add patient overview to result
            const enhancedResult = {
                ...result,
                patientOverview: patient ? {
                    totalSessions: patient.total_sessions,
                    lastSession: patient.last_session_date,
                    riskLevel: patient.current_risk_level
                } : null,
                recentSessions: recentSessions.slice(0, 3).map(s => ({
                    sessionId: s.session_id,
                    date: s.started_at,
                    duration: s.duration_seconds
                }))
            };

            logger.info('Context fetched successfully', {
                patientId: request.patientId,
                memoriesFound: relevantMemories.length,
                latencyMs: result.latencyMs
            });

            return this.createResponse(
                JSON.stringify(enhancedResult),
                Date.now() - startTime
            );

        } catch (error) {
            watchdog.stop('CONTEXT_FETCH', request.sessionId);
            logger.error('Context fetch failed', { error });

            return this.createErrorResponse(
                'CONTEXT_FETCH_FAILED',
                (error as Error).message,
                Date.now() - startTime
            );
        }
    }

    /**
     * Fetch relevant memories from Qdrant
     */
    private async fetchRelevantMemories(
        patientId: string,
        query: string,
        limit: number
    ): Promise<Array<{ content: string; similarity: number; sessionId: string; timestamp: string }>> {
        // Check if Qdrant is available
        const health = await qdrantManager.healthCheck();
        if (!health.healthy) {
            return [];
        }

        try {
            // Simple keyword-based search fallback (embedding service to be added)
            // For now, skip vector search if no embedding service available
            // TODO: Integrate with Ollama embeddings or OpenAI embeddings
            const results = await qdrantManager.getClient().scroll('patient_memories', {
                filter: {
                    must: [
                        { key: 'patient_id', match: { value: patientId } }
                    ]
                },
                limit
            });

            return (results.points || []).map(r => ({
                content: (r.payload?.content as string) || '',
                similarity: 1.0, // No vector similarity without embeddings
                sessionId: (r.payload?.session_id as string) || '',
                timestamp: (r.payload?.timestamp as string) || ''
            }));
        } catch (error) {
            logger.warn('Memory retrieval failed', { error });
            return [];
        }
    }

    /**
     * Extract suggested topics from input
     */
    private extractTopics(input: string): string[] {
        const topicKeywords: Record<string, string[]> = {
            'anxiety': ['anxious', 'worried', 'nervous', 'panic', 'fear'],
            'depression': ['sad', 'hopeless', 'empty', 'tired', 'unmotivated'],
            'stress': ['stressed', 'overwhelmed', 'pressure', 'busy', 'deadline'],
            'relationships': ['family', 'friend', 'partner', 'relationship', 'marriage'],
            'work': ['job', 'work', 'career', 'boss', 'colleague'],
            'sleep': ['sleep', 'insomnia', 'tired', 'nightmares', 'rest']
        };

        const topics: string[] = [];
        const lowerInput = input.toLowerCase();

        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            if (keywords.some(kw => lowerInput.includes(kw))) {
                topics.push(topic);
            }
        }

        return topics.length > 0 ? topics : ['general'];
    }
}

/**
 * Get context fetcher instance
 */
export function getContextFetcher(): ContextFetcherAgent {
    return new ContextFetcherAgent();
}
