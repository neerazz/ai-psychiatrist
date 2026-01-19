// scripts/test-validator.ts
// Manual test script for configuration validator
// Run with: npm run dev scripts/test-validator.ts

import {
  validateEnvironment,
  validateSessionConfig,
  validateAudioConfig,
  validatePrivacyConfig,
  validateHardwareRequirements,
  validateConfiguration
} from '../src/config/validator.js';

console.log('=== Configuration Validator Test ===\n');

// Test 1: Environment Validation
console.log('1. Testing Environment Validation:');
const envResult = validateEnvironment();
console.log('   Valid:', envResult.valid);
console.log('   Errors:', envResult.errors);
console.log('   Warnings:', envResult.warnings);
console.log('');

// Test 2: Session Config Validation
console.log('2. Testing Session Config Validation:');
const sessionConfig = {
  maxDurationMinutes: 25,
  warningAtMinutes: 20,
  minDurationMinutes: 5,
  autoSaveIntervalSeconds: 30
};
const sessionResult = validateSessionConfig(sessionConfig);
console.log('   Valid:', sessionResult.valid);
console.log('   Errors:', sessionResult.errors);
console.log('');

// Test 3: Audio Config Validation
console.log('3. Testing Audio Config Validation:');
const audioConfig = {
  sampleRate: 16000,
  silenceThresholdMs: 500,
  maxSilenceSeconds: 10
};
const audioResult = validateAudioConfig(audioConfig);
console.log('   Valid:', audioResult.valid);
console.log('   Errors:', audioResult.errors);
console.log('');

// Test 4: Privacy Config Validation
console.log('4. Testing Privacy Config Validation:');
const privacyConfig = {
  encryptionEnabled: true,
  auditLoggingEnabled: true,
  dataRetentionDays: -1
};
const privacyResult = validatePrivacyConfig(privacyConfig);
console.log('   Valid:', privacyResult.valid);
console.log('   Errors:', privacyResult.errors);
console.log('');

// Test 5: Hardware Requirements
console.log('5. Testing Hardware Requirements:');
const hardwareCheck = validateHardwareRequirements();
console.log('   CPU Cores:', hardwareCheck.cpuCores);
console.log('   Memory (GB):', hardwareCheck.memoryGB);
console.log('   GPU VRAM (GB):', hardwareCheck.gpuVRAMGB || 'Not detected');
console.log('   Recommended Mode:', hardwareCheck.recommendedMode);
console.log('   Warnings:', hardwareCheck.warnings);
console.log('');

// Test 6: Complete Configuration Validation
console.log('6. Testing Complete Configuration Validation:');
validateConfiguration().then(result => {
  console.log('   Valid:', result.valid);
  console.log('   Errors:', result.errors);
  console.log('   Warnings:', result.warnings);
  console.log('   Hardware Mode:', result.details.hardware.recommendedMode);
  console.log('');
  console.log('=== All Tests Complete ===');
});
