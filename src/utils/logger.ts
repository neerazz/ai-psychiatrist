// src/utils/logger.ts
// Centralized logging system using Winston
// Reference: Requirements R38 (Audit logging with 6-year retention)

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log directory path
const LOG_DIR = path.join(__dirname, '../../memory_directory/logs');

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

/**
 * Main application logger
 * Logs to console and errors.log file
 */
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: structuredFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat
    }),
    // Error log file - errors only
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'errors.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,  // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // Combined log file - all levels
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
      tailable: true
    })
  ]
});

/**
 * Audit logger for security and compliance events
 * Reference: Requirements R38 - 6-year retention, tamper-evident
 *
 * Events logged:
 * - data_access: Any patient data access
 * - data_modify: Patient data modifications
 * - data_delete: Data deletion requests
 * - data_export: GDPR/CCPA data exports
 * - auth_success: Successful authentication
 * - auth_failure: Failed authentication attempts
 * - crisis_detection: Crisis events detected
 * - session_event: Session lifecycle events
 */
export const auditLogger = winston.createLogger({
  level: 'info',
  format: structuredFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'audit.log'),
      maxsize: 50 * 1024 * 1024,  // 50MB
      maxFiles: 100,  // Keep many files for 6-year retention
      tailable: true
    })
  ]
});

/**
 * Crisis event logger - separate file for crisis events
 * Reference: Requirements R31 (Crisis Detection logging)
 */
export const crisisLogger = winston.createLogger({
  level: 'info',
  format: structuredFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'crisis_events.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 50,
      tailable: true
    })
  ]
});

/**
 * Log an audit event with proper structure
 * @param eventType - Type of audit event (see list above)
 * @param patientId - Patient ID (optional, will be hashed in production)
 * @param sessionId - Session ID (optional)
 * @param action - Specific action performed
 * @param details - Additional details (will be sanitized)
 */
export function logAuditEvent(
  eventType: string,
  patientId: string | null,
  sessionId: string | null,
  action: string,
  details: Record<string, unknown> = {}
): void {
  auditLogger.info({
    event_type: eventType,
    patient_id: patientId,
    session_id: sessionId,
    action,
    details,
    // Note: In Task 3 (Security), we'll add HMAC signatures here
  });
}

/**
 * Log a crisis detection event
 * Reference: Requirements R31 - privacy-preserved logging
 *
 * @param sessionId - Current session ID
 * @param tier - Crisis severity tier (1, 2, or 3)
 * @param indicators - List of detected indicators (no sensitive content)
 * @param actionTaken - Response action taken by system
 */
export function logCrisisEvent(
  sessionId: string,
  tier: 1 | 2 | 3,
  indicators: string[],
  actionTaken: string
): void {
  crisisLogger.warn({
    session_id: sessionId,
    severity_tier: tier,
    indicators,  // e.g., ['tier1_keyword_match', 'elevated_sentiment']
    action_taken: actionTaken,
    // Note: Do NOT log actual patient statements - privacy requirement
  });
}

export default logger;
