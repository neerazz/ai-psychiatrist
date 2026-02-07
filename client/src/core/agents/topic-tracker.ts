import type { ChatFunction, TopicBucket } from '../types.ts';
import { emptyBucket } from '../types.ts';

export class TopicTrackerAgent {
  private systemPrompt: string;
  private chatFn: ChatFunction;

  constructor(chatFn: ChatFunction, systemPrompt: string) {
    this.chatFn = chatFn;
    this.systemPrompt = systemPrompt;
  }

  /**
   * Analyze the latest exchange and return an updated TopicBucket.
   * Runs in the background — never blocks the main conversation thread.
   */
  async analyze(
    userMessage: string,
    assistantResponse: string,
    currentBucket: TopicBucket,
    turnNumber: number,
  ): Promise<TopicBucket> {
    const prompt = [
      `Turn ${turnNumber}`,
      '',
      '## Latest Exchange',
      `**Patient**: ${userMessage}`,
      '',
      `**Therapist**: ${assistantResponse}`,
      '',
      '## Current Topic Bucket',
      '```json',
      JSON.stringify(currentBucket, null, 2),
      '```',
      '',
      `Update the topic bucket based on this exchange. Return ONLY valid JSON.`,
    ].join('\n');

    try {
      const response = await this.chatFn(
        this.systemPrompt,
        [{ role: 'user', content: prompt }],
        { temperature: 0.2, maxTokens: 1024 },
      );

      const jsonStr = response.replace(/```json\s*|```\s*/g, '').trim();
      const parsed = JSON.parse(jsonStr) as TopicBucket;

      // Validate structure — if any field is missing, fill with defaults
      return {
        active: Array.isArray(parsed.active) ? parsed.active : [],
        pending: Array.isArray(parsed.pending) ? parsed.pending : [],
        resolved: Array.isArray(parsed.resolved) ? parsed.resolved : [],
        sessionInsights: Array.isArray(parsed.sessionInsights) ? parsed.sessionInsights : [],
        emotionalArc: typeof parsed.emotionalArc === 'string' ? parsed.emotionalArc : '',
        turnCount: typeof parsed.turnCount === 'number' ? parsed.turnCount : turnNumber,
      };
    } catch (err) {
      console.warn('[topic-tracker] Failed to parse response, keeping current bucket:', err);
      // Return the current bucket unchanged — safe fallback
      return { ...currentBucket, turnCount: turnNumber };
    }
  }

  /**
   * Build an initial bucket from carry-over topics loaded from past sessions.
   * Non-resolved topics from previous sessions become pending carry-overs.
   */
  static buildCarryOverBucket(pastBuckets: TopicBucket[]): TopicBucket {
    const bucket = emptyBucket();

    for (const past of pastBuckets) {
      // Active topics from past sessions that were never resolved → carry over as pending
      for (const topic of past.active) {
        bucket.pending.push({
          ...topic,
          depth: 'mentioned',
          carryOver: true,
          notes: `[Carry-over] Was actively discussed last session. ${topic.notes}`.trim(),
        });
      }

      // Pending topics from past sessions → carry over
      for (const topic of past.pending) {
        // Avoid duplicates by ID
        if (!bucket.pending.some(t => t.id === topic.id)) {
          bucket.pending.push({
            ...topic,
            carryOver: true,
            notes: `[Carry-over] Mentioned but not explored last session. ${topic.notes}`.trim(),
          });
        }
      }

      // Resolved topics stay resolved (just for reference)
      for (const topic of past.resolved) {
        if (!bucket.resolved.some(t => t.id === topic.id)) {
          bucket.resolved.push({
            ...topic,
            carryOver: true,
            notes: `[Previous session] ${topic.notes}`.trim(),
          });
        }
      }
    }

    // Sort carry-over pending by priority
    bucket.pending.sort((a, b) => a.priority - b.priority);

    return bucket;
  }
}
