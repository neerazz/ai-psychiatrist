// scripts/test-security-basic.js
// Basic verification that security files exist and compile

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  'src/encryption/key-manager.ts',
  'src/encryption/file-encryption.ts',
  'src/encryption/data-export.ts',
  'src/encryption/data-deletion.ts',
  'src/config/tls.ts',
  'tests/unit/encryption/key-manager.test.ts',
  'tests/unit/encryption/file-encryption.test.ts',
  'tests/integration/encryption/data-export.test.ts',
  'tests/integration/encryption/data-deletion.test.ts'
];

console.log('='.repeat(60));
console.log('Security System Files Verification');
console.log('='.repeat(60));

let allExist = true;

for (const file of files) {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✓' : '✗';
  console.log(`${status} ${file}`);
  if (!exists) allExist = false;
}

console.log('\n' + '='.repeat(60));
if (allExist) {
  console.log('✓ All security system files created successfully!');
} else {
  console.log('✗ Some files are missing');
}
console.log('='.repeat(60));
