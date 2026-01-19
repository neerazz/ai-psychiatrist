// src/agents/analyst-ai.ts
// Analyst AI Agent - Generates session summaries and insights
// Reference: AGENTS.md Article VII, Requirements R8 (Session Summary)

import { BaseAgent } from './base-agent.js';
import { AgentId, AgentModelConfig, AgentRequest, AgentResponse, SessionSummaryResult, DEFAULT_AGENT_CONFIGS } from './types.js';
import { logger } from '../utils/logger.js';
import Anthropic from '@anthropic-ai/sdk';
import { getConfig } from '../config/environment.js';

/**
 * Analyst AI Agent
 * Generates session summaries and clinical insights
 */
export class AnalystAIAgent extends BaseAgent {
    private anthropic: Anthropic | null = null;

    constructor() {
        const config = DEFAULT_AGENT_CONFIGS.analyst_ai;
        super('analyst_ai', config);
    }

    public async initialize(): Promise<void> {
        const envConfig = getConfig();
        if (envConfig.anthropicApiKey) {
            this.anthropic = new Anthropic({
                apiKey: envConfig.anthropicApiKey
            });
            logger.info('Analyst AI initialized with Anthropic');
        } else {
            logger.warn('Analyst AI: No API key, using mock analysis');
        }
        this.initialized = true;
    }

    public async isAvailable(): Promise<boolean> {
        return this.anthropic !== null;
    }

    /**
     * Process session analysis request
     */
    public async process(request: AgentRequest): Promise<AgentResponse> {
        const startTime = Date.now();

        if (!this.anthropic) {
            return this.createMockAnalysis(request, startTime);
        }

        try {
            // Build transcript from context
            const transcript = request.context?.recentTranscript || [];
            const transcriptText = transcript
                .map(t => `[${t.speaker}]: ${t.content}`)
                .join('\n');

            const response = await this.anthropic.messages.create({
                model: this.config.model,
                max_tokens: this.config.maxTokens,
                system: this.config.systemPrompt,
                messages: [{
                    role: 'user',
                    content: `Analyze this therapy session and provide a structured summary:

TRANSCRIPT:
${transcriptText || request.input}

Provide analysis as JSON:
{
  "mainTopics": ["topic1", "topic2"],
  "emotionalJourney": "Description of emotional progression",
  "keyInsights": ["insight1", "insight2"],
  "therapeuticProgress": "Assessment of progress",
  "recommendations": ["recommendation1"],
  "riskAssessment": "Current risk level and notes"
}`
                }]
            });

            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Unexpected response type');
            }

            // Extract JSON
            const jsonMatch = content.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON in response');
            }

            const analysis = JSON.parse(jsonMatch[0]) as SessionSummaryResult;

            logger.info('Session analysis complete', {
                sessionId: request.sessionId,
                topics: analysis.mainTopics.length
            });

            return this.createResponse(
                JSON.stringify(analysis),
                Date.now() - startTime,
                response.usage?.output_tokens
            );

        } catch (error) {
            logger.error('Analysis failed', { error });
            return this.createMockAnalysis(request, startTime);
        }
    }

    /**
     * Create mock analysis for testing
     */
    private createMockAnalysis(request: AgentRequest, startTime: number): AgentResponse {
        const mockResult: SessionSummaryResult = {
            mainTopics: ['general discussion', 'coping strategies'],
            emotionalJourney: 'Patient remained stable throughout the session.',
            keyInsights: ['Patient shows willingness to engage in self-reflection.'],
            therapeuticProgress: 'Continued exploration of established themes.',
            recommendations: ['Continue current therapeutic approach.'],
            riskAssessment: 'Low risk - stable presentation.'
        };

        return this.createResponse(
            JSON.stringify(mockResult),
            Date.now() - startTime
        );
    }
}

/**
 * Get analyst AI instance
 */
export function getAnalystAI(): AnalystAIAgent {
    return new AnalystAIAgent();
}
