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
  async summarize(messages: Message[], patientProfile?: string): Promise<SessionSummary> {
    let content = `Summarize this therapy session:\n\n${formatMessages(messages)}`;

    if (patientProfile) {
      content = `[PAST PATIENT PROFILE]\n${patientProfile}\n\n` + content;
    }

    const response = await chat(
      this.provider,
      this.model,
      this.systemPrompt,
      [
        {
          role: 'user',
          content,
        },
      ],
      { temperature: 0.3, maxTokens: 4096 }, // Increased maxTokens for detailed analysis
    );

    try {
      const jsonStr = response.replace(/```json\s*|```\s*/g, '').trim();
      return JSON.parse(jsonStr) as SessionSummary;
    } catch {
      // Fallback: return a basic summary if JSON parsing fails
      return {
        sessionTitle: 'Session Analysis (Fallback)',
        mainTopics: ['Unable to parse structured summary'],
        emotionalJourney: response.slice(0, 200),
        keyInsights: [],
        clinicalAnalysis: {
          defenseMechanisms: [],
          cognitiveDistortions: [],
          attachmentIndicators: [],
        },
        researchTopics: [],
        homework: [],
        recommendations: [],
        riskAssessment: {
          level: 'low',
          notes: 'Automatic fallback due to parsing error',
        },
      };
    }
  }
}
