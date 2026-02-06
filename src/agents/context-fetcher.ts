import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chat } from '../llm.js';
import type { AIProvider, Message } from '../types.js';

function formatMessages(messages: Message[]): string {
  return messages.map(m => `${m.role}: ${m.content}`).join('\n');
}

export class ContextFetcherAgent {
  private systemPrompt: string = '';
  private provider: AIProvider;
  private model: string;

  constructor(provider: AIProvider, model: string) {
    this.provider = provider;
    this.model = model;
  }

  async initialize(promptsDir: string): Promise<void> {
    this.systemPrompt = await readFile(join(promptsDir, 'context-fetcher.md'), 'utf-8');
  }

  /**
   * Enrich context by identifying what's most relevant from the full context
   * for the current conversation state.
   */
  async enrich(baseContext: string, messages: Message[]): Promise<string> {
    if (!baseContext.trim()) return '';

    const conversationSoFar = formatMessages(messages);

    const response = await chat(
      this.provider,
      this.model,
      this.systemPrompt,
      [
        {
          role: 'user',
          content: `Given this background context about the patient:\n\n${baseContext}\n\nAnd this conversation so far:\n${conversationSoFar}\n\nWhat context is most relevant for the therapist right now? Provide a concise, focused summary.`,
        },
      ],
      { temperature: 0.3, maxTokens: 1024 },
    );

    return response;
  }
}
