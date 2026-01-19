// src/test-config.ts
// Quick test script to verify environment configuration

import { determineModelMode, loadEnvironment, generateModelConfig, appConfig } from './config/environment.js';

console.log('=== Environment Configuration Test ===\n');

// Load environment
const env = loadEnvironment();

console.log('Environment Variables:');
console.log('- ANTHROPIC_API_KEY:', env.ANTHROPIC_API_KEY ? '✓ Set' : '✗ Not set');
console.log('- GEMINI_API_KEY:', env.GEMINI_API_KEY ? '✓ Set' : '✗ Not set');
console.log('- ELEVENLABS_API_KEY:', env.ELEVENLABS_API_KEY ? '✓ Set' : '✗ Not set');
console.log('- DEEPGRAM_API_KEY:', env.DEEPGRAM_API_KEY ? '✓ Set' : '✗ Not set');
console.log('- OPENAI_API_KEY:', env.OPENAI_API_KEY ? '✓ Set' : '✗ Not set');
console.log('- NODE_ENV:', env.NODE_ENV);
console.log('- PORT:', env.PORT);

// Determine model mode
const mode = determineModelMode(env);
console.log('\n=== Detected Model Mode ===');
console.log('Mode:', mode);

// Show model configuration
console.log('\n=== Model Configuration ===');
console.log('Dr. Sterling:');
console.log('  - Provider:', appConfig.modelConfig.drSterling.provider);
console.log('  - Model:', appConfig.modelConfig.drSterling.model);
console.log('  - Temperature:', appConfig.modelConfig.drSterling.temperature);
console.log('  - Max Tokens:', appConfig.modelConfig.drSterling.maxTokens);
console.log('  - Thinking Budget:', appConfig.modelConfig.drSterling.thinkingBudget || 'N/A');

console.log('\nContext Fetcher:');
console.log('  - Provider:', appConfig.modelConfig.contextFetcher.provider);
console.log('  - Model:', appConfig.modelConfig.contextFetcher.model);
console.log('  - Temperature:', appConfig.modelConfig.contextFetcher.temperature);

console.log('\nDeep Researcher:');
console.log('  - Provider:', appConfig.modelConfig.deepResearcher.provider);
console.log('  - Model:', appConfig.modelConfig.deepResearcher.model);
console.log('  - Temperature:', appConfig.modelConfig.deepResearcher.temperature);

console.log('\nAnalyst AI:');
console.log('  - Provider:', appConfig.modelConfig.analystAI.provider);
console.log('  - Model:', appConfig.modelConfig.analystAI.model);
console.log('  - Temperature:', appConfig.modelConfig.analystAI.temperature);

console.log('\n=== Session Configuration ===');
console.log('- Max Duration:', appConfig.sessionConfig.maxDurationMinutes, 'minutes');
console.log('- Warning At:', appConfig.sessionConfig.warningAtMinutes, 'minutes');
console.log('- Min Duration:', appConfig.sessionConfig.minDurationMinutes, 'minutes');
console.log('- Auto-save Interval:', appConfig.sessionConfig.autoSaveIntervalSeconds, 'seconds');

console.log('\n=== Audio Configuration ===');
console.log('- Sample Rate:', appConfig.audioConfig.sampleRate, 'Hz');
console.log('- Silence Threshold:', appConfig.audioConfig.silenceThresholdMs, 'ms');
console.log('- Max Silence:', appConfig.audioConfig.maxSilenceSeconds, 'seconds');

console.log('\n=== Privacy Configuration ===');
console.log('- Encryption Enabled:', appConfig.privacyConfig.encryptionEnabled);
console.log('- Audit Logging Enabled:', appConfig.privacyConfig.auditLoggingEnabled);
console.log('- Data Retention Days:', appConfig.privacyConfig.dataRetentionDays === -1 ? 'Unlimited' : appConfig.privacyConfig.dataRetentionDays);

console.log('\n=== Test Complete ✓ ===');
