import type { ChatFunction, StreamChatFunction, CrisisResult, Message, TopicBucket } from '../types.ts';

/**
 * Format the topic bucket into a concise block for Sterling's system prompt.
 */
function formatBucketForPrompt(bucket: TopicBucket): string {
  const lines: string[] = ['[SESSION TRACKER — use this awareness naturally, do NOT read items aloud or act like a checklist]'];

  if (bucket.active.length > 0) {
    lines.push('Currently exploring:');
    for (const t of bucket.active) {
      const note = t.notes ? ` (${t.notes})` : '';
      lines.push(`  - ${t.topic} [${t.depth}]${note}`);
    }
  }

  if (bucket.pending.length > 0) {
    lines.push('Mentioned but not yet explored (when there\'s a natural opening):');
    for (const t of bucket.pending.slice(0, 5)) {
      const carryNote = t.carryOver ? ' [from previous session]' : '';
      const note = t.notes && !t.notes.startsWith('[') ? ` (${t.notes})` : '';
      lines.push(`  - ${t.topic}${carryNote}${note}`);
    }
    if (bucket.pending.length > 5) {
      lines.push(`  - ...and ${bucket.pending.length - 5} more`);
    }
  }

  if (bucket.resolved.length > 0) {
    const recentResolved = bucket.resolved.filter(t => !t.carryOver).slice(0, 3);
    if (recentResolved.length > 0) {
      lines.push('Already covered this session (no need to revisit unless patient brings up):');
      for (const t of recentResolved) {
        lines.push(`  - ${t.topic}`);
      }
    }
  }

  if (bucket.emotionalArc) {
    lines.push(`Emotional arc so far: ${bucket.emotionalArc}`);
  }

  if (bucket.sessionInsights.length > 0) {
    lines.push('Key patterns noticed:');
    for (const insight of bucket.sessionInsights) {
      lines.push(`  - ${insight}`);
    }
  }

  return lines.join('\n');
}

export class DrSterlingAgent {
  private systemPrompt: string;
  private chatFn: ChatFunction;
  private streamFn: StreamChatFunction | null;

  constructor(chatFn: ChatFunction, systemPrompt: string, streamFn?: StreamChatFunction) {
    this.chatFn = chatFn;
    this.systemPrompt = systemPrompt;
    this.streamFn = streamFn ?? null;
  }

  /**
   * Generate an opening greeting for a new session (non-streaming, short).
   */
  async greet(context: string, bucket?: TopicBucket): Promise<string> {
    let prompt = this.systemPrompt;
    if (context) {
      prompt += `\n\n[PATIENT CONTEXT - use this to personalize your greeting, do not reference it explicitly]\n${context}`;
    }

    // If there are carry-over topics, let Sterling know
    if (bucket && bucket.pending.length > 0) {
      const carryOvers = bucket.pending.filter(t => t.carryOver);
      if (carryOvers.length > 0) {
        prompt += `\n\n[PREVIOUS SESSION NOTES — things mentioned but not fully explored last time. You might naturally check in on these, but follow the patient's lead]\n`;
        for (const t of carryOvers.slice(0, 4)) {
          prompt += `- ${t.topic}\n`;
        }
      }
    }

    prompt += `\n\n[INSTRUCTION: This is the very beginning of a new session. Generate a warm, brief opening check-in (1-2 sentences). Be genuine and conversational, not scripted. Do not introduce yourself by name unless it feels natural.]`;
    return this.chatFn(prompt, [], { maxTokens: 512 });
  }

  /**
   * Generate a response — streaming tokens to the caller in real time.
   * Falls back to non-streaming if streamFn not available.
   */
  async respond(
    input: string,
    messages: Message[],
    context: string,
    crisis: CrisisResult,
    bucket: TopicBucket,
    onToken?: (token: string) => void,
  ): Promise<string> {
    let prompt = this.systemPrompt;

    if (crisis.detected && crisis.tier && crisis.tier < 3) {
      prompt += `\n\n[SAFETY NOTE: Patient is showing ${crisis.action} indicators: ${crisis.indicators.join(', ')}. Respond with extra care and warmth. Gently weave in awareness without being heavy-handed.]`;
    }

    if (context) {
      prompt += `\n\n[PATIENT CONTEXT - use this to personalize your response, do not reference it explicitly]\n${context}`;
    }

    // Inject topic bucket awareness
    if (bucket.active.length > 0 || bucket.pending.length > 0 || bucket.sessionInsights.length > 0) {
      prompt += `\n\n${formatBucketForPrompt(bucket)}`;
    }

    const conversationMessages: Message[] = [
      ...messages,
      { role: 'user', content: input },
    ];

    // Use streaming if available and caller wants tokens
    if (this.streamFn && onToken) {
      return this.streamFn(prompt, conversationMessages, onToken, { maxTokens: 4096 });
    }

    return this.chatFn(prompt, conversationMessages, { maxTokens: 4096 });
  }
}
