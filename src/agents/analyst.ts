import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chat } from '../llm.js';
import type { AIProvider, Message, SessionSummary } from '../types.js';

function formatMessages(messages: Message[]): string {
  return messages.map(m => `${m.role}: ${m.content}`).join('\n');
}

export class AnalystAgent {
  private systemPrompt: string = '';
  private provider: AIProvider;
  private model: string;

  constructor(provider: AIProvider, model: string) {
    this.provider = provider;
    this.model = model;
  }

  async initialize(promptsDir: string): Promise<void> {
    this.systemPrompt = await readFile(join(promptsDir, 'analyst.md'), 'utf-8');
  }

  /**
   * Generate a structured session summary from the full transcript.
   */
  async summarize(messages: Message[]): Promise<SessionSummary> {
    const response = await chat(
      this.provider,
      this.model,
      this.systemPrompt,
      [
        {
          role: 'user',
          content: `Summarize this therapy session:\n\n${formatMessages(messages)}`,
        },
      ],
      { temperature: 0.3, maxTokens: 1024 },
    );

    try {
      const jsonStr = response.replace(/```json\s*|```\s*/g, '').trim();
      return JSON.parse(jsonStr) as SessionSummary;
    } catch {
      // Fallback: return a basic summary if JSON parsing fails
      return {
        mainTopics: ['Unable to parse summary'],
        emotionalJourney: response.slice(0, 200),
        keyInsights: [],
        recommendations: [],
        riskAssessment: 'unknown',
      };
    }
  }
}
