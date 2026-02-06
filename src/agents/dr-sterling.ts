import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chat } from '../llm.js';
import type { AIProvider, CrisisResult, Message } from '../types.js';

export class DrSterlingAgent {
  private systemPrompt: string = '';
  private provider: AIProvider;
  private model: string;

  constructor(provider: AIProvider, model: string) {
    this.provider = provider;
    this.model = model;
  }

  async initialize(promptsDir: string): Promise<void> {
    this.systemPrompt = await readFile(join(promptsDir, 'dr-sterling.md'), 'utf-8');
  }

  /**
   * Generate a therapeutic response.
   * If crisis is detected (tier 1-2), a safety note is prepended to the system prompt.
   */
  async respond(
    input: string,
    messages: Message[],
    context: string,
    crisis: CrisisResult,
  ): Promise<string> {
    let prompt = this.systemPrompt;

    // Inject safety awareness if crisis detected
    if (crisis.detected && crisis.tier && crisis.tier < 3) {
      prompt += `\n\n[SAFETY NOTE: Patient is showing ${crisis.action} indicators: ${crisis.indicators.join(', ')}. Respond with extra care and warmth. Gently weave in awareness without being heavy-handed.]`;
    }

    // Append external context
    if (context) {
      prompt += `\n\n[PATIENT CONTEXT - use this to personalize your response, do not reference it explicitly]\n${context}`;
    }

    // Build conversation messages
    const conversationMessages: Message[] = [
      ...messages,
      { role: 'user', content: input },
    ];

    return chat(this.provider, this.model, prompt, conversationMessages);
  }
}
