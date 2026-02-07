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

  async summarize(messages: Message[], patientProfile?: string): Promise<SessionSummary> {
    let content = `Summarize this therapy session:\n\n${formatMessages(messages)}`;

    if (patientProfile) {
      content = `[PAST PATIENT PROFILE]\n${patientProfile}\n\n` + content;
    }

    const response = await this.chatFn(
      this.systemPrompt,
      [{
        role: 'user',
        content,
      }],
      { temperature: 0.3, maxTokens: 4096 }, // Increased maxTokens for detailed analysis
    );

    try {
      const jsonStr = response.replace(/```json\s*|```\s*/g, '').trim();
      return JSON.parse(jsonStr) as SessionSummary;
    } catch {
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
