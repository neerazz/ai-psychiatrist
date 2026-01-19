// src/agents/dr-sterling.ts
// Dr. Sterling - Primary therapist AI agent
// Reference: agent_protocols.md, Requirements R22 (Dr. Sterling as primary)

import Anthropic from '@anthropic-ai/sdk';
import { BaseAgent } from './base-agent.js';
import { AgentId, AgentModelConfig, AgentRequest, AgentResponse, DEFAULT_AGENT_CONFIGS } from './types.js';
import { logger } from '../utils/logger.js';
import { getConfig } from '../config/environment.js';

/**
 * Dr. Eleanor Sterling - Primary Therapist Agent
 * Uses Claude for conversational therapy
 */
export class DrSterlingAgent extends BaseAgent {
    private client: Anthropic | null = null;

    constructor(config?: Partial<AgentModelConfig>) {
        const fullConfig = { ...DEFAULT_AGENT_CONFIGS.dr_sterling, ...config };
        super('dr_sterling', fullConfig);
    }

    public async initialize(): Promise<void> {
        const config = getConfig();

        if (config.anthropicApiKey) {
            this.client = new Anthropic({
                apiKey: config.anthropicApiKey
            });
            this.initialized = true;
            logger.info('Dr. Sterling agent initialized with Anthropic');
        } else {
            logger.warn('Dr. Sterling: No Anthropic API key, running in mock mode');
            this.initialized = true;
        }
    }

    public async isAvailable(): Promise<boolean> {
        const config = getConfig();
        return !!config.anthropicApiKey;
    }

    public async process(request: AgentRequest): Promise<AgentResponse> {
        const startTime = Date.now();

        // Build messages with context
        const messages = this.buildMessages(request);

        try {
            if (!this.client) {
                // Mock mode
                return this.generateMockResponse(request, startTime);
            }

            // Call Claude API with extended thinking if configured
            const response = await this.client.messages.create({
                model: this.config.model,
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
                system: this.config.systemPrompt,
                messages: messages
            });

            const latencyMs = Date.now() - startTime;

            // Extract content
            const content = response.content
                .filter(block => block.type === 'text')
                .map(block => (block as { type: 'text'; text: string }).text)
                .join('\n');

            // Extract thinking if present
            const thinkingBlocks = response.content.filter(block => block.type === 'thinking');
            const thinking = thinkingBlocks.length > 0
                ? thinkingBlocks.map(b => (b as { type: 'thinking'; thinking: string }).thinking).join('\n')
                : undefined;

            logger.info('Dr. Sterling response generated', {
                latencyMs,
                tokenCount: response.usage?.output_tokens,
                hasThinking: !!thinking
            });

            return this.createResponse(
                content,
                latencyMs,
                response.usage?.output_tokens,
                thinking
            );

        } catch (error) {
            const latencyMs = Date.now() - startTime;
            logger.error('Dr. Sterling API error', { error, latencyMs });

            return this.createErrorResponse(
                'API_ERROR',
                (error as Error).message,
                latencyMs,
                true
            );
        }
    }

    /**
     * Build message array for Claude API
     */
    private buildMessages(request: AgentRequest): Array<{ role: 'user' | 'assistant'; content: string }> {
        const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

        // Add context as a user message if present
        if (request.context) {
            const contextParts: string[] = [];

            if (request.context.patientOverview) {
                contextParts.push(`[PATIENT CONTEXT]\n${JSON.stringify(request.context.patientOverview, null, 2)}`);
            }

            if (request.context.emotionalState) {
                contextParts.push(`[CURRENT EMOTIONAL STATE]: ${request.context.emotionalState}`);
            }

            if (request.context.retrievedMemories?.length) {
                contextParts.push(`[RELEVANT MEMORIES FROM PAST SESSIONS]\n${request.context.retrievedMemories.join('\n---\n')}`);
            }

            if (contextParts.length > 0) {
                messages.push({
                    role: 'user',
                    content: `[CONTEXT FOR THIS SESSION - DO NOT RESPOND TO THIS, JUST USE IT]\n${contextParts.join('\n\n')}`
                });
                messages.push({
                    role: 'assistant',
                    content: 'I understand the context. I\'ll use this information to provide personalized support. Please share what you\'d like to discuss.'
                });
            }
        }

        // Add recent transcript
        if (request.context?.recentTranscript?.length) {
            for (const turn of request.context.recentTranscript) {
                messages.push({
                    role: turn.speaker === 'patient' ? 'user' : 'assistant',
                    content: turn.content
                });
            }
        }

        // Add current input
        messages.push({
            role: 'user',
            content: request.input
        });

        return messages;
    }

    /**
     * Generate mock response for testing/offline mode
     */
    private generateMockResponse(request: AgentRequest, startTime: number): AgentResponse {
        const latencyMs = Date.now() - startTime + 100;

        const responses = [
            'I hear what you\'re saying. Can you tell me more about how that makes you feel?',
            'That sounds like it\'s been weighing on you. What do you think might help?',
            'Thank you for sharing that with me. It takes courage to open up about these things.',
            'I\'m curious - when did you first notice these feelings?',
            'It seems like there\'s a lot going on for you right now. Let\'s take this one step at a time.'
        ];

        const content = responses[Math.floor(Math.random() * responses.length)];

        return this.createResponse(content, latencyMs);
    }
}

// Factory function
export function createDrSterlingAgent(config?: Partial<AgentModelConfig>): DrSterlingAgent {
    return new DrSterlingAgent(config);
}
