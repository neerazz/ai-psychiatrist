import { DrSterlingAgent } from './agents/dr-sterling.ts';
import { CrisisDetectorAgent } from './agents/crisis-detector.ts';
import { AnalystAgent } from './agents/analyst.ts';
import { TopicTrackerAgent } from './agents/topic-tracker.ts';
import { emptyBucket } from './types.ts';
import type {
  ChatFunction, StreamChatFunction, CrisisResult, Message,
  SessionSummary, TopicBucket,
} from './types.ts';

/** Max messages to send to Sterling before switching to sliding window. */
const SLIDING_WINDOW_THRESHOLD = 30;
/** How many recent messages to keep in the sliding window. */
const SLIDING_WINDOW_SIZE = 12;

export class AgentCoordinator {
  private drSterling: DrSterlingAgent;
  private crisisDetector: CrisisDetectorAgent;
  private analyst: AnalystAgent;
  private topicTracker: TopicTrackerAgent;
  private sessionContext: string = '';
  private topicBucket: TopicBucket;
  private turnNumber: number = 0;
  private onBucketUpdate: ((bucket: TopicBucket) => void) | null = null;

  constructor(
    chatFn: ChatFunction,
    prompts: {
      drSterling: string;
      crisisDetector: string;
      contextFetcher: string;
      analyst: string;
      topicTracker: string;
    },
    streamFn?: StreamChatFunction,
  ) {
    this.drSterling = new DrSterlingAgent(chatFn, prompts.drSterling, streamFn);
    this.crisisDetector = new CrisisDetectorAgent(chatFn, prompts.crisisDetector);
    this.analyst = new AnalystAgent(chatFn, prompts.analyst);
    this.topicTracker = new TopicTrackerAgent(chatFn, prompts.topicTracker);
    this.topicBucket = emptyBucket();
  }

  /**
   * Register a callback that fires when the background topic tracker finishes.
   * Used by the UI to update the bucket panel asynchronously.
   */
  setBucketUpdateCallback(cb: (bucket: TopicBucket) => void) {
    this.onBucketUpdate = cb;
  }

  /** Set context once at session start. */
  setSessionContext(context: string) {
    this.sessionContext = context;
  }

  /** Seed initial bucket (e.g., from carry-over data). */
  setInitialBucket(bucket: TopicBucket) {
    this.topicBucket = bucket;
  }

  /** Get current bucket snapshot. */
  getTopicBucket(): TopicBucket {
    return this.topicBucket;
  }

  /**
   * Generate an opening greeting for the session.
   */
  async generateGreeting(context: string): Promise<string> {
    this.sessionContext = context;
    return this.drSterling.greet(context, this.topicBucket);
  }

  /**
   * Build a sliding-window message list when the conversation gets long.
   * Replaces early messages with a compressed bucket summary so the model
   * still has context without exceeding token limits.
   */
  private buildMessageWindow(messages: Message[]): Message[] {
    if (messages.length <= SLIDING_WINDOW_THRESHOLD) {
      return messages;
    }

    // Compress older messages into a summary injected as a system message
    const recentMessages = messages.slice(-SLIDING_WINDOW_SIZE);
    const bucketSummary = this.buildBucketSummaryText();

    const summaryMessage: Message = {
      role: 'system',
      content: [
        '[CONVERSATION MEMORY — earlier messages have been compressed]',
        bucketSummary,
        `[The last ${SLIDING_WINDOW_SIZE} messages follow. Continue the conversation naturally.]`,
      ].join('\n\n'),
    };

    return [summaryMessage, ...recentMessages];
  }

  /** Compact text representation of the bucket for the sliding window. */
  private buildBucketSummaryText(): string {
    const b = this.topicBucket;
    const lines: string[] = [];

    if (b.active.length > 0) {
      lines.push(`Currently exploring: ${b.active.map(t => t.topic).join(', ')}`);
    }
    if (b.pending.length > 0) {
      lines.push(`Still to discuss: ${b.pending.map(t => t.topic).join(', ')}`);
    }
    if (b.resolved.length > 0) {
      lines.push(`Already covered: ${b.resolved.map(t => t.topic).join(', ')}`);
    }
    if (b.sessionInsights.length > 0) {
      lines.push(`Key insights: ${b.sessionInsights.join('; ')}`);
    }
    if (b.emotionalArc) {
      lines.push(`Emotional arc: ${b.emotionalArc}`);
    }

    return lines.join('\n');
  }

  /**
   * Process user input.
   * Dr. Sterling streams FIRST (main thread).
   * Topic tracker runs in background AFTER Sterling responds.
   */
  async processInput(
    input: string,
    messages: Message[],
    onToken?: (token: string) => void,
  ): Promise<{ response: string; crisis: CrisisResult; topicBucket: TopicBucket }> {
    this.turnNumber++;

    // Step 1: Instant regex crisis check (< 1ms)
    const regexCrisis = this.crisisDetector.regexCheck(input);

    // Step 2: If Tier 3 — immediate intervention, skip everything
    if (regexCrisis.tier === 3) {
      const crisis: CrisisResult = {
        detected: true,
        tier: 3,
        indicators: regexCrisis.indicators,
        confidence: 1.0,
        regexScore: 1.0,
        aiScore: 0,
        action: 'IMMEDIATE',
        interventionMessage: regexCrisis.interventionMessage,
      };
      return { response: crisis.interventionMessage!, crisis, topicBucket: this.topicBucket };
    }

    // Step 3: Background crisis AI (only if regex flagged concern)
    const crisisPromise = regexCrisis.tier
      ? this.crisisDetector.assess(input, messages)
      : Promise.resolve<CrisisResult>({
        detected: false, tier: null, indicators: [], confidence: 0,
        regexScore: 0, aiScore: 0, action: 'CONTINUE',
      });

    const sterlingCrisis: CrisisResult = regexCrisis.tier
      ? {
        detected: true, tier: regexCrisis.tier as 1 | 2,
        indicators: regexCrisis.indicators,
        confidence: regexCrisis.score, regexScore: regexCrisis.score, aiScore: 0,
        action: regexCrisis.tier === 2 ? 'ELEVATED' : 'ATTENTION',
      }
      : {
        detected: false, tier: null, indicators: [], confidence: 0,
        regexScore: 0, aiScore: 0, action: 'CONTINUE',
      };

    // Step 4: Dr. Sterling streams response (MAIN THREAD)
    // Uses sliding window if conversation is long
    const windowedMessages = this.buildMessageWindow(messages);
    const response = await this.drSterling.respond(
      input, windowedMessages, this.sessionContext, sterlingCrisis, this.topicBucket, onToken,
    );

    // Step 5: Fire topic tracker in background — DO NOT await before returning
    this.topicTracker
      .analyze(input, response, this.topicBucket, this.turnNumber)
      .then(updatedBucket => {
        this.topicBucket = updatedBucket;
        this.onBucketUpdate?.(updatedBucket);
      })
      .catch(err => {
        console.warn('[coordinator] Topic tracker background error:', err);
      });

    // Step 6: Collect crisis result (already resolved for most messages)
    const crisis = await crisisPromise;

    // Return current bucket (tracker update will arrive asynchronously)
    return { response, crisis, topicBucket: this.topicBucket };
  }

  /**
   * End session: analyst generates a structured summary.
   */
  async endSession(messages: Message[]): Promise<{ summary: SessionSummary; topicBucket: TopicBucket }> {
    const summary = await this.analyst.summarize(messages, this.sessionContext);
    return { summary, topicBucket: this.topicBucket };
  }
}
