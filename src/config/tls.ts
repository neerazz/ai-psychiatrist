// src/config/tls.ts
// TLS 1.3 configuration for HTTPS
// Reference: Requirements R37 (data in transit encryption)

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CERT_DIR = path.join(__dirname, '../../memory_directory/config/certs');

export interface TLSConfig {
  key: Buffer;
  cert: Buffer;
  minVersion: 'TLSv1.3';
  ciphers: string;
}

/**
 * Load TLS configuration for HTTPS server
 * Returns null if certificates don't exist (fallback to HTTP for development)
 */
export function loadTLSConfig(): TLSConfig | null {
  const keyPath = path.join(CERT_DIR, 'server.key');
  const certPath = path.join(CERT_DIR, 'server.crt');

  try {
    const key = fs.readFileSync(keyPath);
    const cert = fs.readFileSync(certPath);

    logger.info('TLS certificates loaded');

    return {
      key,
      cert,
      minVersion: 'TLSv1.3',
      // Modern cipher suite for TLS 1.3
      ciphers: [
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'TLS_AES_128_GCM_SHA256'
      ].join(':')
    };
  } catch (error) {
    logger.warn('TLS certificates not found - using HTTP (development only)', {
      keyPath,
      certPath
    });
    return null;
  }
}

/**
 * Create HTTPS server with TLS 1.3 configuration
 * Falls back to HTTP in development if no certificates
 */
export function createSecureServer(
  app: any  // Express app
): https.Server | null {
  const tlsConfig = loadTLSConfig();

  if (!tlsConfig) {
    return null;
  }

  return https.createServer(tlsConfig, app);
}
