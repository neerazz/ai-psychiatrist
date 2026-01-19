// tests/unit/config-test.ts
// Test script to verify environment configuration system

import { determineModelMode, loadEnvironment, generateModelConfig } from '../../src/config/environment.js';

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

// Generate model configuration
const modelConfig = generateModelConfig(mode);
console.log('\n=== Model Configuration ===');
console.log('Dr. Sterling:');
console.log('  - Provider:', modelConfig.drSterling.provider);
console.log('  - Model:', modelConfig.drSterling.model);
console.log('  - Temperature:', modelConfig.drSterling.temperature);
console.log('  - Max Tokens:', modelConfig.drSterling.maxTokens);
console.log('  - Thinking Budget:', modelConfig.drSterling.thinkingBudget || 'N/A');

console.log('\nContext Fetcher:');
console.log('  - Provider:', modelConfig.contextFetcher.provider);
console.log('  - Model:', modelConfig.contextFetcher.model);
console.log('  - Temperature:', modelConfig.contextFetcher.temperature);

console.log('\nDeep Researcher:');
console.log('  - Provider:', modelConfig.deepResearcher.provider);
console.log('  - Model:', modelConfig.deepResearcher.model);
console.log('  - Temperature:', modelConfig.deepResearcher.temperature);

console.log('\nAnalyst AI:');
console.log('  - Provider:', modelConfig.analystAI.provider);
console.log('  - Model:', modelConfig.analystAI.model);
console.log('  - Temperature:', modelConfig.analystAI.temperature);

console.log('\n=== Test Complete ===');
