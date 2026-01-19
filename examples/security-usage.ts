// examples/security-usage.ts
// Example usage of the security and encryption system
// Demonstrates Tasks 3.2-3.7 functionality

import {
  keyManager,
  encryptFile,
  decryptFile,
  exportPatientData,
  deletePatientData
} from '../src/encryption/index.js';

async function demonstrateSecurityFeatures() {
  console.log('='.repeat(60));
  console.log('Security System Usage Examples');
  console.log('='.repeat(60));

  // Task 3.2-3.3: Initialize key management
  console.log('\n1. Initialize Key Management');
  await keyManager.initialize();
  console.log('✓ Key manager initialized');

  const patientKeyId = keyManager.generatePatientKeyId();
  console.log(`✓ Generated patient key ID: ${patientKeyId}`);

  // Task 3.4: File encryption
  console.log('\n2. File Encryption');
  const patientId = 'example-patient-123';
  const testFile = './memory_directory/test-encrypted.json';
  const sensitiveData = {
    name: 'John Doe',
    diagnosis: 'Anxiety Disorder',
    notes: 'Patient shows improvement in coping strategies'
  };

  await encryptFile(patientId, testFile, sensitiveData);
  console.log('✓ File encrypted and saved');

  const decrypted = await decryptFile(patientId, testFile);
  console.log('✓ File decrypted successfully');
  console.log(`  Decrypted data: ${JSON.parse(decrypted).name}`);

  // Task 3.6: Data export (GDPR/CCPA)
  console.log('\n3. Data Export (GDPR/CCPA Compliance)');
  console.log('  Note: Requires database to be initialized');
  console.log('  Usage: await exportPatientData(patientId)');
  console.log('  Returns: ZIP file with all patient data');

  // Task 3.7: Secure data deletion
  console.log('\n4. Secure Data Deletion');
  console.log('  Note: Requires confirmation code');
  console.log(`  Usage: await deletePatientData(patientId, 'DELETE-${patientId}')`);
  console.log('  - Deletes patient files');
  console.log('  - Deletes sessions from database');
  console.log('  - Soft-deletes patient record');
  console.log('  - Deletes vectors from Qdrant');
  console.log('  - Preserves audit log');

  console.log('\n' + '='.repeat(60));
  console.log('✓ Security system demonstration complete');
  console.log('='.repeat(60));
}

// Run demonstration
demonstrateSecurityFeatures().catch(console.error);
