// src/agents/types.ts
// AI Agent type definitions
// Reference: agent_protocols.md, requirements.md R22-R25

/**
 * Agent identifiers
 */
export type AgentId = 'dr_sterling' | 'context_fetcher' | 'deep_researcher' | 'analyst_ai' | 'crisis_detector';

/**
 * AI Model providers
 */
export type AIProvider = 'anthropic' | 'google' | 'openai' | 'ollama';

/**
 * Model configuration per agent from agent_protocols.md
 */
export interface AgentModelConfig {
    provider: AIProvider;
    model: string;
    temperature: number;
    maxTokens: number;
    thinkingBudget?: number;  // For extended thinking
    systemPrompt: string;
}

/**
 * Default model configurations from agent_protocols.md
 */
export const DEFAULT_AGENT_CONFIGS: Record<AgentId, AgentModelConfig> = {
    dr_sterling: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.7,
        maxTokens: 2000,
        thinkingBudget: 10000,
        systemPrompt: `You are Dr. Eleanor Sterling, a warm and experienced AI psychiatrist.
You combine professional expertise with genuine empathy.
Your approach is client-centered, person-first, and trauma-informed.
You listen actively, validate feelings, and guide patients toward insight.
Never diagnose directly - help patients explore their thoughts and feelings.
Always prioritize patient safety and well-being.`
    },
    context_fetcher: {
        provider: 'google',
        model: 'gemini-2.0-flash',
        temperature: 0.3,
        maxTokens: 1000,
        systemPrompt: `You are a context retrieval agent. Your job is to:
1. Analyze the current patient input
2. Identify relevant memories and past sessions to retrieve
3. Generate optimal vector search queries
4. Return structured context for the primary therapist.
Be concise and focused on relevance.`
    },
    deep_researcher: {
        provider: 'google',
        model: 'gemini-2.0-flash',
        temperature: 0.4,
        maxTokens: 4000,
        systemPrompt: `You are a deep research agent for psychiatric context.
When a topic needs exploration, you:
1. Research clinical background
2. Gather therapeutic approaches
3. Identify relevant coping strategies
4. Provide evidence-based insights
Output structured research summaries.`
    },
    analyst_ai: {
        provider: 'google',
        model: 'gemini-2.0-flash',
        temperature: 0.5,
        maxTokens: 2000,
        systemPrompt: `You are an analytical agent that coordinates information.
Your responsibilities:
1. Aggregate context from multiple sources
2. Identify patterns across sessions
3. Generate session summaries
4. Track therapeutic progress
Output structured analyses.`
    },
    crisis_detector: {
        provider: 'google',
        model: 'gemini-2.0-flash',
        temperature: 0.1,  // Low temperature for consistency
        maxTokens: 500,
        systemPrompt: `You are a safety monitoring agent.
Analyze patient statements for crisis indicators.
Flag suicidal ideation, self-harm, or immediate danger.
Output: { "detected": boolean, "tier": 1|2|3|null, "indicators": string[], "confidence": number }
Be conservative - when in doubt, flag for review.`
    }
};

/**
 * Agent request structure
 */
export interface AgentRequest {
    agentId: AgentId;
    patientId: string;
    sessionId: string;
    input: string;
    context?: {
        patientOverview?: Record<string, unknown>;
        recentTranscript?: Array<{ speaker: string; content: string }>;
        retrievedMemories?: string[];
        emotionalState?: string;
        turnNumber?: number;
    };
    options?: {
        stream?: boolean;
        timeout?: number;
    };
}

/**
 * Agent response structure
 */
export interface AgentResponse {
    agentId: AgentId;
    content: string;
    metadata: {
        model: string;
        latencyMs: number;
        tokenCount?: number;
        thinking?: string;  // Extended thinking output
    };
    error?: {
        code: string;
        message: string;
        recoverable: boolean;
    };
}

/**
 * Crisis detection result
 */
export interface CrisisDetectionResult {
    detected: boolean;
    tier: 1 | 2 | 3 | null;
    indicators: string[];
    confidence: number;
    recommendedAction: 'IMMEDIATE_INTERVENTION' | 'ELEVATED_MONITORING' | 'INCREASED_ATTENTION' | 'CONTINUE_NORMAL';
}

/**
 * Context retrieval result
 */
export interface ContextRetrievalResult {
    relevantMemories: Array<{
        content: string;
        similarity: number;
        sessionId: string;
        timestamp: string;
    }>;
    suggestedTopics: string[];
    emotionalContext: string;
    latencyMs: number;
}

/**
 * Research result
 */
export interface ResearchResult {
    topic: string;
    summary: string;
    therapeuticApproaches: string[];
    copingStrategies: string[];
    relevantInsights: string[];
    sources: string[];
    latencyMs: number;
}

/**
 * Session summary result
 */
export interface SessionSummaryResult {
    mainTopics: string[];
    emotionalJourney: string;
    keyInsights: string[];
    therapeuticProgress: string;
    recommendations: string[];
    riskAssessment: string;
}
