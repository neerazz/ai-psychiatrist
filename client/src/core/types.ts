export type AIProvider = 'anthropic' | 'openai' | 'google';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
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

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

/** Standard non-streaming chat. */
export type ChatFunction = (
  systemPrompt: string,
  messages: Message[],
  options?: ChatOptions,
) => Promise<string>;

/** Streaming chat — calls onToken for each chunk, returns full text at end. */
export type StreamChatFunction = (
  systemPrompt: string,
  messages: Message[],
  onToken: (token: string) => void,
  options?: ChatOptions,
) => Promise<string>;

export interface AppSettings {
  provider: AIProvider;
  model: string;
  apiKey: string;
  voiceEnabled: boolean;
}

// ── Topic Tracker types ──

export type TopicDepth = 'mentioned' | 'exploring' | 'deep' | 'resolved';

export interface TopicItem {
  id: string;
  topic: string;
  depth: TopicDepth;
  priority: number;           // 1 (highest) to 5 (lowest)
  turnMentioned: number;
  turnLastTouched: number;
  relatedTopics: string[];
  notes: string;
  carryOver?: boolean;        // true if carried from a previous session
}

export interface TopicBucket {
  active: TopicItem[];        // currently being explored (depth: exploring | deep)
  pending: TopicItem[];       // mentioned but not yet explored
  resolved: TopicItem[];      // sufficiently covered
  sessionInsights: string[];  // key patterns/insights so far
  emotionalArc: string;       // one-line emotional trajectory
  turnCount: number;
}

export function emptyBucket(): TopicBucket {
  return {
    active: [],
    pending: [],
    resolved: [],
    sessionInsights: [],
    emotionalArc: '',
    turnCount: 0,
  };
}
