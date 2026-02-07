// Shared types for the AI Psychiatrist multi-agent system

export type AgentId = 'dr_sterling' | 'context_fetcher' | 'crisis_detector' | 'analyst';
export type AIProvider = 'anthropic' | 'openai' | 'google';
export type AudioProviderType = 'whisper_tts' | 'gemini_live' | 'text';
export type TTSProvider = 'say' | 'piper' | 'edge';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentRequest {
  agentId: AgentId;
  input: string;
  messages: Message[];
  context?: string;
}

export interface AgentResponse {
  agentId: AgentId;
  content: string;
  latencyMs: number;
}

export interface CrisisResult {
  detected: boolean;
  tier: 1 | 2 | 3 | null;
  indicators: string[];
  confidence: number;
  regexScore: number;
  aiScore: number;
  action: 'IMMEDIATE' | 'ELEVATED' | 'ATTENTION' | 'CONTINUE';
  interventionMessage?: string;
}

export interface SessionSummary {
  sessionTitle: string;
  mainTopics: string[];
  emotionalJourney: string;
  keyInsights: string[];
  clinicalAnalysis: {
    defenseMechanisms: string[];
    cognitiveDistortions: string[];
    attachmentIndicators: string[];
  };
  researchTopics: {
    topic: string;
    clinicalContext: string;
    suggestedReading: string[];
  }[];
  homework: string[];
  recommendations: string[];
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    notes: string;
  };
}

export interface Config {
  provider: AIProvider;
  model: string;
  audioProvider: AudioProviderType;
  whisperModel: string;
  ttsProvider: TTSProvider;
  externalContextPaths: string[];
  dataDir: string;
  apiKeys: {
    anthropic?: string;
    openai?: string;
    google?: string;
  };
}
