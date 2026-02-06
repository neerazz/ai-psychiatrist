import { EventEmitter } from 'node:events';
import { resolve } from 'node:path';
import { DrSterlingAgent } from './dr-sterling.js';
import { ContextFetcherAgent } from './context-fetcher.js';
import { CrisisDetectorAgent } from './crisis-detector.js';
import { AnalystAgent } from './analyst.js';
import type { Config, CrisisResult, Message, SessionSummary } from '../types.js';

export class AgentCoordinator extends EventEmitter {
  private drSterling: DrSterlingAgent;
  private contextFetcher: ContextFetcherAgent;
  private crisisDetector: CrisisDetectorAgent;
  private analyst: AnalystAgent;

  constructor(config: Config) {
    super();
    this.drSterling = new DrSterlingAgent(config.provider, config.model);
    this.contextFetcher = new ContextFetcherAgent(config.provider, config.model);
    this.crisisDetector = new CrisisDetectorAgent(config.provider, config.model);
    this.analyst = new AnalystAgent(config.provider, config.model);
  }

  /**
   * Load prompt files for all agents.
   */
  async initialize(): Promise<void> {
    const promptsDir = resolve(process.cwd(), 'prompts');
    await Promise.all([
      this.drSterling.initialize(promptsDir),
      this.contextFetcher.initialize(promptsDir),
      this.crisisDetector.initialize(promptsDir),
      this.analyst.initialize(promptsDir),
    ]);
    console.log('[coordinator] All agents initialized');
  }

  /**
   * Process user input through the full agent pipeline:
   * 1. Crisis detection (always first)
   * 2. If Tier 3 → immediate intervention, skip LLM
   * 3. Context enrichment
   * 4. Dr. Sterling generates response
   */
  async processInput(
    input: string,
    messages: Message[],
    context: string,
  ): Promise<{ response: string; crisis: CrisisResult }> {
    // 1. Crisis detection — regex is instant, AI runs only if no Tier 3
    const crisis = await this.crisisDetector.assess(input, messages);

    if (crisis.detected) {
      this.emit('crisis:detected', crisis);
    }

    // 2. Tier 3 → immediate intervention, no LLM call
    if (crisis.tier === 3 && crisis.interventionMessage) {
      return { response: crisis.interventionMessage, crisis };
    }

    // 3. Context enrichment (uses LLM to pick relevant parts)
    let enrichedContext = context;
    try {
      const relevant = await this.contextFetcher.enrich(context, messages);
      if (relevant) {
        enrichedContext = relevant;
      }
    } catch {
      // Context enrichment failure is non-fatal, use raw context
      console.warn('[coordinator] Context enrichment failed, using raw context');
    }

    // 4. Dr. Sterling generates therapeutic response
    const response = await this.drSterling.respond(input, messages, enrichedContext, crisis);

    return { response, crisis };
  }

  /**
   * End session: analyst generates a structured summary.
   */
  async endSession(messages: Message[]): Promise<SessionSummary> {
    return this.analyst.summarize(messages);
  }
}
