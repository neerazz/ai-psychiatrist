import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chat } from '../llm.js';
import type { AIProvider, CrisisResult, Message } from '../types.js';

// ─── Regex Patterns (ported from legacy crisis-detector.ts) ─────────────────

const TIER_3_PATTERNS: RegExp[] = [
  // Active suicidal ideation with plan
  /\b(going to|will|plan to|decided to)\s*(kill|end|take)\s*(my\s*)?(life|myself)\b/i,
  /\b(have|got|made)\s*(a\s*)?(plan|method|way)\s*(to\s*)?(die|kill|end)\b/i,
  /\b(when|after)\s*(i|im|i'm)\s*(dead|gone|not here)\b/i,
  /\b(tonight|today|tomorrow)\s*.*(die|kill|end it)\b/i,
  /\b(goodbye|farewell|last\s*words)\b.*\b(forever|everyone)\b/i,
  /\bi('?m|am)\s*going to\s*do it\b/i,
  /\bthis is (my|the) last\b/i,
  /\b(bought|have|obtained)\s*(pills|gun|rope|knife)\s*(for|to)\b/i,
];

const TIER_2_PATTERNS: RegExp[] = [
  // Passive suicidal ideation
  /\bwish\s*(i|id|i'd)\s*(was|were|wasn't)\s*(dead|alive|born)\b/i,
  /\b(better|easier)\s*(off|if)\s*.*(dead|gone|without me)\b/i,
  /\b(don't|do not)\s*(want|care)\s*(to\s*)?(live|be here|go on)\b/i,
  /\b(want|wanting|wished)\s*(to\s*)?(die|disappear|not exist)\b/i,
  /\blife\s*(is|isn't)\s*(worth|worthless)\b/i,
  // Self-harm
  /\b(cut|cutting|burn|burning|hurt|hurting)\s*(myself|me)\b/i,
  /\bself[- ]?(harm|injury|mutilation)\b/i,
  /\b(starving|purging|binging)\s*(myself)?\b/i,
];

const TIER_1_PATTERNS: RegExp[] = [
  // Severe hopelessness
  /\b(no|lost|losing)\s*(hope|point|reason|purpose)\b/i,
  /\bnothing\s*(matters|works|helps)\b/i,
  /\b(can't|cannot)\s*(go on|continue|take it|do this)\b/i,
  /\b(feel|feeling)\s*(empty|numb|dead inside)\b/i,
  /\bwhat('s| is) the point\b/i,
  /\b(trapped|stuck|no way out)\b/i,
  /\b(hate|despise)\s*(myself|my life)\b/i,
  /\b(exhausted|tired)\s*(of|from)\s*(everything|living|trying)\b/i,
  /\bburden\s*(to|on)\s*(everyone|family|you)\b/i,
];

const FALSE_POSITIVE_PATTERNS: RegExp[] = [
  /\bi('d| would)\s*die\s*(for|of)\s*(laughter|that|this)/i,
  /\bkilling\s*(it|the game|time)\b/i,
  /\bdead\s*(serious|tired|end)\b/i,
  /\bi('m| am)\s*dying\s*(to|of laughter)\b/i,
  /\bthat\s*joke\s*killed\s*me\b/i,
  /\bin\s*the\s*past|used to|years ago\b/i,
  /\b(movie|book|show|song|character)\b/i,
];

// ─── Intervention messages ──────────────────────────────────────────────────

const INTERVENTION_MESSAGES: Record<number, string> = {
  3: `I need to pause our conversation. What you're describing sounds very serious, and your safety is my top priority right now.

Please reach out for immediate help:
• Call 988 (Suicide & Crisis Lifeline) — available 24/7
• Text HOME to 741741 (Crisis Text Line)
• Call 911 if you are in immediate danger

You are not alone. People care about you and want to help.`,
  2: `I hear that you're really struggling right now, and I want you to know that your feelings are valid. If at any point you feel like you might hurt yourself, please call 988 — the Suicide & Crisis Lifeline is available 24/7.

Let's continue talking, and I'll be right here with you.`,
  1: `It sounds like you're going through a very difficult time. I'm here to listen and help however I can. If things ever feel overwhelming, you can always reach out to 988 for additional support.`,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatMessages(messages: Message[]): string {
  return messages.map(m => `${m.role}: ${m.content}`).join('\n');
}

function tierToAction(tier: number | null): CrisisResult['action'] {
  switch (tier) {
    case 3: return 'IMMEDIATE';
    case 2: return 'ELEVATED';
    case 1: return 'ATTENTION';
    default: return 'CONTINUE';
  }
}

// ─── CrisisDetectorAgent ───────────────────────────────────────────────────

interface RegexAnalysis {
  score: number;
  tier: number | null;
  indicators: string[];
}

interface AIAnalysis {
  score: number;
  suggestedTier: number | null;
  indicators: string[];
}

export class CrisisDetectorAgent {
  private systemPrompt: string = '';
  private provider: AIProvider;
  private model: string;

  constructor(provider: AIProvider, model: string) {
    this.provider = provider;
    this.model = model;
  }

  async initialize(promptsDir: string): Promise<void> {
    this.systemPrompt = await readFile(join(promptsDir, 'crisis-detector.md'), 'utf-8');
  }

  /**
   * Hybrid crisis assessment: 60% regex (deterministic) + 40% AI (contextual).
   * Regex runs first (<10ms). Tier 3 regex match = immediate action, skip AI.
   * AI can only ESCALATE, never downgrade.
   */
  async assess(input: string, messages: Message[]): Promise<CrisisResult> {
    // Layer 1: Deterministic regex (60% weight)
    const regexResult = this.regexAnalyze(input);

    // Tier 3 regex = act immediately, no waiting for AI
    if (regexResult.tier === 3) {
      return {
        detected: true,
        tier: 3,
        indicators: regexResult.indicators,
        confidence: 1.0,
        regexScore: 1.0,
        aiScore: 0,
        action: 'IMMEDIATE',
        interventionMessage: INTERVENTION_MESSAGES[3],
      };
    }

    // Layer 2: AI contextual analysis (40% weight)
    let aiResult: AIAnalysis = { score: 0, suggestedTier: null, indicators: [] };
    try {
      aiResult = await this.aiAnalyze(input, messages);
    } catch {
      // AI failure = rely entirely on regex (safe default)
      console.warn('[crisis] AI analysis failed, using regex only');
    }

    // Combine: 60% regex + 40% AI
    const combinedScore = (regexResult.score * 0.6) + (aiResult.score * 0.4);

    // AI can only ESCALATE, never downgrade
    const finalTier = Math.max(regexResult.tier ?? 0, aiResult.suggestedTier ?? 0) || null;

    return {
      detected: finalTier !== null,
      tier: finalTier as 1 | 2 | 3 | null,
      indicators: [...regexResult.indicators, ...aiResult.indicators],
      confidence: combinedScore,
      regexScore: regexResult.score,
      aiScore: aiResult.score,
      action: tierToAction(finalTier),
      interventionMessage: finalTier ? INTERVENTION_MESSAGES[finalTier] : undefined,
    };
  }

  /**
   * Deterministic regex analysis. Checks false positives first, then tier 3→2→1.
   */
  private regexAnalyze(text: string): RegexAnalysis {
    // False positive check
    for (const pattern of FALSE_POSITIVE_PATTERNS) {
      if (pattern.test(text)) {
        return { score: 0, tier: null, indicators: [] };
      }
    }

    const indicators: string[] = [];

    // Tier 3 (most severe)
    for (const pattern of TIER_3_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        indicators.push(`TIER_3: "${match[0]}"`);
        return { score: 1.0, tier: 3, indicators };
      }
    }

    // Tier 2
    for (const pattern of TIER_2_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        indicators.push(`TIER_2: "${match[0]}"`);
        return { score: 0.7, tier: 2, indicators };
      }
    }

    // Tier 1
    for (const pattern of TIER_1_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        indicators.push(`TIER_1: "${match[0]}"`);
        return { score: 0.4, tier: 1, indicators };
      }
    }

    return { score: 0, tier: null, indicators: [] };
  }

  /**
   * AI contextual analysis — sends recent conversation to LLM for assessment.
   * Returns structured JSON with risk score and suggested tier.
   */
  private async aiAnalyze(input: string, messages: Message[]): Promise<AIAnalysis> {
    const recentMessages = messages.slice(-5);
    const response = await chat(
      this.provider,
      this.model,
      this.systemPrompt,
      [
        {
          role: 'user',
          content: `Analyze for crisis indicators:\n\nRecent messages:\n${formatMessages(recentMessages)}\n\nLatest input: "${input}"`,
        },
      ],
      { temperature: 0.1, maxTokens: 512 },
    );

    try {
      // Extract JSON from response (handles ```json ... ``` wrapping)
      const jsonStr = response.replace(/```json\s*|```\s*/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      return {
        score: typeof parsed.riskScore === 'number' ? parsed.riskScore : 0,
        suggestedTier: parsed.suggestedTier ?? null,
        indicators: Array.isArray(parsed.indicators) ? parsed.indicators : [],
      };
    } catch {
      return { score: 0, suggestedTier: null, indicators: [] };
    }
  }
}
