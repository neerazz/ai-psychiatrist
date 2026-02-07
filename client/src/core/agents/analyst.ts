import type { ChatFunction, Message, SessionSummary } from '../types.ts';

function formatMessages(messages: Message[]): string {
  return messages.map(m => `${m.role}: ${m.content}`).join('\n');
}

export class AnalystAgent {
  private systemPrompt: string;
  private chatFn: ChatFunction;

  constructor(chatFn: ChatFunction, systemPrompt: string) {
    this.chatFn = chatFn;
    this.systemPrompt = systemPrompt;
  }

  async summarize(messages: Message[]): Promise<SessionSummary> {
    const response = await this.chatFn(
      this.systemPrompt,
      [{
        role: 'user',
        content: `Summarize this therapy session:\n\n${formatMessages(messages)}`,
      }],
      { temperature: 0.3, maxTokens: 1024 },
    );

    try {
      const jsonStr = response.replace(/```json\s*|```\s*/g, '').trim();
      return JSON.parse(jsonStr) as SessionSummary;
    } catch {
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
