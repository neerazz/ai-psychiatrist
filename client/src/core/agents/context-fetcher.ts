import type { ChatFunction, Message } from '../types.ts';

function formatMessages(messages: Message[]): string {
  return messages.map(m => `${m.role}: ${m.content}`).join('\n');
}

export class ContextFetcherAgent {
  private systemPrompt: string;
  private chatFn: ChatFunction;

  constructor(chatFn: ChatFunction, systemPrompt: string) {
    this.chatFn = chatFn;
    this.systemPrompt = systemPrompt;
  }

  async enrich(baseContext: string, messages: Message[]): Promise<string> {
    if (!baseContext.trim()) return '';

    const conversationSoFar = formatMessages(messages);

    return this.chatFn(
      this.systemPrompt,
      [{
        role: 'user',
        content: `Given this background context about the patient:\n\n${baseContext}\n\nAnd this conversation so far:\n${conversationSoFar}\n\nWhat context is most relevant for the therapist right now? Provide a concise, focused summary.`,
      }],
      { temperature: 0.3, maxTokens: 1024 },
    );
  }
}
