// src/agents/crisis-detector.ts
// Deterministic crisis detection agent
// Reference: Requirements R31 (Crisis Detection), AGENTS.md Article VI (regex-based)
// IMPORTANT: Crisis detection is DETERMINISTIC (regex-based), not AI-driven per AGENTS.md

import { logger, logCrisisEvent } from '../utils/logger.js';
import { CrisisDetectionResult } from './types.js';

/**
 * Crisis tier definitions from requirements.md R31
 * 
 * Tier 3 (IMMEDIATE): Active suicidal ideation with plan/means
 * Tier 2 (ELEVATED): Passive suicidal ideation, self-harm
 * Tier 1 (ATTENTION): Hopelessness, emotional distress
 */

/**
 * Crisis detection patterns - DETERMINISTIC (regex-based)
 * Per AGENTS.md Article VI: "Crisis detection is DETERMINISTIC (regex-based)"
 */
const TIER_3_PATTERNS: RegExp[] = [
    // Active suicidal ideation with plan
    /\b(going to|will|plan to|decided to)\s*(kill|end|take)\s*(my\s*)?(life|myself)\b/i,
    /\b(have|got|made)\s*(a\s*)?(plan|method|way)\s*(to\s*)?(die|kill|end)\b/i,
    /\b(when|after)\s*(i|im|i'm)\s*(dead|gone|not here)\b/i,
    /\b(tonight|today|tomorrow)\s*.*(die|kill|end it)\b/i,
    /\b(goodbye|farewell|last\s*words)\b.*\b(forever|everyone)\b/i,
    /\bi('?m|am)\s*going to\s*do it\b/i,
    /\bthis is (my|the) last\b/i,
    /\b(bought|have|obtained)\s*(pills|gun|rope|knife)\s*(for|to)\b/i
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
    /\b(starving|purging|binging)\s*(myself)?\b/i
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
    /\bburden\s*(to|on)\s*(everyone|family|you)\b/i
];

/**
 * False positive patterns - reduce over-flagging
 */
const FALSE_POSITIVE_PATTERNS: RegExp[] = [
    /\bi('d| would)\s*die\s*(for|of)\s*(laughter|that|this)/i,
    /\bkilling\s*(it|the game|time)\b/i,
    /\bdead\s*(serious|tired|end)\b/i,
    /\bi('m| am)\s*dying\s*(to|of laughter)\b/i,
    /\bthat\s*joke\s*killed\s*me\b/i,
    /\bin\s*the\s*past|used to|years ago\b/i,  // Historical references
    /\b(movie|book|show|song|character)\b/i,    // Media references
];

/**
 * Crisis Detector
 * Deterministic crisis detection using regex patterns
 * This is NOT an AI agent - it's deterministic code per AGENTS.md Article VI
 */
export class CrisisDetector {
    private enabled: boolean = true;

    /**
     * Analyze text for crisis indicators
     * @param text The patient's input text
     * @returns Crisis detection result
     */
    public analyze(text: string): CrisisDetectionResult {
        if (!this.enabled) {
            return {
                detected: false,
                tier: null,
                indicators: [],
                confidence: 1.0,
                recommendedAction: 'CONTINUE_NORMAL'
            };
        }

        const indicators: string[] = [];
        let tier: 1 | 2 | 3 | null = null;

        // Check for false positives first
        for (const pattern of FALSE_POSITIVE_PATTERNS) {
            if (pattern.test(text)) {
                logger.debug('Crisis check: false positive pattern matched', {
                    pattern: pattern.source
                });
                return {
                    detected: false,
                    tier: null,
                    indicators: [],
                    confidence: 0.9,
                    recommendedAction: 'CONTINUE_NORMAL'
                };
            }
        }

        // Check Tier 3 (most severe)
        for (const pattern of TIER_3_PATTERNS) {
            const match = text.match(pattern);
            if (match) {
                tier = 3;
                indicators.push(`TIER_3: "${match[0]}"`);
                logger.warn('Crisis detected: Tier 3 pattern matched', {
                    pattern: pattern.source,
                    match: match[0]
                });
            }
        }

        // Check Tier 2 (if no Tier 3)
        if (!tier) {
            for (const pattern of TIER_2_PATTERNS) {
                const match = text.match(pattern);
                if (match) {
                    tier = 2;
                    indicators.push(`TIER_2: "${match[0]}"`);
                    logger.warn('Crisis detected: Tier 2 pattern matched', {
                        pattern: pattern.source,
                        match: match[0]
                    });
                }
            }
        }

        // Check Tier 1 (if no higher tier)
        if (!tier) {
            for (const pattern of TIER_1_PATTERNS) {
                const match = text.match(pattern);
                if (match) {
                    tier = 1;
                    indicators.push(`TIER_1: "${match[0]}"`);
                    logger.info('Crisis attention: Tier 1 pattern matched', {
                        pattern: pattern.source,
                        match: match[0]
                    });
                }
            }
        }

        const detected = tier !== null;
        const confidence = detected ? 0.95 : 1.0;

        let recommendedAction: CrisisDetectionResult['recommendedAction'];
        switch (tier) {
            case 3:
                recommendedAction = 'IMMEDIATE_INTERVENTION';
                break;
            case 2:
                recommendedAction = 'ELEVATED_MONITORING';
                break;
            case 1:
                recommendedAction = 'INCREASED_ATTENTION';
                break;
            default:
                recommendedAction = 'CONTINUE_NORMAL';
        }

        if (detected) {
            logCrisisEvent('unknown_session', tier!, indicators, recommendedAction);
        }

        return {
            detected,
            tier,
            indicators,
            confidence,
            recommendedAction
        };
    }

    /**
     * Enable/disable crisis detection
     */
    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        logger.info('Crisis detector enabled status changed', { enabled });
    }

    /**
     * Check if crisis detection is enabled
     */
    public isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Get crisis resources for display
     */
    public static getCrisisResources(tier: 1 | 2 | 3): CrisisResources {
        return {
            hotlines: [
                {
                    name: 'National Suicide Prevention Lifeline',
                    number: '988',
                    available: '24/7'
                },
                {
                    name: 'Crisis Text Line',
                    number: 'Text HOME to 741741',
                    available: '24/7'
                },
                {
                    name: 'International Association for Suicide Prevention',
                    number: 'https://www.iasp.info/resources/Crisis_Centres/',
                    available: 'Directory of crisis centers'
                }
            ],
            immediateActions: tier === 3 ? [
                'You are not alone - help is available right now',
                'Please call 988 (Suicide Prevention Lifeline) immediately',
                'If you are in immediate danger, call 911',
                'Go to your nearest emergency room',
                'Stay with someone you trust'
            ] : tier === 2 ? [
                'I hear that you\'re struggling right now',
                'Your feelings are valid, and support is available',
                'Consider reaching out to a crisis counselor',
                'You don\'t have to face this alone'
            ] : [
                'It sounds like you\'re going through a difficult time',
                'These feelings are temporary, even when they don\'t feel that way',
                'Would you like to explore some coping strategies together?'
            ],
            followUpRequired: tier >= 2
        };
    }
}

/**
 * Crisis resources structure
 */
export interface CrisisResources {
    hotlines: Array<{
        name: string;
        number: string;
        available: string;
    }>;
    immediateActions: string[];
    followUpRequired: boolean;
}

// Export singleton
export const crisisDetector = new CrisisDetector();
