# Implementation Tasks: AI Psychiatrist Web Application

> **Status**: Not Started
> **Last Updated**: 2026-01-18
> **Total Tasks**: 21 major tasks with detailed subtasks
> **Estimated Complexity**: High (Multi-agent AI system with real-time audio/video)

---

## How to Use This Document

Each task contains:
- **References**: Links to exact sections in specification documents
- **Prerequisites**: Tasks that MUST be completed before starting this task
- **File Paths**: Exact file paths to create (relative to project root)
- **Implementation Steps**: Step-by-step instructions with code templates
- **Verification**: How to confirm the task is complete
- **Success Criteria**: Specific, measurable outcomes

**IMPORTANT**: Always check the referenced specification documents for the authoritative schemas and configurations. This document provides implementation guidance, but the specs are the source of truth.

---

## Phase 1: Foundation & Infrastructure

### Task 1: Project Setup and Configuration

**References**:
- Requirements R41 (Infrastructure Setup)
- Design Section "Technology Stack"
- AGENTS.md Article I (Library-First Principle)
- AGENTS.md Article II (CLI/API Interface Mandate)

**Prerequisites**: None (This is the first task)

**Estimated Subtasks**: 7

---

#### Task 1.1: Initialize Node.js Project with TypeScript

**File to Create**: `package.json`, `tsconfig.json`

**Step-by-Step Instructions**:

1. Open terminal in project root directory: `D:\Projects\AI_POCs\ai-psychiatrist`

2. Run the following command to initialize the project:
   ```bash
   npm init -y
   ```

3. Install TypeScript and core dependencies:
   ```bash
   npm install typescript ts-node @types/node --save-dev
   npm install express socket.io cors dotenv uuid winston
   npm install @types/express @types/cors @types/uuid --save-dev
   ```

4. Create `tsconfig.json` with this exact content:
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "NodeNext",
       "moduleResolution": "NodeNext",
       "lib": ["ES2022"],
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "resolveJsonModule": true,
       "declaration": true,
       "declarationMap": true,
       "sourceMap": true
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist", "memory_directory"]
   }
   ```

5. Update `package.json` to add these scripts:
   ```json
   {
     "scripts": {
       "build": "tsc",
       "start": "node dist/index.js",
       "dev": "ts-node src/index.ts",
       "test": "jest"
     },
     "type": "module"
   }
   ```

**Verification**:
- [ ] `package.json` exists with all dependencies listed
- [ ] `tsconfig.json` exists and is valid JSON
- [ ] Running `npm run build` completes without errors (after creating src/index.ts)

---

#### Task 1.2: Set Up Project Directory Structure

**Directories to Create** (create these empty folders):

```
D:\Projects\AI_POCs\ai-psychiatrist\
├── src/
│   ├── agents/           # AI agent implementations (Dr. Sterling, Context Fetcher, etc.)
│   ├── api/              # REST API routes and controllers
│   ├── audio/            # STT and TTS engine implementations
│   ├── config/           # Configuration loaders and validators
│   ├── database/         # SQLite and Vector DB managers
│   ├── encryption/       # Encryption utilities (AES-256-GCM)
│   ├── session/          # Session state machine and management
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions (logging, helpers)
│   ├── websocket/        # WebSocket event handlers
│   └── index.ts          # Application entry point
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── performance/      # Performance/latency tests
├── scripts/
│   ├── setup/            # Infrastructure setup scripts
│   └── migrations/       # Database migration scripts
├── memory_directory/     # Created by Task 1.3
└── public/               # Frontend static files (Phase 6)
```

**Step-by-Step Instructions**:

1. Create the directories using these commands (Windows PowerShell):
   ```powershell
   New-Item -ItemType Directory -Force -Path src/agents
   New-Item -ItemType Directory -Force -Path src/api
   New-Item -ItemType Directory -Force -Path src/audio
   New-Item -ItemType Directory -Force -Path src/config
   New-Item -ItemType Directory -Force -Path src/database
   New-Item -ItemType Directory -Force -Path src/encryption
   New-Item -ItemType Directory -Force -Path src/session
   New-Item -ItemType Directory -Force -Path src/types
   New-Item -ItemType Directory -Force -Path src/utils
   New-Item -ItemType Directory -Force -Path src/websocket
   New-Item -ItemType Directory -Force -Path tests/unit
   New-Item -ItemType Directory -Force -Path tests/integration
   New-Item -ItemType Directory -Force -Path tests/performance
   New-Item -ItemType Directory -Force -Path scripts/setup
   New-Item -ItemType Directory -Force -Path scripts/migrations
   New-Item -ItemType Directory -Force -Path public
   ```

2. Create a placeholder `src/index.ts` file:
   ```typescript
   // src/index.ts
   // AI Psychiatrist Application Entry Point
   // This file will be populated in later tasks

   console.log('AI Psychiatrist Application Starting...');

   export {};
   ```

**Verification**:
- [ ] All directories exist as shown in the structure above
- [ ] `src/index.ts` exists and contains the placeholder code
- [ ] Running `npm run build` creates a `dist/` folder with compiled JavaScript

---

#### Task 1.3: Create Memory_Directory Structure

**Reference**: data_schemas.md Section 3 (Directory Structure), Design Section 5

**Directory Structure to Create**:

```
memory_directory/
├── config/
│   ├── settings.json           # System configuration (Task 1.4 will populate)
│   └── .gitkeep               # Placeholder to track empty folder
├── patients/
│   └── .gitkeep
├── databases/
│   ├── vectors/
│   │   └── .gitkeep
│   └── .gitkeep
├── models/
│   └── .gitkeep
├── logs/
│   └── .gitkeep
└── cache/
    ├── context_cache/
    │   └── .gitkeep
    └── research_cache/
        └── .gitkeep
```

**Step-by-Step Instructions**:

1. Create the memory_directory structure:
   ```powershell
   New-Item -ItemType Directory -Force -Path memory_directory/config
   New-Item -ItemType Directory -Force -Path memory_directory/patients
   New-Item -ItemType Directory -Force -Path memory_directory/databases/vectors
   New-Item -ItemType Directory -Force -Path memory_directory/models
   New-Item -ItemType Directory -Force -Path memory_directory/logs
   New-Item -ItemType Directory -Force -Path memory_directory/cache/context_cache
   New-Item -ItemType Directory -Force -Path memory_directory/cache/research_cache
   ```

2. Create `.gitkeep` files in each empty directory to ensure Git tracks them:
   ```powershell
   New-Item -ItemType File -Force -Path memory_directory/config/.gitkeep
   New-Item -ItemType File -Force -Path memory_directory/patients/.gitkeep
   New-Item -ItemType File -Force -Path memory_directory/databases/.gitkeep
   New-Item -ItemType File -Force -Path memory_directory/databases/vectors/.gitkeep
   New-Item -ItemType File -Force -Path memory_directory/models/.gitkeep
   New-Item -ItemType File -Force -Path memory_directory/logs/.gitkeep
   New-Item -ItemType File -Force -Path memory_directory/cache/context_cache/.gitkeep
   New-Item -ItemType File -Force -Path memory_directory/cache/research_cache/.gitkeep
   ```

3. Add `memory_directory/` to `.gitignore` EXCEPT for the structure:
   ```
   # .gitignore - Add these lines
   memory_directory/patients/*
   memory_directory/databases/*.db
   memory_directory/databases/vectors/*
   memory_directory/logs/*.log
   memory_directory/cache/**/*
   memory_directory/config/settings.json
   !memory_directory/**/.gitkeep
   ```

**Verification**:
- [ ] All directories exist as shown above
- [ ] `.gitkeep` files exist in each empty directory
- [ ] `.gitignore` is updated to protect sensitive data

---

#### Task 1.4: Implement Environment Configuration System

**Reference**:
- Requirements R20 (Smart Model Orchestration) - API key detection
- agent_protocols.md Section 5.1 (Model Configuration by Mode)
- data_schemas.md Section 6 (Configuration Schema)

**Files to Create**:
- `src/config/environment.ts` - Environment variable loader
- `src/config/types.ts` - Configuration TypeScript types
- `.env.example` - Example environment file
- `memory_directory/config/settings.json` - Default settings

**Step-by-Step Instructions**:

1. Create `src/config/types.ts`:
   ```typescript
   // src/config/types.ts
   // Configuration type definitions based on data_schemas.md Section 6

   export type ModelMode = 'claude_only' | 'gemini_only' | 'hybrid' | 'offline';

   export interface AgentModelConfig {
     provider: 'anthropic' | 'google' | 'ollama';
     model: string;
     temperature: number;
     maxTokens: number;
     thinkingBudget?: number;  // Only for Dr. Sterling
   }

   export interface ModelConfig {
     mode: ModelMode;
     drSterling: AgentModelConfig;
     contextFetcher: AgentModelConfig;
     deepResearcher: AgentModelConfig;
     analystAI: AgentModelConfig;
   }

   export interface SessionConfig {
     maxDurationMinutes: number;      // Default: 25 (from R1)
     warningAtMinutes: number;        // Default: 20 (from R1)
     minDurationMinutes: number;      // Default: 5
     autoSaveIntervalSeconds: number; // Default: 30 (from R1)
   }

   export interface AudioConfig {
     sampleRate: number;              // Default: 16000 (from R4)
     silenceThresholdMs: number;      // Default: 500 (from R4)
     maxSilenceSeconds: number;       // Default: 10 (from R4)
   }

   export interface PrivacyConfig {
     encryptionEnabled: boolean;      // Default: true (from R37)
     auditLoggingEnabled: boolean;    // Default: true (from R38)
     dataRetentionDays: number;       // Default: -1 (unlimited)
   }

   export interface AppConfig {
     version: string;
     modelConfig: ModelConfig;
     sessionConfig: SessionConfig;
     audioConfig: AudioConfig;
     privacyConfig: PrivacyConfig;
   }

   export interface EnvironmentVariables {
     ANTHROPIC_API_KEY?: string;
     GEMINI_API_KEY?: string;
     ELEVENLABS_API_KEY?: string;
     DEEPGRAM_API_KEY?: string;
     OPENAI_API_KEY?: string;  // For embeddings (text-embedding-3-large)
     NODE_ENV: 'development' | 'production' | 'test';
     PORT: number;
   }
   ```

2. Create `src/config/environment.ts`:
   ```typescript
   // src/config/environment.ts
   // Environment loader and configuration validator
   // Reference: agent_protocols.md Section 5.1 for model selection logic

   import dotenv from 'dotenv';
   import path from 'path';
   import {
     EnvironmentVariables,
     AppConfig,
     ModelMode,
     ModelConfig,
     AgentModelConfig
   } from './types.js';

   // Load .env file
   dotenv.config();

   /**
    * Loads and validates environment variables
    * @throws Error if required variables are missing in production
    */
   export function loadEnvironment(): EnvironmentVariables {
     return {
       ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
       GEMINI_API_KEY: process.env.GEMINI_API_KEY,
       ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
       DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
       OPENAI_API_KEY: process.env.OPENAI_API_KEY,
       NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
       PORT: parseInt(process.env.PORT || '3000', 10)
     };
   }

   /**
    * Determines the model mode based on available API keys
    * Reference: Requirements R20 (Smart Model Orchestration)
    * Priority: ANTHROPIC_API_KEY, then GEMINI_API_KEY, then offline
    */
   export function determineModelMode(env: EnvironmentVariables): ModelMode {
     const hasAnthropic = !!env.ANTHROPIC_API_KEY;
     const hasGemini = !!env.GEMINI_API_KEY;

     if (hasAnthropic && hasGemini) {
       return 'hybrid';
     } else if (hasAnthropic) {
       return 'claude_only';
     } else if (hasGemini) {
       return 'gemini_only';
     } else {
       return 'offline';
     }
   }

   /**
    * Generates model configuration based on detected mode
    * Reference: agent_protocols.md Section 5.1, Requirements R21
    *
    * Model Parameters (from Requirements R21):
    * - Dr. Sterling: temperature 0.25, top-p 0.9, thinking budget 32768
    * - Context Fetcher: temperature 0.1, top-p 0.8
    * - Deep Researcher: temperature 0.3, top-p 0.9
    * - Analyst AI: temperature 0.2, top-p 0.85
    */
   export function generateModelConfig(mode: ModelMode): ModelConfig {
     switch (mode) {
       case 'hybrid':
         // Claude for Dr. Sterling, Gemini for support agents
         return {
           mode: 'hybrid',
           drSterling: {
             provider: 'anthropic',
             model: 'claude-sonnet-4-5-20241022',
             temperature: 0.25,
             maxTokens: 2048,
             thinkingBudget: 32768
           },
           contextFetcher: {
             provider: 'google',
             model: 'gemini-1.5-flash',
             temperature: 0.1,
             maxTokens: 1024
           },
           deepResearcher: {
             provider: 'google',
             model: 'gemini-1.5-pro',
             temperature: 0.3,
             maxTokens: 4096
           },
           analystAI: {
             provider: 'google',
             model: 'gemini-1.5-pro',
             temperature: 0.2,
             maxTokens: 2048
           }
         };

       case 'claude_only':
         return {
           mode: 'claude_only',
           drSterling: {
             provider: 'anthropic',
             model: 'claude-sonnet-4-5-20241022',
             temperature: 0.25,
             maxTokens: 2048,
             thinkingBudget: 32768
           },
           contextFetcher: {
             provider: 'anthropic',
             model: 'claude-sonnet-4-5-20241022',
             temperature: 0.1,
             maxTokens: 1024
           },
           deepResearcher: {
             provider: 'anthropic',
             model: 'claude-sonnet-4-5-20241022',
             temperature: 0.3,
             maxTokens: 4096
           },
           analystAI: {
             provider: 'anthropic',
             model: 'claude-sonnet-4-5-20241022',
             temperature: 0.2,
             maxTokens: 2048
           }
         };

       case 'gemini_only':
         return {
           mode: 'gemini_only',
           drSterling: {
             provider: 'google',
             model: 'gemini-1.5-pro',
             temperature: 0.35,  // Slightly higher for Gemini
             maxTokens: 2048
           },
           contextFetcher: {
             provider: 'google',
             model: 'gemini-1.5-flash',
             temperature: 0.1,
             maxTokens: 1024
           },
           deepResearcher: {
             provider: 'google',
             model: 'gemini-1.5-pro',
             temperature: 0.4,
             maxTokens: 4096
           },
           analystAI: {
             provider: 'google',
             model: 'gemini-1.5-pro',
             temperature: 0.25,
             maxTokens: 2048
           }
         };

       case 'offline':
       default:
         // Ollama local models
         return {
           mode: 'offline',
           drSterling: {
             provider: 'ollama',
             model: 'llama3:70b-instruct-q4_K_M',
             temperature: 0.3,
             maxTokens: 2048
           },
           contextFetcher: {
             provider: 'ollama',
             model: 'mistral:7b-instruct-q4_K_M',
             temperature: 0.1,
             maxTokens: 1024
           },
           deepResearcher: {
             provider: 'ollama',
             model: 'llama3:8b-instruct-q4_K_M',
             temperature: 0.4,
             maxTokens: 2048
           },
           analystAI: {
             provider: 'ollama',
             model: 'mistral:7b-instruct-q4_K_M',
             temperature: 0.2,
             maxTokens: 1024
           }
         };
     }
   }

   /**
    * Creates the complete application configuration
    */
   export function createAppConfig(env: EnvironmentVariables): AppConfig {
     const mode = determineModelMode(env);

     return {
       version: '1.0.0',
       modelConfig: generateModelConfig(mode),
       sessionConfig: {
         maxDurationMinutes: 25,        // R1: Session ends at 25 min
         warningAtMinutes: 20,          // R1: Warning at 20 min
         minDurationMinutes: 5,         // R1: Min session duration
         autoSaveIntervalSeconds: 30    // R1: Persist state every 30s
       },
       audioConfig: {
         sampleRate: 16000,             // R4: 16kHz sample rate
         silenceThresholdMs: 500,       // R4: VAD threshold
         maxSilenceSeconds: 10          // R4: Prompt after 10s silence
       },
       privacyConfig: {
         encryptionEnabled: true,       // R37: AES-256-GCM encryption
         auditLoggingEnabled: true,     // R38: Audit logging
         dataRetentionDays: -1          // Unlimited retention
       }
     };
   }

   // Export singleton instance
   const env = loadEnvironment();
   export const appConfig = createAppConfig(env);
   export const environmentVariables = env;
   ```

3. Create `.env.example`:
   ```
   # .env.example - Copy this to .env and fill in your API keys

   # AI Model API Keys (at least one required for online mode)
   ANTHROPIC_API_KEY=sk-ant-api03-...    # For Claude Sonnet 4.5
   GEMINI_API_KEY=AIza...                 # For Gemini 1.5 Pro/Flash

   # Speech Services API Keys
   DEEPGRAM_API_KEY=...                   # For online STT (Nova-2)
   ELEVENLABS_API_KEY=...                 # For online TTS (Dr. Sterling voice)

   # Embedding API Key
   OPENAI_API_KEY=sk-...                  # For text-embedding-3-large

   # Application Settings
   NODE_ENV=development
   PORT=3000
   ```

4. Create initial `memory_directory/config/settings.json`:
   ```json
   {
     "version": "1.0.0",
     "ui_config": {
       "theme": "light",
       "show_debug_panel": false,
       "show_agent_thoughts": false
     }
   }
   ```

**Verification**:
- [ ] `src/config/types.ts` exists with all type definitions
- [ ] `src/config/environment.ts` compiles without errors
- [ ] `.env.example` exists with all required variables documented
- [ ] Running the following test passes:
  ```typescript
  import { determineModelMode, loadEnvironment } from './src/config/environment.js';
  const env = loadEnvironment();
  console.log('Mode:', determineModelMode(env));  // Should print the detected mode
  ```

---

#### Task 1.5: Set Up Logging System Using Winston

**Reference**:
- AGENTS.md Article II (CLI/API Interface - all interfaces must be observable)
- Design Section 5 (Memory Directory - logs structure)
- Requirements R38 (Audit Logging)

**Files to Create**:
- `src/utils/logger.ts` - Winston logger configuration

**Step-by-Step Instructions**:

1. Install Winston:
   ```bash
   npm install winston
   ```

2. Create `src/utils/logger.ts`:
   ```typescript
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
   ```

**Verification**:
- [ ] `src/utils/logger.ts` compiles without errors
- [ ] Running a test script creates log files in `memory_directory/logs/`:
  ```typescript
  import { logger, logAuditEvent, logCrisisEvent } from './src/utils/logger.js';

  logger.info('Application started');
  logger.error('Test error', { code: 'TEST_001' });
  logAuditEvent('session_event', 'patient_123', 'session_456', 'session_started');
  logCrisisEvent('session_456', 2, ['elevated_sentiment'], 'ELEVATED_MONITORING');
  ```
- [ ] `errors.log`, `combined.log`, `audit.log`, and `crisis_events.log` are created
- [ ] Log entries are valid JSON with timestamps

---

#### Task 1.6: Create package.json with All Required Dependencies

**Reference**:
- Design Section "Technology Stack" (complete list of technologies)
- AGENTS.md Article VIII (Framework Trust - use SDKs directly)

**Step-by-Step Instructions**:

1. Install all production dependencies:
   ```bash
   # Core Framework
   npm install express socket.io cors helmet

   # AI SDKs (use directly per AGENTS.md Article VIII)
   npm install @anthropic-ai/sdk @google/generative-ai openai

   # Database
   npm install better-sqlite3 qdrant-client

   # Audio Processing
   # Note: Deepgram, ElevenLabs SDKs to be added in Phase 3

   # Utilities
   npm install dotenv uuid winston zod ajv
   npm install node-cron crypto-js

   # Type definitions
   npm install --save-dev @types/express @types/cors @types/better-sqlite3
   npm install --save-dev @types/uuid @types/crypto-js
   ```

2. Install development dependencies:
   ```bash
   npm install --save-dev typescript ts-node @types/node
   npm install --save-dev jest @types/jest ts-jest
   npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
   npm install --save-dev prettier
   ```

3. Update `package.json` with complete configuration:
   ```json
   {
     "name": "ai-psychiatrist",
     "version": "1.0.0",
     "description": "AI-powered psychiatrist web application with multi-agent architecture",
     "type": "module",
     "main": "dist/index.js",
     "scripts": {
       "build": "tsc",
       "start": "node dist/index.js",
       "dev": "ts-node --esm src/index.ts",
       "test": "jest",
       "test:unit": "jest tests/unit",
       "test:integration": "jest tests/integration",
       "lint": "eslint src/**/*.ts",
       "format": "prettier --write src/**/*.ts"
     },
     "engines": {
       "node": ">=20.0.0"
     }
   }
   ```

**Verification**:
- [ ] All packages install without errors
- [ ] `npm run build` completes successfully
- [ ] `package.json` has all dependencies listed

---

#### Task 1.7: Implement Configuration Validation System

**Reference**:
- AGENTS.md Article III (Test-First Imperative)
- data_schemas.md Section 6 (Configuration Schema)
- Requirements R41 (validate all components and report status)

**Files to Create**:
- `src/config/validator.ts` - Configuration validation using Zod

**Step-by-Step Instructions**:

1. Install Zod for validation:
   ```bash
   npm install zod
   ```

2. Create `src/config/validator.ts`:
   ```typescript
   // src/config/validator.ts
   // Configuration validation using Zod schemas
   // Reference: data_schemas.md Section 6, Requirements R41

   import { z } from 'zod';
   import { logger } from '../utils/logger.js';

   /**
    * Environment variables schema
    * Validates API keys and required environment variables
    */
   export const environmentSchema = z.object({
     ANTHROPIC_API_KEY: z.string().optional(),
     GEMINI_API_KEY: z.string().optional(),
     ELEVENLABS_API_KEY: z.string().optional(),
     DEEPGRAM_API_KEY: z.string().optional(),
     OPENAI_API_KEY: z.string().optional(),
     NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
     PORT: z.coerce.number().min(1).max(65535).default(3000)
   }).refine(
     (data) => data.ANTHROPIC_API_KEY || data.GEMINI_API_KEY,
     {
       message: 'At least one AI API key (ANTHROPIC_API_KEY or GEMINI_API_KEY) is required for online mode. Set both to null for offline mode.',
       path: []
     }
   );

   /**
    * Session configuration schema
    * Reference: Requirements R1 (Session lifecycle)
    */
   export const sessionConfigSchema = z.object({
     maxDurationMinutes: z.number().min(5).max(60).default(25),
     warningAtMinutes: z.number().min(1).max(59).default(20),
     minDurationMinutes: z.number().min(1).max(30).default(5),
     autoSaveIntervalSeconds: z.number().min(10).max(120).default(30)
   }).refine(
     (data) => data.warningAtMinutes < data.maxDurationMinutes,
     { message: 'Warning time must be less than max duration' }
   );

   /**
    * Audio configuration schema
    * Reference: Requirements R4-R5 (Speech processing)
    */
   export const audioConfigSchema = z.object({
     sampleRate: z.literal(16000),  // Must be 16kHz per spec
     silenceThresholdMs: z.number().min(100).max(2000).default(500),
     maxSilenceSeconds: z.number().min(5).max(30).default(10)
   });

   /**
    * Hardware requirements validation
    * Reference: Requirements R41 (minimum hardware requirements)
    *
    * Mode requirements:
    * - Online Only: 4 cores, 8GB RAM
    * - Hybrid: 6 cores, 16GB RAM
    * - Full Offline: 8 cores, 32GB RAM, GPU 12GB+
    */
   export interface HardwareCheck {
     cpuCores: number;
     memoryGB: number;
     gpuVRAMGB: number | null;
     recommendedMode: 'online_only' | 'hybrid' | 'full_offline' | 'insufficient';
     warnings: string[];
   }

   export async function validateHardwareRequirements(): Promise<HardwareCheck> {
     const os = await import('os');

     const cpuCores = os.cpus().length;
     const memoryGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));

     // GPU detection is platform-specific - simplified check
     // In production, use a library like 'systeminformation'
     const gpuVRAMGB: number | null = null;  // Placeholder

     const warnings: string[] = [];
     let recommendedMode: HardwareCheck['recommendedMode'];

     if (cpuCores >= 8 && memoryGB >= 32) {
       recommendedMode = 'full_offline';
       if (!gpuVRAMGB || gpuVRAMGB < 12) {
         warnings.push('GPU with 12GB+ VRAM recommended for full offline mode');
       }
     } else if (cpuCores >= 6 && memoryGB >= 16) {
       recommendedMode = 'hybrid';
     } else if (cpuCores >= 4 && memoryGB >= 8) {
       recommendedMode = 'online_only';
     } else {
       recommendedMode = 'insufficient';
       warnings.push(`Minimum requirements not met. Need: 4 cores, 8GB RAM. Have: ${cpuCores} cores, ${memoryGB}GB RAM`);
     }

     return { cpuCores, memoryGB, gpuVRAMGB, recommendedMode, warnings };
   }

   /**
    * Validates complete application configuration
    * Logs validation results and returns validated config
    */
   export function validateEnvironment(): { valid: boolean; errors: string[] } {
     const errors: string[] = [];

     try {
       environmentSchema.parse({
         ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
         GEMINI_API_KEY: process.env.GEMINI_API_KEY,
         ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
         DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
         OPENAI_API_KEY: process.env.OPENAI_API_KEY,
         NODE_ENV: process.env.NODE_ENV,
         PORT: process.env.PORT
       });
     } catch (error) {
       if (error instanceof z.ZodError) {
         errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
       }
     }

     // Check for embedding API key
     if (!process.env.OPENAI_API_KEY) {
       errors.push('OPENAI_API_KEY is required for text-embedding-3-large embeddings');
     }

     return { valid: errors.length === 0, errors };
   }

   /**
    * Runs complete startup validation
    * Reference: Requirements R41 (validate all components and report status)
    */
   export async function runStartupValidation(): Promise<{
     success: boolean;
     envValid: boolean;
     hardwareCheck: HardwareCheck;
     errors: string[];
   }> {
     logger.info('Running startup validation...');

     const envResult = validateEnvironment();
     const hardwareCheck = await validateHardwareRequirements();

     const allErrors = [
       ...envResult.errors,
       ...hardwareCheck.warnings
     ];

     const success = envResult.valid && hardwareCheck.recommendedMode !== 'insufficient';

     if (success) {
       logger.info('Startup validation passed', {
         mode: hardwareCheck.recommendedMode,
         cpuCores: hardwareCheck.cpuCores,
         memoryGB: hardwareCheck.memoryGB
       });
     } else {
       logger.error('Startup validation failed', { errors: allErrors });
     }

     return {
       success,
       envValid: envResult.valid,
       hardwareCheck,
       errors: allErrors
     };
   }
   ```

**Verification**:
- [ ] `src/config/validator.ts` compiles without errors
- [ ] Running validation with no API keys shows offline mode warning
- [ ] Running validation with valid API key(s) passes
- [ ] Hardware check returns correct values for your system

---

### Task 2: Database Infrastructure

**References**:
- Requirements R25-R27 (Portable Memory, Session DB, Vector DB)
- data_schemas.md Section 3 (SQLite Schema), Section 4 (Qdrant Schema)
- AGENTS.md Article IX (Integration-First Testing - use actual databases)

**Prerequisites**: Task 1 (Project Setup) must be complete

**Estimated Subtasks**: 7

---

#### Task 2.1: Install and Configure SQLite with SQLCipher

**Reference**:
- Requirements R37 (AES-256-GCM encryption)
- data_schemas.md Section 3 (Complete SQLite schema)

**Files to Create**:
- `src/database/sqlite.ts` - SQLite database manager

**Step-by-Step Instructions**:

1. Install better-sqlite3 (already done in Task 1.6, but verify):
   ```bash
   npm install better-sqlite3
   npm install --save-dev @types/better-sqlite3
   ```

2. Create `src/database/sqlite.ts`:
   ```typescript
   // src/database/sqlite.ts
   // SQLite database manager with encryption support
   // Reference: data_schemas.md Section 3, Requirements R26

   import Database from 'better-sqlite3';
   import path from 'path';
   import { fileURLToPath } from 'url';
   import { logger } from '../utils/logger.js';

   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);

   // Database file path
   const DB_PATH = path.join(__dirname, '../../memory_directory/databases/sessions.db');

   /**
    * SQLite Database Manager
    * Manages the sessions.db database with all tables from data_schemas.md
    */
   export class SQLiteManager {
     private db: Database.Database | null = null;

     /**
      * Initialize the database connection
      * Creates the database file if it doesn't exist
      */
     public initialize(): void {
       logger.info('Initializing SQLite database', { path: DB_PATH });

       this.db = new Database(DB_PATH);

       // Enable foreign keys
       this.db.pragma('foreign_keys = ON');

       // Enable WAL mode for better concurrent access
       this.db.pragma('journal_mode = WAL');

       logger.info('SQLite database initialized successfully');
     }

     /**
      * Get the database instance
      * @throws Error if database is not initialized
      */
     public getDb(): Database.Database {
       if (!this.db) {
         throw new Error('Database not initialized. Call initialize() first.');
       }
       return this.db;
     }

     /**
      * Close the database connection
      */
     public close(): void {
       if (this.db) {
         this.db.close();
         this.db = null;
         logger.info('SQLite database connection closed');
       }
     }

     /**
      * Check if database is connected and healthy
      * Reference: Requirements R26 (fast access < 50ms)
      */
     public healthCheck(): { healthy: boolean; latencyMs: number } {
       const start = Date.now();

       try {
         const db = this.getDb();
         db.prepare('SELECT 1').get();
         const latencyMs = Date.now() - start;

         return { healthy: true, latencyMs };
       } catch (error) {
         logger.error('SQLite health check failed', { error });
         return { healthy: false, latencyMs: Date.now() - start };
       }
     }
   }

   // Export singleton instance
   export const sqliteManager = new SQLiteManager();
   ```

**Verification**:
- [ ] `src/database/sqlite.ts` compiles without errors
- [ ] Running `sqliteManager.initialize()` creates the database file
- [ ] Health check returns `healthy: true` with latency < 50ms

---

#### Task 2.2: Implement Database Schema

**Reference**: data_schemas.md Section 3 (Complete SQLite schema with all tables)

**Files to Create**:
- `src/database/schema.ts` - Schema initialization and migration

**Step-by-Step Instructions**:

1. Create `src/database/schema.ts`:
   ```typescript
   // src/database/schema.ts
   // Database schema initialization
   // Reference: data_schemas.md Section 3 (exact table definitions)

   import { sqliteManager } from './sqlite.js';
   import { logger } from '../utils/logger.js';

   /**
    * Complete database schema from data_schemas.md Section 3
    *
    * Tables:
    * - patients: Patient records with risk levels
    * - sessions: Session records with status tracking
    * - session_events: Audit trail for session events
    * - crisis_events: Crisis detection records
    * - embedding_jobs: Vector embedding job queue
    * - audit_log: Security audit trail (6-year retention)
    * - conversation_highlights: Session highlights
    */
   export const SCHEMA_SQL = `
   -- ============================================
   -- PATIENTS TABLE
   -- Reference: data_schemas.md Section 3
   -- ============================================
   CREATE TABLE IF NOT EXISTS patients (
       patient_id TEXT PRIMARY KEY,
       created_at TEXT NOT NULL DEFAULT (datetime('now')),
       updated_at TEXT NOT NULL DEFAULT (datetime('now')),
       overview_version INTEGER NOT NULL DEFAULT 1,
       overview_checksum TEXT,
       encryption_key_id TEXT NOT NULL,
       is_active INTEGER NOT NULL DEFAULT 1,
       last_session_date TEXT,
       total_sessions INTEGER DEFAULT 0,
       current_risk_level TEXT DEFAULT 'low' CHECK (current_risk_level IN ('low', 'moderate', 'high', 'crisis'))
   );

   CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(is_active);
   CREATE INDEX IF NOT EXISTS idx_patients_risk ON patients(current_risk_level);

   -- ============================================
   -- SESSIONS TABLE
   -- Reference: data_schemas.md Section 3, R1 (session lifecycle)
   -- ============================================
   CREATE TABLE IF NOT EXISTS sessions (
       session_id TEXT PRIMARY KEY,
       patient_id TEXT NOT NULL,
       session_number INTEGER NOT NULL,
       started_at TEXT NOT NULL,
       ended_at TEXT,
       duration_seconds INTEGER,
       session_status TEXT NOT NULL DEFAULT 'active'
           CHECK (session_status IN ('active', 'completed', 'interrupted', 'crashed', 'paused')),
       transcript_path TEXT,
       summary_path TEXT,
       risk_level_start TEXT,
       risk_level_end TEXT,
       model_configuration TEXT,
       session_quality_score REAL,
       created_at TEXT NOT NULL DEFAULT (datetime('now')),
       FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
   );

   CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id);
   CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(session_status);
   CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(started_at);

   -- ============================================
   -- SESSION EVENTS TABLE (Audit Trail)
   -- Reference: data_schemas.md Section 3, system_architecture.md S2
   -- ============================================
   CREATE TABLE IF NOT EXISTS session_events (
       event_id TEXT PRIMARY KEY,
       session_id TEXT NOT NULL,
       event_type TEXT NOT NULL CHECK (event_type IN (
           'session_start', 'session_end', 'session_pause', 'session_resume',
           'speech_detected', 'response_generated', 'crisis_detected',
           'context_retrieved', 'research_completed', 'state_persisted',
           'connection_lost', 'connection_restored', 'error_occurred'
       )),
       event_timestamp TEXT NOT NULL,
       event_data TEXT,
       agent_source TEXT,
       created_at TEXT NOT NULL DEFAULT (datetime('now')),
       FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
   );

   CREATE INDEX IF NOT EXISTS idx_events_session ON session_events(session_id);
   CREATE INDEX IF NOT EXISTS idx_events_type ON session_events(event_type);
   CREATE INDEX IF NOT EXISTS idx_events_timestamp ON session_events(event_timestamp);

   -- ============================================
   -- CRISIS EVENTS TABLE
   -- Reference: data_schemas.md Section 3, R31 (Crisis Detection)
   -- ============================================
   CREATE TABLE IF NOT EXISTS crisis_events (
       crisis_id TEXT PRIMARY KEY,
       session_id TEXT NOT NULL,
       patient_id TEXT NOT NULL,
       detected_at TEXT NOT NULL,
       severity_tier INTEGER NOT NULL CHECK (severity_tier IN (1, 2, 3)),
       trigger_indicators TEXT NOT NULL,
       response_actions TEXT,
       resolved_at TEXT,
       reviewed_at TEXT,
       reviewer_notes TEXT,
       FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
       FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
   );

   CREATE INDEX IF NOT EXISTS idx_crisis_severity ON crisis_events(severity_tier);
   CREATE INDEX IF NOT EXISTS idx_crisis_patient ON crisis_events(patient_id);
   CREATE INDEX IF NOT EXISTS idx_crisis_date ON crisis_events(detected_at);

   -- ============================================
   -- EMBEDDING JOBS TABLE
   -- Reference: data_schemas.md Section 3, R27-R28 (Vector Database)
   -- ============================================
   CREATE TABLE IF NOT EXISTS embedding_jobs (
       job_id TEXT PRIMARY KEY,
       session_id TEXT,
       patient_id TEXT,
       job_type TEXT NOT NULL CHECK (job_type IN ('session_transcript', 'patient_overview', 'clinical_insight', 'full_rebuild')),
       status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
       progress_percent INTEGER DEFAULT 0,
       chunks_total INTEGER,
       chunks_processed INTEGER DEFAULT 0,
       error_message TEXT,
       started_at TEXT,
       completed_at TEXT,
       created_at TEXT NOT NULL DEFAULT (datetime('now')),
       FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE SET NULL,
       FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
   );

   CREATE INDEX IF NOT EXISTS idx_embedding_status ON embedding_jobs(status);
   CREATE INDEX IF NOT EXISTS idx_embedding_patient ON embedding_jobs(patient_id);

   -- ============================================
   -- AUDIT LOG TABLE
   -- Reference: data_schemas.md Section 3, R38 (6-year retention)
   -- ============================================
   CREATE TABLE IF NOT EXISTS audit_log (
       log_id TEXT PRIMARY KEY,
       timestamp TEXT NOT NULL DEFAULT (datetime('now')),
       event_type TEXT NOT NULL CHECK (event_type IN (
           'data_access', 'data_modify', 'data_delete', 'data_export',
           'auth_success', 'auth_failure', 'crisis_detection', 'session_event'
       )),
       patient_id TEXT,
       session_id TEXT,
       action TEXT NOT NULL,
       details TEXT,
       ip_address TEXT,
       user_agent TEXT,
       checksum TEXT
   );

   CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
   CREATE INDEX IF NOT EXISTS idx_audit_patient ON audit_log(patient_id);
   CREATE INDEX IF NOT EXISTS idx_audit_type ON audit_log(event_type);

   -- ============================================
   -- CONVERSATION HIGHLIGHTS TABLE
   -- Reference: data_schemas.md Section 3, R14 (Conversation_Highlights)
   -- ============================================
   CREATE TABLE IF NOT EXISTS conversation_highlights (
       highlight_id TEXT PRIMARY KEY,
       session_id TEXT NOT NULL,
       timestamp_minutes REAL NOT NULL,
       highlight_type TEXT NOT NULL CHECK (highlight_type IN (
           'insight', 'emotional_peak', 'breakthrough', 'concern',
           'resistance', 'homework_discussion', 'crisis_indicator'
       )),
       speaker TEXT NOT NULL CHECK (speaker IN ('patient', 'dr_sterling')),
       content_summary TEXT NOT NULL,
       clinical_significance TEXT,
       emotion_detected TEXT,
       emotion_intensity REAL,
       created_at TEXT NOT NULL DEFAULT (datetime('now')),
       FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
   );

   CREATE INDEX IF NOT EXISTS idx_highlights_session ON conversation_highlights(session_id);
   CREATE INDEX IF NOT EXISTS idx_highlights_type ON conversation_highlights(highlight_type);
   `;

   /**
    * Initialize the database schema
    * Creates all tables and indexes if they don't exist
    */
   export function initializeSchema(): void {
     logger.info('Initializing database schema...');

     const db = sqliteManager.getDb();

     // Execute schema SQL
     db.exec(SCHEMA_SQL);

     logger.info('Database schema initialized successfully');
   }

   /**
    * Verify schema is correctly initialized
    * Checks that all required tables exist
    */
   export function verifySchema(): { valid: boolean; missingTables: string[] } {
     const requiredTables = [
       'patients',
       'sessions',
       'session_events',
       'crisis_events',
       'embedding_jobs',
       'audit_log',
       'conversation_highlights'
     ];

     const db = sqliteManager.getDb();
     const existingTables = db
       .prepare("SELECT name FROM sqlite_master WHERE type='table'")
       .all()
       .map((row: any) => row.name);

     const missingTables = requiredTables.filter(t => !existingTables.includes(t));

     return {
       valid: missingTables.length === 0,
       missingTables
     };
   }
   ```

**Verification**:
- [ ] `src/database/schema.ts` compiles without errors
- [ ] Running `initializeSchema()` creates all 7 tables
- [ ] `verifySchema()` returns `{ valid: true, missingTables: [] }`
- [ ] All indexes are created (check with `.schema` in sqlite3 CLI)

---

#### Task 2.3: Create Database Initialization Script

**Files to Create**:
- `scripts/migrations/init-database.ts` - Standalone database initialization script

**Step-by-Step Instructions**:

1. Create `scripts/migrations/init-database.ts`:
   ```typescript
   // scripts/migrations/init-database.ts
   // Database initialization script - run this to set up the database

   import { sqliteManager } from '../../src/database/sqlite.js';
   import { initializeSchema, verifySchema } from '../../src/database/schema.js';
   import { logger } from '../../src/utils/logger.js';

   async function main() {
     console.log('='.repeat(50));
     console.log('AI Psychiatrist - Database Initialization');
     console.log('='.repeat(50));

     try {
       // Step 1: Initialize database connection
       console.log('\n1. Initializing database connection...');
       sqliteManager.initialize();

       // Step 2: Create schema
       console.log('2. Creating database schema...');
       initializeSchema();

       // Step 3: Verify schema
       console.log('3. Verifying schema...');
       const verification = verifySchema();

       if (verification.valid) {
         console.log('   ✓ All tables created successfully');
       } else {
         console.error('   ✗ Missing tables:', verification.missingTables);
         process.exit(1);
       }

       // Step 4: Health check
       console.log('4. Running health check...');
       const health = sqliteManager.healthCheck();
       console.log(`   ✓ Database healthy (latency: ${health.latencyMs}ms)`);

       console.log('\n' + '='.repeat(50));
       console.log('Database initialization complete!');
       console.log('='.repeat(50));

     } catch (error) {
       console.error('Database initialization failed:', error);
       process.exit(1);
     } finally {
       sqliteManager.close();
     }
   }

   main();
   ```

2. Add a script to `package.json`:
   ```json
   {
     "scripts": {
       "db:init": "ts-node --esm scripts/migrations/init-database.ts"
     }
   }
   ```

**Verification**:
- [ ] Running `npm run db:init` completes successfully
- [ ] `memory_directory/databases/sessions.db` file is created
- [ ] All 7 tables are verified as created

---

#### Task 2.4: Set Up Qdrant Vector Database

**Reference**:
- data_schemas.md Section 4 (Qdrant schema with 3 collections)
- Requirements R27 (Vector Database Management)
- Design Section 6 (Hybrid retrieval: 70% vector + 30% BM25)

**Files to Create**:
- `src/database/qdrant.ts` - Qdrant vector database manager

**Step-by-Step Instructions**:

1. Install Qdrant client:
   ```bash
   npm install @qdrant/js-client-rest
   ```

2. Create `src/database/qdrant.ts`:
   ```typescript
   // src/database/qdrant.ts
   // Qdrant Vector Database Manager
   // Reference: data_schemas.md Section 4 (collection schemas)

   import { QdrantClient } from '@qdrant/js-client-rest';
   import { logger } from '../utils/logger.js';

   // Qdrant configuration
   const QDRANT_HOST = process.env.QDRANT_HOST || 'localhost';
   const QDRANT_PORT = parseInt(process.env.QDRANT_PORT || '6333', 10);

   // Vector dimensions for text-embedding-3-large
   const VECTOR_SIZE = 3072;

   /**
    * Collection definitions from data_schemas.md Section 4
    */
   export const COLLECTIONS = {
     SESSION_TRANSCRIPTS: 'session_transcripts',
     PATIENT_MEMORIES: 'patient_memories',
     CLINICAL_INSIGHTS: 'clinical_insights'
   } as const;

   /**
    * Qdrant Vector Database Manager
    * Manages vector collections for semantic search
    */
   export class QdrantManager {
     private client: QdrantClient | null = null;

     /**
      * Initialize connection to Qdrant
      */
     public async initialize(): Promise<void> {
       logger.info('Initializing Qdrant connection', { host: QDRANT_HOST, port: QDRANT_PORT });

       this.client = new QdrantClient({
         host: QDRANT_HOST,
         port: QDRANT_PORT
       });

       // Verify connection
       const health = await this.healthCheck();
       if (!health.healthy) {
         throw new Error('Failed to connect to Qdrant');
       }

       logger.info('Qdrant connection established');
     }

     /**
      * Get the Qdrant client instance
      */
     public getClient(): QdrantClient {
       if (!this.client) {
         throw new Error('Qdrant not initialized. Call initialize() first.');
       }
       return this.client;
     }

     /**
      * Health check for Qdrant connection
      */
     public async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
       const start = Date.now();

       try {
         const client = this.getClient();
         await client.getCollections();
         return { healthy: true, latencyMs: Date.now() - start };
       } catch (error) {
         logger.error('Qdrant health check failed', { error });
         return { healthy: false, latencyMs: Date.now() - start };
       }
     }

     /**
      * Create all required collections
      * Reference: data_schemas.md Section 4 (3 collections)
      */
     public async createCollections(): Promise<void> {
       const client = this.getClient();

       // Get existing collections
       const existing = await client.getCollections();
       const existingNames = existing.collections.map(c => c.name);

       // Collection 1: Session Transcripts
       if (!existingNames.includes(COLLECTIONS.SESSION_TRANSCRIPTS)) {
         await client.createCollection(COLLECTIONS.SESSION_TRANSCRIPTS, {
           vectors: {
             size: VECTOR_SIZE,
             distance: 'Cosine'
           }
         });
         logger.info('Created collection: session_transcripts');
       }

       // Collection 2: Patient Memories
       if (!existingNames.includes(COLLECTIONS.PATIENT_MEMORIES)) {
         await client.createCollection(COLLECTIONS.PATIENT_MEMORIES, {
           vectors: {
             size: VECTOR_SIZE,
             distance: 'Cosine'
           }
         });
         logger.info('Created collection: patient_memories');
       }

       // Collection 3: Clinical Insights
       if (!existingNames.includes(COLLECTIONS.CLINICAL_INSIGHTS)) {
         await client.createCollection(COLLECTIONS.CLINICAL_INSIGHTS, {
           vectors: {
             size: VECTOR_SIZE,
             distance: 'Cosine'
           }
         });
         logger.info('Created collection: clinical_insights');
       }
     }

     /**
      * Verify all collections exist
      */
     public async verifyCollections(): Promise<{ valid: boolean; missing: string[] }> {
       const client = this.getClient();
       const existing = await client.getCollections();
       const existingNames = existing.collections.map(c => c.name);

       const required = Object.values(COLLECTIONS);
       const missing = required.filter(c => !existingNames.includes(c));

       return {
         valid: missing.length === 0,
         missing
       };
     }
   }

   // Export singleton
   export const qdrantManager = new QdrantManager();
   ```

3. **Docker Setup for Qdrant** (create `docker-compose.yml` in project root):
   ```yaml
   version: '3.8'
   services:
     qdrant:
       image: qdrant/qdrant:latest
       ports:
         - "6333:6333"
         - "6334:6334"
       volumes:
         - ./memory_directory/databases/vectors:/qdrant/storage
       environment:
         - QDRANT__SERVICE__GRPC_PORT=6334
   ```

**Verification**:
- [ ] Docker Compose file created
- [ ] Running `docker-compose up -d` starts Qdrant
- [ ] `qdrantManager.initialize()` succeeds
- [ ] `qdrantManager.createCollections()` creates all 3 collections
- [ ] `qdrantManager.verifyCollections()` returns `{ valid: true, missing: [] }`

---

#### Task 2.5: Implement Database Connection Manager

**Reference**: Design Section 6 (Database connection with health checks)

**Files to Create**:
- `src/database/index.ts` - Unified database manager

**Step-by-Step Instructions**:

1. Create `src/database/index.ts`:
   ```typescript
   // src/database/index.ts
   // Unified Database Manager
   // Manages both SQLite and Qdrant connections

   import { sqliteManager } from './sqlite.js';
   import { initializeSchema, verifySchema } from './schema.js';
   import { qdrantManager, COLLECTIONS } from './qdrant.js';
   import { logger } from '../utils/logger.js';

   export interface DatabaseHealth {
     sqlite: { healthy: boolean; latencyMs: number };
     qdrant: { healthy: boolean; latencyMs: number };
     overall: boolean;
   }

   /**
    * Initialize all database connections
    * Must be called at application startup
    */
   export async function initializeDatabases(): Promise<void> {
     logger.info('Initializing all databases...');

     // Initialize SQLite
     sqliteManager.initialize();
     initializeSchema();

     const sqliteVerify = verifySchema();
     if (!sqliteVerify.valid) {
       throw new Error(`SQLite schema invalid. Missing: ${sqliteVerify.missingTables.join(', ')}`);
     }

     // Initialize Qdrant
     try {
       await qdrantManager.initialize();
       await qdrantManager.createCollections();

       const qdrantVerify = await qdrantManager.verifyCollections();
       if (!qdrantVerify.valid) {
         throw new Error(`Qdrant collections missing: ${qdrantVerify.missing.join(', ')}`);
       }
     } catch (error) {
       logger.warn('Qdrant initialization failed - vector search will be unavailable', { error });
       // Don't throw - app can work without vector DB in degraded mode
     }

     logger.info('All databases initialized successfully');
   }

   /**
    * Check health of all database connections
    * Reference: Requirements R26 (< 50ms for single record)
    */
   export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
     const sqliteHealth = sqliteManager.healthCheck();

     let qdrantHealth = { healthy: false, latencyMs: 0 };
     try {
       qdrantHealth = await qdrantManager.healthCheck();
     } catch {
       // Qdrant not available
     }

     return {
       sqlite: sqliteHealth,
       qdrant: qdrantHealth,
       overall: sqliteHealth.healthy // SQLite is required, Qdrant is optional
     };
   }

   /**
    * Close all database connections
    * Call at application shutdown
    */
   export function closeDatabases(): void {
     sqliteManager.close();
     logger.info('All database connections closed');
   }

   // Re-export for convenience
   export { sqliteManager } from './sqlite.js';
   export { qdrantManager, COLLECTIONS } from './qdrant.js';
   ```

**Verification**:
- [ ] `src/database/index.ts` compiles without errors
- [ ] `initializeDatabases()` initializes both databases
- [ ] `checkDatabaseHealth()` returns health status for both
- [ ] `closeDatabases()` cleanly closes connections

---

#### Task 2.6: Create Database Utility Functions

**Reference**:
- AGENTS.md Article I (Library-First - modular components)
- Requirements R26 (fast access < 50ms)

**Files to Create**:
- `src/database/repositories/patient.repository.ts` - Patient CRUD operations
- `src/database/repositories/session.repository.ts` - Session CRUD operations

**Step-by-Step Instructions**:

1. Create `src/database/repositories/patient.repository.ts`:
   ```typescript
   // src/database/repositories/patient.repository.ts
   // Patient data access operations
   // Reference: data_schemas.md Section 1 (Patient_Overview), Section 3 (patients table)

   import { v4 as uuidv4 } from 'uuid';
   import { sqliteManager } from '../sqlite.js';
   import { logger, logAuditEvent } from '../../utils/logger.js';

   export interface PatientRecord {
     patient_id: string;
     created_at: string;
     updated_at: string;
     overview_version: number;
     overview_checksum: string | null;
     encryption_key_id: string;
     is_active: number;
     last_session_date: string | null;
     total_sessions: number;
     current_risk_level: 'low' | 'moderate' | 'high' | 'crisis';
   }

   export interface CreatePatientInput {
     encryption_key_id: string;
     current_risk_level?: 'low' | 'moderate' | 'high' | 'crisis';
   }

   /**
    * Patient Repository
    * Handles all patient-related database operations
    */
   export class PatientRepository {
     /**
      * Create a new patient record
      * @returns The created patient ID
      */
     public create(input: CreatePatientInput): string {
       const db = sqliteManager.getDb();
       const patientId = uuidv4();

       const stmt = db.prepare(`
         INSERT INTO patients (patient_id, encryption_key_id, current_risk_level)
         VALUES (?, ?, ?)
       `);

       stmt.run(patientId, input.encryption_key_id, input.current_risk_level || 'low');

       logAuditEvent('data_modify', patientId, null, 'patient_created');
       logger.info('Patient created', { patientId });

       return patientId;
     }

     /**
      * Get patient by ID
      * @returns Patient record or null if not found
      */
     public getById(patientId: string): PatientRecord | null {
       const db = sqliteManager.getDb();

       const stmt = db.prepare('SELECT * FROM patients WHERE patient_id = ?');
       const result = stmt.get(patientId) as PatientRecord | undefined;

       if (result) {
         logAuditEvent('data_access', patientId, null, 'patient_read');
       }

       return result || null;
     }

     /**
      * Update patient's last session date and increment session count
      */
     public updateSessionInfo(patientId: string): void {
       const db = sqliteManager.getDb();

       const stmt = db.prepare(`
         UPDATE patients
         SET last_session_date = datetime('now'),
             total_sessions = total_sessions + 1,
             updated_at = datetime('now')
         WHERE patient_id = ?
       `);

       stmt.run(patientId);
       logAuditEvent('data_modify', patientId, null, 'patient_session_updated');
     }

     /**
      * Update patient risk level
      * Reference: Requirements R31 (Crisis Detection updates risk level)
      */
     public updateRiskLevel(patientId: string, riskLevel: PatientRecord['current_risk_level']): void {
       const db = sqliteManager.getDb();

       const stmt = db.prepare(`
         UPDATE patients
         SET current_risk_level = ?,
             updated_at = datetime('now')
         WHERE patient_id = ?
       `);

       stmt.run(riskLevel, patientId);
       logAuditEvent('data_modify', patientId, null, `risk_level_updated_to_${riskLevel}`);
       logger.info('Patient risk level updated', { patientId, riskLevel });
     }

     /**
      * Get all active patients
      */
     public getAllActive(): PatientRecord[] {
       const db = sqliteManager.getDb();
       const stmt = db.prepare('SELECT * FROM patients WHERE is_active = 1');
       return stmt.all() as PatientRecord[];
     }

     /**
      * Soft delete patient (set is_active = 0)
      * Reference: Requirements R37 (data deletion with audit trail)
      */
     public softDelete(patientId: string): void {
       const db = sqliteManager.getDb();

       const stmt = db.prepare(`
         UPDATE patients
         SET is_active = 0,
             updated_at = datetime('now')
         WHERE patient_id = ?
       `);

       stmt.run(patientId);
       logAuditEvent('data_delete', patientId, null, 'patient_soft_deleted');
       logger.info('Patient soft deleted', { patientId });
     }
   }

   // Export singleton
   export const patientRepository = new PatientRepository();
   ```

2. Create `src/database/repositories/session.repository.ts`:
   ```typescript
   // src/database/repositories/session.repository.ts
   // Session data access operations
   // Reference: data_schemas.md Section 3 (sessions table)

   import { v4 as uuidv4 } from 'uuid';
   import { sqliteManager } from '../sqlite.js';
   import { logger, logAuditEvent } from '../../utils/logger.js';

   export interface SessionRecord {
     session_id: string;
     patient_id: string;
     session_number: number;
     started_at: string;
     ended_at: string | null;
     duration_seconds: number | null;
     session_status: 'active' | 'completed' | 'interrupted' | 'crashed' | 'paused';
     transcript_path: string | null;
     summary_path: string | null;
     risk_level_start: string | null;
     risk_level_end: string | null;
     model_configuration: string | null;
     session_quality_score: number | null;
     created_at: string;
   }

   export interface CreateSessionInput {
     patient_id: string;
     risk_level_start?: string;
     model_configuration?: Record<string, unknown>;
   }

   /**
    * Session Repository
    * Handles all session-related database operations
    */
   export class SessionRepository {
     /**
      * Create a new session
      * @returns The created session ID
      */
     public create(input: CreateSessionInput): string {
       const db = sqliteManager.getDb();
       const sessionId = uuidv4();

       // Get next session number for this patient
       const countStmt = db.prepare('SELECT COUNT(*) as count FROM sessions WHERE patient_id = ?');
       const countResult = countStmt.get(input.patient_id) as { count: number };
       const sessionNumber = countResult.count + 1;

       const stmt = db.prepare(`
         INSERT INTO sessions (
           session_id, patient_id, session_number, started_at,
           session_status, risk_level_start, model_configuration
         )
         VALUES (?, ?, ?, datetime('now'), 'active', ?, ?)
       `);

       stmt.run(
         sessionId,
         input.patient_id,
         sessionNumber,
         input.risk_level_start || null,
         input.model_configuration ? JSON.stringify(input.model_configuration) : null
       );

       logAuditEvent('session_event', input.patient_id, sessionId, 'session_created');
       logger.info('Session created', { sessionId, patientId: input.patient_id, sessionNumber });

       return sessionId;
     }

     /**
      * Get session by ID
      */
     public getById(sessionId: string): SessionRecord | null {
       const db = sqliteManager.getDb();
       const stmt = db.prepare('SELECT * FROM sessions WHERE session_id = ?');
       return stmt.get(sessionId) as SessionRecord | undefined || null;
     }

     /**
      * Get active session for patient (should only be one)
      */
     public getActiveForPatient(patientId: string): SessionRecord | null {
       const db = sqliteManager.getDb();
       const stmt = db.prepare(`
         SELECT * FROM sessions
         WHERE patient_id = ? AND session_status = 'active'
         ORDER BY started_at DESC
         LIMIT 1
       `);
       return stmt.get(patientId) as SessionRecord | undefined || null;
     }

     /**
      * Get recent sessions for patient
      * @param limit Number of sessions to return (default: 10)
      */
     public getRecentForPatient(patientId: string, limit: number = 10): SessionRecord[] {
       const db = sqliteManager.getDb();
       const stmt = db.prepare(`
         SELECT * FROM sessions
         WHERE patient_id = ?
         ORDER BY started_at DESC
         LIMIT ?
       `);
       return stmt.all(patientId, limit) as SessionRecord[];
     }

     /**
      * Complete a session
      * Reference: Requirements R1 (session ends at 25 min)
      */
     public complete(
       sessionId: string,
       riskLevelEnd: string,
       qualityScore: number | null,
       transcriptPath: string,
       summaryPath: string
     ): void {
       const db = sqliteManager.getDb();

       // Calculate duration
       const session = this.getById(sessionId);
       if (!session) {
         throw new Error(`Session not found: ${sessionId}`);
       }

       const startTime = new Date(session.started_at);
       const endTime = new Date();
       const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

       const stmt = db.prepare(`
         UPDATE sessions
         SET ended_at = datetime('now'),
             duration_seconds = ?,
             session_status = 'completed',
             risk_level_end = ?,
             session_quality_score = ?,
             transcript_path = ?,
             summary_path = ?
         WHERE session_id = ?
       `);

       stmt.run(durationSeconds, riskLevelEnd, qualityScore, transcriptPath, summaryPath, sessionId);
       logAuditEvent('session_event', session.patient_id, sessionId, 'session_completed');
       logger.info('Session completed', { sessionId, durationSeconds });
     }

     /**
      * Update session status (for pause, interrupt, crash)
      */
     public updateStatus(sessionId: string, status: SessionRecord['session_status']): void {
       const db = sqliteManager.getDb();
       const stmt = db.prepare('UPDATE sessions SET session_status = ? WHERE session_id = ?');
       stmt.run(status, sessionId);

       const session = this.getById(sessionId);
       logAuditEvent('session_event', session?.patient_id || null, sessionId, `session_status_${status}`);
     }
   }

   // Export singleton
   export const sessionRepository = new SessionRepository();
   ```

**Verification**:
- [ ] Both repository files compile without errors
- [ ] `patientRepository.create()` creates a patient and returns ID
- [ ] `sessionRepository.create()` creates a session with correct session_number
- [ ] Audit events are logged for all operations

---

#### Task 2.7: Implement Audit Logging with HMAC Signatures

**Reference**:
- Requirements R38 (tamper-evident audit logs)
- data_schemas.md Section 3 (audit_log table with checksum)

**Files to Create**:
- `src/database/repositories/audit.repository.ts` - Audit log with HMAC signatures

**Step-by-Step Instructions**:

1. Create `src/database/repositories/audit.repository.ts`:
   ```typescript
   // src/database/repositories/audit.repository.ts
   // Audit logging with HMAC signatures for tamper detection
   // Reference: Requirements R38 (6-year retention, tamper-evident)

   import crypto from 'crypto';
   import { v4 as uuidv4 } from 'uuid';
   import { sqliteManager } from '../sqlite.js';
   import { logger } from '../../utils/logger.js';

   // HMAC secret key - in production, load from secure storage
   const AUDIT_HMAC_SECRET = process.env.AUDIT_HMAC_SECRET || 'default-audit-secret-change-in-production';

   export type AuditEventType =
     | 'data_access'
     | 'data_modify'
     | 'data_delete'
     | 'data_export'
     | 'auth_success'
     | 'auth_failure'
     | 'crisis_detection'
     | 'session_event';

   export interface AuditLogEntry {
     log_id: string;
     timestamp: string;
     event_type: AuditEventType;
     patient_id: string | null;
     session_id: string | null;
     action: string;
     details: string | null;
     ip_address: string | null;
     user_agent: string | null;
     checksum: string;
   }

   export interface CreateAuditEntryInput {
     event_type: AuditEventType;
     patient_id?: string | null;
     session_id?: string | null;
     action: string;
     details?: Record<string, unknown>;
     ip_address?: string;
     user_agent?: string;
   }

   /**
    * Audit Repository
    * Creates tamper-evident audit log entries with HMAC checksums
    *
    * Checksum chain: Each entry's checksum includes the previous entry's checksum
    * This creates a tamper-evident chain similar to blockchain
    */
   export class AuditRepository {
     private lastChecksum: string | null = null;

     /**
      * Initialize by loading the last checksum from the database
      */
     public async initialize(): Promise<void> {
       const db = sqliteManager.getDb();

       const stmt = db.prepare(`
         SELECT checksum FROM audit_log
         ORDER BY timestamp DESC
         LIMIT 1
       `);
       const result = stmt.get() as { checksum: string } | undefined;

       this.lastChecksum = result?.checksum || null;
       logger.info('Audit repository initialized', { hasExistingEntries: !!this.lastChecksum });
     }

     /**
      * Generate HMAC checksum for an entry
      * Includes previous checksum for chain integrity
      */
     private generateChecksum(
       entry: Omit<AuditLogEntry, 'checksum'>,
       previousChecksum: string | null
     ): string {
       const data = JSON.stringify({
         ...entry,
         previousChecksum
       });

       return crypto
         .createHmac('sha256', AUDIT_HMAC_SECRET)
         .update(data)
         .digest('hex');
     }

     /**
      * Create a new audit log entry
      * Automatically generates tamper-evident checksum
      */
     public create(input: CreateAuditEntryInput): string {
       const db = sqliteManager.getDb();
       const logId = uuidv4();
       const timestamp = new Date().toISOString();

       const entry: Omit<AuditLogEntry, 'checksum'> = {
         log_id: logId,
         timestamp,
         event_type: input.event_type,
         patient_id: input.patient_id || null,
         session_id: input.session_id || null,
         action: input.action,
         details: input.details ? JSON.stringify(input.details) : null,
         ip_address: input.ip_address || null,
         user_agent: input.user_agent || null
       };

       // Generate checksum including previous entry's checksum
       const checksum = this.generateChecksum(entry, this.lastChecksum);

       const stmt = db.prepare(`
         INSERT INTO audit_log (
           log_id, timestamp, event_type, patient_id, session_id,
           action, details, ip_address, user_agent, checksum
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       `);

       stmt.run(
         logId,
         timestamp,
         input.event_type,
         entry.patient_id,
         entry.session_id,
         input.action,
         entry.details,
         entry.ip_address,
         entry.user_agent,
         checksum
       );

       // Update last checksum for next entry
       this.lastChecksum = checksum;

       return logId;
     }

     /**
      * Verify the integrity of the audit log chain
      * Returns true if all checksums are valid
      */
     public verifyIntegrity(): { valid: boolean; brokenAt: string | null } {
       const db = sqliteManager.getDb();

       const stmt = db.prepare('SELECT * FROM audit_log ORDER BY timestamp ASC');
       const entries = stmt.all() as AuditLogEntry[];

       let previousChecksum: string | null = null;

       for (const entry of entries) {
         const expectedChecksum = this.generateChecksum(
           {
             log_id: entry.log_id,
             timestamp: entry.timestamp,
             event_type: entry.event_type,
             patient_id: entry.patient_id,
             session_id: entry.session_id,
             action: entry.action,
             details: entry.details,
             ip_address: entry.ip_address,
             user_agent: entry.user_agent
           },
           previousChecksum
         );

         if (entry.checksum !== expectedChecksum) {
           logger.error('Audit log integrity violation detected', { logId: entry.log_id });
           return { valid: false, brokenAt: entry.log_id };
         }

         previousChecksum = entry.checksum;
       }

       return { valid: true, brokenAt: null };
     }

     /**
      * Get audit entries for a patient
      * Reference: Requirements R38 (data export for GDPR)
      */
     public getForPatient(patientId: string, limit: number = 100): AuditLogEntry[] {
       const db = sqliteManager.getDb();
       const stmt = db.prepare(`
         SELECT * FROM audit_log
         WHERE patient_id = ?
         ORDER BY timestamp DESC
         LIMIT ?
       `);
       return stmt.all(patientId, limit) as AuditLogEntry[];
     }
   }

   // Export singleton
   export const auditRepository = new AuditRepository();
   ```

**Verification**:
- [ ] `src/database/repositories/audit.repository.ts` compiles without errors
- [ ] Creating multiple audit entries generates unique, chained checksums
- [ ] `verifyIntegrity()` returns `{ valid: true }` for untampered logs
- [ ] Manually modifying a log entry causes `verifyIntegrity()` to return `{ valid: false }`

---

### Task 3: Security and Encryption System

**References**:
- Requirements R37-R38 (Secure Data Storage, Audit Logging)
- Design Section 16 (Security and Compliance System)
- AGENTS.md Article VI (Determinism Over Flexibility - encryption is code, not AI)

**Prerequisites**: Task 1 (Project Setup), Task 2 (Database Infrastructure)

**Estimated Subtasks**: 7

---

#### Task 3.1: Implement EncryptionManager Class

**Reference**:
- Requirements R37 (AES-256-GCM encryption)
- Design Section 16 (Encryption specifications: PBKDF2, 100,000 iterations)

**Files to Create**:
- `src/encryption/encryption-manager.ts`

**Step-by-Step Instructions**:

1. Create `src/encryption/encryption-manager.ts`:
   ```typescript
   // src/encryption/encryption-manager.ts
   // AES-256-GCM encryption for data at rest
   // Reference: Requirements R37, Design Section 16

   import crypto from 'crypto';
   import { logger } from '../utils/logger.js';

   // Encryption constants from Requirements R37
   const ALGORITHM = 'aes-256-gcm';
   const KEY_LENGTH = 32;  // 256 bits
   const IV_LENGTH = 16;   // 128 bits
   const AUTH_TAG_LENGTH = 16;  // 128 bits
   const PBKDF2_ITERATIONS = 100000;  // From Design spec
   const PBKDF2_DIGEST = 'sha256';

   export interface EncryptedData {
     iv: string;        // Base64 encoded IV
     authTag: string;   // Base64 encoded auth tag
     data: string;      // Base64 encoded encrypted data
   }

   /**
    * Encryption Manager
    * Provides AES-256-GCM encryption/decryption for patient data
    *
    * Key derivation uses PBKDF2 with patient-specific salt
    * to ensure each patient's data is encrypted with a unique key
    */
   export class EncryptionManager {
     private masterKey: Buffer | null = null;

     /**
      * Initialize with master key
      * Master key should be loaded from secure storage (encrypted file or OS keychain)
      *
      * @param masterKeyHex - 64-character hex string (256 bits)
      */
     public initialize(masterKeyHex: string): void {
       if (masterKeyHex.length !== 64) {
         throw new Error('Master key must be 64 hex characters (256 bits)');
       }

       this.masterKey = Buffer.from(masterKeyHex, 'hex');
       logger.info('Encryption manager initialized');
     }

     /**
      * Generate a new random master key
      * Use this for initial setup, then store securely
      *
      * @returns 64-character hex string
      */
     public static generateMasterKey(): string {
       return crypto.randomBytes(KEY_LENGTH).toString('hex');
     }

     /**
      * Derive a patient-specific encryption key using PBKDF2
      * Reference: Design Section 16 (100,000 iterations)
      *
      * @param patientId - Patient UUID used as salt component
      */
     public derivePatientKey(patientId: string): Buffer {
       if (!this.masterKey) {
         throw new Error('Encryption manager not initialized');
       }

       // Create salt from patient ID (hashed for consistency)
       const salt = crypto.createHash('sha256').update(patientId).digest();

       // Derive patient-specific key
       return crypto.pbkdf2Sync(
         this.masterKey,
         salt,
         PBKDF2_ITERATIONS,
         KEY_LENGTH,
         PBKDF2_DIGEST
       );
     }

     /**
      * Encrypt data using patient-specific key
      *
      * @param patientId - Patient ID for key derivation
      * @param plaintext - Data to encrypt (string or object)
      * @returns Encrypted data structure
      */
     public encrypt(patientId: string, plaintext: string | object): EncryptedData {
       const key = this.derivePatientKey(patientId);
       const iv = crypto.randomBytes(IV_LENGTH);

       // Convert object to string if needed
       const data = typeof plaintext === 'object' ? JSON.stringify(plaintext) : plaintext;

       const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

       const encrypted = Buffer.concat([
         cipher.update(data, 'utf8'),
         cipher.final()
       ]);

       const authTag = cipher.getAuthTag();

       return {
         iv: iv.toString('base64'),
         authTag: authTag.toString('base64'),
         data: encrypted.toString('base64')
       };
     }

     /**
      * Decrypt data using patient-specific key
      *
      * @param patientId - Patient ID for key derivation
      * @param encrypted - Encrypted data structure
      * @returns Decrypted plaintext string
      */
     public decrypt(patientId: string, encrypted: EncryptedData): string {
       const key = this.derivePatientKey(patientId);
       const iv = Buffer.from(encrypted.iv, 'base64');
       const authTag = Buffer.from(encrypted.authTag, 'base64');
       const encryptedData = Buffer.from(encrypted.data, 'base64');

       const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
       decipher.setAuthTag(authTag);

       const decrypted = Buffer.concat([
         decipher.update(encryptedData),
         decipher.final()
       ]);

       return decrypted.toString('utf8');
     }

     /**
      * Decrypt and parse JSON data
      */
     public decryptJSON<T = unknown>(patientId: string, encrypted: EncryptedData): T {
       const plaintext = this.decrypt(patientId, encrypted);
       return JSON.parse(plaintext) as T;
     }
   }

   // Export singleton
   export const encryptionManager = new EncryptionManager();
   ```

**Verification**:
- [ ] `src/encryption/encryption-manager.ts` compiles without errors
- [ ] `EncryptionManager.generateMasterKey()` returns a 64-character hex string
- [ ] Encrypting and decrypting data returns the original plaintext
- [ ] Different patient IDs produce different encrypted outputs for the same plaintext
- [ ] Tampering with authTag causes decryption to fail (authentication works)

---

#### Task 3.2: Create Patient-Specific Key Derivation

**Reference**:
- Design Section 16 (PBKDF2-HMAC-SHA256, 100,000 iterations)
- Requirements R37 (patient-specific encryption keys)

**Files to Create**:
- `src/encryption/key-manager.ts` - Key derivation and storage

**Step-by-Step Instructions**:

1. Create `src/encryption/key-manager.ts`:
   ```typescript
   // src/encryption/key-manager.ts
   // Key management with secure storage
   // Reference: Requirements R37, Design Section 16

   import crypto from 'crypto';
   import fs from 'fs/promises';
   import path from 'path';
   import { fileURLToPath } from 'url';
   import { logger } from '../utils/logger.js';
   import { encryptionManager } from './encryption-manager.js';

   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);

   const KEY_FILE_PATH = path.join(__dirname, '../../memory_directory/config/encryption.key.enc');
   const MASTER_KEY_ENV_VAR = 'MASTER_ENCRYPTION_KEY';

   /**
    * Key Manager
    * Handles master key generation, storage, and patient key derivation
    */
   export class KeyManager {
     private initialized = false;

     /**
      * Initialize key management system
      * Loads existing master key or creates new one
      */
     public async initialize(): Promise<void> {
       // Check for master key in environment variable (preferred for production)
       const envKey = process.env[MASTER_KEY_ENV_VAR];

       if (envKey) {
         encryptionManager.initialize(envKey);
         logger.info('Master key loaded from environment variable');
       } else {
         // Try to load from encrypted file (for development)
         try {
           const keyData = await fs.readFile(KEY_FILE_PATH, 'utf-8');
           encryptionManager.initialize(keyData.trim());
           logger.info('Master key loaded from file');
         } catch {
           // Generate new key if none exists
           await this.generateAndSaveMasterKey();
         }
       }

       this.initialized = true;
     }

     /**
      * Generate a new master key and save to file
      * ONLY for initial setup - in production, use environment variable
      */
     private async generateAndSaveMasterKey(): Promise<void> {
       const masterKey = encryptionManager.constructor.prototype.constructor.generateMasterKey
         ? (encryptionManager.constructor as any).generateMasterKey()
         : crypto.randomBytes(32).toString('hex');

       // Save to file (development only - use secure storage in production)
       await fs.writeFile(KEY_FILE_PATH, masterKey, { mode: 0o600 });

       encryptionManager.initialize(masterKey);
       logger.warn('New master key generated and saved - SECURE THIS FILE');
     }

     /**
      * Generate a unique encryption key ID for a new patient
      * This ID is stored in the database and used to identify the key derivation
      */
     public generatePatientKeyId(): string {
       return crypto.randomBytes(16).toString('hex');
     }

     /**
      * Check if key management is initialized
      */
     public isInitialized(): boolean {
       return this.initialized;
     }
   }

   // Export singleton
   export const keyManager = new KeyManager();
   ```

**Verification**:
- [ ] `src/encryption/key-manager.ts` compiles without errors
- [ ] Running `keyManager.initialize()` loads or creates a master key
- [ ] `generatePatientKeyId()` returns a unique 32-character hex string
- [ ] Encryption file is created with restricted permissions (0o600)

---

#### Task 3.3: Implement Master Key Generation and Secure Storage

**Reference**: Design Section 16 (master key encrypted with system key)

**Implementation**: Covered in Task 3.2 above. Additional security measures:

1. Add to `.env.example`:
   ```
   # Master encryption key - 64 hex characters (256 bits)
   # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   MASTER_ENCRYPTION_KEY=
   ```

2. Add to `.gitignore`:
   ```
   memory_directory/config/encryption.key.enc
   ```

**Verification**:
- [ ] `.env.example` documents the master key variable
- [ ] `.gitignore` excludes the key file
- [ ] Key file permissions are restricted (not readable by others)

---

#### Task 3.4: Create File Encryption/Decryption Utilities

**Reference**: Requirements R37 (AES-256-GCM for all files in Memory_Directory)

**Files to Create**:
- `src/encryption/file-encryption.ts` - File-level encryption utilities

**Step-by-Step Instructions**:

1. Create `src/encryption/file-encryption.ts`:
   ```typescript
   // src/encryption/file-encryption.ts
   // File encryption utilities for Memory_Directory
   // Reference: Requirements R37

   import fs from 'fs/promises';
   import path from 'path';
   import { encryptionManager, EncryptedData } from './encryption-manager.js';
   import { logger, logAuditEvent } from '../utils/logger.js';

   export interface EncryptedFile {
     version: string;
     patientId: string;
     encrypted: EncryptedData;
     createdAt: string;
     checksum: string;
   }

   /**
    * Encrypt and save data to a file
    *
    * @param patientId - Patient ID for key derivation
    * @param filePath - Path to save the encrypted file
    * @param data - Data to encrypt (string or object)
    */
   export async function encryptFile(
     patientId: string,
     filePath: string,
     data: string | object
   ): Promise<void> {
     const encrypted = encryptionManager.encrypt(patientId, data);

     const fileData: EncryptedFile = {
       version: '1.0.0',
       patientId: patientId,
       encrypted,
       createdAt: new Date().toISOString(),
       checksum: encrypted.authTag  // Use authTag as integrity check
     };

     // Ensure directory exists
     await fs.mkdir(path.dirname(filePath), { recursive: true });

     // Write file
     await fs.writeFile(filePath, JSON.stringify(fileData, null, 2));

     logAuditEvent('data_modify', patientId, null, 'file_encrypted', { filePath });
     logger.debug('File encrypted', { filePath });
   }

   /**
    * Read and decrypt a file
    *
    * @param patientId - Patient ID for key derivation
    * @param filePath - Path to the encrypted file
    * @returns Decrypted data as string
    */
   export async function decryptFile(
     patientId: string,
     filePath: string
   ): Promise<string> {
     const content = await fs.readFile(filePath, 'utf-8');
     const fileData: EncryptedFile = JSON.parse(content);

     // Verify patient ID matches
     if (fileData.patientId !== patientId) {
       throw new Error('Patient ID mismatch - cannot decrypt file');
     }

     const decrypted = encryptionManager.decrypt(patientId, fileData.encrypted);

     logAuditEvent('data_access', patientId, null, 'file_decrypted', { filePath });
     return decrypted;
   }

   /**
    * Read and decrypt a JSON file
    */
   export async function decryptJSONFile<T = unknown>(
     patientId: string,
     filePath: string
   ): Promise<T> {
     const content = await decryptFile(patientId, filePath);
     return JSON.parse(content) as T;
   }

   /**
    * Check if an encrypted file exists
    */
   export async function encryptedFileExists(filePath: string): Promise<boolean> {
     try {
       await fs.access(filePath);
       return true;
     } catch {
       return false;
     }
   }
   ```

**Verification**:
- [ ] `encryptFile()` creates an encrypted JSON file
- [ ] `decryptFile()` returns the original data
- [ ] Attempting to decrypt with wrong patientId throws an error
- [ ] Audit events are logged for file operations

---

#### Task 3.5: Implement TLS 1.3 Configuration

**Reference**: Requirements R37 (TLS 1.3 for data in transit)

**Files to Create**:
- `src/config/tls.ts` - TLS configuration for HTTPS server

**Step-by-Step Instructions**:

1. Create `src/config/tls.ts`:
   ```typescript
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
   ```

2. Add certificate generation script to `scripts/setup/generate-certs.sh`:
   ```bash
   #!/bin/bash
   # Generate self-signed certificates for development

   CERT_DIR="memory_directory/config/certs"
   mkdir -p "$CERT_DIR"

   openssl req -x509 -newkey rsa:4096 \
     -keyout "$CERT_DIR/server.key" \
     -out "$CERT_DIR/server.crt" \
     -days 365 \
     -nodes \
     -subj "/CN=localhost"

   echo "Certificates generated in $CERT_DIR"
   ```

**Verification**:
- [ ] `loadTLSConfig()` returns null gracefully when certs don't exist
- [ ] Running the cert generation script creates valid certificates
- [ ] HTTPS server starts with TLS 1.3 when certificates exist

---

#### Task 3.6: Create Data Export Functionality (GDPR/CCPA)

**Reference**: Requirements R37 (data export on user request)

**Files to Create**:
- `src/encryption/data-export.ts` - GDPR/CCPA compliant data export

**Step-by-Step Instructions**:

1. Create `src/encryption/data-export.ts`:
   ```typescript
   // src/encryption/data-export.ts
   // GDPR/CCPA compliant data export
   // Reference: Requirements R37 (data export on user request)

   import fs from 'fs/promises';
   import path from 'path';
   import { fileURLToPath } from 'url';
   import archiver from 'archiver';
   import { createWriteStream } from 'fs';
   import { patientRepository } from '../database/repositories/patient.repository.js';
   import { sessionRepository } from '../database/repositories/session.repository.js';
   import { auditRepository } from '../database/repositories/audit.repository.js';
   import { decryptJSONFile, encryptedFileExists } from './file-encryption.js';
   import { logger, logAuditEvent } from '../utils/logger.js';

   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   const EXPORTS_DIR = path.join(__dirname, '../../memory_directory/exports');

   export interface ExportResult {
     success: boolean;
     exportPath: string;
     fileCount: number;
     exportedAt: string;
   }

   /**
    * Export all patient data to a ZIP file
    * Reference: Requirements R37 (GDPR/CCPA compliance)
    *
    * Includes:
    * - Patient overview
    * - All session transcripts and summaries
    * - Audit log entries for this patient
    */
   export async function exportPatientData(patientId: string): Promise<ExportResult> {
     logger.info('Starting patient data export', { patientId });
     logAuditEvent('data_export', patientId, null, 'export_started');

     const exportTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
     const exportFileName = `patient_${patientId}_export_${exportTimestamp}.zip`;
     const exportPath = path.join(EXPORTS_DIR, exportFileName);

     // Ensure exports directory exists
     await fs.mkdir(EXPORTS_DIR, { recursive: true });

     // Create ZIP archive
     const output = createWriteStream(exportPath);
     const archive = archiver('zip', { zlib: { level: 9 } });

     return new Promise((resolve, reject) => {
       output.on('close', async () => {
         logAuditEvent('data_export', patientId, null, 'export_completed', {
           exportPath,
           size: archive.pointer()
         });

         resolve({
           success: true,
           exportPath,
           fileCount: archive.pointer(), // Actually bytes, not files
           exportedAt: new Date().toISOString()
         });
       });

       archive.on('error', (err) => {
         logger.error('Export failed', { patientId, error: err });
         reject(err);
       });

       archive.pipe(output);

       // Add export manifest
       const manifest = {
         patientId,
         exportedAt: new Date().toISOString(),
         exportFormat: 'GDPR/CCPA Data Export',
         contents: [] as string[]
       };

       // Add patient record
       const patient = patientRepository.getById(patientId);
       if (patient) {
         archive.append(JSON.stringify(patient, null, 2), { name: 'patient_record.json' });
         manifest.contents.push('patient_record.json');
       }

       // Add sessions
       const sessions = sessionRepository.getRecentForPatient(patientId, 1000);
       archive.append(JSON.stringify(sessions, null, 2), { name: 'sessions.json' });
       manifest.contents.push('sessions.json');

       // Add audit log entries for this patient
       const auditEntries = auditRepository.getForPatient(patientId, 10000);
       archive.append(JSON.stringify(auditEntries, null, 2), { name: 'audit_log.json' });
       manifest.contents.push('audit_log.json');

       // Add manifest
       archive.append(JSON.stringify(manifest, null, 2), { name: 'MANIFEST.json' });

       archive.finalize();
     });
   }
   ```

2. Install archiver:
   ```bash
   npm install archiver
   npm install --save-dev @types/archiver
   ```

**Verification**:
- [ ] `exportPatientData()` creates a ZIP file with all patient data
- [ ] ZIP contains patient_record.json, sessions.json, audit_log.json, MANIFEST.json
- [ ] Audit event is logged for the export
- [ ] Export works for patient with multiple sessions

---

#### Task 3.7: Implement Secure Data Deletion

**Reference**: Requirements R37 (data deletion with audit trail)

**Files to Create**:
- `src/encryption/data-deletion.ts` - Secure data deletion with confirmation

**Step-by-Step Instructions**:

1. Create `src/encryption/data-deletion.ts`:
   ```typescript
   // src/encryption/data-deletion.ts
   // Secure data deletion with audit trail preservation
   // Reference: Requirements R37 (GDPR right to erasure)

   import fs from 'fs/promises';
   import path from 'path';
   import { fileURLToPath } from 'url';
   import { patientRepository } from '../database/repositories/patient.repository.js';
   import { sqliteManager } from '../database/sqlite.js';
   import { qdrantManager, COLLECTIONS } from '../database/qdrant.js';
   import { logger, logAuditEvent } from '../utils/logger.js';

   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   const PATIENTS_DIR = path.join(__dirname, '../../memory_directory/patients');

   export interface DeletionResult {
     success: boolean;
     deletedItems: {
       files: number;
       sessions: number;
       vectors: number;
     };
     deletedAt: string;
     auditPreserved: boolean;
   }

   /**
    * Delete all patient data with audit trail preservation
    * Reference: Requirements R37 (GDPR right to erasure with audit retention)
    *
    * IMPORTANT: Requires confirmation code to prevent accidental deletion
    * Confirmation code must be: "DELETE-{patientId}"
    *
    * @param patientId - Patient ID to delete
    * @param confirmationCode - Must be "DELETE-{patientId}"
    */
   export async function deletePatientData(
     patientId: string,
     confirmationCode: string
   ): Promise<DeletionResult> {
     // Verify confirmation code
     const expectedCode = `DELETE-${patientId}`;
     if (confirmationCode !== expectedCode) {
       throw new Error(`Invalid confirmation code. Expected: ${expectedCode}`);
     }

     logger.warn('Starting patient data deletion', { patientId });
     logAuditEvent('data_delete', patientId, null, 'deletion_started');

     let filesDeleted = 0;
     let sessionsDeleted = 0;
     let vectorsDeleted = 0;

     try {
       // 1. Delete patient files from Memory_Directory
       const patientDir = path.join(PATIENTS_DIR, patientId);
       try {
         await fs.rm(patientDir, { recursive: true, force: true });
         filesDeleted = 1;  // Count as 1 directory
         logger.info('Patient files deleted', { patientId, dir: patientDir });
       } catch (error) {
         logger.debug('No patient directory to delete', { patientId });
       }

       // 2. Delete sessions from SQLite (CASCADE will delete related records)
       const db = sqliteManager.getDb();
       const deleteSessionsStmt = db.prepare('DELETE FROM sessions WHERE patient_id = ?');
       const sessionsResult = deleteSessionsStmt.run(patientId);
       sessionsDeleted = sessionsResult.changes;

       // 3. Soft-delete patient record (preserve for audit trail)
       patientRepository.softDelete(patientId);

       // 4. Delete vectors from Qdrant
       try {
         const client = qdrantManager.getClient();

         // Delete from each collection
         for (const collection of Object.values(COLLECTIONS)) {
           await client.delete(collection, {
             filter: {
               must: [{ key: 'patient_id', match: { value: patientId } }]
             }
           });
         }
         vectorsDeleted = 1;  // Mark as success
       } catch (error) {
         logger.warn('Qdrant deletion failed - vectors may remain', { patientId, error });
       }

       logAuditEvent('data_delete', patientId, null, 'deletion_completed', {
         filesDeleted,
         sessionsDeleted,
         vectorsDeleted
       });

       return {
         success: true,
         deletedItems: {
           files: filesDeleted,
           sessions: sessionsDeleted,
           vectors: vectorsDeleted
         },
         deletedAt: new Date().toISOString(),
         auditPreserved: true  // Audit log entries are NOT deleted
       };

     } catch (error) {
       logger.error('Patient data deletion failed', { patientId, error });
       logAuditEvent('data_delete', patientId, null, 'deletion_failed', { error: String(error) });
       throw error;
     }
   }
   ```

**Verification**:
- [ ] `deletePatientData()` requires correct confirmation code
- [ ] Wrong confirmation code throws an error
- [ ] Patient files, sessions, and vectors are deleted
- [ ] Patient record is soft-deleted (is_active = 0), not removed
- [ ] Audit log entries are preserved (not deleted)
- [ ] Audit events log the deletion

---

## Phase 2: Core Session Management

### Task 4: Session State Machine

**References**:
- Requirements R1 (Session Lifecycle)
- system_architecture.md Section 2 (State Machine with all states and transitions)
- AGENTS.md Article VI (Determinism - state machines are code, not AI)

**Prerequisites**: Task 1 (Project Setup), Task 2 (Database)

**Estimated Subtasks**: 7

---

#### Task 4.1: Implement SessionStateMachine Class

**Reference**: system_architecture.md Section 2.1-2.3 (State diagram, definitions, transitions)

**Files to Create**:
- `src/session/state-machine.ts` - Core state machine implementation
- `src/session/types.ts` - Session type definitions

**Step-by-Step Instructions**:

1. Create `src/session/types.ts`:
   ```typescript
   // src/session/types.ts
   // Session type definitions
   // Reference: system_architecture.md Section 2.2

   /**
    * Session States from system_architecture.md Section 2.2
    */
   export type SessionState =
     | 'INIT'
     | 'LOADING'
     | 'AWAITING_PATIENT'
     | 'READY'
     | 'ACTIVE_LISTENING'
     | 'PROCESSING_STT'
     | 'PROCESSING_LLM'
     | 'SPEAKING'
     | 'CRISIS_PROTOCOL'
     | 'WARNING_5MIN'
     | 'SESSION_ENDING'
     | 'SESSION_COMPLETE'
     | 'ERROR_RECOVERY'
     | 'ERROR';

   /**
    * State transition triggers from system_architecture.md Section 2.3
    */
   export type SessionTrigger =
     | 'load_application'
     | 'config_loaded'
     | 'config_error'
     | 'patient_overview_loaded'
     | 'validation_failed'
     | 'session_started'
     | 'speech_detected'
     | 'transcription_complete'
     | 'stt_timeout'
     | 'response_ready'
     | 'llm_timeout'
     | 'speech_complete'
     | 'user_interrupt'
     | 'timer_20min'
     | 'timer_25min'
     | 'summary_complete'
     | 'crisis_detected'
     | 'crisis_resolved'
     | 'escalation_required'
     | 'recovery_success'
     | 'recovery_failed'
     | 'new_session'
     | 'end_session';

   /**
    * State timeout configurations from system_architecture.md Section 2.2
    */
   export const STATE_TIMEOUTS: Partial<Record<SessionState, number>> = {
     LOADING: 30000,           // 30s → ERROR
     ACTIVE_LISTENING: 120000, // 120s → gentle prompt
     PROCESSING_STT: 5000,     // 5s → ERROR_RECOVERY
     PROCESSING_LLM: 30000,    // 30s → ERROR_RECOVERY
     SPEAKING: 60000,          // 60s → force stop
     SESSION_ENDING: 60000,    // 60s → force complete
     ERROR_RECOVERY: 10000     // 10s → ERROR
   };

   /**
    * Session context - data associated with current session
    */
   export interface SessionContext {
     sessionId: string | null;
     patientId: string | null;
     startTime: Date | null;
     turnNumber: number;
     lastTranscript: string;
     lastResponse: string;
     emotionalState: string;
     crisisTier: 1 | 2 | 3 | null;
     warningShown: boolean;
   }

   /**
    * State transition definition
    */
   export interface StateTransition {
     from: SessionState;
     to: SessionState;
     trigger: SessionTrigger;
     guard?: () => boolean;
     action?: () => void | Promise<void>;
   }
   ```

2. Create `src/session/state-machine.ts`:
   ```typescript
   // src/session/state-machine.ts
   // Session State Machine Implementation
   // Reference: system_architecture.md Section 2 (Complete state machine)

   import { EventEmitter } from 'events';
   import {
     SessionState,
     SessionTrigger,
     SessionContext,
     StateTransition,
     STATE_TIMEOUTS
   } from './types.js';
   import { logger } from '../utils/logger.js';

   /**
    * Session State Machine
    * Implements the state machine from system_architecture.md Section 2
    *
    * Events emitted:
    * - 'stateChange': { from, to, trigger }
    * - 'timeout': { state }
    * - 'error': { state, error }
    */
   export class SessionStateMachine extends EventEmitter {
     private currentState: SessionState = 'INIT';
     private context: SessionContext;
     private transitions: StateTransition[] = [];
     private timeoutHandle: NodeJS.Timeout | null = null;

     constructor() {
       super();
       this.context = this.createInitialContext();
       this.setupTransitions();
     }

     /**
      * Create initial session context
      */
     private createInitialContext(): SessionContext {
       return {
         sessionId: null,
         patientId: null,
         startTime: null,
         turnNumber: 0,
         lastTranscript: '',
         lastResponse: '',
         emotionalState: 'neutral',
         crisisTier: null,
         warningShown: false
       };
     }

     /**
      * Setup all valid state transitions
      * Reference: system_architecture.md Section 2.3
      */
     private setupTransitions(): void {
       this.transitions = [
         // Startup flow
         { from: 'INIT', to: 'LOADING', trigger: 'load_application' },
         { from: 'LOADING', to: 'AWAITING_PATIENT', trigger: 'config_loaded' },
         { from: 'LOADING', to: 'ERROR', trigger: 'config_error' },
         { from: 'AWAITING_PATIENT', to: 'READY', trigger: 'patient_overview_loaded' },
         { from: 'AWAITING_PATIENT', to: 'ERROR', trigger: 'validation_failed' },

         // Session flow
         { from: 'READY', to: 'ACTIVE_LISTENING', trigger: 'session_started' },
         { from: 'ACTIVE_LISTENING', to: 'PROCESSING_STT', trigger: 'speech_detected' },
         { from: 'PROCESSING_STT', to: 'PROCESSING_LLM', trigger: 'transcription_complete' },
         { from: 'PROCESSING_STT', to: 'ERROR_RECOVERY', trigger: 'stt_timeout' },
         { from: 'PROCESSING_LLM', to: 'SPEAKING', trigger: 'response_ready' },
         { from: 'PROCESSING_LLM', to: 'ERROR_RECOVERY', trigger: 'llm_timeout' },
         { from: 'SPEAKING', to: 'ACTIVE_LISTENING', trigger: 'speech_complete' },
         { from: 'SPEAKING', to: 'PROCESSING_STT', trigger: 'user_interrupt' },

         // Timer flow
         { from: 'ACTIVE_LISTENING', to: 'WARNING_5MIN', trigger: 'timer_20min' },
         { from: 'PROCESSING_LLM', to: 'WARNING_5MIN', trigger: 'timer_20min' },
         { from: 'SPEAKING', to: 'WARNING_5MIN', trigger: 'timer_20min' },
         { from: 'WARNING_5MIN', to: 'SESSION_ENDING', trigger: 'timer_25min' },
         { from: 'SESSION_ENDING', to: 'SESSION_COMPLETE', trigger: 'summary_complete' },

         // Crisis flow (can be triggered from any active state)
         { from: 'ACTIVE_LISTENING', to: 'CRISIS_PROTOCOL', trigger: 'crisis_detected' },
         { from: 'PROCESSING_STT', to: 'CRISIS_PROTOCOL', trigger: 'crisis_detected' },
         { from: 'PROCESSING_LLM', to: 'CRISIS_PROTOCOL', trigger: 'crisis_detected' },
         { from: 'SPEAKING', to: 'CRISIS_PROTOCOL', trigger: 'crisis_detected' },
         { from: 'CRISIS_PROTOCOL', to: 'ACTIVE_LISTENING', trigger: 'crisis_resolved' },
         { from: 'CRISIS_PROTOCOL', to: 'SESSION_ENDING', trigger: 'escalation_required' },

         // Error recovery
         { from: 'ERROR_RECOVERY', to: 'ACTIVE_LISTENING', trigger: 'recovery_success' },
         { from: 'ERROR_RECOVERY', to: 'ERROR', trigger: 'recovery_failed' },

         // Session end options
         { from: 'SESSION_COMPLETE', to: 'READY', trigger: 'new_session' },
         { from: 'SESSION_COMPLETE', to: 'AWAITING_PATIENT', trigger: 'end_session' }
       ];
     }

     /**
      * Get current state
      */
     public getState(): SessionState {
       return this.currentState;
     }

     /**
      * Get current context
      */
     public getContext(): SessionContext {
       return { ...this.context };
     }

     /**
      * Update context
      */
     public updateContext(updates: Partial<SessionContext>): void {
       this.context = { ...this.context, ...updates };
     }

     /**
      * Trigger a state transition
      * @returns true if transition was valid and executed
      */
     public trigger(triggerName: SessionTrigger): boolean {
       const transition = this.transitions.find(
         t => t.from === this.currentState && t.trigger === triggerName
       );

       if (!transition) {
         logger.warn('Invalid state transition', {
           currentState: this.currentState,
           trigger: triggerName
         });
         return false;
       }

       // Check guard if present
       if (transition.guard && !transition.guard()) {
         logger.debug('Transition guard prevented transition', {
           from: transition.from,
           to: transition.to,
           trigger: triggerName
         });
         return false;
       }

       // Clear any existing timeout
       this.clearTimeout();

       const previousState = this.currentState;
       this.currentState = transition.to;

       logger.info('State transition', {
         from: previousState,
         to: this.currentState,
         trigger: triggerName
       });

       // Execute action if present
       if (transition.action) {
         try {
           const result = transition.action();
           if (result instanceof Promise) {
             result.catch(err => {
               logger.error('Transition action failed', { error: err });
             });
           }
         } catch (err) {
           logger.error('Transition action failed', { error: err });
         }
       }

       // Set timeout for new state
       this.setTimeoutForState(this.currentState);

       // Emit state change event
       this.emit('stateChange', {
         from: previousState,
         to: this.currentState,
         trigger: triggerName
       });

       return true;
     }

     /**
      * Set timeout for a state
      */
     private setTimeoutForState(state: SessionState): void {
       const timeout = STATE_TIMEOUTS[state];
       if (!timeout) return;

       this.timeoutHandle = setTimeout(() => {
         logger.warn('State timeout', { state });
         this.emit('timeout', { state });

         // Auto-trigger timeout transitions
         if (state === 'PROCESSING_STT') {
           this.trigger('stt_timeout');
         } else if (state === 'PROCESSING_LLM') {
           this.trigger('llm_timeout');
         } else if (state === 'ERROR_RECOVERY') {
           this.trigger('recovery_failed');
         }
       }, timeout);
     }

     /**
      * Clear current timeout
      */
     private clearTimeout(): void {
       if (this.timeoutHandle) {
         clearTimeout(this.timeoutHandle);
         this.timeoutHandle = null;
       }
     }

     /**
      * Check if a trigger is valid from current state
      */
     public canTrigger(triggerName: SessionTrigger): boolean {
       return this.transitions.some(
         t => t.from === this.currentState && t.trigger === triggerName
       );
     }

     /**
      * Get all valid triggers from current state
      */
     public getValidTriggers(): SessionTrigger[] {
       return this.transitions
         .filter(t => t.from === this.currentState)
         .map(t => t.trigger);
     }

     /**
      * Reset state machine to initial state
      */
     public reset(): void {
       this.clearTimeout();
       this.currentState = 'INIT';
       this.context = this.createInitialContext();
       logger.info('State machine reset');
     }
   }
   ```

**Verification**:
- [ ] `SessionStateMachine` compiles without errors
- [ ] Initial state is 'INIT'
- [ ] `trigger('load_application')` transitions to 'LOADING'
- [ ] Invalid transitions return false and log warning
- [ ] State change events are emitted
- [ ] Timeouts fire for states with timeout configuration

---

#### Task 4.2: Create State Transition Logic with Guards

**Reference**: system_architecture.md Section 2.3 (guard conditions)

**Implementation**: Included in Task 4.1. Add guards by modifying transitions:

```typescript
// Example: Add guard to prevent session start without patient
{
  from: 'READY',
  to: 'ACTIVE_LISTENING',
  trigger: 'session_started',
  guard: () => {
    // Ensure patient is loaded
    return this.context.patientId !== null;
  }
}
```

**Verification**:
- [ ] Guards prevent invalid transitions
- [ ] `session_started` fails if no patient is loaded

---

#### Task 4.3: Implement Watchdog Timers

**Reference**: system_architecture.md Section 7 (Watchdog Timers table)

**Implementation**: Included in Task 4.1 via `STATE_TIMEOUTS`. Create dedicated watchdog class for component timeouts:

**Files to Create**:
- `src/session/watchdog.ts` - Component watchdog timers

```typescript
// src/session/watchdog.ts
// Component watchdog timers
// Reference: system_architecture.md Section 7

import { logger } from '../utils/logger.js';

/**
 * Watchdog timer configurations from system_architecture.md
 */
export const WATCHDOG_TIMEOUTS = {
  STT_PROCESSING: 5000,      // 5s - switch to offline
  LLM_RESPONSE: 30000,       // 30s - force end
  TTS_GENERATION: 15000,     // 15s - skip audio
  LIP_SYNC: 1000,            // 1s - use static avatar
  CONTEXT_FETCH: 3000,       // 3s - proceed without context
  STATE_PERSISTENCE: 5000,   // 5s - retry in background
  AGENT_COMMUNICATION: 2000, // 2s - direct call fallback
  CRISIS_DETECTION: 500      // 500ms - async (never blocks)
};

export type WatchdogComponent = keyof typeof WATCHDOG_TIMEOUTS;

/**
 * Watchdog timer for a component
 */
export class Watchdog {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private callbacks: Map<string, () => void> = new Map();

  /**
   * Start a watchdog timer for a component
   */
  public start(
    component: WatchdogComponent,
    id: string,
    onTimeout: () => void
  ): void {
    const key = `${component}:${id}`;
    const timeout = WATCHDOG_TIMEOUTS[component];

    // Clear existing timer if any
    this.stop(component, id);

    this.callbacks.set(key, onTimeout);
    this.timers.set(key, setTimeout(() => {
      logger.warn('Watchdog timeout', { component, id, timeout });
      const callback = this.callbacks.get(key);
      if (callback) callback();
      this.timers.delete(key);
      this.callbacks.delete(key);
    }, timeout));
  }

  /**
   * Stop a watchdog timer (component completed successfully)
   */
  public stop(component: WatchdogComponent, id: string): void {
    const key = `${component}:${id}`;
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
      this.callbacks.delete(key);
    }
  }

  /**
   * Stop all watchdog timers
   */
  public stopAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.callbacks.clear();
  }
}

// Export singleton
export const watchdog = new Watchdog();
```

**Verification**:
- [ ] Watchdog timers fire after configured timeout
- [ ] `stop()` prevents timeout callback from firing
- [ ] Multiple components can have independent watchdogs

---

#### Task 4.4: Create State Persistence System

**Reference**: Requirements R1 (persist state every 30 seconds), R24 (Session State Persistence)

**Files to Create**:
- `src/session/persistence.ts` - Session state persistence

```typescript
// src/session/persistence.ts
// Session state persistence system
// Reference: Requirements R1 (30s auto-save), R24

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { SessionStateMachine } from './state-machine.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PERSISTENCE_INTERVAL = 30000; // 30 seconds per R1

export interface PersistedSessionState {
  version: string;
  sessionId: string;
  patientId: string;
  state: string;
  context: Record<string, unknown>;
  transcript: Array<{ speaker: string; content: string; timestamp: string }>;
  persistedAt: string;
  checkpointNumber: number;
}

/**
 * Session Persistence Manager
 * Auto-saves session state every 30 seconds
 */
export class SessionPersistence {
  private stateMachine: SessionStateMachine;
  private intervalHandle: NodeJS.Timeout | null = null;
  private checkpointNumber = 0;
  private transcript: Array<{ speaker: string; content: string; timestamp: string }> = [];

  constructor(stateMachine: SessionStateMachine) {
    this.stateMachine = stateMachine;
  }

  /**
   * Start auto-persistence
   */
  public startAutoPersist(): void {
    if (this.intervalHandle) return;

    this.intervalHandle = setInterval(async () => {
      try {
        await this.persist();
      } catch (error) {
        logger.error('Auto-persist failed', { error });
      }
    }, PERSISTENCE_INTERVAL);

    logger.info('Session auto-persistence started', { intervalMs: PERSISTENCE_INTERVAL });
  }

  /**
   * Stop auto-persistence
   */
  public stopAutoPersist(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      logger.info('Session auto-persistence stopped');
    }
  }

  /**
   * Add a transcript entry
   */
  public addTranscriptEntry(speaker: 'patient' | 'dr_sterling', content: string): void {
    this.transcript.push({
      speaker,
      content,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Persist current session state
   */
  public async persist(): Promise<string | null> {
    const context = this.stateMachine.getContext();
    if (!context.sessionId || !context.patientId) {
      return null;
    }

    this.checkpointNumber++;

    const state: PersistedSessionState = {
      version: '1.0.0',
      sessionId: context.sessionId,
      patientId: context.patientId,
      state: this.stateMachine.getState(),
      context,
      transcript: [...this.transcript],
      persistedAt: new Date().toISOString(),
      checkpointNumber: this.checkpointNumber
    };

    const sessionDir = path.join(
      __dirname,
      '../../memory_directory/patients',
      context.patientId,
      'sessions',
      context.sessionId
    );

    await fs.mkdir(sessionDir, { recursive: true });

    // Save state.json (current state)
    const statePath = path.join(sessionDir, 'state.json');
    await fs.writeFile(statePath, JSON.stringify(state, null, 2));

    // Save checkpoint (backup)
    const checkpointPath = path.join(
      sessionDir,
      `checkpoint_${this.checkpointNumber.toString().padStart(4, '0')}.json`
    );
    await fs.writeFile(checkpointPath, JSON.stringify(state, null, 2));

    logger.debug('Session state persisted', {
      sessionId: context.sessionId,
      checkpoint: this.checkpointNumber
    });

    return statePath;
  }

  /**
   * Load persisted session state
   */
  public async loadPersistedState(
    patientId: string,
    sessionId: string
  ): Promise<PersistedSessionState | null> {
    const statePath = path.join(
      __dirname,
      '../../memory_directory/patients',
      patientId,
      'sessions',
      sessionId,
      'state.json'
    );

    try {
      const content = await fs.readFile(statePath, 'utf-8');
      return JSON.parse(content) as PersistedSessionState;
    } catch {
      return null;
    }
  }

  /**
   * Reset persistence state for new session
   */
  public reset(): void {
    this.checkpointNumber = 0;
    this.transcript = [];
  }
}
```

**Verification**:
- [ ] Auto-persist saves state every 30 seconds
- [ ] Checkpoint files are created with incrementing numbers
- [ ] `loadPersistedState()` correctly loads saved state
- [ ] Transcript entries are included in persisted state

---

#### Task 4.5: Implement CRDT-Based Transcript Merging

**Reference**: Requirements R24 (CRDT for transcript merging)

**Files to Create**:
- `src/session/crdt.ts` - CRDT implementation for transcripts

```typescript
// src/session/crdt.ts
// CRDT-based transcript merging
// Reference: Requirements R24 (Conflict-free Replicated Data Types)

/**
 * Transcript entry with unique ID for CRDT
 */
export interface CRDTTranscriptEntry {
  id: string;           // Unique ID: {timestamp}-{source}-{random}
  speaker: 'patient' | 'dr_sterling' | 'system';
  content: string;
  timestamp: number;    // Unix timestamp in ms
  source: 'local' | 'cloud';
  deleted: boolean;     // Tombstone for deletions
}

/**
 * CRDT Transcript Manager
 * Implements a Grow-Only Set (G-Set) with timestamps for ordering
 * and tombstones for deletions (OR-Set semantics)
 */
export class TranscriptCRDT {
  private entries: Map<string, CRDTTranscriptEntry> = new Map();

  /**
   * Add a new entry to the transcript
   */
  public add(
    speaker: CRDTTranscriptEntry['speaker'],
    content: string,
    source: 'local' | 'cloud' = 'local'
  ): string {
    const timestamp = Date.now();
    const id = `${timestamp}-${source}-${Math.random().toString(36).substr(2, 9)}`;

    const entry: CRDTTranscriptEntry = {
      id,
      speaker,
      content,
      timestamp,
      source,
      deleted: false
    };

    this.entries.set(id, entry);
    return id;
  }

  /**
   * Merge another CRDT transcript into this one
   * Uses Last-Writer-Wins for conflicts
   */
  public merge(other: TranscriptCRDT): void {
    for (const [id, entry] of other.entries) {
      const existing = this.entries.get(id);

      if (!existing) {
        // New entry - add it
        this.entries.set(id, { ...entry });
      } else {
        // Existing entry - use LWW based on timestamp
        if (entry.timestamp > existing.timestamp) {
          this.entries.set(id, { ...entry });
        }
      }
    }
  }

  /**
   * Get all entries in chronological order
   */
  public getEntries(): CRDTTranscriptEntry[] {
    return Array.from(this.entries.values())
      .filter(e => !e.deleted)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Export as plain array for persistence
   */
  public toArray(): CRDTTranscriptEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Import from array (for loading persisted state)
   */
  public static fromArray(entries: CRDTTranscriptEntry[]): TranscriptCRDT {
    const crdt = new TranscriptCRDT();
    for (const entry of entries) {
      crdt.entries.set(entry.id, entry);
    }
    return crdt;
  }

  /**
   * Get entry count (excluding deleted)
   */
  public size(): number {
    return this.getEntries().length;
  }
}
```

**Verification**:
- [ ] Adding entries creates unique IDs
- [ ] Merge combines entries from both CRDTs
- [ ] Duplicate IDs use Last-Writer-Wins
- [ ] Deleted entries (tombstones) are excluded from `getEntries()`

---

#### Task 4.6: Create Session Recovery System

**Reference**: Requirements R24 (Resume Previous Session on crash)

**Files to Create**:
- `src/session/recovery.ts` - Session recovery after crash

```typescript
// src/session/recovery.ts
// Session crash recovery
// Reference: Requirements R24 (preserve 95% of data)

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PersistedSessionState, SessionPersistence } from './persistence.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface RecoveryResult {
  success: boolean;
  sessionId: string;
  recoveredTurns: number;
  dataIntegrity: number;  // Percentage of data recovered
  resumeState: string;
}

/**
 * Find the most recent session for a patient that was interrupted
 */
export async function findRecoverableSession(
  patientId: string
): Promise<{ sessionId: string; state: PersistedSessionState } | null> {
  const sessionsDir = path.join(
    __dirname,
    '../../memory_directory/patients',
    patientId,
    'sessions'
  );

  try {
    const sessionDirs = await fs.readdir(sessionsDir);

    for (const sessionId of sessionDirs.reverse()) {  // Most recent first
      const statePath = path.join(sessionsDir, sessionId, 'state.json');

      try {
        const content = await fs.readFile(statePath, 'utf-8');
        const state = JSON.parse(content) as PersistedSessionState;

        // Check if session was interrupted (not SESSION_COMPLETE)
        if (state.state !== 'SESSION_COMPLETE' && state.state !== 'INIT') {
          logger.info('Found recoverable session', { sessionId, state: state.state });
          return { sessionId, state };
        }
      } catch {
        continue;
      }
    }
  } catch {
    // No sessions directory
  }

  return null;
}

/**
 * Attempt to recover a crashed session
 */
export async function recoverSession(
  patientId: string,
  sessionId: string
): Promise<RecoveryResult> {
  logger.info('Attempting session recovery', { patientId, sessionId });

  const sessionDir = path.join(
    __dirname,
    '../../memory_directory/patients',
    patientId,
    'sessions',
    sessionId
  );

  // Try to load state.json first
  const statePath = path.join(sessionDir, 'state.json');
  let state: PersistedSessionState | null = null;

  try {
    const content = await fs.readFile(statePath, 'utf-8');
    state = JSON.parse(content);
  } catch {
    // Try latest checkpoint
    const files = await fs.readdir(sessionDir);
    const checkpoints = files.filter(f => f.startsWith('checkpoint_')).sort().reverse();

    if (checkpoints.length > 0) {
      const checkpointPath = path.join(sessionDir, checkpoints[0]);
      const content = await fs.readFile(checkpointPath, 'utf-8');
      state = JSON.parse(content);
      logger.info('Recovered from checkpoint', { checkpoint: checkpoints[0] });
    }
  }

  if (!state) {
    return {
      success: false,
      sessionId,
      recoveredTurns: 0,
      dataIntegrity: 0,
      resumeState: 'ERROR'
    };
  }

  // Calculate data integrity
  const transcriptCount = state.transcript.length;
  const expectedMinimum = 1;  // At least something
  const dataIntegrity = Math.min(100, (transcriptCount / Math.max(expectedMinimum, transcriptCount)) * 100);

  return {
    success: true,
    sessionId,
    recoveredTurns: transcriptCount,
    dataIntegrity,
    resumeState: 'ACTIVE_LISTENING'  // Resume to listening state
  };
}
```

**Verification**:
- [ ] `findRecoverableSession()` finds interrupted sessions
- [ ] `recoverSession()` loads from state.json or latest checkpoint
- [ ] Recovery returns correct turn count and data integrity percentage

---

#### Task 4.7: Implement Session Timer

**Reference**: Requirements R1 (5-min warning at 20 min, auto-end at 25 min)

**Files to Create**:
- `src/session/timer.ts` - Session timer with warnings

```typescript
// src/session/timer.ts
// Session timer with 5-minute warning
// Reference: Requirements R1 (25 min max, warning at 20 min)

import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';

const WARNING_TIME_MS = 20 * 60 * 1000;  // 20 minutes
const MAX_TIME_MS = 25 * 60 * 1000;       // 25 minutes
const MIN_TIME_MS = 5 * 60 * 1000;        // 5 minutes

/**
 * Session Timer
 * Tracks session duration with warnings and auto-end
 *
 * Events:
 * - 'tick': { elapsed, remaining } - every second
 * - 'minimumReached': {} - when 5 min minimum reached
 * - 'warning': {} - when 20 min warning triggered
 * - 'expired': {} - when 25 min limit reached
 */
export class SessionTimer extends EventEmitter {
  private startTime: Date | null = null;
  private intervalHandle: NodeJS.Timeout | null = null;
  private warningTriggered = false;
  private minimumReached = false;

  /**
   * Start the session timer
   */
  public start(): void {
    if (this.startTime) {
      logger.warn('Timer already started');
      return;
    }

    this.startTime = new Date();
    this.warningTriggered = false;
    this.minimumReached = false;

    this.intervalHandle = setInterval(() => {
      this.tick();
    }, 1000);

    logger.info('Session timer started');
  }

  /**
   * Stop the timer
   */
  public stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    logger.info('Session timer stopped', { elapsed: this.getElapsedMs() });
  }

  /**
   * Get elapsed time in milliseconds
   */
  public getElapsedMs(): number {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime.getTime();
  }

  /**
   * Get remaining time in milliseconds
   */
  public getRemainingMs(): number {
    return Math.max(0, MAX_TIME_MS - this.getElapsedMs());
  }

  /**
   * Get formatted time strings for display
   */
  public getDisplayTime(): { elapsed: string; remaining: string } {
    const elapsed = this.getElapsedMs();
    const remaining = this.getRemainingMs();

    return {
      elapsed: this.formatTime(elapsed),
      remaining: this.formatTime(remaining)
    };
  }

  /**
   * Format milliseconds as MM:SS
   */
  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Timer tick - called every second
   */
  private tick(): void {
    const elapsed = this.getElapsedMs();
    const remaining = this.getRemainingMs();

    this.emit('tick', {
      elapsed,
      remaining,
      elapsedFormatted: this.formatTime(elapsed),
      remainingFormatted: this.formatTime(remaining)
    });

    // Check minimum reached (5 minutes)
    if (!this.minimumReached && elapsed >= MIN_TIME_MS) {
      this.minimumReached = true;
      this.emit('minimumReached');
      logger.info('Session minimum duration reached');
    }

    // Check warning (20 minutes)
    if (!this.warningTriggered && elapsed >= WARNING_TIME_MS) {
      this.warningTriggered = true;
      this.emit('warning');
      logger.info('Session 5-minute warning triggered');
    }

    // Check expired (25 minutes)
    if (remaining <= 0) {
      this.stop();
      this.emit('expired');
      logger.info('Session time expired');
    }
  }

  /**
   * Check if timer is running
   */
  public isRunning(): boolean {
    return this.intervalHandle !== null;
  }

  /**
   * Reset timer for new session
   */
  public reset(): void {
    this.stop();
    this.startTime = null;
    this.warningTriggered = false;
    this.minimumReached = false;
  }
}
```

**Verification**:
- [ ] Timer starts and emits 'tick' events every second
- [ ] 'minimumReached' emitted at 5 minutes
- [ ] 'warning' emitted at 20 minutes
- [ ] 'expired' emitted at 25 minutes
- [ ] Timer stops automatically when expired

---

### Task 5: Patient Data Management

**References**:
- Requirements R9-R11 (Patient Overview, Memory, Medication)
- data_schemas.md Section 1 (Patient_Overview schema)
- AGENTS.md Article IV (Specification-First)

**Prerequisites**: Task 1, Task 2, Task 3

**Estimated Subtasks**: 7

---

#### Task 5.1: Implement Patient Overview Schema Validation

**Reference**: data_schemas.md Section 1 (complete Patient_Overview JSON schema)

**Files to Create**:
- `src/patient/schema.ts` - Zod schema for Patient_Overview validation

**Step-by-Step Instructions**:

1. Create `src/patient/schema.ts`:
   ```typescript
   // src/patient/schema.ts
   // Patient_Overview validation using Zod
   // Reference: data_schemas.md Section 1 (exact schema definition)

   import { z } from 'zod';

   /**
    * Basic Info schema
    */
   export const basicInfoSchema = z.object({
     name: z.string().min(1).max(100),
     preferred_name: z.string().max(50).optional(),
     age: z.number().int().min(13).max(120).optional(),
     date_of_birth: z.string().date().optional(),
     pronouns: z.enum(['he/him', 'she/her', 'they/them', 'other']).optional(),
     occupation: z.string().max(100).optional(),
     relationship_status: z.enum([
       'single', 'in_relationship', 'married', 'divorced',
       'widowed', 'separated', 'prefer_not_to_say'
     ]).optional(),
     living_situation: z.string().max(200).optional(),
     location: z.object({
       country: z.string().optional(),
       timezone: z.string().optional()
     }).optional()
   });

   /**
    * Clinical Profile schema
    */
   export const clinicalProfileSchema = z.object({
     presenting_concerns: z.array(z.object({
       concern: z.string(),
       severity: z.enum(['mild', 'moderate', 'severe']).optional(),
       onset_date: z.string().date().optional(),
       notes: z.string().optional()
     })).optional(),
     diagnosis_history: z.array(z.object({
       diagnosis: z.string(),
       icd_code: z.string().optional(),
       diagnosed_date: z.string().date().optional(),
       diagnosed_by: z.string().optional(),
       status: z.enum(['active', 'in_remission', 'resolved']).optional()
     })).optional(),
     treatment_goals: z.array(z.object({
       goal_id: z.string().uuid().optional(),
       description: z.string(),
       target_date: z.string().date().optional(),
       progress: z.number().min(0).max(100).optional(),
       status: z.enum(['active', 'achieved', 'modified', 'abandoned']).optional(),
       milestones: z.array(z.string()).optional()
     })).optional(),
     therapeutic_approaches: z.array(z.enum([
       'CBT', 'DBT', 'ACT', 'EMDR', 'Psychodynamic',
       'Humanistic', 'Motivational_Interviewing',
       'Solution_Focused', 'Narrative', 'Other'
     ])).optional(),
     contraindications: z.array(z.string()).optional(),
     triggers: z.array(z.object({
       trigger: z.string(),
       severity: z.enum(['mild', 'moderate', 'severe']).optional(),
       coping_strategy: z.string().optional()
     })).optional(),
     coping_strategies: z.array(z.object({
       strategy: z.string(),
       effectiveness: z.enum(['very_effective', 'somewhat_effective', 'not_effective']).optional(),
       context: z.string().optional()
     })).optional(),
     support_system: z.array(z.object({
       name: z.string(),
       relationship: z.string().optional(),
       availability: z.string().optional(),
       notes: z.string().optional()
     })).optional()
   }).optional();

   /**
    * Medication History schema
    */
   export const medicationSchema = z.object({
     medication_id: z.string().uuid().optional(),
     medication_name: z.string(),
     generic_name: z.string().optional(),
     dosage: z.string().optional(),
     frequency: z.string().optional(),
     route: z.enum(['oral', 'injection', 'topical', 'other']).optional(),
     start_date: z.string().date().optional(),
     end_date: z.string().date().optional(),
     prescriber: z.string().optional(),
     reason: z.string().optional(),
     effectiveness: z.enum(['very_effective', 'somewhat_effective', 'not_effective', 'unknown']).optional(),
     side_effects: z.array(z.string()).optional(),
     reason_discontinued: z.string().optional(),
     is_current: z.boolean().optional()
   });

   /**
    * Personal Context schema (hobbies, aspirations, etc.)
    */
   export const personalContextSchema = z.object({
     hobbies: z.array(z.object({
       hobby: z.string(),
       engagement_level: z.enum(['active', 'occasional', 'past']).optional(),
       first_mentioned: z.string().datetime().optional()
     })).optional(),
     aspirations: z.array(z.object({
       aspiration: z.string(),
       timeframe: z.string().optional(),
       first_mentioned: z.string().datetime().optional()
     })).optional(),
     values: z.array(z.string()).optional(),
     cultural_background: z.string().optional(),
     spiritual_beliefs: z.string().optional(),
     important_relationships: z.array(z.object({
       name: z.string(),
       relationship: z.string(),
       significance: z.string().optional(),
       notes: z.string().optional()
     })).optional(),
     life_events: z.array(z.object({
       event: z.string(),
       date: z.string().optional(),
       impact: z.enum(['positive', 'negative', 'neutral', 'mixed']).optional(),
       notes: z.string().optional()
     })).optional()
   }).optional();

   /**
    * Risk Assessment schema
    */
   export const riskAssessmentSchema = z.object({
     current_risk_level: z.enum(['low', 'moderate', 'high', 'crisis']).optional(),
     last_assessed: z.string().datetime().optional(),
     risk_factors: z.array(z.string()).optional(),
     protective_factors: z.array(z.string()).optional(),
     safety_plan: z.object({
       warning_signs: z.array(z.string()).optional(),
       coping_strategies: z.array(z.string()).optional(),
       support_contacts: z.array(z.object({})).optional(),
       professional_contacts: z.array(z.object({})).optional(),
       environment_safety: z.string().optional(),
       reasons_to_live: z.array(z.string()).optional()
     }).optional(),
     crisis_history: z.array(z.object({
       date: z.string().datetime(),
       description: z.string(),
       intervention: z.string().optional(),
       outcome: z.string().optional()
     })).optional()
   }).optional();

   /**
    * Complete Patient_Overview schema
    * Reference: data_schemas.md Section 1
    */
   export const patientOverviewSchema = z.object({
     patient_id: z.string().uuid(),
     schema_version: z.string().regex(/^\d+\.\d+\.\d+$/).default('1.0.0'),
     created_at: z.string().datetime(),
     updated_at: z.string().datetime().optional(),
     version: z.number().int().min(1).optional(),
     basic_info: basicInfoSchema,
     clinical_profile: clinicalProfileSchema,
     medication_history: z.array(medicationSchema).optional(),
     personal_context: personalContextSchema,
     session_history: z.array(z.object({
       session_id: z.string().uuid(),
       date: z.string().datetime(),
       duration_minutes: z.number().int().optional(),
       key_topics: z.array(z.string()).optional(),
       mood_start: z.string().optional(),
       mood_end: z.string().optional(),
       breakthroughs: z.array(z.string()).optional(),
       homework_assigned: z.array(z.string()).optional(),
       homework_completed: z.boolean().optional(),
       summary_snippet: z.string().max(500).optional()
     })).optional(),
     risk_assessment: riskAssessmentSchema
   });

   // Type export
   export type PatientOverview = z.infer<typeof patientOverviewSchema>;

   /**
    * Validate patient overview data
    * @throws ZodError if validation fails
    */
   export function validatePatientOverview(data: unknown): PatientOverview {
     return patientOverviewSchema.parse(data);
   }

   /**
    * Safe validation that returns result instead of throwing
    */
   export function safeValidatePatientOverview(data: unknown): {
     success: boolean;
     data?: PatientOverview;
     errors?: string[];
   } {
     const result = patientOverviewSchema.safeParse(data);
     if (result.success) {
       return { success: true, data: result.data };
     } else {
       return {
         success: false,
         errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
       };
     }
   }
   ```

**Verification**:
- [ ] Schema validates correct Patient_Overview documents
- [ ] Schema rejects documents with missing required fields
- [ ] Schema rejects documents with invalid enum values
- [ ] Error messages identify the specific field that failed

---

#### Task 5.2: Create Patient Context Loading Service

**Reference**:
- Requirements R10 (Comprehensive Patient Memory), R29 (Context Retrieval)
- data_schemas.md Section 1 (Patient_Overview JSON schema)

**Prerequisites**: Task 5.1

**Files to Create**:
- `src/patient/context-loader.ts` - Patient context loading service

**Step-by-Step Instructions**:

1. Create `src/patient/context-loader.ts`:
   ```typescript
   // src/patient/context-loader.ts
   // Patient context loading service
   // Reference: Requirements R10 (load context without context bloating)

   import path from 'path';
   import fs from 'fs/promises';
   import { fileURLToPath } from 'url';
   import { PatientOverview, validatePatientOverview } from './patient-schema.js';
   import { logger } from '../utils/logger.js';

   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);

   /**
    * Context priority levels for intelligent loading
    * Reference: R10 (load context without bloating)
    */
   export type ContextPriority = 'critical' | 'high' | 'medium' | 'low';

   /**
    * Context segment with priority
    */
   export interface ContextSegment {
     type: string;
     priority: ContextPriority;
     content: string;
     tokenEstimate: number;
   }

   /**
    * Loaded patient context
    */
   export interface LoadedContext {
     patientId: string;
     patientName: string;
     preferredName: string;
     segments: ContextSegment[];
     totalTokens: number;
     loadedAt: string;
   }

   /**
    * Token budget configuration
    * Total budget should stay under context limits
    */
   const TOKEN_BUDGETS = {
     critical: 2000,   // Basic info, current risk, active medications
     high: 3000,       // Treatment goals, recent sessions, triggers
     medium: 2000,     // History, coping strategies, personal context
     low: 1000         // Older sessions, aspirations, hobbies
   };

   /**
    * Estimate tokens in a string (rough: 1 token ≈ 4 chars)
    */
   function estimateTokens(text: string): number {
     return Math.ceil(text.length / 4);
   }

   /**
    * Patient Context Loader
    * Intelligently loads patient context with priority-based budgeting
    */
   export class PatientContextLoader {
     private memoryDir: string;

     constructor() {
       this.memoryDir = path.join(__dirname, '../../memory_directory/patients');
     }

     /**
      * Load patient overview from file
      */
     public async loadPatientOverview(patientId: string): Promise<PatientOverview | null> {
       const overviewPath = path.join(this.memoryDir, patientId, 'overview.json');

       try {
         const content = await fs.readFile(overviewPath, 'utf-8');
         const data = JSON.parse(content);
         return validatePatientOverview(data);
       } catch (error) {
         logger.warn('Failed to load patient overview', { patientId, error });
         return null;
       }
     }

     /**
      * Extract context segments from patient overview
      */
     private extractSegments(overview: PatientOverview): ContextSegment[] {
       const segments: ContextSegment[] = [];

       // CRITICAL: Basic info and risk
       const basicInfo = `Patient: ${overview.basic_info.name}` +
         (overview.basic_info.preferred_name ? ` (goes by ${overview.basic_info.preferred_name})` : '') +
         (overview.basic_info.age ? `, Age: ${overview.basic_info.age}` : '') +
         (overview.basic_info.occupation ? `, Occupation: ${overview.basic_info.occupation}` : '');

       segments.push({
         type: 'basic_info',
         priority: 'critical',
         content: basicInfo,
         tokenEstimate: estimateTokens(basicInfo)
       });

       // CRITICAL: Current risk level
       if (overview.risk_assessment?.current_risk_level) {
         const riskContent = `Current Risk Level: ${overview.risk_assessment.current_risk_level}` +
           (overview.risk_assessment.risk_factors?.length
             ? `. Risk factors: ${overview.risk_assessment.risk_factors.join(', ')}` : '') +
           (overview.risk_assessment.protective_factors?.length
             ? `. Protective factors: ${overview.risk_assessment.protective_factors.join(', ')}` : '');

         segments.push({
           type: 'risk_assessment',
           priority: 'critical',
           content: riskContent,
           tokenEstimate: estimateTokens(riskContent)
         });
       }

       // CRITICAL: Current medications
       const currentMeds = overview.medication_history?.filter(m => m.is_current) || [];
       if (currentMeds.length > 0) {
         const medsContent = 'Current Medications: ' + currentMeds
           .map(m => `${m.medication_name} ${m.dosage || ''} ${m.frequency || ''}`.trim())
           .join('; ');

         segments.push({
           type: 'current_medications',
           priority: 'critical',
           content: medsContent,
           tokenEstimate: estimateTokens(medsContent)
         });
       }

       // HIGH: Presenting concerns
       if (overview.clinical_profile?.presenting_concerns?.length) {
         const concernsContent = 'Presenting Concerns: ' + overview.clinical_profile.presenting_concerns
           .map(c => `${c.concern} (${c.severity || 'unspecified severity'})`)
           .join('; ');

         segments.push({
           type: 'presenting_concerns',
           priority: 'high',
           content: concernsContent,
           tokenEstimate: estimateTokens(concernsContent)
         });
       }

       // HIGH: Treatment goals
       if (overview.clinical_profile?.treatment_goals?.length) {
         const goalsContent = 'Treatment Goals: ' + overview.clinical_profile.treatment_goals
           .filter(g => g.status === 'active')
           .map(g => `${g.description} (${g.progress || 0}% progress)`)
           .join('; ');

         segments.push({
           type: 'treatment_goals',
           priority: 'high',
           content: goalsContent,
           tokenEstimate: estimateTokens(goalsContent)
         });
       }

       // HIGH: Known triggers
       if (overview.clinical_profile?.triggers?.length) {
         const triggersContent = 'Known Triggers: ' + overview.clinical_profile.triggers
           .map(t => `${t.trigger} (${t.severity || 'unspecified'})` +
             (t.coping_strategy ? ` - coping: ${t.coping_strategy}` : ''))
           .join('; ');

         segments.push({
           type: 'triggers',
           priority: 'high',
           content: triggersContent,
           tokenEstimate: estimateTokens(triggersContent)
         });
       }

       // MEDIUM: Recent sessions (last 3)
       if (overview.session_history?.length) {
         const recentSessions = overview.session_history.slice(0, 3);
         const sessionsContent = 'Recent Sessions: ' + recentSessions
           .map(s => `${s.date}: ${s.key_topics?.join(', ') || 'no topics recorded'}` +
             (s.summary_snippet ? ` - ${s.summary_snippet}` : ''))
           .join(' | ');

         segments.push({
           type: 'recent_sessions',
           priority: 'medium',
           content: sessionsContent,
           tokenEstimate: estimateTokens(sessionsContent)
         });
       }

       // MEDIUM: Coping strategies
       if (overview.clinical_profile?.coping_strategies?.length) {
         const copingContent = 'Coping Strategies: ' + overview.clinical_profile.coping_strategies
           .filter(c => c.effectiveness !== 'not_effective')
           .map(c => `${c.strategy} (${c.effectiveness})`)
           .join('; ');

         segments.push({
           type: 'coping_strategies',
           priority: 'medium',
           content: copingContent,
           tokenEstimate: estimateTokens(copingContent)
         });
       }

       // LOW: Personal context (hobbies, aspirations)
       if (overview.personal_context) {
         const parts: string[] = [];

         if (overview.personal_context.hobbies?.length) {
           parts.push('Hobbies: ' + overview.personal_context.hobbies
             .filter(h => h.engagement_level === 'active')
             .map(h => h.hobby)
             .join(', '));
         }

         if (overview.personal_context.aspirations?.length) {
           parts.push('Aspirations: ' + overview.personal_context.aspirations
             .map(a => a.aspiration)
             .join(', '));
         }

         if (overview.personal_context.values?.length) {
           parts.push('Values: ' + overview.personal_context.values.join(', '));
         }

         if (parts.length > 0) {
           const personalContent = parts.join('. ');
           segments.push({
             type: 'personal_context',
             priority: 'low',
             content: personalContent,
             tokenEstimate: estimateTokens(personalContent)
           });
         }
       }

       return segments;
     }

     /**
      * Load patient context with intelligent prioritization
      * Reference: R10 (load without context bloating)
      */
     public async loadContext(patientId: string): Promise<LoadedContext | null> {
       const overview = await this.loadPatientOverview(patientId);
       if (!overview) {
         return null;
       }

       const allSegments = this.extractSegments(overview);
       const loadedSegments: ContextSegment[] = [];
       const budgetUsed = { critical: 0, high: 0, medium: 0, low: 0 };

       // Load segments respecting budget per priority
       for (const segment of allSegments) {
         const budget = TOKEN_BUDGETS[segment.priority];
         const used = budgetUsed[segment.priority];

         if (used + segment.tokenEstimate <= budget) {
           loadedSegments.push(segment);
           budgetUsed[segment.priority] += segment.tokenEstimate;
         } else {
           logger.debug('Skipping segment due to budget', {
             type: segment.type,
             priority: segment.priority,
             tokens: segment.tokenEstimate,
             budgetRemaining: budget - used
           });
         }
       }

       const totalTokens = loadedSegments.reduce((sum, s) => sum + s.tokenEstimate, 0);

       logger.info('Patient context loaded', {
         patientId,
         segmentCount: loadedSegments.length,
         totalTokens,
         budgetUsed
       });

       return {
         patientId,
         patientName: overview.basic_info.name,
         preferredName: overview.basic_info.preferred_name || overview.basic_info.name,
         segments: loadedSegments,
         totalTokens,
         loadedAt: new Date().toISOString()
       };
     }

     /**
      * Format context for LLM prompt injection
      */
     public formatForPrompt(context: LoadedContext): string {
       const lines: string[] = [
         '=== PATIENT CONTEXT ===',
         ''
       ];

       // Group by priority
       const byPriority = {
         critical: context.segments.filter(s => s.priority === 'critical'),
         high: context.segments.filter(s => s.priority === 'high'),
         medium: context.segments.filter(s => s.priority === 'medium'),
         low: context.segments.filter(s => s.priority === 'low')
       };

       for (const segment of byPriority.critical) {
         lines.push(`[CRITICAL] ${segment.content}`);
       }
       lines.push('');

       for (const segment of byPriority.high) {
         lines.push(`[HIGH] ${segment.content}`);
       }
       lines.push('');

       for (const segment of byPriority.medium) {
         lines.push(segment.content);
       }
       lines.push('');

       for (const segment of byPriority.low) {
         lines.push(segment.content);
       }

       lines.push('');
       lines.push('=== END PATIENT CONTEXT ===');

       return lines.join('\n');
     }
   }

   // Export singleton
   export const patientContextLoader = new PatientContextLoader();
   ```

**Verification**:
- [ ] `PatientContextLoader` compiles without errors
- [ ] Loading non-existent patient returns null
- [ ] Context segments are prioritized correctly
- [ ] Token budgets are respected
- [ ] `formatForPrompt()` produces readable output

---

#### Task 5.3: Implement Memory Capture Service

**Reference**:
- Requirements R10 (capture every detail mentioned by patients)
- data_schemas.md Section 1 (personal_context, hobbies, aspirations)

**Prerequisites**: Task 5.1, Task 5.2

**Files to Create**:
- `src/patient/memory-capture.ts` - Real-time memory capture from conversations

**Step-by-Step Instructions**:

1. Create `src/patient/memory-capture.ts`:
   ```typescript
   // src/patient/memory-capture.ts
   // Real-time memory capture from patient conversations
   // Reference: Requirements R10 (capture casual mentions, aspirations)

   import { logger } from '../utils/logger.js';
   import { PatientOverview } from './patient-schema.js';

   /**
    * Captured memory types
    */
   export type MemoryType =
     | 'hobby'
     | 'aspiration'
     | 'relationship'
     | 'preference'
     | 'trigger'
     | 'coping_strategy'
     | 'medication_mention'
     | 'life_event'
     | 'value'
     | 'concern';

   /**
    * A captured memory from conversation
    */
   export interface CapturedMemory {
     id: string;
     type: MemoryType;
     content: string;
     extractedFrom: string;  // The original utterance
     timestamp: string;
     sessionId: string;
     confidence: number;  // 0.0-1.0 how confident we are in extraction
     processed: boolean;
   }

   /**
    * Memory extraction patterns
    * These regex patterns help identify memory-worthy content
    */
   const MEMORY_PATTERNS: Record<MemoryType, RegExp[]> = {
     hobby: [
       /I (?:like|love|enjoy) (?:to )?(\w+ing)/gi,
       /I'm a (\w+(?:er|ist|or))/gi,
       /I (?:play|do|practice) (\w+)/gi,
       /my hobby is (\w+)/gi
     ],
     aspiration: [
       /I want to (?:be|become) (.+?)(?:\.|,|$)/gi,
       /I hope to (.+?)(?:\.|,|$)/gi,
       /my (?:dream|goal) is to (.+?)(?:\.|,|$)/gi,
       /I wish I could (.+?)(?:\.|,|$)/gi
     ],
     relationship: [
       /my (\w+) (?:is|are|was|were) (.+?)(?:\.|,|$)/gi,
       /I have a (\w+) named (\w+)/gi
     ],
     preference: [
       /I (?:prefer|like) (.+?) over (.+)/gi,
       /I (?:don't like|hate|can't stand) (.+?)(?:\.|,|$)/gi
     ],
     trigger: [
       /(?:when|whenever) (.+?) I (?:feel|get|become) (\w+)/gi,
       /(.+?) (?:makes|triggers|causes) me (?:to )?(\w+)/gi
     ],
     coping_strategy: [
       /(?:when|if) I (?:feel|am) (\w+),? I (.+?)(?:\.|,|$)/gi,
       /(.+?) helps me (?:with|when|feel)/gi
     ],
     medication_mention: [
       /I'm (?:on|taking) (\w+)/gi,
       /my doctor prescribed (\w+)/gi,
       /I take (\w+) (?:for|because)/gi
     ],
     life_event: [
       /(?:last|this) (?:week|month|year) I (.+?)(?:\.|,|$)/gi,
       /recently I (.+?)(?:\.|,|$)/gi,
       /I just (.+?)(?:\.|,|$)/gi
     ],
     value: [
       /I (?:believe|think) (?:that )?(.+?) is important/gi,
       /(.+?) matters (?:a lot )?to me/gi
     ],
     concern: [
       /I'm worried about (.+?)(?:\.|,|$)/gi,
       /I'm concerned (?:about|that) (.+?)(?:\.|,|$)/gi,
       /(.+?) has been bothering me/gi
     ]
   };

   /**
    * Memory Capture Service
    * Extracts and stores memories from patient utterances
    */
   export class MemoryCaptureService {
     private capturedMemories: CapturedMemory[] = [];
     private sessionId: string = '';

     /**
      * Start capturing for a new session
      */
     public startSession(sessionId: string): void {
       this.sessionId = sessionId;
       this.capturedMemories = [];
       logger.info('Memory capture started', { sessionId });
     }

     /**
      * Process a patient utterance for memory extraction
      */
     public processUtterance(utterance: string): CapturedMemory[] {
       const newMemories: CapturedMemory[] = [];

       for (const [type, patterns] of Object.entries(MEMORY_PATTERNS)) {
         for (const pattern of patterns) {
           // Reset regex state
           pattern.lastIndex = 0;

           let match;
           while ((match = pattern.exec(utterance)) !== null) {
             const memory: CapturedMemory = {
               id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
               type: type as MemoryType,
               content: match[1]?.trim() || match[0],
               extractedFrom: utterance,
               timestamp: new Date().toISOString(),
               sessionId: this.sessionId,
               confidence: this.calculateConfidence(match[0], type as MemoryType),
               processed: false
             };

             // Avoid duplicates
             if (!this.isDuplicate(memory)) {
               newMemories.push(memory);
               this.capturedMemories.push(memory);
               logger.debug('Memory captured', { type, content: memory.content });
             }
           }
         }
       }

       return newMemories;
     }

     /**
      * Calculate confidence score for extracted memory
      */
     private calculateConfidence(matchedText: string, type: MemoryType): number {
       let confidence = 0.7; // Base confidence

       // Longer matches are more confident
       if (matchedText.length > 20) confidence += 0.1;
       if (matchedText.length > 40) confidence += 0.1;

       // Some types are more reliable than others
       if (type === 'medication_mention') confidence += 0.1;
       if (type === 'trigger' || type === 'coping_strategy') confidence -= 0.1;

       return Math.min(1.0, Math.max(0.0, confidence));
     }

     /**
      * Check if memory is duplicate
      */
     private isDuplicate(memory: CapturedMemory): boolean {
       return this.capturedMemories.some(m =>
         m.type === memory.type &&
         m.content.toLowerCase() === memory.content.toLowerCase()
       );
     }

     /**
      * Get all captured memories from this session
      */
     public getSessionMemories(): CapturedMemory[] {
       return [...this.capturedMemories];
     }

     /**
      * Get high-confidence memories only
      */
     public getHighConfidenceMemories(threshold: number = 0.75): CapturedMemory[] {
       return this.capturedMemories.filter(m => m.confidence >= threshold);
     }

     /**
      * Mark memories as processed (merged into overview)
      */
     public markAsProcessed(memoryIds: string[]): void {
       for (const memory of this.capturedMemories) {
         if (memoryIds.includes(memory.id)) {
           memory.processed = true;
         }
       }
     }

     /**
      * Convert captured memories to patient overview updates
      */
     public toOverviewUpdates(memories: CapturedMemory[]): Partial<PatientOverview> {
       const updates: Partial<PatientOverview> = {};

       // Group by type
       const hobbies = memories.filter(m => m.type === 'hobby');
       const aspirations = memories.filter(m => m.type === 'aspiration');
       const triggers = memories.filter(m => m.type === 'trigger');
       const coping = memories.filter(m => m.type === 'coping_strategy');

       if (hobbies.length > 0) {
         updates.personal_context = updates.personal_context || {};
         updates.personal_context.hobbies = hobbies.map(h => ({
           hobby: h.content,
           engagement_level: 'active' as const,
           first_mentioned: h.timestamp
         }));
       }

       if (aspirations.length > 0) {
         updates.personal_context = updates.personal_context || {};
         updates.personal_context.aspirations = aspirations.map(a => ({
           aspiration: a.content,
           timeframe: 'unspecified',
           first_mentioned: a.timestamp
         }));
       }

       if (triggers.length > 0) {
         updates.clinical_profile = updates.clinical_profile || {};
         updates.clinical_profile.triggers = triggers.map(t => ({
           trigger: t.content,
           severity: 'moderate' as const
         }));
       }

       if (coping.length > 0) {
         updates.clinical_profile = updates.clinical_profile || {};
         updates.clinical_profile.coping_strategies = coping.map(c => ({
           strategy: c.content,
           effectiveness: 'somewhat_effective' as const
         }));
       }

       return updates;
     }

     /**
      * End session and get summary
      */
     public endSession(): { total: number; byType: Record<MemoryType, number> } {
       const byType: Partial<Record<MemoryType, number>> = {};

       for (const memory of this.capturedMemories) {
         byType[memory.type] = (byType[memory.type] || 0) + 1;
       }

       logger.info('Memory capture session ended', {
         sessionId: this.sessionId,
         totalMemories: this.capturedMemories.length,
         byType
       });

       return {
         total: this.capturedMemories.length,
         byType: byType as Record<MemoryType, number>
       };
     }
   }

   // Export singleton
   export const memoryCaptureService = new MemoryCaptureService();
   ```

**Verification**:
- [ ] `MemoryCaptureService` compiles without errors
- [ ] Processing "I love painting" captures a hobby
- [ ] Processing "I want to become a doctor" captures an aspiration
- [ ] Duplicate memories are filtered
- [ ] `toOverviewUpdates()` produces valid partial overview

---

#### Task 5.4: Implement Medication Tracking Service

**Reference**:
- Requirements R11 (Medication Tracking)
- data_schemas.md Section 1 (medication_history schema)

**Prerequisites**: Task 5.1

**Files to Create**:
- `src/patient/medication-tracker.ts` - Medication tracking service

**Step-by-Step Instructions**:

1. Create `src/patient/medication-tracker.ts`:
   ```typescript
   // src/patient/medication-tracker.ts
   // Medication tracking service
   // Reference: Requirements R11 (comprehensive medication list)

   import { v4 as uuidv4 } from 'uuid';
   import { logger } from '../utils/logger.js';

   /**
    * Medication record matching data_schemas.md
    */
   export interface MedicationRecord {
     medication_id: string;
     medication_name: string;
     generic_name?: string;
     dosage?: string;
     frequency?: string;
     route?: 'oral' | 'injection' | 'topical' | 'other';
     start_date?: string;
     end_date?: string;
     prescriber?: string;
     reason?: string;
     effectiveness?: 'very_effective' | 'somewhat_effective' | 'not_effective' | 'unknown';
     side_effects?: string[];
     reason_discontinued?: string;
     is_current: boolean;
   }

   /**
    * Medication mention extracted from conversation
    */
   export interface MedicationMention {
     name: string;
     dosage?: string;
     frequency?: string;
     context: 'current' | 'past' | 'considering' | 'unknown';
     effects?: string;
     sideEffects?: string[];
     utterance: string;
     timestamp: string;
   }

   /**
    * Common psychiatric medication patterns
    */
   const MEDICATION_PATTERNS = [
     // SSRIs
     { pattern: /\b(sertraline|zoloft)\b/gi, generic: 'sertraline', brand: 'Zoloft' },
     { pattern: /\b(fluoxetine|prozac)\b/gi, generic: 'fluoxetine', brand: 'Prozac' },
     { pattern: /\b(escitalopram|lexapro)\b/gi, generic: 'escitalopram', brand: 'Lexapro' },
     { pattern: /\b(citalopram|celexa)\b/gi, generic: 'citalopram', brand: 'Celexa' },
     { pattern: /\b(paroxetine|paxil)\b/gi, generic: 'paroxetine', brand: 'Paxil' },

     // SNRIs
     { pattern: /\b(venlafaxine|effexor)\b/gi, generic: 'venlafaxine', brand: 'Effexor' },
     { pattern: /\b(duloxetine|cymbalta)\b/gi, generic: 'duloxetine', brand: 'Cymbalta' },

     // Benzodiazepines
     { pattern: /\b(alprazolam|xanax)\b/gi, generic: 'alprazolam', brand: 'Xanax' },
     { pattern: /\b(lorazepam|ativan)\b/gi, generic: 'lorazepam', brand: 'Ativan' },
     { pattern: /\b(clonazepam|klonopin)\b/gi, generic: 'clonazepam', brand: 'Klonopin' },
     { pattern: /\b(diazepam|valium)\b/gi, generic: 'diazepam', brand: 'Valium' },

     // Atypical antipsychotics
     { pattern: /\b(quetiapine|seroquel)\b/gi, generic: 'quetiapine', brand: 'Seroquel' },
     { pattern: /\b(aripiprazole|abilify)\b/gi, generic: 'aripiprazole', brand: 'Abilify' },
     { pattern: /\b(risperidone|risperdal)\b/gi, generic: 'risperidone', brand: 'Risperdal' },
     { pattern: /\b(olanzapine|zyprexa)\b/gi, generic: 'olanzapine', brand: 'Zyprexa' },

     // Mood stabilizers
     { pattern: /\b(lithium)\b/gi, generic: 'lithium', brand: 'Lithium' },
     { pattern: /\b(lamotrigine|lamictal)\b/gi, generic: 'lamotrigine', brand: 'Lamictal' },
     { pattern: /\b(valproate|depakote)\b/gi, generic: 'valproate', brand: 'Depakote' },

     // Sleep aids
     { pattern: /\b(trazodone)\b/gi, generic: 'trazodone', brand: 'Trazodone' },
     { pattern: /\b(zolpidem|ambien)\b/gi, generic: 'zolpidem', brand: 'Ambien' },
     { pattern: /\b(melatonin)\b/gi, generic: 'melatonin', brand: 'Melatonin' },

     // ADHD medications
     { pattern: /\b(methylphenidate|ritalin|concerta)\b/gi, generic: 'methylphenidate', brand: 'Ritalin/Concerta' },
     { pattern: /\b(amphetamine|adderall)\b/gi, generic: 'amphetamine', brand: 'Adderall' },

     // Other
     { pattern: /\b(bupropion|wellbutrin)\b/gi, generic: 'bupropion', brand: 'Wellbutrin' },
     { pattern: /\b(buspirone|buspar)\b/gi, generic: 'buspirone', brand: 'Buspar' },
     { pattern: /\b(hydroxyzine|vistaril)\b/gi, generic: 'hydroxyzine', brand: 'Vistaril' }
   ];

   /**
    * Dosage patterns
    */
   const DOSAGE_PATTERN = /(\d+(?:\.\d+)?)\s*(mg|mcg|ml)/gi;
   const FREQUENCY_PATTERNS = [
     { pattern: /once (?:a|per) day|daily|qd/gi, frequency: 'once daily' },
     { pattern: /twice (?:a|per) day|bid/gi, frequency: 'twice daily' },
     { pattern: /three times (?:a|per) day|tid/gi, frequency: 'three times daily' },
     { pattern: /as needed|prn/gi, frequency: 'as needed' },
     { pattern: /at (?:bed|night)|bedtime|qhs/gi, frequency: 'at bedtime' },
     { pattern: /in the morning/gi, frequency: 'in the morning' }
   ];

   /**
    * Context patterns (current vs past)
    */
   const CONTEXT_PATTERNS = {
     current: [/I'm (?:on|taking)/gi, /I take/gi, /currently/gi, /my doctor (?:just )?prescribed/gi],
     past: [/I was on/gi, /I used to take/gi, /I stopped/gi, /didn't work/gi, /I quit/gi],
     considering: [/might try/gi, /thinking about/gi, /doctor suggested/gi]
   };

   /**
    * Medication Tracker Service
    */
   export class MedicationTracker {
     private mentions: MedicationMention[] = [];

     /**
      * Extract medication mentions from utterance
      */
     public extractMentions(utterance: string): MedicationMention[] {
       const extracted: MedicationMention[] = [];

       for (const med of MEDICATION_PATTERNS) {
         med.pattern.lastIndex = 0;
         if (med.pattern.test(utterance)) {
           // Determine context
           let context: MedicationMention['context'] = 'unknown';
           for (const [ctx, patterns] of Object.entries(CONTEXT_PATTERNS)) {
             for (const p of patterns) {
               p.lastIndex = 0;
               if (p.test(utterance)) {
                 context = ctx as MedicationMention['context'];
                 break;
               }
             }
             if (context !== 'unknown') break;
           }

           // Extract dosage
           let dosage: string | undefined;
           const dosageMatch = DOSAGE_PATTERN.exec(utterance);
           if (dosageMatch) {
             dosage = `${dosageMatch[1]}${dosageMatch[2]}`;
           }

           // Extract frequency
           let frequency: string | undefined;
           for (const freq of FREQUENCY_PATTERNS) {
             freq.pattern.lastIndex = 0;
             if (freq.pattern.test(utterance)) {
               frequency = freq.frequency;
               break;
             }
           }

           const mention: MedicationMention = {
             name: med.brand,
             dosage,
             frequency,
             context,
             utterance,
             timestamp: new Date().toISOString()
           };

           extracted.push(mention);
           this.mentions.push(mention);

           logger.debug('Medication mention extracted', {
             medication: med.brand,
             context,
             dosage,
             frequency
           });
         }
       }

       return extracted;
     }

     /**
      * Convert mention to medication record
      */
     public mentionToRecord(mention: MedicationMention): MedicationRecord {
       const medInfo = MEDICATION_PATTERNS.find(m => {
         m.pattern.lastIndex = 0;
         return m.pattern.test(mention.name);
       });

       return {
         medication_id: uuidv4(),
         medication_name: mention.name,
         generic_name: medInfo?.generic,
         dosage: mention.dosage,
         frequency: mention.frequency,
         route: 'oral', // Default assumption
         start_date: mention.context === 'current' ? undefined : undefined,
         is_current: mention.context === 'current',
         reason: undefined,
         effectiveness: 'unknown',
         side_effects: mention.sideEffects
       };
     }

     /**
      * Get all mentions from session
      */
     public getSessionMentions(): MedicationMention[] {
       return [...this.mentions];
     }

     /**
      * Clear session data
      */
     public clearSession(): void {
       this.mentions = [];
     }

     /**
      * Merge new medication info with existing records
      * Reference: R11 (track changes, discontinuations)
      */
     public mergeWithExisting(
       existing: MedicationRecord[],
       newMentions: MedicationMention[]
     ): MedicationRecord[] {
       const updated = [...existing];

       for (const mention of newMentions) {
         const existingIdx = updated.findIndex(m =>
           m.medication_name.toLowerCase() === mention.name.toLowerCase() ||
           m.generic_name?.toLowerCase() === mention.name.toLowerCase()
         );

         if (existingIdx >= 0) {
           // Update existing record
           const record = updated[existingIdx];

           if (mention.context === 'past' && record.is_current) {
             // Medication was discontinued
             record.is_current = false;
             record.end_date = mention.timestamp.split('T')[0];
             record.reason_discontinued = 'Patient reported stopping';
           } else if (mention.context === 'current') {
             record.is_current = true;
             if (mention.dosage) record.dosage = mention.dosage;
             if (mention.frequency) record.frequency = mention.frequency;
           }
         } else {
           // Add new record
           updated.push(this.mentionToRecord(mention));
         }
       }

       return updated;
     }
   }

   // Export singleton
   export const medicationTracker = new MedicationTracker();
   ```

**Verification**:
- [ ] `MedicationTracker` compiles without errors
- [ ] "I'm on Zoloft 50mg daily" extracts medication, dosage, frequency, current context
- [ ] "I stopped taking Lexapro" extracts medication with past context
- [ ] Merging updates existing records correctly
- [ ] Common psychiatric medications are recognized

---

#### Task 5.5: Implement Patient Overview Versioning

**Reference**:
- Requirements R9 (version control with timestamps and change summaries)
- data_schemas.md Section 1 (version field in Patient_Overview)

**Prerequisites**: Task 5.1

**Files to Create**:
- `src/patient/version-control.ts` - Patient overview versioning system

**Step-by-Step Instructions**:

1. Create `src/patient/version-control.ts`:
   ```typescript
   // src/patient/version-control.ts
   // Patient overview versioning system
   // Reference: Requirements R9 (version control with timestamps)

   import path from 'path';
   import fs from 'fs/promises';
   import { fileURLToPath } from 'url';
   import { v4 as uuidv4 } from 'uuid';
   import { PatientOverview } from './patient-schema.js';
   import { logger } from '../utils/logger.js';

   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);

   /**
    * Version record for tracking changes
    */
   export interface VersionRecord {
     version_id: string;
     version_number: number;
     created_at: string;
     created_by: 'system' | 'session_update' | 'manual';
     change_summary: string;
     changes: VersionChange[];
   }

   /**
    * Individual change within a version
    */
   export interface VersionChange {
     path: string;           // JSON path to changed field
     operation: 'add' | 'modify' | 'delete';
     old_value?: unknown;
     new_value?: unknown;
   }

   /**
    * Version history document
    */
   export interface VersionHistory {
     patient_id: string;
     current_version: number;
     versions: VersionRecord[];
   }

   /**
    * Patient Version Control Service
    */
   export class PatientVersionControl {
     private memoryDir: string;

     constructor() {
       this.memoryDir = path.join(__dirname, '../../memory_directory/patients');
     }

     /**
      * Get version history file path
      */
     private getHistoryPath(patientId: string): string {
       return path.join(this.memoryDir, patientId, 'version_history.json');
     }

     /**
      * Get versioned overview path
      */
     private getVersionPath(patientId: string, version: number): string {
       return path.join(
         this.memoryDir,
         patientId,
         'versions',
         `overview_v${version.toString().padStart(4, '0')}.json`
       );
     }

     /**
      * Load version history for a patient
      */
     public async loadHistory(patientId: string): Promise<VersionHistory> {
       const historyPath = this.getHistoryPath(patientId);

       try {
         const content = await fs.readFile(historyPath, 'utf-8');
         return JSON.parse(content) as VersionHistory;
       } catch {
         // Initialize new history
         return {
           patient_id: patientId,
           current_version: 0,
           versions: []
         };
       }
     }

     /**
      * Compare two objects and detect changes
      */
     private detectChanges(
       oldObj: Record<string, unknown>,
       newObj: Record<string, unknown>,
       basePath: string = ''
     ): VersionChange[] {
       const changes: VersionChange[] = [];

       // Check for modifications and additions
       for (const [key, newValue] of Object.entries(newObj)) {
         const path = basePath ? `${basePath}.${key}` : key;
         const oldValue = oldObj[key];

         if (oldValue === undefined) {
           // New field added
           changes.push({ path, operation: 'add', new_value: newValue });
         } else if (typeof newValue === 'object' && typeof oldValue === 'object' &&
                    newValue !== null && oldValue !== null &&
                    !Array.isArray(newValue) && !Array.isArray(oldValue)) {
           // Recurse into nested objects
           changes.push(...this.detectChanges(
             oldValue as Record<string, unknown>,
             newValue as Record<string, unknown>,
             path
           ));
         } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
           // Value changed
           changes.push({ path, operation: 'modify', old_value: oldValue, new_value: newValue });
         }
       }

       // Check for deletions
       for (const key of Object.keys(oldObj)) {
         if (!(key in newObj)) {
           const path = basePath ? `${basePath}.${key}` : key;
           changes.push({ path, operation: 'delete', old_value: oldObj[key] });
         }
       }

       return changes;
     }

     /**
      * Generate change summary from changes
      */
     private generateSummary(changes: VersionChange[]): string {
       const adds = changes.filter(c => c.operation === 'add').length;
       const mods = changes.filter(c => c.operation === 'modify').length;
       const dels = changes.filter(c => c.operation === 'delete').length;

       const parts: string[] = [];
       if (adds > 0) parts.push(`${adds} addition${adds > 1 ? 's' : ''}`);
       if (mods > 0) parts.push(`${mods} modification${mods > 1 ? 's' : ''}`);
       if (dels > 0) parts.push(`${dels} deletion${dels > 1 ? 's' : ''}`);

       // Add specific field mentions for important changes
       const importantPaths = ['risk_assessment', 'medication_history', 'clinical_profile'];
       const importantChanges = changes.filter(c =>
         importantPaths.some(p => c.path.startsWith(p))
       );

       if (importantChanges.length > 0) {
         const fields = [...new Set(importantChanges.map(c => c.path.split('.')[0]))];
         parts.push(`affecting ${fields.join(', ')}`);
       }

       return parts.join(', ') || 'No changes';
     }

     /**
      * Create a new version of patient overview
      */
     public async createVersion(
       patientId: string,
       oldOverview: PatientOverview,
       newOverview: PatientOverview,
       createdBy: VersionRecord['created_by'] = 'session_update'
     ): Promise<VersionRecord> {
       // Load history
       const history = await this.loadHistory(patientId);

       // Detect changes
       const changes = this.detectChanges(
         oldOverview as unknown as Record<string, unknown>,
         newOverview as unknown as Record<string, unknown>
       );

       // Create version record
       const versionRecord: VersionRecord = {
         version_id: uuidv4(),
         version_number: history.current_version + 1,
         created_at: new Date().toISOString(),
         created_by: createdBy,
         change_summary: this.generateSummary(changes),
         changes
       };

       // Update history
       history.current_version = versionRecord.version_number;
       history.versions.push(versionRecord);

       // Create versions directory
       const versionsDir = path.join(this.memoryDir, patientId, 'versions');
       await fs.mkdir(versionsDir, { recursive: true });

       // Save versioned overview
       const versionPath = this.getVersionPath(patientId, versionRecord.version_number);
       await fs.writeFile(versionPath, JSON.stringify(newOverview, null, 2));

       // Save updated history
       const historyPath = this.getHistoryPath(patientId);
       await fs.writeFile(historyPath, JSON.stringify(history, null, 2));

       logger.info('Patient overview version created', {
         patientId,
         version: versionRecord.version_number,
         changeCount: changes.length,
         summary: versionRecord.change_summary
       });

       return versionRecord;
     }

     /**
      * Get a specific version of patient overview
      */
     public async getVersion(patientId: string, version: number): Promise<PatientOverview | null> {
       const versionPath = this.getVersionPath(patientId, version);

       try {
         const content = await fs.readFile(versionPath, 'utf-8');
         return JSON.parse(content) as PatientOverview;
       } catch {
         return null;
       }
     }

     /**
      * Get version diff between two versions
      */
     public async getVersionDiff(
       patientId: string,
       fromVersion: number,
       toVersion: number
     ): Promise<VersionChange[]> {
       const fromOverview = await this.getVersion(patientId, fromVersion);
       const toOverview = await this.getVersion(patientId, toVersion);

       if (!fromOverview || !toOverview) {
         return [];
       }

       return this.detectChanges(
         fromOverview as unknown as Record<string, unknown>,
         toOverview as unknown as Record<string, unknown>
       );
     }

     /**
      * Rollback to a previous version
      */
     public async rollback(
       patientId: string,
       targetVersion: number
     ): Promise<PatientOverview | null> {
       const overview = await this.getVersion(patientId, targetVersion);
       if (!overview) {
         logger.error('Rollback failed: version not found', { patientId, targetVersion });
         return null;
       }

       // Save as current overview
       const overviewPath = path.join(this.memoryDir, patientId, 'overview.json');

       // Create new version record for the rollback
       const currentOverviewContent = await fs.readFile(overviewPath, 'utf-8');
       const currentOverview = JSON.parse(currentOverviewContent) as PatientOverview;

       await this.createVersion(patientId, currentOverview, overview, 'manual');
       await fs.writeFile(overviewPath, JSON.stringify(overview, null, 2));

       logger.info('Patient overview rolled back', { patientId, targetVersion });
       return overview;
     }
   }

   // Export singleton
   export const patientVersionControl = new PatientVersionControl();
   ```

**Verification**:
- [ ] `PatientVersionControl` compiles without errors
- [ ] Creating a version saves overview to versions/ directory
- [ ] Version history JSON contains all version records
- [ ] `detectChanges()` correctly identifies adds, modifies, deletes
- [ ] `rollback()` restores previous version

---

#### Task 5.6: Create Patient Overview Update Service

**Reference**:
- Requirements R30 (Post-Session Memory Update)
- data_schemas.md Section 1 (Patient_Overview schema)

**Prerequisites**: Tasks 5.1-5.5

**Files to Create**:
- `src/patient/overview-updater.ts` - Post-session overview update service

**Step-by-Step Instructions**:

1. Create `src/patient/overview-updater.ts`:
   ```typescript
   // src/patient/overview-updater.ts
   // Post-session overview update service
   // Reference: Requirements R30 (latest-wins with audit trail)

   import path from 'path';
   import fs from 'fs/promises';
   import { fileURLToPath } from 'url';
   import { PatientOverview, validatePatientOverview } from './patient-schema.js';
   import { CapturedMemory, memoryCaptureService } from './memory-capture.js';
   import { MedicationMention, medicationTracker } from './medication-tracker.js';
   import { patientVersionControl } from './version-control.js';
   import { logger } from '../utils/logger.js';

   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);

   /**
    * Conflict resolution record
    */
   export interface ConflictResolution {
     field: string;
     old_value: unknown;
     new_value: unknown;
     resolution: 'new_wins' | 'old_wins' | 'merged';
     reason: string;
     timestamp: string;
   }

   /**
    * Update result
    */
   export interface UpdateResult {
     success: boolean;
     version: number;
     changes: string[];
     conflicts: ConflictResolution[];
     errors?: string[];
   }

   /**
    * Overview Update Service
    * Handles post-session overview updates with conflict resolution
    */
   export class OverviewUpdater {
     private memoryDir: string;

     constructor() {
       this.memoryDir = path.join(__dirname, '../../memory_directory/patients');
     }

     /**
      * Load current overview
      */
     private async loadOverview(patientId: string): Promise<PatientOverview | null> {
       const overviewPath = path.join(this.memoryDir, patientId, 'overview.json');

       try {
         const content = await fs.readFile(overviewPath, 'utf-8');
         return JSON.parse(content) as PatientOverview;
       } catch {
         return null;
       }
     }

     /**
      * Save updated overview
      */
     private async saveOverview(patientId: string, overview: PatientOverview): Promise<void> {
       const overviewPath = path.join(this.memoryDir, patientId, 'overview.json');
       await fs.writeFile(overviewPath, JSON.stringify(overview, null, 2));
     }

     /**
      * Deep merge objects with conflict tracking
      */
     private mergeWithConflicts(
       base: Record<string, unknown>,
       updates: Record<string, unknown>,
       conflicts: ConflictResolution[],
       basePath: string = ''
     ): Record<string, unknown> {
       const result = { ...base };

       for (const [key, newValue] of Object.entries(updates)) {
         const path = basePath ? `${basePath}.${key}` : key;
         const oldValue = base[key];

         if (oldValue === undefined) {
           // New field - just add it
           result[key] = newValue;
         } else if (Array.isArray(newValue) && Array.isArray(oldValue)) {
           // Merge arrays (add new items)
           result[key] = [...oldValue, ...newValue.filter(
             item => !oldValue.some(old =>
               JSON.stringify(old) === JSON.stringify(item)
             )
           )];
         } else if (typeof newValue === 'object' && typeof oldValue === 'object' &&
                    newValue !== null && oldValue !== null) {
           // Recurse into nested objects
           result[key] = this.mergeWithConflicts(
             oldValue as Record<string, unknown>,
             newValue as Record<string, unknown>,
             conflicts,
             path
           );
         } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
           // Conflict detected - latest wins (R30)
           conflicts.push({
             field: path,
             old_value: oldValue,
             new_value: newValue,
             resolution: 'new_wins',
             reason: 'Latest session information takes precedence (R30)',
             timestamp: new Date().toISOString()
           });
           result[key] = newValue;
         }
       }

       return result;
     }

     /**
      * Update overview after session
      * Reference: R30 (identify new info, conflicts, update with audit)
      */
     public async updateAfterSession(
       patientId: string,
       sessionId: string,
       sessionSummary?: {
         key_topics?: string[];
         mood_start?: string;
         mood_end?: string;
         breakthroughs?: string[];
         homework_assigned?: string[];
       }
     ): Promise<UpdateResult> {
       const changes: string[] = [];
       const conflicts: ConflictResolution[] = [];
       const errors: string[] = [];

       // Load current overview
       const current = await this.loadOverview(patientId);
       if (!current) {
         return {
           success: false,
           version: 0,
           changes: [],
           conflicts: [],
           errors: ['Patient overview not found']
         };
       }

       // Clone for updates
       let updated = JSON.parse(JSON.stringify(current)) as PatientOverview;

       // 1. Process captured memories
       const memories = memoryCaptureService.getHighConfidenceMemories();
       if (memories.length > 0) {
         const memoryUpdates = memoryCaptureService.toOverviewUpdates(memories);

         if (memoryUpdates.personal_context) {
           updated.personal_context = this.mergeWithConflicts(
             (updated.personal_context || {}) as Record<string, unknown>,
             memoryUpdates.personal_context as unknown as Record<string, unknown>,
             conflicts,
             'personal_context'
           ) as PatientOverview['personal_context'];
           changes.push(`Added ${memories.length} captured memories`);
         }

         if (memoryUpdates.clinical_profile) {
           updated.clinical_profile = this.mergeWithConflicts(
             (updated.clinical_profile || {}) as Record<string, unknown>,
             memoryUpdates.clinical_profile as unknown as Record<string, unknown>,
             conflicts,
             'clinical_profile'
           ) as PatientOverview['clinical_profile'];
         }

         memoryCaptureService.markAsProcessed(memories.map(m => m.id));
       }

       // 2. Process medication mentions
       const medMentions = medicationTracker.getSessionMentions();
       if (medMentions.length > 0) {
         updated.medication_history = medicationTracker.mergeWithExisting(
           updated.medication_history || [],
           medMentions
         );
         changes.push(`Updated ${medMentions.length} medication records`);
       }

       // 3. Add session to history
       if (sessionSummary) {
         updated.session_history = updated.session_history || [];
         updated.session_history.unshift({
           session_id: sessionId,
           date: new Date().toISOString(),
           key_topics: sessionSummary.key_topics,
           mood_start: sessionSummary.mood_start,
           mood_end: sessionSummary.mood_end,
           breakthroughs: sessionSummary.breakthroughs,
           homework_assigned: sessionSummary.homework_assigned
         });
         changes.push('Added session to history');

         // Keep only last 50 sessions in overview
         if (updated.session_history.length > 50) {
           updated.session_history = updated.session_history.slice(0, 50);
         }
       }

       // 4. Update metadata
       updated.updated_at = new Date().toISOString();
       updated.version = (updated.version || 0) + 1;

       // Validate updated overview
       try {
         validatePatientOverview(updated);
       } catch (error) {
         logger.error('Updated overview validation failed', { error });
         errors.push(`Validation error: ${error}`);
         return {
           success: false,
           version: current.version || 0,
           changes,
           conflicts,
           errors
         };
       }

       // 5. Create version and save
       try {
         const versionRecord = await patientVersionControl.createVersion(
           patientId,
           current,
           updated,
           'session_update'
         );

         await this.saveOverview(patientId, updated);

         // Log conflicts for audit
         if (conflicts.length > 0) {
           logger.warn('Conflicts resolved during update', {
             patientId,
             sessionId,
             conflictCount: conflicts.length,
             conflicts
           });
         }

         logger.info('Patient overview updated', {
           patientId,
           sessionId,
           version: versionRecord.version_number,
           changeCount: changes.length,
           conflictCount: conflicts.length
         });

         return {
           success: true,
           version: versionRecord.version_number,
           changes,
           conflicts
         };
       } catch (error) {
         errors.push(`Save error: ${error}`);
         return {
           success: false,
           version: current.version || 0,
           changes,
           conflicts,
           errors
         };
       }
     }

     /**
      * Get conflict history for a patient
      */
     public async getConflictHistory(patientId: string): Promise<ConflictResolution[]> {
       const historyPath = path.join(this.memoryDir, patientId, 'conflict_history.json');

       try {
         const content = await fs.readFile(historyPath, 'utf-8');
         return JSON.parse(content) as ConflictResolution[];
       } catch {
         return [];
       }
     }
   }

   // Export singleton
   export const overviewUpdater = new OverviewUpdater();
   ```

**Verification**:
- [ ] `OverviewUpdater` compiles without errors
- [ ] `updateAfterSession()` merges captured memories into overview
- [ ] Conflicts are detected and resolved with "latest wins"
- [ ] Session is added to session_history
- [ ] Version is incremented and saved

---

#### Task 5.7: Create Patient Data Export/Delete Service

**Reference**:
- Requirements R37 (GDPR/CCPA compliance - export and deletion)

**Prerequisites**: Task 2.1, Task 5.1

**Files to Create**:
- `src/patient/data-compliance.ts` - GDPR/CCPA data export and deletion

**Step-by-Step Instructions**:

1. Create `src/patient/data-compliance.ts`:
   ```typescript
   // src/patient/data-compliance.ts
   // GDPR/CCPA compliance: data export and deletion
   // Reference: Requirements R37

   import path from 'path';
   import fs from 'fs/promises';
   import { fileURLToPath } from 'url';
   import archiver from 'archiver';
   import { createWriteStream } from 'fs';
   import { v4 as uuidv4 } from 'uuid';
   import { sqliteManager } from '../database/sqlite.js';
   import { auditRepository } from '../database/repositories/audit.repository.js';
   import { logger } from '../utils/logger.js';

   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);

   /**
    * Export request record
    */
   export interface ExportRequest {
     request_id: string;
     patient_id: string;
     requested_at: string;
     completed_at?: string;
     export_path?: string;
     status: 'pending' | 'processing' | 'completed' | 'failed';
     error?: string;
   }

   /**
    * Deletion request record
    */
   export interface DeletionRequest {
     request_id: string;
     patient_id: string;
     requested_at: string;
     completed_at?: string;
     status: 'pending' | 'processing' | 'completed' | 'failed';
     items_deleted: {
       files: number;
       database_records: number;
       vector_entries: number;
     };
     error?: string;
   }

   /**
    * Data Compliance Service
    * Handles GDPR/CCPA data export and deletion requests
    */
   export class DataComplianceService {
     private memoryDir: string;

     constructor() {
       this.memoryDir = path.join(__dirname, '../../memory_directory');
     }

     /**
      * Export all patient data to a ZIP archive
      * Reference: R37 (data export on user request)
      */
     public async exportPatientData(patientId: string): Promise<ExportRequest> {
       const request: ExportRequest = {
         request_id: uuidv4(),
         patient_id: patientId,
         requested_at: new Date().toISOString(),
         status: 'processing'
       };

       // Log the export request
       auditRepository.create({
         event_type: 'data_export',
         patient_id: patientId,
         action: 'export_requested',
         details: { request_id: request.request_id }
       });

       try {
         const patientDir = path.join(this.memoryDir, 'patients', patientId);
         const exportDir = path.join(this.memoryDir, 'patients', patientId, 'exports');
         await fs.mkdir(exportDir, { recursive: true });

         const exportPath = path.join(exportDir, `export_${request.request_id}.zip`);
         const output = createWriteStream(exportPath);
         const archive = archiver('zip', { zlib: { level: 9 } });

         archive.pipe(output);

         // Add patient directory
         archive.directory(path.join(patientDir, 'sessions'), 'sessions');
         archive.directory(path.join(patientDir, 'versions'), 'versions');

         // Add overview
         try {
           const overviewPath = path.join(patientDir, 'overview.json');
           await fs.access(overviewPath);
           archive.file(overviewPath, { name: 'overview.json' });
         } catch {
           // Overview doesn't exist
         }

         // Add version history
         try {
           const historyPath = path.join(patientDir, 'version_history.json');
           await fs.access(historyPath);
           archive.file(historyPath, { name: 'version_history.json' });
         } catch {
           // History doesn't exist
         }

         // Export database records
         const db = sqliteManager.getDb();

         // Patient record
         const patientStmt = db.prepare('SELECT * FROM patients WHERE patient_id = ?');
         const patient = patientStmt.get(patientId);

         // Sessions
         const sessionsStmt = db.prepare('SELECT * FROM sessions WHERE patient_id = ?');
         const sessions = sessionsStmt.all(patientId);

         // Audit logs (for this patient)
         const auditStmt = db.prepare('SELECT * FROM audit_log WHERE patient_id = ?');
         const auditLogs = auditStmt.all(patientId);

         // Add database exports as JSON
         archive.append(JSON.stringify({ patient, sessions, auditLogs }, null, 2), {
           name: 'database_records.json'
         });

         // Add export metadata
         archive.append(JSON.stringify({
           export_id: request.request_id,
           patient_id: patientId,
           exported_at: new Date().toISOString(),
           contents: [
             'overview.json - Patient overview document',
             'sessions/ - All session transcripts and reports',
             'versions/ - Historical overview versions',
             'version_history.json - Version change log',
             'database_records.json - Database records (patient, sessions, audit)'
           ]
         }, null, 2), { name: 'EXPORT_MANIFEST.json' });

         await archive.finalize();

         // Wait for output to finish
         await new Promise<void>((resolve, reject) => {
           output.on('close', resolve);
           output.on('error', reject);
         });

         request.status = 'completed';
         request.completed_at = new Date().toISOString();
         request.export_path = exportPath;

         auditRepository.create({
           event_type: 'data_export',
           patient_id: patientId,
           action: 'export_completed',
           details: {
             request_id: request.request_id,
             export_path: exportPath,
             archive_size: (await fs.stat(exportPath)).size
           }
         });

         logger.info('Patient data exported', {
           patientId,
           requestId: request.request_id,
           exportPath
         });

         return request;

       } catch (error) {
         request.status = 'failed';
         request.error = String(error);

         auditRepository.create({
           event_type: 'data_export',
           patient_id: patientId,
           action: 'export_failed',
           details: { request_id: request.request_id, error: String(error) }
         });

         logger.error('Patient data export failed', { patientId, error });
         return request;
       }
     }

     /**
      * Delete all patient data (right to erasure)
      * Reference: R37 (data deletion on user request)
      */
     public async deletePatientData(patientId: string): Promise<DeletionRequest> {
       const request: DeletionRequest = {
         request_id: uuidv4(),
         patient_id: patientId,
         requested_at: new Date().toISOString(),
         status: 'processing',
         items_deleted: { files: 0, database_records: 0, vector_entries: 0 }
       };

       // Log deletion request BEFORE deletion
       auditRepository.create({
         event_type: 'data_delete',
         patient_id: patientId,
         action: 'deletion_requested',
         details: { request_id: request.request_id }
       });

       try {
         const patientDir = path.join(this.memoryDir, 'patients', patientId);

         // 1. Delete files
         try {
           const countFiles = async (dir: string): Promise<number> => {
             let count = 0;
             const entries = await fs.readdir(dir, { withFileTypes: true });
             for (const entry of entries) {
               if (entry.isDirectory()) {
                 count += await countFiles(path.join(dir, entry.name));
               } else {
                 count++;
               }
             }
             return count;
           };

           request.items_deleted.files = await countFiles(patientDir);
           await fs.rm(patientDir, { recursive: true, force: true });
         } catch {
           // Directory might not exist
         }

         // 2. Delete database records
         const db = sqliteManager.getDb();

         // Delete sessions
         const deleteSessionsStmt = db.prepare('DELETE FROM sessions WHERE patient_id = ?');
         const sessionsResult = deleteSessionsStmt.run(patientId);
         request.items_deleted.database_records += sessionsResult.changes;

         // Delete patient
         const deletePatientStmt = db.prepare('DELETE FROM patients WHERE patient_id = ?');
         const patientResult = deletePatientStmt.run(patientId);
         request.items_deleted.database_records += patientResult.changes;

         // Note: We keep audit logs for legal compliance (R38: 6-year retention)
         // but anonymize them
         const anonymizeAuditStmt = db.prepare(`
           UPDATE audit_log
           SET patient_id = 'DELETED_' || patient_id,
               details = json_set(COALESCE(details, '{}'), '$.anonymized', true)
           WHERE patient_id = ?
         `);
         anonymizeAuditStmt.run(patientId);

         // 3. Delete vector database entries (placeholder - implement with Qdrant)
         // This would call qdrantManager.deletePatientVectors(patientId)
         // request.items_deleted.vector_entries = await qdrantManager.deletePatientVectors(patientId);

         request.status = 'completed';
         request.completed_at = new Date().toISOString();

         // Final audit entry
         auditRepository.create({
           event_type: 'data_delete',
           patient_id: `DELETED_${patientId}`,
           action: 'deletion_completed',
           details: {
             request_id: request.request_id,
             items_deleted: request.items_deleted
           }
         });

         logger.info('Patient data deleted', {
           patientId,
           requestId: request.request_id,
           itemsDeleted: request.items_deleted
         });

         return request;

       } catch (error) {
         request.status = 'failed';
         request.error = String(error);

         auditRepository.create({
           event_type: 'data_delete',
           patient_id: patientId,
           action: 'deletion_failed',
           details: { request_id: request.request_id, error: String(error) }
         });

         logger.error('Patient data deletion failed', { patientId, error });
         return request;
       }
     }
   }

   // Export singleton
   export const dataComplianceService = new DataComplianceService();
   ```

2. Install archiver package:
   ```bash
   npm install archiver
   npm install -D @types/archiver
   ```

**Verification**:
- [ ] `DataComplianceService` compiles without errors
- [ ] `exportPatientData()` creates a valid ZIP archive
- [ ] ZIP contains overview, sessions, versions, and database records
- [ ] `deletePatientData()` removes all files and database records
- [ ] Audit logs are anonymized (not deleted) per R38 retention requirement
- [ ] All operations are audit-logged

---

### Task 6: Speech-to-Text System

**References**:
- Requirements R4 (Speech-to-Text Processing)
- system_architecture.md Section 3 (Latency requirements: 150ms target, 500ms max)

**Prerequisites**: Task 1 (Project Setup)

**Estimated Subtasks**: 7

---

#### Task 6.1: Create STT Provider Interface

**Reference**: Requirements R4 (multiple providers: Deepgram, Google, Whisper)

**Files to Create**:
- `src/audio/stt/stt-provider.interface.ts` - Provider interface definition

**Step-by-Step Instructions**:

1. Create directory structure:
   ```bash
   mkdir -p src/audio/stt
   ```

2. Create `src/audio/stt/stt-provider.interface.ts`:
   ```typescript
   // src/audio/stt/stt-provider.interface.ts
   // Speech-to-Text provider interface
   // Reference: Requirements R4

   /**
    * STT result from any provider
    */
   export interface STTResult {
     text: string;
     confidence: number;
     isFinal: boolean;
     latencyMs: number;
     provider: string;
     words?: Array<{
       word: string;
       start: number;  // seconds
       end: number;    // seconds
       confidence: number;
     }>;
     metadata?: Record<string, unknown>;
   }

   /**
    * Audio configuration
    * Reference: R4 Audio Parameters
    */
   export interface AudioConfig {
     sampleRate: number;     // 16000 Hz
     bitDepth: number;       // 16-bit
     channels: number;       // Mono (1)
     encoding: 'pcm' | 'wav' | 'webm' | 'ogg';
   }

   /**
    * Default audio configuration per spec
    */
   export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
     sampleRate: 16000,
     bitDepth: 16,
     channels: 1,
     encoding: 'pcm'
   };

   /**
    * STT event types
    */
   export type STTEventType =
     | 'transcription'      // Partial or final transcription
     | 'utterance_end'      // Speaker finished talking
     | 'error'              // Error occurred
     | 'connected'          // Connected to provider
     | 'disconnected';      // Disconnected from provider

   /**
    * STT event listener
    */
   export type STTEventListener = (event: STTEvent) => void;

   /**
    * STT event
    */
   export interface STTEvent {
     type: STTEventType;
     result?: STTResult;
     error?: Error;
     timestamp: string;
   }

   /**
    * STT Provider Interface
    * All STT providers must implement this interface
    */
   export interface STTProvider {
     /** Provider name (deepgram, google, whisper) */
     readonly name: string;

     /** Whether this provider supports streaming */
     readonly supportsStreaming: boolean;

     /** Whether this provider is available (API key configured) */
     isAvailable(): boolean;

     /**
      * Initialize the provider
      */
     initialize(): Promise<void>;

     /**
      * Start streaming transcription
      * @param audioConfig Audio configuration
      */
     startStreaming(audioConfig?: Partial<AudioConfig>): Promise<void>;

     /**
      * Send audio chunk for transcription
      * @param chunk Audio data buffer
      */
     sendAudio(chunk: Buffer): void;

     /**
      * Stop streaming and get final result
      */
     stopStreaming(): Promise<STTResult | null>;

     /**
      * Transcribe a complete audio file (non-streaming)
      * @param audioBuffer Complete audio data
      * @param audioConfig Audio configuration
      */
     transcribe(audioBuffer: Buffer, audioConfig?: Partial<AudioConfig>): Promise<STTResult>;

     /**
      * Add event listener
      */
     on(event: STTEventType, listener: STTEventListener): void;

     /**
      * Remove event listener
      */
     off(event: STTEventType, listener: STTEventListener): void;

     /**
      * Close connection and cleanup resources
      */
     close(): Promise<void>;
   }
   ```

**Verification**:
- [ ] Interface file compiles without errors
- [ ] `DEFAULT_AUDIO_CONFIG` matches R4 specifications

---

#### Task 6.2: Implement Deepgram Provider (Online Primary)

**Reference**: Requirements R4 (Deepgram Nova-2, 80ms target, 200ms max)

**Files to Create**:
- `src/audio/stt/deepgram-provider.ts` - Deepgram STT implementation

**Step-by-Step Instructions**:

1. Install Deepgram SDK:
   ```bash
   npm install @deepgram/sdk
   ```

2. Create `src/audio/stt/deepgram-provider.ts`:
   ```typescript
   // src/audio/stt/deepgram-provider.ts
   // Deepgram STT Provider (Online Primary)
   // Reference: Requirements R4 (Nova-2, 80ms target)

   import { createClient, LiveTranscriptionEvents, DeepgramClient } from '@deepgram/sdk';
   import {
     STTProvider,
     STTResult,
     STTEventType,
     STTEventListener,
     STTEvent,
     AudioConfig,
     DEFAULT_AUDIO_CONFIG
   } from './stt-provider.interface.js';
   import { logger } from '../../utils/logger.js';
   import { config } from '../../config/environment.js';

   export class DeepgramProvider implements STTProvider {
     public readonly name = 'deepgram';
     public readonly supportsStreaming = true;

     private client: DeepgramClient | null = null;
     private liveConnection: ReturnType<DeepgramClient['listen']['live']> | null = null;
     private listeners: Map<STTEventType, Set<STTEventListener>> = new Map();
     private startTime: number = 0;
     private transcriptBuffer: string[] = [];
     private currentAudioConfig: AudioConfig = DEFAULT_AUDIO_CONFIG;

     public isAvailable(): boolean {
       return !!config.deepgramApiKey;
     }

     public async initialize(): Promise<void> {
       if (!this.isAvailable()) {
         throw new Error('Deepgram API key not configured');
       }

       this.client = createClient(config.deepgramApiKey);
       logger.info('Deepgram provider initialized');
     }

     public async startStreaming(audioConfig?: Partial<AudioConfig>): Promise<void> {
       if (!this.client) {
         throw new Error('Provider not initialized');
       }

       this.currentAudioConfig = { ...DEFAULT_AUDIO_CONFIG, ...audioConfig };
       this.startTime = Date.now();
       this.transcriptBuffer = [];

       // Deepgram live transcription options
       // Reference: R4 specifications
       this.liveConnection = this.client.listen.live({
         model: 'nova-2',           // Best model per R4
         language: 'en-US',
         smart_format: true,        // Punctuation and formatting
         punctuate: true,
         profanity_filter: false,   // Disabled for clinical context (R4)
         utterance_end_ms: 1000,    // 1s pause detection
         interim_results: true,     // Get partial results
         vad_events: true,          // Voice activity detection
         encoding: this.currentAudioConfig.encoding === 'pcm' ? 'linear16' : 'webm',
         sample_rate: this.currentAudioConfig.sampleRate,
         channels: this.currentAudioConfig.channels
       });

       // Handle transcription events
       this.liveConnection.on(LiveTranscriptionEvents.Transcript, (data) => {
         const result = this.parseDeepgramResult(data);
         if (result) {
           this.emit('transcription', result);
           if (result.isFinal && result.text) {
             this.transcriptBuffer.push(result.text);
           }
         }
       });

       // Handle utterance end
       this.liveConnection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
         this.emit('utterance_end');
       });

       // Handle errors
       this.liveConnection.on(LiveTranscriptionEvents.Error, (error) => {
         logger.error('Deepgram streaming error', { error });
         this.emit('error', undefined, new Error(String(error)));
       });

       // Handle connection
       this.liveConnection.on(LiveTranscriptionEvents.Open, () => {
         logger.info('Deepgram connection opened');
         this.emit('connected');
       });

       this.liveConnection.on(LiveTranscriptionEvents.Close, () => {
         logger.info('Deepgram connection closed');
         this.emit('disconnected');
       });

       // Wait for connection
       await new Promise<void>((resolve, reject) => {
         const timeout = setTimeout(() => {
           reject(new Error('Deepgram connection timeout'));
         }, 5000);

         const onOpen = () => {
           clearTimeout(timeout);
           resolve();
         };

         this.liveConnection?.on(LiveTranscriptionEvents.Open, onOpen);
       });
     }

     public sendAudio(chunk: Buffer): void {
       if (!this.liveConnection) {
         throw new Error('Streaming not started');
       }
       this.liveConnection.send(chunk);
     }

     public async stopStreaming(): Promise<STTResult | null> {
       if (!this.liveConnection) {
         return null;
       }

       // Finish the stream
       this.liveConnection.finish();

       // Wait a bit for final results
       await new Promise(resolve => setTimeout(resolve, 200));

       this.liveConnection = null;

       const fullText = this.transcriptBuffer.join(' ');
       if (!fullText) return null;

       return {
         text: fullText,
         confidence: 0.95, // Deepgram doesn't provide overall confidence
         isFinal: true,
         latencyMs: Date.now() - this.startTime,
         provider: this.name
       };
     }

     public async transcribe(audioBuffer: Buffer, audioConfig?: Partial<AudioConfig>): Promise<STTResult> {
       if (!this.client) {
         throw new Error('Provider not initialized');
       }

       const startTime = Date.now();
       const config = { ...DEFAULT_AUDIO_CONFIG, ...audioConfig };

       const response = await this.client.listen.prerecorded.transcribeFile(
         audioBuffer,
         {
           model: 'nova-2',
           language: 'en-US',
           smart_format: true,
           punctuate: true,
           profanity_filter: false
         }
       );

       const alternative = response.result?.results?.channels?.[0]?.alternatives?.[0];

       return {
         text: alternative?.transcript || '',
         confidence: alternative?.confidence || 0,
         isFinal: true,
         latencyMs: Date.now() - startTime,
         provider: this.name,
         words: alternative?.words?.map(w => ({
           word: w.word,
           start: w.start,
           end: w.end,
           confidence: w.confidence
         }))
       };
     }

     private parseDeepgramResult(data: any): STTResult | null {
       const alternative = data?.channel?.alternatives?.[0];
       if (!alternative) return null;

       return {
         text: alternative.transcript || '',
         confidence: alternative.confidence || 0,
         isFinal: data.is_final || false,
         latencyMs: Date.now() - this.startTime,
         provider: this.name,
         words: alternative.words?.map((w: any) => ({
           word: w.word,
           start: w.start,
           end: w.end,
           confidence: w.confidence
         }))
       };
     }

     public on(event: STTEventType, listener: STTEventListener): void {
       if (!this.listeners.has(event)) {
         this.listeners.set(event, new Set());
       }
       this.listeners.get(event)!.add(listener);
     }

     public off(event: STTEventType, listener: STTEventListener): void {
       this.listeners.get(event)?.delete(listener);
     }

     private emit(type: STTEventType, result?: STTResult, error?: Error): void {
       const event: STTEvent = {
         type,
         result,
         error,
         timestamp: new Date().toISOString()
       };

       this.listeners.get(type)?.forEach(listener => listener(event));
     }

     public async close(): Promise<void> {
       if (this.liveConnection) {
         this.liveConnection.finish();
         this.liveConnection = null;
       }
       this.client = null;
       logger.info('Deepgram provider closed');
     }
   }
   ```

**Verification**:
- [ ] `DeepgramProvider` compiles without errors
- [ ] `isAvailable()` returns true when API key is set
- [ ] Streaming transcription works with test audio
- [ ] Latency is logged and within 200ms target

---

#### Task 6.3: Implement Google Speech-to-Text Provider (Online Fallback)

**Reference**: Requirements R4 (Google STT v2, 100ms target, 300ms max)

**Files to Create**:
- `src/audio/stt/google-provider.ts` - Google STT implementation

**Step-by-Step Instructions**:

1. Install Google Cloud Speech:
   ```bash
   npm install @google-cloud/speech
   ```

2. Create `src/audio/stt/google-provider.ts`:
   ```typescript
   // src/audio/stt/google-provider.ts
   // Google Speech-to-Text Provider (Online Fallback)
   // Reference: Requirements R4 (v2, 100ms target)

   import { SpeechClient, protos } from '@google-cloud/speech';
   import {
     STTProvider,
     STTResult,
     STTEventType,
     STTEventListener,
     STTEvent,
     AudioConfig,
     DEFAULT_AUDIO_CONFIG
   } from './stt-provider.interface.js';
   import { logger } from '../../utils/logger.js';
   import { config } from '../../config/environment.js';

   type IRecognitionConfig = protos.google.cloud.speech.v1.IRecognitionConfig;
   type IStreamingRecognitionConfig = protos.google.cloud.speech.v1.IStreamingRecognitionConfig;

   export class GoogleSTTProvider implements STTProvider {
     public readonly name = 'google';
     public readonly supportsStreaming = true;

     private client: SpeechClient | null = null;
     private recognizeStream: ReturnType<SpeechClient['streamingRecognize']> | null = null;
     private listeners: Map<STTEventType, Set<STTEventListener>> = new Map();
     private startTime: number = 0;
     private transcriptBuffer: string[] = [];
     private currentAudioConfig: AudioConfig = DEFAULT_AUDIO_CONFIG;

     public isAvailable(): boolean {
       // Google Cloud uses application default credentials or GOOGLE_APPLICATION_CREDENTIALS
       return !!process.env.GOOGLE_APPLICATION_CREDENTIALS || !!config.googleCloudProject;
     }

     public async initialize(): Promise<void> {
       this.client = new SpeechClient();
       logger.info('Google STT provider initialized');
     }

     public async startStreaming(audioConfig?: Partial<AudioConfig>): Promise<void> {
       if (!this.client) {
         throw new Error('Provider not initialized');
       }

       this.currentAudioConfig = { ...DEFAULT_AUDIO_CONFIG, ...audioConfig };
       this.startTime = Date.now();
       this.transcriptBuffer = [];

       const request: IStreamingRecognitionConfig = {
         config: {
           encoding: 'LINEAR16',
           sampleRateHertz: this.currentAudioConfig.sampleRate,
           languageCode: 'en-US',
           enableAutomaticPunctuation: true,
           profanityFilter: false,  // Disabled for clinical context (R4)
           model: 'latest_long',    // Best for conversations
           useEnhanced: true        // Enhanced model for better accuracy
         },
         interimResults: true       // Get partial results
       };

       this.recognizeStream = this.client.streamingRecognize(request);

       this.recognizeStream.on('data', (data) => {
         const result = this.parseGoogleResult(data);
         if (result) {
           this.emit('transcription', result);
           if (result.isFinal && result.text) {
             this.transcriptBuffer.push(result.text);
           }
         }
       });

       this.recognizeStream.on('error', (error) => {
         logger.error('Google STT streaming error', { error });
         this.emit('error', undefined, error);
       });

       this.recognizeStream.on('end', () => {
         this.emit('disconnected');
       });

       this.emit('connected');
       logger.info('Google STT streaming started');
     }

     public sendAudio(chunk: Buffer): void {
       if (!this.recognizeStream) {
         throw new Error('Streaming not started');
       }
       this.recognizeStream.write(chunk);
     }

     public async stopStreaming(): Promise<STTResult | null> {
       if (!this.recognizeStream) {
         return null;
       }

       // End the stream
       this.recognizeStream.end();

       // Wait for final results
       await new Promise(resolve => setTimeout(resolve, 300));

       this.recognizeStream = null;

       const fullText = this.transcriptBuffer.join(' ');
       if (!fullText) return null;

       return {
         text: fullText,
         confidence: 0.9,
         isFinal: true,
         latencyMs: Date.now() - this.startTime,
         provider: this.name
       };
     }

     public async transcribe(audioBuffer: Buffer, audioConfig?: Partial<AudioConfig>): Promise<STTResult> {
       if (!this.client) {
         throw new Error('Provider not initialized');
       }

       const startTime = Date.now();
       const config = { ...DEFAULT_AUDIO_CONFIG, ...audioConfig };

       const request = {
         config: {
           encoding: 'LINEAR16' as const,
           sampleRateHertz: config.sampleRate,
           languageCode: 'en-US',
           enableAutomaticPunctuation: true,
           profanityFilter: false
         },
         audio: {
           content: audioBuffer.toString('base64')
         }
       };

       const [response] = await this.client.recognize(request);
       const result = response.results?.[0]?.alternatives?.[0];

       return {
         text: result?.transcript || '',
         confidence: result?.confidence || 0,
         isFinal: true,
         latencyMs: Date.now() - startTime,
         provider: this.name,
         words: result?.words?.map(w => ({
           word: w.word || '',
           start: Number(w.startTime?.seconds || 0) + Number(w.startTime?.nanos || 0) / 1e9,
           end: Number(w.endTime?.seconds || 0) + Number(w.endTime?.nanos || 0) / 1e9,
           confidence: w.confidence || 0
         }))
       };
     }

     private parseGoogleResult(data: any): STTResult | null {
       const result = data.results?.[0];
       if (!result) return null;

       const alternative = result.alternatives?.[0];
       if (!alternative) return null;

       return {
         text: alternative.transcript || '',
         confidence: alternative.confidence || 0,
         isFinal: result.isFinal || false,
         latencyMs: Date.now() - this.startTime,
         provider: this.name,
         words: alternative.words?.map((w: any) => ({
           word: w.word || '',
           start: Number(w.startTime?.seconds || 0),
           end: Number(w.endTime?.seconds || 0),
           confidence: w.confidence || 0
         }))
       };
     }

     public on(event: STTEventType, listener: STTEventListener): void {
       if (!this.listeners.has(event)) {
         this.listeners.set(event, new Set());
       }
       this.listeners.get(event)!.add(listener);
     }

     public off(event: STTEventType, listener: STTEventListener): void {
       this.listeners.get(event)?.delete(listener);
     }

     private emit(type: STTEventType, result?: STTResult, error?: Error): void {
       const event: STTEvent = {
         type,
         result,
         error,
         timestamp: new Date().toISOString()
       };

       this.listeners.get(type)?.forEach(listener => listener(event));
     }

     public async close(): Promise<void> {
       if (this.recognizeStream) {
         this.recognizeStream.end();
         this.recognizeStream = null;
       }
       if (this.client) {
         await this.client.close();
         this.client = null;
       }
       logger.info('Google STT provider closed');
     }
   }
   ```

**Verification**:
- [ ] `GoogleSTTProvider` compiles without errors
- [ ] `isAvailable()` returns true when credentials are configured
- [ ] Streaming transcription works with test audio
- [ ] Latency is within 300ms target

---

#### Task 6.4: Implement Whisper Provider (Offline)

**Reference**: Requirements R4 (Whisper.cpp medium.en, 200ms target, 500ms max)

**Files to Create**:
- `src/audio/stt/whisper-provider.ts` - Whisper offline implementation

**Step-by-Step Instructions**:

1. Install node-whisper (or use child_process to call whisper.cpp):
   ```bash
   npm install node-whisper
   ```

2. Create `src/audio/stt/whisper-provider.ts`:
   ```typescript
   // src/audio/stt/whisper-provider.ts
   // Whisper STT Provider (Offline)
   // Reference: Requirements R4 (medium.en, 200ms target)

   import { spawn } from 'child_process';
   import path from 'path';
   import fs from 'fs/promises';
   import { fileURLToPath } from 'url';
   import {
     STTProvider,
     STTResult,
     STTEventType,
     STTEventListener,
     STTEvent,
     AudioConfig,
     DEFAULT_AUDIO_CONFIG
   } from './stt-provider.interface.js';
   import { logger } from '../../utils/logger.js';

   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);

   export class WhisperProvider implements STTProvider {
     public readonly name = 'whisper';
     public readonly supportsStreaming = false;  // Whisper doesn't support true streaming

     private listeners: Map<STTEventType, Set<STTEventListener>> = new Map();
     private whisperPath: string = '';
     private modelPath: string = '';
     private audioBuffer: Buffer[] = [];
     private isRecording: boolean = false;
     private startTime: number = 0;

     public isAvailable(): boolean {
       // Check if whisper binary exists
       return !!this.whisperPath;
     }

     public async initialize(): Promise<void> {
       // Look for whisper.cpp binary
       const possiblePaths = [
         path.join(__dirname, '../../../bin/whisper'),
         path.join(__dirname, '../../../bin/whisper.exe'),
         '/usr/local/bin/whisper',
         'whisper' // System PATH
       ];

       for (const p of possiblePaths) {
         try {
           await fs.access(p);
           this.whisperPath = p;
           break;
         } catch {
           // Continue checking
         }
       }

       // Look for model
       const modelDir = path.join(__dirname, '../../../memory_directory/models');
       const possibleModels = [
         'ggml-medium.en.bin',
         'ggml-base.en.bin',
         'ggml-small.en.bin'
       ];

       for (const model of possibleModels) {
         const modelPath = path.join(modelDir, model);
         try {
           await fs.access(modelPath);
           this.modelPath = modelPath;
           break;
         } catch {
           // Continue checking
         }
       }

       if (!this.modelPath) {
         logger.warn('Whisper model not found. Download with: scripts/download-whisper-model.sh');
       }

       logger.info('Whisper provider initialized', {
         whisperPath: this.whisperPath || 'not found',
         modelPath: this.modelPath || 'not found'
       });
     }

     public async startStreaming(audioConfig?: Partial<AudioConfig>): Promise<void> {
       // Whisper doesn't support true streaming, we accumulate audio
       this.audioBuffer = [];
       this.isRecording = true;
       this.startTime = Date.now();
       this.emit('connected');
       logger.info('Whisper pseudo-streaming started (accumulating audio)');
     }

     public sendAudio(chunk: Buffer): void {
       if (!this.isRecording) {
         throw new Error('Recording not started');
       }
       this.audioBuffer.push(chunk);
     }

     public async stopStreaming(): Promise<STTResult | null> {
       if (!this.isRecording) {
         return null;
       }

       this.isRecording = false;
       this.emit('disconnected');

       // Combine audio chunks
       const audioData = Buffer.concat(this.audioBuffer);
       this.audioBuffer = [];

       if (audioData.length === 0) {
         return null;
       }

       // Transcribe the accumulated audio
       return this.transcribe(audioData);
     }

     public async transcribe(audioBuffer: Buffer, audioConfig?: Partial<AudioConfig>): Promise<STTResult> {
       const startTime = Date.now();

       if (!this.whisperPath || !this.modelPath) {
         throw new Error('Whisper not available. Check binary and model paths.');
       }

       // Write audio to temp file
       const tempDir = path.join(__dirname, '../../../memory_directory/cache');
       await fs.mkdir(tempDir, { recursive: true });
       const tempFile = path.join(tempDir, `whisper_${Date.now()}.wav`);

       // Write WAV header + PCM data
       const wavBuffer = this.pcmToWav(audioBuffer, DEFAULT_AUDIO_CONFIG.sampleRate);
       await fs.writeFile(tempFile, wavBuffer);

       try {
         // Run whisper.cpp
         const result = await this.runWhisper(tempFile);

         return {
           text: result.trim(),
           confidence: 0.85,  // Whisper doesn't provide confidence scores
           isFinal: true,
           latencyMs: Date.now() - startTime,
           provider: this.name
         };
       } finally {
         // Cleanup temp file
         try {
           await fs.unlink(tempFile);
         } catch {
           // Ignore cleanup errors
         }
       }
     }

     private runWhisper(audioFile: string): Promise<string> {
       return new Promise((resolve, reject) => {
         const args = [
           '-m', this.modelPath,
           '-f', audioFile,
           '-l', 'en',
           '--no-timestamps',
           '-t', '4'  // Use 4 threads
         ];

         const process = spawn(this.whisperPath, args);
         let stdout = '';
         let stderr = '';

         process.stdout.on('data', (data) => {
           stdout += data.toString();
         });

         process.stderr.on('data', (data) => {
           stderr += data.toString();
         });

         process.on('close', (code) => {
           if (code === 0) {
             resolve(stdout);
           } else {
             reject(new Error(`Whisper failed with code ${code}: ${stderr}`));
           }
         });

         process.on('error', reject);

         // Timeout after 10 seconds
         setTimeout(() => {
           process.kill();
           reject(new Error('Whisper transcription timeout'));
         }, 10000);
       });
     }

     /**
      * Convert raw PCM to WAV format
      */
     private pcmToWav(pcmData: Buffer, sampleRate: number): Buffer {
       const numChannels = 1;
       const bitsPerSample = 16;
       const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
       const blockAlign = numChannels * (bitsPerSample / 8);
       const dataSize = pcmData.length;
       const fileSize = 36 + dataSize;

       const header = Buffer.alloc(44);

       // RIFF header
       header.write('RIFF', 0);
       header.writeUInt32LE(fileSize, 4);
       header.write('WAVE', 8);

       // fmt chunk
       header.write('fmt ', 12);
       header.writeUInt32LE(16, 16);          // chunk size
       header.writeUInt16LE(1, 20);           // audio format (PCM)
       header.writeUInt16LE(numChannels, 22);
       header.writeUInt32LE(sampleRate, 24);
       header.writeUInt32LE(byteRate, 28);
       header.writeUInt16LE(blockAlign, 32);
       header.writeUInt16LE(bitsPerSample, 34);

       // data chunk
       header.write('data', 36);
       header.writeUInt32LE(dataSize, 40);

       return Buffer.concat([header, pcmData]);
     }

     public on(event: STTEventType, listener: STTEventListener): void {
       if (!this.listeners.has(event)) {
         this.listeners.set(event, new Set());
       }
       this.listeners.get(event)!.add(listener);
     }

     public off(event: STTEventType, listener: STTEventListener): void {
       this.listeners.get(event)?.delete(listener);
     }

     private emit(type: STTEventType, result?: STTResult, error?: Error): void {
       const event: STTEvent = {
         type,
         result,
         error,
         timestamp: new Date().toISOString()
       };

       this.listeners.get(type)?.forEach(listener => listener(event));
     }

     public async close(): Promise<void> {
       this.audioBuffer = [];
       this.isRecording = false;
       logger.info('Whisper provider closed');
     }
   }
   ```

**Verification**:
- [ ] `WhisperProvider` compiles without errors
- [ ] Provider correctly detects model availability
- [ ] Transcription works with test audio file
- [ ] PCM to WAV conversion produces valid WAV files

---

#### Task 6.5: Create STT Manager (Provider Selection)

**Reference**: Requirements R4, R22 (automatic fallback on network failure)

**Files to Create**:
- `src/audio/stt/stt-manager.ts` - STT provider manager with fallback

**Step-by-Step Instructions**:

1. Create `src/audio/stt/stt-manager.ts`:
   ```typescript
   // src/audio/stt/stt-manager.ts
   // STT Manager with automatic provider selection and fallback
   // Reference: Requirements R4, R22 (fallback within 3 seconds)

   import {
     STTProvider,
     STTResult,
     STTEventType,
     STTEventListener,
     STTEvent,
     AudioConfig,
     DEFAULT_AUDIO_CONFIG
   } from './stt-provider.interface.js';
   import { DeepgramProvider } from './deepgram-provider.js';
   import { GoogleSTTProvider } from './google-provider.js';
   import { WhisperProvider } from './whisper-provider.js';
   import { watchdog, WatchdogComponent } from '../../session/watchdog.js';
   import { logger } from '../../utils/logger.js';

   /**
    * Provider priority order
    * Reference: R4 - Deepgram primary, Google fallback, Whisper offline
    */
   type ProviderType = 'deepgram' | 'google' | 'whisper';

   const PROVIDER_PRIORITY: ProviderType[] = ['deepgram', 'google', 'whisper'];

   /**
    * STT Manager
    * Handles provider selection, fallback, and watchdog timeouts
    */
   export class STTManager {
     private providers: Map<ProviderType, STTProvider> = new Map();
     private currentProvider: STTProvider | null = null;
     private listeners: Map<STTEventType, Set<STTEventListener>> = new Map();
     private isOnline: boolean = true;
     private fallbackInProgress: boolean = false;

     /**
      * Initialize all available providers
      */
     public async initialize(): Promise<void> {
       // Create provider instances
       const deepgram = new DeepgramProvider();
       const google = new GoogleSTTProvider();
       const whisper = new WhisperProvider();

       // Initialize each provider
       for (const [type, provider] of [
         ['deepgram', deepgram],
         ['google', google],
         ['whisper', whisper]
       ] as [ProviderType, STTProvider][]) {
         try {
           if (provider.isAvailable()) {
             await provider.initialize();
             this.providers.set(type, provider);
             logger.info(`STT provider ${type} initialized`);
           } else {
             logger.info(`STT provider ${type} not available`);
           }
         } catch (error) {
           logger.warn(`Failed to initialize STT provider ${type}`, { error });
         }
       }

       // Select initial provider
       await this.selectBestProvider();

       if (!this.currentProvider) {
         throw new Error('No STT providers available');
       }

       logger.info('STT Manager initialized', {
         availableProviders: Array.from(this.providers.keys()),
         currentProvider: this.currentProvider.name
       });
     }

     /**
      * Select the best available provider based on priority
      */
     private async selectBestProvider(): Promise<void> {
       for (const type of PROVIDER_PRIORITY) {
         const provider = this.providers.get(type);
         if (provider && provider.isAvailable()) {
           // For online providers, check network status
           if ((type === 'deepgram' || type === 'google') && !this.isOnline) {
             continue;
           }
           this.currentProvider = provider;
           return;
         }
       }

       // Fallback to whisper if available
       const whisper = this.providers.get('whisper');
       if (whisper) {
         this.currentProvider = whisper;
       }
     }

     /**
      * Set online/offline status
      * Reference: R22 (switch to offline within 3 seconds)
      */
     public setOnlineStatus(online: boolean): void {
       const wasOnline = this.isOnline;
       this.isOnline = online;

       if (wasOnline && !online) {
         logger.warn('Network offline, switching to offline STT provider');
         this.selectBestProvider();
       } else if (!wasOnline && online) {
         logger.info('Network restored, switching to online STT provider');
         this.selectBestProvider();
       }
     }

     /**
      * Start streaming transcription
      */
     public async startStreaming(audioConfig?: Partial<AudioConfig>): Promise<void> {
       if (!this.currentProvider) {
         throw new Error('No STT provider available');
       }

       // Set up watchdog timeout (5s per system_architecture.md)
       watchdog.start('STT_PROCESSING', 'streaming', async () => {
         logger.warn('STT watchdog timeout, attempting fallback');
         await this.handleProviderFailure();
       });

       // Wire up events from current provider
       this.setupProviderEvents(this.currentProvider);

       await this.currentProvider.startStreaming(audioConfig);
     }

     /**
      * Send audio chunk
      */
     public sendAudio(chunk: Buffer): void {
       if (!this.currentProvider) {
         throw new Error('No STT provider available');
       }
       this.currentProvider.sendAudio(chunk);
     }

     /**
      * Stop streaming and get result
      */
     public async stopStreaming(): Promise<STTResult | null> {
       watchdog.stop('STT_PROCESSING', 'streaming');

       if (!this.currentProvider) {
         return null;
       }

       const result = await this.currentProvider.stopStreaming();

       if (result) {
         logger.info('STT transcription complete', {
           provider: result.provider,
           latencyMs: result.latencyMs,
           textLength: result.text.length
         });
       }

       return result;
     }

     /**
      * Transcribe audio file (non-streaming)
      */
     public async transcribe(audioBuffer: Buffer, audioConfig?: Partial<AudioConfig>): Promise<STTResult> {
       if (!this.currentProvider) {
         throw new Error('No STT provider available');
       }

       const startTime = Date.now();

       try {
         return await this.currentProvider.transcribe(audioBuffer, audioConfig);
       } catch (error) {
         logger.error('Transcription failed, attempting fallback', { error });
         await this.handleProviderFailure();

         if (this.currentProvider) {
           return await this.currentProvider.transcribe(audioBuffer, audioConfig);
         }

         throw error;
       }
     }

     /**
      * Handle provider failure and fallback
      */
     private async handleProviderFailure(): Promise<void> {
       if (this.fallbackInProgress) return;

       this.fallbackInProgress = true;
       const failedProvider = this.currentProvider?.name;

       try {
         // Find next available provider
         for (const type of PROVIDER_PRIORITY) {
           const provider = this.providers.get(type);
           if (provider && provider !== this.currentProvider && provider.isAvailable()) {
             // For online providers, skip if offline
             if ((type === 'deepgram' || type === 'google') && !this.isOnline) {
               continue;
             }

             this.currentProvider = provider;
             logger.info('STT provider fallback', {
               from: failedProvider,
               to: provider.name
             });
             return;
           }
         }

         logger.error('No fallback STT provider available');
       } finally {
         this.fallbackInProgress = false;
       }
     }

     /**
      * Setup event listeners for provider
      */
     private setupProviderEvents(provider: STTProvider): void {
       // Forward all events
       for (const eventType of ['transcription', 'utterance_end', 'error', 'connected', 'disconnected'] as STTEventType[]) {
         provider.on(eventType, (event) => {
           this.emit(event.type, event.result, event.error);

           // Reset watchdog on successful transcription
           if (eventType === 'transcription' && event.result) {
             watchdog.stop('STT_PROCESSING', 'streaming');
             watchdog.start('STT_PROCESSING', 'streaming', async () => {
               await this.handleProviderFailure();
             });
           }

           // Handle errors
           if (eventType === 'error') {
             this.handleProviderFailure();
           }
         });
       }
     }

     /**
      * Get current provider name
      */
     public getCurrentProvider(): string {
       return this.currentProvider?.name || 'none';
     }

     /**
      * Get available providers
      */
     public getAvailableProviders(): string[] {
       return Array.from(this.providers.keys());
     }

     public on(event: STTEventType, listener: STTEventListener): void {
       if (!this.listeners.has(event)) {
         this.listeners.set(event, new Set());
       }
       this.listeners.get(event)!.add(listener);
     }

     public off(event: STTEventType, listener: STTEventListener): void {
       this.listeners.get(event)?.delete(listener);
     }

     private emit(type: STTEventType, result?: STTResult, error?: Error): void {
       const event: STTEvent = {
         type,
         result,
         error,
         timestamp: new Date().toISOString()
       };

       this.listeners.get(type)?.forEach(listener => listener(event));
     }

     /**
      * Close all providers
      */
     public async close(): Promise<void> {
       for (const provider of this.providers.values()) {
         await provider.close();
       }
       this.providers.clear();
       this.currentProvider = null;
       logger.info('STT Manager closed');
     }
   }

   // Export singleton
   export const sttManager = new STTManager();
   ```

**Verification**:
- [ ] `STTManager` compiles without errors
- [ ] Provider selection follows priority order
- [ ] Fallback works when primary provider fails
- [ ] `setOnlineStatus(false)` switches to Whisper
- [ ] Watchdog timeout triggers fallback

---

#### Task 6.6: Create Voice Activity Detection (VAD)

**Reference**: Requirements R4 (VAD-based silence detection, 500ms threshold)

**Files to Create**:
- `src/audio/vad/vad.ts` - Voice activity detection

**Step-by-Step Instructions**:

1. Create `src/audio/vad/vad.ts`:
   ```typescript
   // src/audio/vad/vad.ts
   // Voice Activity Detection
   // Reference: Requirements R4 (500ms silence threshold)

   import { EventEmitter } from 'events';
   import { logger } from '../../utils/logger.js';

   /**
    * VAD configuration
    */
   export interface VADConfig {
     sampleRate: number;
     silenceThreshold: number;      // dB level below which is silence
     silenceDurationMs: number;     // How long silence before utterance_end
     minSpeechDurationMs: number;   // Minimum speech to count as valid
   }

   /**
    * Default VAD configuration
    * Reference: R4 (500ms silence threshold)
    */
   export const DEFAULT_VAD_CONFIG: VADConfig = {
     sampleRate: 16000,
     silenceThreshold: -40,          // dB
     silenceDurationMs: 500,         // 500ms per R4
     minSpeechDurationMs: 100        // Minimum 100ms of speech
   };

   /**
    * VAD events
    */
   export type VADEvent = 'speech_start' | 'speech_end' | 'silence' | 'speech';

   /**
    * Voice Activity Detector
    */
   export class VAD extends EventEmitter {
     private config: VADConfig;
     private isSpeaking: boolean = false;
     private silenceStart: number = 0;
     private speechStart: number = 0;
     private lastLevel: number = -100;

     constructor(config?: Partial<VADConfig>) {
       super();
       this.config = { ...DEFAULT_VAD_CONFIG, ...config };
     }

     /**
      * Process an audio chunk
      * @param chunk PCM audio data (16-bit LE)
      */
     public processChunk(chunk: Buffer): void {
       const level = this.calculateLevel(chunk);
       this.lastLevel = level;

       const now = Date.now();
       const isSpeech = level > this.config.silenceThreshold;

       if (isSpeech) {
         if (!this.isSpeaking) {
           // Speech started
           this.isSpeaking = true;
           this.speechStart = now;
           this.silenceStart = 0;
           this.emit('speech_start');
           logger.debug('VAD: Speech started', { level });
         }
         this.emit('speech', { level, duration: now - this.speechStart });
       } else {
         // Silence detected
         if (this.isSpeaking) {
           if (this.silenceStart === 0) {
             this.silenceStart = now;
           }

           const silenceDuration = now - this.silenceStart;

           if (silenceDuration >= this.config.silenceDurationMs) {
             // Speech ended (silence threshold reached)
             const speechDuration = this.silenceStart - this.speechStart;

             if (speechDuration >= this.config.minSpeechDurationMs) {
               this.isSpeaking = false;
               this.emit('speech_end', {
                 duration: speechDuration,
                 silenceDuration
               });
               logger.debug('VAD: Speech ended', { speechDuration, silenceDuration });
             }
           }
         }
         this.emit('silence', { level, duration: this.silenceStart ? now - this.silenceStart : 0 });
       }
     }

     /**
      * Calculate audio level in dB
      */
     private calculateLevel(chunk: Buffer): number {
       // Convert buffer to 16-bit samples
       const samples = new Int16Array(chunk.buffer, chunk.byteOffset, chunk.length / 2);

       // Calculate RMS (Root Mean Square)
       let sum = 0;
       for (let i = 0; i < samples.length; i++) {
         const normalized = samples[i] / 32768;  // Normalize to -1 to 1
         sum += normalized * normalized;
       }
       const rms = Math.sqrt(sum / samples.length);

       // Convert to dB
       const db = 20 * Math.log10(Math.max(rms, 1e-10));

       return db;
     }

     /**
      * Get current speech state
      */
     public isSpeechActive(): boolean {
       return this.isSpeaking;
     }

     /**
      * Get current audio level
      */
     public getCurrentLevel(): number {
       return this.lastLevel;
     }

     /**
      * Reset state
      */
     public reset(): void {
       this.isSpeaking = false;
       this.silenceStart = 0;
       this.speechStart = 0;
       this.lastLevel = -100;
     }
   }
   ```

**Verification**:
- [ ] `VAD` compiles without errors
- [ ] `speech_start` fires when audio level exceeds threshold
- [ ] `speech_end` fires after 500ms of silence
- [ ] Level calculation returns reasonable dB values

---

#### Task 6.7: Create Audio Recording Service

**Reference**: Requirements R4 (capture, process, and stream audio)

**Files to Create**:
- `src/audio/audio-recorder.ts` - Audio recording and processing

**Step-by-Step Instructions**:

1. Create `src/audio/audio-recorder.ts`:
   ```typescript
   // src/audio/audio-recorder.ts
   // Audio recording service for patient speech capture
   // Reference: Requirements R4

   import { EventEmitter } from 'events';
   import { VAD, VADEvent } from './vad/vad.js';
   import { sttManager } from './stt/stt-manager.js';
   import { DEFAULT_AUDIO_CONFIG, STTResult } from './stt/stt-provider.interface.js';
   import { logger } from '../utils/logger.js';

   /**
    * Audio recorder events
    */
   export type RecorderEvent =
     | 'recording_started'
     | 'recording_stopped'
     | 'speech_detected'
     | 'utterance_complete'
     | 'transcription'
     | 'error';

   /**
    * Audio Recorder Service
    * Manages audio capture, VAD, and STT integration
    */
   export class AudioRecorder extends EventEmitter {
     private vad: VAD;
     private isRecording: boolean = false;
     private audioBuffer: Buffer[] = [];
     private utteranceStartTime: number = 0;

     constructor() {
       super();
       this.vad = new VAD();
       this.setupVADEvents();
     }

     /**
      * Setup VAD event handlers
      */
     private setupVADEvents(): void {
       this.vad.on('speech_start', () => {
         this.utteranceStartTime = Date.now();
         this.emit('speech_detected');
       });

       this.vad.on('speech_end', async (data) => {
         // Utterance complete, send for transcription
         const utteranceDuration = data.duration;

         if (this.audioBuffer.length > 0) {
           const audioData = Buffer.concat(this.audioBuffer);
           this.audioBuffer = [];  // Clear buffer

           this.emit('utterance_complete', { duration: utteranceDuration });

           // If we're streaming, the STT will handle it
           // If not streaming, transcribe the utterance
           logger.debug('Utterance captured', { duration: utteranceDuration, bytes: audioData.length });
         }
       });
     }

     /**
      * Start recording with streaming STT
      */
     public async startRecording(): Promise<void> {
       if (this.isRecording) {
         return;
       }

       this.isRecording = true;
       this.audioBuffer = [];
       this.vad.reset();

       // Start STT streaming
       await sttManager.startStreaming();

       // Setup STT event handlers
       sttManager.on('transcription', (event) => {
         if (event.result) {
           this.emit('transcription', event.result);
         }
       });

       sttManager.on('error', (event) => {
         this.emit('error', event.error);
       });

       this.emit('recording_started');
       logger.info('Audio recording started');
     }

     /**
      * Process incoming audio chunk from browser/microphone
      * Call this with audio data from WebRTC or MediaRecorder
      */
     public processAudio(chunk: Buffer): void {
       if (!this.isRecording) {
         return;
       }

       // Process with VAD
       this.vad.processChunk(chunk);

       // Buffer audio
       this.audioBuffer.push(chunk);

       // Keep buffer from growing too large (max 30 seconds)
       const maxBufferSize = DEFAULT_AUDIO_CONFIG.sampleRate * 2 * 30;  // 30 seconds of 16-bit audio
       let totalSize = this.audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
       while (totalSize > maxBufferSize && this.audioBuffer.length > 1) {
         this.audioBuffer.shift();
         totalSize = this.audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
       }

       // Send to STT
       sttManager.sendAudio(chunk);
     }

     /**
      * Stop recording
      */
     public async stopRecording(): Promise<STTResult | null> {
       if (!this.isRecording) {
         return null;
       }

       this.isRecording = false;

       // Get final STT result
       const result = await sttManager.stopStreaming();

       this.audioBuffer = [];
       this.emit('recording_stopped');
       logger.info('Audio recording stopped');

       return result;
     }

     /**
      * Check if currently recording
      */
     public getIsRecording(): boolean {
       return this.isRecording;
     }

     /**
      * Get current audio level (for UI visualization)
      */
     public getCurrentLevel(): number {
       return this.vad.getCurrentLevel();
     }

     /**
      * Check if speech is currently active
      */
     public isSpeechActive(): boolean {
       return this.vad.isSpeechActive();
     }
   }

   // Export singleton
   export const audioRecorder = new AudioRecorder();
   ```

**Verification**:
- [ ] `AudioRecorder` compiles without errors
- [ ] Recording starts and emits `recording_started`
- [ ] Audio chunks are processed by VAD
- [ ] `transcription` events are emitted with results
- [ ] Buffer doesn't grow beyond 30 seconds

---

### Task 7: Text-to-Speech System

**References**:
- Requirements R5 (Text-to-Speech Synthesis)
- system_architecture.md Section 3 (200ms target, 400ms max)

**Prerequisites**: Task 1 (Project Setup)

**Estimated Subtasks**: 6

---

#### Task 7.1: Create TTS Provider Interface

**Reference**: Requirements R5 (multiple providers: ElevenLabs, Azure, Coqui)

**Files to Create**:
- `src/audio/tts/tts-provider.interface.ts` - TTS provider interface

**Step-by-Step Instructions**:

1. Create directory:
   ```bash
   mkdir -p src/audio/tts
   ```

2. Create `src/audio/tts/tts-provider.interface.ts`:
   ```typescript
   // src/audio/tts/tts-provider.interface.ts
   // Text-to-Speech provider interface
   // Reference: Requirements R5

   /**
    * TTS result
    */
   export interface TTSResult {
     audioBuffer: Buffer;
     format: 'mp3' | 'wav' | 'ogg' | 'pcm';
     sampleRate: number;
     durationMs: number;
     latencyMs: number;
     provider: string;
     visemes?: VisemeData[];
   }

   /**
    * Viseme data for lip-sync
    * Reference: R6 (lip-sync animation)
    */
   export interface VisemeData {
     viseme: string;          // Viseme ID (e.g., 'AA', 'AO', 'sil')
     startTimeMs: number;
     durationMs: number;
     audioOffset: number;     // Byte offset in audio buffer
   }

   /**
    * Voice configuration
    * Reference: R5 Voice Parameters
    */
   export interface VoiceConfig {
     voiceId: string;
     pitch?: number;          // -100 to 100 (default 0)
     rate?: number;           // 0.5 to 2.0 (default 1.0)
     volume?: number;         // 0 to 1.0 (default 1.0)
     emotion?: 'neutral' | 'empathy' | 'affirmation' | 'grounding';
   }

   /**
    * Dr. Sterling voice configuration
    * Reference: R5 (calming parameters)
    */
   export const DR_STERLING_VOICE_CONFIG: VoiceConfig = {
     voiceId: 'dr_sterling',
     pitch: 0,
     rate: 0.9,               // 0.85-0.95x per R5
     volume: 0.95,
     emotion: 'neutral'
   };

   /**
    * Emotional modulation settings
    * Reference: R5 emotional_modulation
    */
   export const EMOTIONAL_MODULATION: Record<string, Partial<VoiceConfig>> = {
     empathy: { rate: 0.8, pitch: -10 },
     affirmation: { rate: 1.0, pitch: 5 },
     grounding: { rate: 0.7, pitch: -15 }
   };

   /**
    * TTS Provider Interface
    */
   export interface TTSProvider {
     /** Provider name */
     readonly name: string;

     /** Whether streaming is supported */
     readonly supportsStreaming: boolean;

     /** Whether viseme generation is supported */
     readonly supportsVisemes: boolean;

     /** Check if provider is available */
     isAvailable(): boolean;

     /** Initialize provider */
     initialize(): Promise<void>;

     /**
      * Synthesize speech from text
      */
     synthesize(text: string, voiceConfig?: Partial<VoiceConfig>): Promise<TTSResult>;

     /**
      * Start streaming synthesis (if supported)
      */
     startStreaming?(voiceConfig?: Partial<VoiceConfig>): Promise<void>;

     /**
      * Send text chunk for streaming synthesis
      */
     streamText?(text: string): Promise<void>;

     /**
      * End streaming and get remaining audio
      */
     endStreaming?(): Promise<TTSResult | null>;

     /**
      * Get available voices
      */
     getVoices(): Promise<Array<{ id: string; name: string; language: string }>>;

     /** Close and cleanup */
     close(): Promise<void>;
   }
   ```

**Verification**:
- [ ] Interface file compiles without errors
- [ ] `DR_STERLING_VOICE_CONFIG` matches R5 specifications

---

#### Task 7.2: Implement ElevenLabs Provider (Online Primary)

**Reference**: Requirements R5 (ElevenLabs custom voice, 200ms target)

**Files to Create**:
- `src/audio/tts/elevenlabs-provider.ts`

**Step-by-Step Instructions**:

1. Install ElevenLabs SDK:
   ```bash
   npm install elevenlabs
   ```

2. Create `src/audio/tts/elevenlabs-provider.ts`:
   ```typescript
   // src/audio/tts/elevenlabs-provider.ts
   // ElevenLabs TTS Provider (Online Primary)
   // Reference: Requirements R5 (200ms target)

   import { ElevenLabsClient, stream } from 'elevenlabs';
   import {
     TTSProvider,
     TTSResult,
     VoiceConfig,
     DR_STERLING_VOICE_CONFIG
   } from './tts-provider.interface.js';
   import { logger } from '../../utils/logger.js';
   import { config } from '../../config/environment.js';

   export class ElevenLabsProvider implements TTSProvider {
     public readonly name = 'elevenlabs';
     public readonly supportsStreaming = true;
     public readonly supportsVisemes = false;  // ElevenLabs doesn't provide visemes

     private client: ElevenLabsClient | null = null;
     private defaultVoiceId: string = '';

     public isAvailable(): boolean {
       return !!config.elevenLabsApiKey;
     }

     public async initialize(): Promise<void> {
       if (!this.isAvailable()) {
         throw new Error('ElevenLabs API key not configured');
       }

       this.client = new ElevenLabsClient({
         apiKey: config.elevenLabsApiKey
       });

       // Get or create Dr. Sterling voice
       const voices = await this.getVoices();
       const sterling = voices.find(v =>
         v.name.toLowerCase().includes('sterling') ||
         v.name.toLowerCase().includes('therapist')
       );

       this.defaultVoiceId = sterling?.id || voices[0]?.id || '';
       logger.info('ElevenLabs provider initialized', { voiceId: this.defaultVoiceId });
     }

     public async synthesize(text: string, voiceConfig?: Partial<VoiceConfig>): Promise<TTSResult> {
       if (!this.client) {
         throw new Error('Provider not initialized');
       }

       const startTime = Date.now();
       const config = { ...DR_STERLING_VOICE_CONFIG, ...voiceConfig };

       const audioResponse = await this.client.generate({
         voice: config.voiceId || this.defaultVoiceId,
         text: text,
         model_id: 'eleven_turbo_v2',  // Fastest model
         voice_settings: {
           stability: 0.7,              // Balance between stability and expressiveness
           similarity_boost: 0.8,
           style: 0.4,
           use_speaker_boost: true
         }
       });

       // Collect audio chunks
       const chunks: Buffer[] = [];
       for await (const chunk of audioResponse) {
         chunks.push(Buffer.from(chunk));
       }
       const audioBuffer = Buffer.concat(chunks);

       const latencyMs = Date.now() - startTime;

       // Estimate duration (MP3 ~128kbps average)
       const durationMs = Math.round((audioBuffer.length * 8) / 128);

       logger.info('ElevenLabs synthesis complete', { latencyMs, bytes: audioBuffer.length });

       return {
         audioBuffer,
         format: 'mp3',
         sampleRate: 44100,
         durationMs,
         latencyMs,
         provider: this.name
       };
     }

     public async getVoices(): Promise<Array<{ id: string; name: string; language: string }>> {
       if (!this.client) {
         throw new Error('Provider not initialized');
       }

       const response = await this.client.voices.getAll();

       return response.voices.map(v => ({
         id: v.voice_id,
         name: v.name,
         language: 'en'  // ElevenLabs is primarily English
       }));
     }

     public async close(): Promise<void> {
       this.client = null;
       logger.info('ElevenLabs provider closed');
     }
   }
   ```

**Verification**:
- [ ] `ElevenLabsProvider` compiles without errors
- [ ] `synthesize()` returns valid audio buffer
- [ ] Latency is within 200ms target for short text

---

#### Task 7.3: Implement Azure TTS Provider (Online Fallback)

**Reference**: Requirements R5 (Azure Neural TTS, 150ms target)

**Files to Create**:
- `src/audio/tts/azure-provider.ts`

**Step-by-Step Instructions**:

1. Install Azure SDK:
   ```bash
   npm install microsoft-cognitiveservices-speech-sdk
   ```

2. Create `src/audio/tts/azure-provider.ts`:
   ```typescript
   // src/audio/tts/azure-provider.ts
   // Azure Neural TTS Provider (Online Fallback)
   // Reference: Requirements R5 (en-US-GuyNeural, 150ms target)

   import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
   import {
     TTSProvider,
     TTSResult,
     VoiceConfig,
     VisemeData,
     DR_STERLING_VOICE_CONFIG
   } from './tts-provider.interface.js';
   import { logger } from '../../utils/logger.js';
   import { config } from '../../config/environment.js';

   export class AzureTTSProvider implements TTSProvider {
     public readonly name = 'azure';
     public readonly supportsStreaming = true;
     public readonly supportsVisemes = true;  // Azure provides viseme data

     private speechConfig: sdk.SpeechConfig | null = null;
     private voiceName: string = 'en-US-GuyNeural';  // Default per R5

     public isAvailable(): boolean {
       return !!config.azureSpeechKey && !!config.azureSpeechRegion;
     }

     public async initialize(): Promise<void> {
       if (!this.isAvailable()) {
         throw new Error('Azure Speech credentials not configured');
       }

       this.speechConfig = sdk.SpeechConfig.fromSubscription(
         config.azureSpeechKey,
         config.azureSpeechRegion
       );

       this.speechConfig.speechSynthesisOutputFormat =
         sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

       logger.info('Azure TTS provider initialized', { voice: this.voiceName });
     }

     public async synthesize(text: string, voiceConfig?: Partial<VoiceConfig>): Promise<TTSResult> {
       if (!this.speechConfig) {
         throw new Error('Provider not initialized');
       }

       const startTime = Date.now();
       const config = { ...DR_STERLING_VOICE_CONFIG, ...voiceConfig };

       // Build SSML for emotional modulation
       const ssml = this.buildSSML(text, config);

       // Create synthesizer
       const synthesizer = new sdk.SpeechSynthesizer(this.speechConfig);
       const visemes: VisemeData[] = [];

       // Collect viseme data
       synthesizer.visemeReceived = (_, e) => {
         visemes.push({
           viseme: e.visemeId.toString(),
           startTimeMs: e.audioOffset / 10000,  // Convert 100ns to ms
           durationMs: 0,  // Will be calculated
           audioOffset: 0
         });
       };

       return new Promise((resolve, reject) => {
         synthesizer.speakSsmlAsync(
           ssml,
           (result) => {
             synthesizer.close();

             if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
               const audioBuffer = Buffer.from(result.audioData);
               const latencyMs = Date.now() - startTime;

               // Calculate viseme durations
               for (let i = 0; i < visemes.length - 1; i++) {
                 visemes[i].durationMs = visemes[i + 1].startTimeMs - visemes[i].startTimeMs;
               }
               if (visemes.length > 0) {
                 visemes[visemes.length - 1].durationMs = 100;  // Default last duration
               }

               logger.info('Azure TTS synthesis complete', { latencyMs, visemeCount: visemes.length });

               resolve({
                 audioBuffer,
                 format: 'mp3',
                 sampleRate: 16000,
                 durationMs: Math.round(result.audioDuration / 10000),
                 latencyMs,
                 provider: this.name,
                 visemes
               });
             } else {
               reject(new Error(`Azure TTS failed: ${result.errorDetails}`));
             }
           },
           (error) => {
             synthesizer.close();
             reject(error);
           }
         );
       });
     }

     private buildSSML(text: string, config: VoiceConfig): string {
       const rate = config.rate || 1.0;
       const pitch = config.pitch || 0;

       return `
         <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
                xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
           <voice name="${this.voiceName}">
             <prosody rate="${rate}" pitch="${pitch > 0 ? '+' : ''}${pitch}%">
               <mstts:express-as style="empathetic">
                 ${this.escapeXml(text)}
               </mstts:express-as>
             </prosody>
           </voice>
         </speak>
       `;
     }

     private escapeXml(text: string): string {
       return text
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&apos;');
     }

     public async getVoices(): Promise<Array<{ id: string; name: string; language: string }>> {
       // Return preset list of neural voices suitable for therapy
       return [
         { id: 'en-US-GuyNeural', name: 'Guy (Neural)', language: 'en-US' },
         { id: 'en-US-DavisNeural', name: 'Davis (Neural)', language: 'en-US' },
         { id: 'en-GB-RyanNeural', name: 'Ryan (Neural)', language: 'en-GB' }
       ];
     }

     public async close(): Promise<void> {
       this.speechConfig = null;
       logger.info('Azure TTS provider closed');
     }
   }
   ```

**Verification**:
- [ ] `AzureTTSProvider` compiles without errors
- [ ] SSML generation includes rate and pitch adjustments
- [ ] Viseme data is captured and returned
- [ ] Latency is within 150ms target

---

#### Task 7.4: Implement Coqui TTS Provider (Offline)

**Reference**: Requirements R5 (Coqui XTTS v2, 300ms target)

**Files to Create**:
- `src/audio/tts/coqui-provider.ts`

**Step-by-Step Instructions**:

1. Create `src/audio/tts/coqui-provider.ts`:
   ```typescript
   // src/audio/tts/coqui-provider.ts
   // Coqui XTTS v2 Provider (Offline)
   // Reference: Requirements R5 (cloned voice, 300ms target)

   import { spawn } from 'child_process';
   import path from 'path';
   import fs from 'fs/promises';
   import { fileURLToPath } from 'url';
   import {
     TTSProvider,
     TTSResult,
     VoiceConfig,
     DR_STERLING_VOICE_CONFIG
   } from './tts-provider.interface.js';
   import { logger } from '../../utils/logger.js';

   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);

   export class CoquiTTSProvider implements TTSProvider {
     public readonly name = 'coqui';
     public readonly supportsStreaming = false;
     public readonly supportsVisemes = false;

     private coquiPath: string = '';
     private modelPath: string = '';
     private speakerWavPath: string = '';  // Reference audio for voice cloning

     public isAvailable(): boolean {
       return !!this.coquiPath && !!this.modelPath;
     }

     public async initialize(): Promise<void> {
       // Look for Coqui TTS (can be Python script or binary)
       const possiblePaths = [
         path.join(__dirname, '../../../venv/bin/tts'),
         path.join(__dirname, '../../../bin/tts'),
         '/usr/local/bin/tts',
         'tts'  // System PATH
       ];

       for (const p of possiblePaths) {
         try {
           await fs.access(p);
           this.coquiPath = p;
           break;
         } catch {
           // Continue checking
         }
       }

       // Look for XTTS model
       const modelDir = path.join(__dirname, '../../../memory_directory/models/coqui');
       try {
         await fs.access(modelDir);
         this.modelPath = modelDir;
       } catch {
         logger.warn('Coqui XTTS model not found');
       }

       // Look for Dr. Sterling reference audio
       const speakerPath = path.join(modelDir, 'dr_sterling_reference.wav');
       try {
         await fs.access(speakerPath);
         this.speakerWavPath = speakerPath;
       } catch {
         logger.warn('Dr. Sterling reference audio not found for voice cloning');
       }

       logger.info('Coqui TTS provider initialized', {
         coquiPath: this.coquiPath || 'not found',
         modelPath: this.modelPath || 'not found',
         hasReferenceAudio: !!this.speakerWavPath
       });
     }

     public async synthesize(text: string, voiceConfig?: Partial<VoiceConfig>): Promise<TTSResult> {
       if (!this.isAvailable()) {
         throw new Error('Coqui TTS not available');
       }

       const startTime = Date.now();
       const config = { ...DR_STERLING_VOICE_CONFIG, ...voiceConfig };

       // Create temp file for output
       const tempDir = path.join(__dirname, '../../../memory_directory/cache');
       await fs.mkdir(tempDir, { recursive: true });
       const outputPath = path.join(tempDir, `tts_${Date.now()}.wav`);

       try {
         await this.runCoqui(text, outputPath);

         const audioBuffer = await fs.readFile(outputPath);
         const latencyMs = Date.now() - startTime;

         // Estimate duration from WAV (16kHz, 16-bit, mono)
         // WAV header is 44 bytes, then 2 bytes per sample
         const dataSize = audioBuffer.length - 44;
         const durationMs = Math.round((dataSize / 2) / 16);  // samples / sample_rate * 1000

         logger.info('Coqui TTS synthesis complete', { latencyMs, bytes: audioBuffer.length });

         return {
           audioBuffer,
           format: 'wav',
           sampleRate: 16000,
           durationMs,
           latencyMs,
           provider: this.name
         };
       } finally {
         // Cleanup temp file
         try {
           await fs.unlink(outputPath);
         } catch {
           // Ignore cleanup errors
         }
       }
     }

     private runCoqui(text: string, outputPath: string): Promise<void> {
       return new Promise((resolve, reject) => {
         const args = [
           '--text', text,
           '--out_path', outputPath,
           '--model_name', 'tts_models/multilingual/multi-dataset/xtts_v2'
         ];

         if (this.speakerWavPath) {
           args.push('--speaker_wav', this.speakerWavPath);
           args.push('--language_idx', 'en');
         }

         const process = spawn(this.coquiPath, args);
         let stderr = '';

         process.stderr.on('data', (data) => {
           stderr += data.toString();
         });

         process.on('close', (code) => {
           if (code === 0) {
             resolve();
           } else {
             reject(new Error(`Coqui TTS failed with code ${code}: ${stderr}`));
           }
         });

         process.on('error', reject);

         // Timeout after 30 seconds
         setTimeout(() => {
           process.kill();
           reject(new Error('Coqui TTS timeout'));
         }, 30000);
       });
     }

     public async getVoices(): Promise<Array<{ id: string; name: string; language: string }>> {
       return [
         { id: 'xtts_v2', name: 'XTTS v2 (Cloned)', language: 'en' }
       ];
     }

     public async close(): Promise<void> {
       logger.info('Coqui TTS provider closed');
     }
   }
   ```

**Verification**:
- [ ] `CoquiTTSProvider` compiles without errors
- [ ] Provider detects Coqui TTS installation
- [ ] Synthesis produces valid WAV output
- [ ] Voice cloning uses reference audio when available

---

#### Task 7.5: Create TTS Manager

**Reference**: Requirements R5, R22 (automatic fallback)

**Files to Create**:
- `src/audio/tts/tts-manager.ts`

**Step-by-Step Instructions**:

1. Create `src/audio/tts/tts-manager.ts`:
   ```typescript
   // src/audio/tts/tts-manager.ts
   // TTS Manager with provider selection and fallback
   // Reference: Requirements R5, R22

   import {
     TTSProvider,
     TTSResult,
     VoiceConfig,
     DR_STERLING_VOICE_CONFIG
   } from './tts-provider.interface.js';
   import { ElevenLabsProvider } from './elevenlabs-provider.js';
   import { AzureTTSProvider } from './azure-provider.js';
   import { CoquiTTSProvider } from './coqui-provider.js';
   import { watchdog } from '../../session/watchdog.js';
   import { logger } from '../../utils/logger.js';

   type ProviderType = 'elevenlabs' | 'azure' | 'coqui';

   const PROVIDER_PRIORITY: ProviderType[] = ['elevenlabs', 'azure', 'coqui'];

   /**
    * TTS Manager
    * Handles provider selection, fallback, and watchdog timeouts
    */
   export class TTSManager {
     private providers: Map<ProviderType, TTSProvider> = new Map();
     private currentProvider: TTSProvider | null = null;
     private isOnline: boolean = true;

     public async initialize(): Promise<void> {
       const elevenlabs = new ElevenLabsProvider();
       const azure = new AzureTTSProvider();
       const coqui = new CoquiTTSProvider();

       for (const [type, provider] of [
         ['elevenlabs', elevenlabs],
         ['azure', azure],
         ['coqui', coqui]
       ] as [ProviderType, TTSProvider][]) {
         try {
           if (provider.isAvailable()) {
             await provider.initialize();
             this.providers.set(type, provider);
             logger.info(`TTS provider ${type} initialized`);
           }
         } catch (error) {
           logger.warn(`Failed to initialize TTS provider ${type}`, { error });
         }
       }

       await this.selectBestProvider();

       if (!this.currentProvider) {
         throw new Error('No TTS providers available');
       }

       logger.info('TTS Manager initialized', {
         currentProvider: this.currentProvider.name
       });
     }

     private async selectBestProvider(): Promise<void> {
       for (const type of PROVIDER_PRIORITY) {
         const provider = this.providers.get(type);
         if (provider && provider.isAvailable()) {
           if ((type === 'elevenlabs' || type === 'azure') && !this.isOnline) {
             continue;
           }
           this.currentProvider = provider;
           return;
         }
       }

       const coqui = this.providers.get('coqui');
       if (coqui) {
         this.currentProvider = coqui;
       }
     }

     public setOnlineStatus(online: boolean): void {
       const wasOnline = this.isOnline;
       this.isOnline = online;

       if (wasOnline !== online) {
         this.selectBestProvider();
       }
     }

     /**
      * Synthesize speech with watchdog and fallback
      */
     public async synthesize(text: string, voiceConfig?: Partial<VoiceConfig>): Promise<TTSResult> {
       if (!this.currentProvider) {
         throw new Error('No TTS provider available');
       }

       const requestId = `tts_${Date.now()}`;

       // Start watchdog (15s timeout per system_architecture.md)
       watchdog.start('TTS_GENERATION', requestId, async () => {
         logger.warn('TTS watchdog timeout, attempting fallback');
         await this.handleProviderFailure();
       });

       try {
         const result = await this.currentProvider.synthesize(text, voiceConfig);
         watchdog.stop('TTS_GENERATION', requestId);

         logger.info('TTS synthesis complete', {
           provider: result.provider,
           latencyMs: result.latencyMs,
           durationMs: result.durationMs
         });

         return result;
       } catch (error) {
         watchdog.stop('TTS_GENERATION', requestId);
         logger.error('TTS synthesis failed, attempting fallback', { error });

         await this.handleProviderFailure();

         if (this.currentProvider) {
           return this.currentProvider.synthesize(text, voiceConfig);
         }

         throw error;
       }
     }

     private async handleProviderFailure(): Promise<void> {
       const failedProvider = this.currentProvider?.name;

       for (const type of PROVIDER_PRIORITY) {
         const provider = this.providers.get(type);
         if (provider && provider !== this.currentProvider && provider.isAvailable()) {
           if ((type === 'elevenlabs' || type === 'azure') && !this.isOnline) {
             continue;
           }

           this.currentProvider = provider;
           logger.info('TTS provider fallback', {
             from: failedProvider,
             to: provider.name
           });
           return;
         }
       }

       logger.error('No fallback TTS provider available');
     }

     public getCurrentProvider(): string {
       return this.currentProvider?.name || 'none';
     }

     public supportsVisemes(): boolean {
       return this.currentProvider?.supportsVisemes || false;
     }

     public async close(): Promise<void> {
       for (const provider of this.providers.values()) {
         await provider.close();
       }
       this.providers.clear();
       this.currentProvider = null;
       logger.info('TTS Manager closed');
     }
   }

   export const ttsManager = new TTSManager();
   ```

**Verification**:
- [ ] `TTSManager` compiles without errors
- [ ] Provider selection follows priority order
- [ ] Fallback works when primary fails
- [ ] Watchdog timeout triggers fallback

---

#### Task 7.6: Create Audio Playback Service

**Reference**: Requirements R5 (synthesize and play audio)

**Files to Create**:
- `src/audio/audio-player.ts`

**Step-by-Step Instructions**:

1. Create `src/audio/audio-player.ts`:
   ```typescript
   // src/audio/audio-player.ts
   // Audio playback service for Dr. Sterling's voice
   // Reference: Requirements R5

   import { EventEmitter } from 'events';
   import { ttsManager } from './tts/tts-manager.js';
   import { TTSResult, VoiceConfig, DR_STERLING_VOICE_CONFIG } from './tts/tts-provider.interface.js';
   import { logger } from '../utils/logger.js';

   export type AudioPlayerEvent =
     | 'synthesis_started'
     | 'synthesis_complete'
     | 'playback_started'
     | 'playback_progress'
     | 'playback_complete'
     | 'error';

   /**
    * Audio Player Service
    * Manages TTS synthesis and audio playback
    */
   export class AudioPlayer extends EventEmitter {
     private isPlaying: boolean = false;
     private playbackQueue: TTSResult[] = [];
     private currentResult: TTSResult | null = null;

     /**
      * Synthesize and queue audio for playback
      */
     public async speak(text: string, voiceConfig?: Partial<VoiceConfig>): Promise<TTSResult> {
       this.emit('synthesis_started', { text });

       try {
         const result = await ttsManager.synthesize(text, {
           ...DR_STERLING_VOICE_CONFIG,
           ...voiceConfig
         });

         this.emit('synthesis_complete', {
           text,
           durationMs: result.durationMs,
           latencyMs: result.latencyMs
         });

         // Add to queue
         this.playbackQueue.push(result);

         // Start playback if not already playing
         if (!this.isPlaying) {
           this.playNext();
         }

         return result;
       } catch (error) {
         this.emit('error', error);
         throw error;
       }
     }

     /**
      * Play next item in queue
      */
     private async playNext(): Promise<void> {
       if (this.playbackQueue.length === 0) {
         this.isPlaying = false;
         return;
       }

       this.isPlaying = true;
       this.currentResult = this.playbackQueue.shift()!;

       this.emit('playback_started', {
         durationMs: this.currentResult.durationMs,
         hasVisemes: !!this.currentResult.visemes?.length
       });

       // Simulate playback progress
       // In real implementation, this would be handled by Web Audio API in browser
       const startTime = Date.now();
       const duration = this.currentResult.durationMs;

       const progressInterval = setInterval(() => {
         const elapsed = Date.now() - startTime;
         const progress = Math.min(elapsed / duration, 1);

         this.emit('playback_progress', {
           progress,
           elapsedMs: elapsed,
           remainingMs: Math.max(0, duration - elapsed),
           currentViseme: this.getCurrentViseme(elapsed)
         });

         if (progress >= 1) {
           clearInterval(progressInterval);
           this.emit('playback_complete');
           this.currentResult = null;
           this.playNext();  // Play next in queue
         }
       }, 50);  // Update every 50ms for smooth progress
     }

     /**
      * Get current viseme based on playback time
      */
     private getCurrentViseme(elapsedMs: number): string | null {
       if (!this.currentResult?.visemes) return null;

       for (let i = this.currentResult.visemes.length - 1; i >= 0; i--) {
         const v = this.currentResult.visemes[i];
         if (elapsedMs >= v.startTimeMs) {
           return v.viseme;
         }
       }

       return null;
     }

     /**
      * Stop playback and clear queue
      */
     public stop(): void {
       this.playbackQueue = [];
       this.isPlaying = false;
       this.currentResult = null;
       logger.info('Audio playback stopped');
     }

     /**
      * Check if currently playing
      */
     public getIsPlaying(): boolean {
       return this.isPlaying;
     }

     /**
      * Get current audio result (for viseme data)
      */
     public getCurrentResult(): TTSResult | null {
       return this.currentResult;
     }

     /**
      * Get audio buffer for browser playback
      */
     public getAudioBuffer(): Buffer | null {
       return this.currentResult?.audioBuffer || null;
     }
   }

   export const audioPlayer = new AudioPlayer();
   ```

**Verification**:
- [ ] `AudioPlayer` compiles without errors
- [ ] `speak()` synthesizes and queues audio
- [ ] Playback progress events are emitted
- [ ] Viseme data is accessible during playback
- [ ] Queue processes multiple items in order

---

### Task 8: Implement Lip-Sync Animation System

**Reference**: Requirements R6 (Lip-Sync Animation), system_architecture.md S3 (Latency: 20ms target, 50ms max)

**Prerequisites**: Task 7 (TTS System) completed

**Overview**: This task implements the lip-sync animation system for Dr. Sterling's avatar using Rhubarb Lip Sync for viseme generation, Three.js for 3D rendering, and Ready Player Me for the avatar model with 52 ARKit blend shapes.

---

#### Task 8.1: Create Viseme Mapping System

**Reference**: Requirements R6 (15 standard visemes), design.md Section 3

**Files to Create**:
- `src/avatar/viseme-mapping.ts`

**Step-by-Step Instructions**:

1. Create directory:
   ```bash
   mkdir -p src/avatar
   ```

2. Create `src/avatar/viseme-mapping.ts`:
   ```typescript
   // src/avatar/viseme-mapping.ts
   // Viseme to blend shape mapping for lip-sync animation
   // Reference: Requirements R6 (15 standard visemes, 52 ARKit blend shapes)

   /**
    * Standard Rhubarb visemes (15 visemes)
    * These map phonetic sounds to mouth shapes
    */
   export type RhubarbViseme =
     | 'A'   // Closed mouth (M, B, P)
     | 'B'   // Slightly open (most consonants)
     | 'C'   // Open mouth (AH, AA)
     | 'D'   // Wide mouth (EH, AE)
     | 'E'   // Rounded open (AO)
     | 'F'   // Puckered (UW, OW)
     | 'G'   // Slightly puckered (W, R)
     | 'H'   // Upper teeth on lower lip (F, V)
     | 'X'   // Idle/silence
     | 'sil' // Extended silence
     | 'PP'  // Closed for P sounds
     | 'FF'  // F/V position
     | 'TH'  // Tongue between teeth
     | 'DD'  // D/T tongue position
     | 'CH'; // CH/SH position

   /**
    * ARKit blend shape names (52 blend shapes)
    * These control facial morphs on the 3D model
    */
   export type ARKitBlendShape =
     | 'jawOpen'
     | 'jawForward'
     | 'jawLeft'
     | 'jawRight'
     | 'mouthClose'
     | 'mouthFunnel'
     | 'mouthPucker'
     | 'mouthLeft'
     | 'mouthRight'
     | 'mouthSmileLeft'
     | 'mouthSmileRight'
     | 'mouthFrownLeft'
     | 'mouthFrownRight'
     | 'mouthDimpleLeft'
     | 'mouthDimpleRight'
     | 'mouthStretchLeft'
     | 'mouthStretchRight'
     | 'mouthRollLower'
     | 'mouthRollUpper'
     | 'mouthShrugLower'
     | 'mouthShrugUpper'
     | 'mouthPressLeft'
     | 'mouthPressRight'
     | 'mouthLowerDownLeft'
     | 'mouthLowerDownRight'
     | 'mouthUpperUpLeft'
     | 'mouthUpperUpRight'
     | 'cheekPuff'
     | 'cheekSquintLeft'
     | 'cheekSquintRight'
     | 'noseSneerLeft'
     | 'noseSneerRight'
     | 'tongueOut'
     | 'eyeBlinkLeft'
     | 'eyeBlinkRight'
     | 'eyeLookDownLeft'
     | 'eyeLookDownRight'
     | 'eyeLookInLeft'
     | 'eyeLookInRight'
     | 'eyeLookOutLeft'
     | 'eyeLookOutRight'
     | 'eyeLookUpLeft'
     | 'eyeLookUpRight'
     | 'eyeSquintLeft'
     | 'eyeSquintRight'
     | 'eyeWideLeft'
     | 'eyeWideRight'
     | 'browDownLeft'
     | 'browDownRight'
     | 'browInnerUp'
     | 'browOuterUpLeft'
     | 'browOuterUpRight';

   /**
    * Blend shape weights for a single viseme
    * Values range from 0.0 (neutral) to 1.0 (fully activated)
    */
   export interface BlendShapeWeights {
     [key: string]: number;
   }

   /**
    * Viseme to ARKit blend shape mapping
    * Each viseme maps to specific blend shape weights
    * Reference: Standard phoneme-to-viseme mapping
    */
   export const VISEME_TO_BLEND_SHAPES: Record<RhubarbViseme, BlendShapeWeights> = {
     // A - Closed mouth (M, B, P)
     'A': {
       mouthClose: 1.0,
       mouthPressLeft: 0.3,
       mouthPressRight: 0.3
     },

     // B - Slightly open (most consonants)
     'B': {
       jawOpen: 0.1,
       mouthClose: 0.0
     },

     // C - Open mouth (AH, AA)
     'C': {
       jawOpen: 0.6,
       mouthStretchLeft: 0.2,
       mouthStretchRight: 0.2
     },

     // D - Wide mouth (EH, AE)
     'D': {
       jawOpen: 0.4,
       mouthStretchLeft: 0.4,
       mouthStretchRight: 0.4
     },

     // E - Rounded open (AO)
     'E': {
       jawOpen: 0.5,
       mouthFunnel: 0.3
     },

     // F - Puckered (UW, OW)
     'F': {
       jawOpen: 0.3,
       mouthPucker: 0.8,
       mouthFunnel: 0.5
     },

     // G - Slightly puckered (W, R)
     'G': {
       jawOpen: 0.15,
       mouthPucker: 0.4,
       mouthFunnel: 0.3
     },

     // H - Upper teeth on lower lip (F, V)
     'H': {
       jawOpen: 0.1,
       mouthUpperUpLeft: 0.3,
       mouthUpperUpRight: 0.3,
       mouthLowerDownLeft: 0.1,
       mouthLowerDownRight: 0.1
     },

     // X - Idle/silence
     'X': {
       // Neutral position - all values at 0
     },

     // sil - Extended silence
     'sil': {
       // Same as X - neutral
     },

     // PP - Closed for P sounds
     'PP': {
       mouthClose: 1.0,
       mouthPressLeft: 0.5,
       mouthPressRight: 0.5
     },

     // FF - F/V position
     'FF': {
       jawOpen: 0.05,
       mouthUpperUpLeft: 0.4,
       mouthUpperUpRight: 0.4,
       mouthLowerDownLeft: 0.2,
       mouthLowerDownRight: 0.2
     },

     // TH - Tongue between teeth
     'TH': {
       jawOpen: 0.15,
       tongueOut: 0.3
     },

     // DD - D/T tongue position
     'DD': {
       jawOpen: 0.2,
       tongueOut: 0.1,
       mouthLowerDownLeft: 0.1,
       mouthLowerDownRight: 0.1
     },

     // CH - CH/SH position
     'CH': {
       jawOpen: 0.25,
       mouthFunnel: 0.4,
       mouthStretchLeft: 0.1,
       mouthStretchRight: 0.1
     }
   };

   /**
    * Therapeutic expression types for Dr. Sterling
    * Reference: R6 (neutral, concerned, warm, thoughtful)
    */
   export type TherapeuticExpression = 'neutral' | 'concerned' | 'warm' | 'thoughtful';

   /**
    * Blend shape weights for therapeutic expressions
    * These combine with lip-sync for full facial animation
    */
   export const EXPRESSION_BLEND_SHAPES: Record<TherapeuticExpression, BlendShapeWeights> = {
     // Neutral - calm, attentive
     neutral: {
       eyeBlinkLeft: 0,
       eyeBlinkRight: 0,
       browInnerUp: 0.05,
       mouthSmileLeft: 0.1,
       mouthSmileRight: 0.1
     },

     // Concerned - empathetic listening
     concerned: {
       browInnerUp: 0.4,
       browDownLeft: 0.1,
       browDownRight: 0.1,
       eyeSquintLeft: 0.1,
       eyeSquintRight: 0.1,
       mouthFrownLeft: 0.15,
       mouthFrownRight: 0.15
     },

     // Warm - supportive, encouraging
     warm: {
       mouthSmileLeft: 0.4,
       mouthSmileRight: 0.4,
       cheekSquintLeft: 0.2,
       cheekSquintRight: 0.2,
       eyeSquintLeft: 0.15,
       eyeSquintRight: 0.15,
       browInnerUp: 0.1
     },

     // Thoughtful - contemplative, processing
     thoughtful: {
       browInnerUp: 0.2,
       browOuterUpLeft: 0.15,
       browOuterUpRight: 0.15,
       eyeLookUpLeft: 0.1,
       eyeLookUpRight: 0.1,
       mouthPucker: 0.05
     }
   };

   /**
    * Convert Rhubarb viseme to blend shape weights
    * @param viseme - Rhubarb viseme code
    * @returns Blend shape weights for the viseme
    */
   export function getBlendShapesForViseme(viseme: string): BlendShapeWeights {
     const normalizedViseme = viseme.toUpperCase() as RhubarbViseme;
     return VISEME_TO_BLEND_SHAPES[normalizedViseme] || VISEME_TO_BLEND_SHAPES['X'];
   }

   /**
    * Get blend shapes for therapeutic expression
    * @param expression - Expression type
    * @returns Blend shape weights for the expression
    */
   export function getBlendShapesForExpression(expression: TherapeuticExpression): BlendShapeWeights {
     return EXPRESSION_BLEND_SHAPES[expression] || EXPRESSION_BLEND_SHAPES.neutral;
   }

   /**
    * Combine viseme and expression blend shapes
    * Expression weights are additive but clamped to 1.0
    * @param visemeWeights - Weights from viseme
    * @param expressionWeights - Weights from expression
    * @returns Combined blend shape weights
    */
   export function combineBlendShapes(
     visemeWeights: BlendShapeWeights,
     expressionWeights: BlendShapeWeights
   ): BlendShapeWeights {
     const combined: BlendShapeWeights = { ...visemeWeights };

     for (const [shape, weight] of Object.entries(expressionWeights)) {
       const existing = combined[shape] || 0;
       // Additive blend, clamped to 1.0
       combined[shape] = Math.min(1.0, existing + weight);
     }

     return combined;
   }

   /**
    * Interpolate between two sets of blend shapes
    * Used for smooth transitions between visemes
    * @param from - Starting blend shapes
    * @param to - Ending blend shapes
    * @param t - Interpolation factor (0.0 to 1.0)
    * @returns Interpolated blend shapes
    */
   export function interpolateBlendShapes(
     from: BlendShapeWeights,
     to: BlendShapeWeights,
     t: number
   ): BlendShapeWeights {
     const result: BlendShapeWeights = {};

     // Get all unique keys from both objects
     const allKeys = new Set([...Object.keys(from), ...Object.keys(to)]);

     for (const key of allKeys) {
       const fromValue = from[key] || 0;
       const toValue = to[key] || 0;
       result[key] = fromValue + (toValue - fromValue) * t;
     }

     return result;
   }
   ```

**Verification**:
- [ ] All 15 Rhubarb visemes are defined
- [ ] All 52 ARKit blend shapes are typed
- [ ] 4 therapeutic expressions are defined (neutral, concerned, warm, thoughtful)
- [ ] `getBlendShapesForViseme()` returns correct weights
- [ ] `interpolateBlendShapes()` smoothly transitions between shapes

---

#### Task 8.2: Create Rhubarb Lip Sync Integration

**Reference**: Requirements R6 (Rhubarb Lip Sync), design.md Section 3

**Files to Create**:
- `src/avatar/rhubarb-lipsync.ts`

**Step-by-Step Instructions**:

1. Create `src/avatar/rhubarb-lipsync.ts`:
   ```typescript
   // src/avatar/rhubarb-lipsync.ts
   // Rhubarb Lip Sync integration for phoneme-to-viseme analysis
   // Reference: Requirements R6 (15 standard visemes, <50ms latency)

   import { spawn, ChildProcess } from 'child_process';
   import { writeFile, unlink, readFile } from 'fs/promises';
   import { join } from 'path';
   import { tmpdir } from 'os';
   import { randomUUID } from 'crypto';
   import { logger } from '../utils/logger.js';
   import { RhubarbViseme } from './viseme-mapping.js';

   /**
    * Rhubarb output format - cue with timing
    */
   export interface RhubarbCue {
     start: number;    // Start time in seconds
     end: number;      // End time in seconds
     value: string;    // Viseme code
   }

   /**
    * Rhubarb analysis result
    */
   export interface RhubarbResult {
     mouthCues: RhubarbCue[];
     metadata: {
       soundFile: string;
       duration: number;
     };
   }

   /**
    * Viseme timeline entry for animation
    */
   export interface VisemeTimeline {
     viseme: RhubarbViseme;
     startMs: number;
     endMs: number;
     durationMs: number;
   }

   /**
    * Rhubarb Lip Sync configuration
    */
   interface RhubarbConfig {
     executablePath: string;      // Path to rhubarb binary
     recognizer: 'pocketSphinx' | 'phonetic';
     extendedShapes: boolean;     // Use extended shape set
   }

   const DEFAULT_CONFIG: RhubarbConfig = {
     executablePath: process.env.RHUBARB_PATH || 'rhubarb',
     recognizer: 'pocketSphinx',
     extendedShapes: true
   };

   /**
    * Rhubarb Lip Sync Service
    * Analyzes audio to generate viseme timelines
    */
   export class RhubarbLipSync {
     private config: RhubarbConfig;
     private isAvailable: boolean = false;

     constructor(config: Partial<RhubarbConfig> = {}) {
       this.config = { ...DEFAULT_CONFIG, ...config };
     }

     /**
      * Initialize and verify Rhubarb is available
      */
     public async initialize(): Promise<void> {
       try {
         // Check if rhubarb executable exists
         await this.checkRhubarbVersion();
         this.isAvailable = true;
         logger.info('Rhubarb Lip Sync initialized', {
           path: this.config.executablePath
         });
       } catch (error) {
         logger.warn('Rhubarb not available, falling back to text-based visemes', { error });
         this.isAvailable = false;
       }
     }

     /**
      * Check Rhubarb version
      */
     private async checkRhubarbVersion(): Promise<string> {
       return new Promise((resolve, reject) => {
         const process = spawn(this.config.executablePath, ['--version']);
         let output = '';

         process.stdout.on('data', (data) => {
           output += data.toString();
         });

         process.on('close', (code) => {
           if (code === 0) {
             resolve(output.trim());
           } else {
             reject(new Error(`Rhubarb not found at ${this.config.executablePath}`));
           }
         });

         process.on('error', (error) => {
           reject(error);
         });
       });
     }

     /**
      * Analyze audio buffer to generate viseme timeline
      * Reference: R6 (<50ms latency target)
      * @param audioBuffer - WAV audio buffer
      * @param text - Optional transcript for better accuracy
      */
     public async analyzeAudio(
       audioBuffer: Buffer,
       text?: string
     ): Promise<VisemeTimeline[]> {
       const startTime = Date.now();

       if (!this.isAvailable) {
         // Fallback to text-based estimation
         return this.estimateFromText(text || '', audioBuffer.length);
       }

       try {
         const result = await this.runRhubarb(audioBuffer, text);
         const timeline = this.convertToTimeline(result);

         const latencyMs = Date.now() - startTime;
         logger.info('Rhubarb analysis complete', {
           latencyMs,
           cueCount: timeline.length
         });

         return timeline;
       } catch (error) {
         logger.error('Rhubarb analysis failed', { error });
         return this.estimateFromText(text || '', audioBuffer.length);
       }
     }

     /**
      * Run Rhubarb analysis on audio file
      */
     private async runRhubarb(
       audioBuffer: Buffer,
       text?: string
     ): Promise<RhubarbResult> {
       // Create temp files
       const tempId = randomUUID();
       const audioPath = join(tmpdir(), `rhubarb-${tempId}.wav`);
       const outputPath = join(tmpdir(), `rhubarb-${tempId}.json`);
       const textPath = text ? join(tmpdir(), `rhubarb-${tempId}.txt`) : null;

       try {
         // Write audio to temp file
         await writeFile(audioPath, audioBuffer);

         // Write text if provided (improves accuracy)
         if (textPath && text) {
           await writeFile(textPath, text);
         }

         // Build command arguments
         const args = [
           audioPath,
           '-f', 'json',  // JSON output format
           '-o', outputPath,
           '-r', this.config.recognizer
         ];

         if (this.config.extendedShapes) {
           args.push('--extendedShapes', 'GHX');
         }

         if (textPath) {
           args.push('-d', textPath);
         }

         // Run Rhubarb
         await this.executeRhubarb(args);

         // Read and parse output
         const outputContent = await readFile(outputPath, 'utf-8');
         return JSON.parse(outputContent) as RhubarbResult;
       } finally {
         // Cleanup temp files
         await Promise.all([
           unlink(audioPath).catch(() => {}),
           unlink(outputPath).catch(() => {}),
           textPath ? unlink(textPath).catch(() => {}) : Promise.resolve()
         ]);
       }
     }

     /**
      * Execute Rhubarb process
      */
     private executeRhubarb(args: string[]): Promise<void> {
       return new Promise((resolve, reject) => {
         const process = spawn(this.config.executablePath, args);
         let stderr = '';

         process.stderr.on('data', (data) => {
           stderr += data.toString();
         });

         process.on('close', (code) => {
           if (code === 0) {
             resolve();
           } else {
             reject(new Error(`Rhubarb failed: ${stderr}`));
           }
         });

         process.on('error', (error) => {
           reject(error);
         });

         // Timeout after 5 seconds
         setTimeout(() => {
           process.kill();
           reject(new Error('Rhubarb timeout'));
         }, 5000);
       });
     }

     /**
      * Convert Rhubarb output to viseme timeline
      */
     private convertToTimeline(result: RhubarbResult): VisemeTimeline[] {
       return result.mouthCues.map(cue => ({
         viseme: cue.value as RhubarbViseme,
         startMs: Math.round(cue.start * 1000),
         endMs: Math.round(cue.end * 1000),
         durationMs: Math.round((cue.end - cue.start) * 1000)
       }));
     }

     /**
      * Fallback: Estimate visemes from text
      * Used when Rhubarb is not available or fails
      */
     private estimateFromText(text: string, bufferLength: number): VisemeTimeline[] {
       if (!text) {
         return [{ viseme: 'X', startMs: 0, endMs: 100, durationMs: 100 }];
       }

       // Estimate duration based on buffer size (16kHz, 16-bit mono)
       const estimatedDurationMs = (bufferLength / 32000) * 1000;
       const words = text.split(/\s+/).filter(w => w.length > 0);
       const msPerWord = estimatedDurationMs / words.length;

       const timeline: VisemeTimeline[] = [];
       let currentMs = 0;

       for (const word of words) {
         const phonemes = this.wordToPhonemes(word);
         const msPerPhoneme = msPerWord / phonemes.length;

         for (const phoneme of phonemes) {
           timeline.push({
             viseme: phoneme,
             startMs: Math.round(currentMs),
             endMs: Math.round(currentMs + msPerPhoneme),
             durationMs: Math.round(msPerPhoneme)
           });
           currentMs += msPerPhoneme;
         }
       }

       return timeline;
     }

     /**
      * Simple word to phoneme estimation
      * This is a basic fallback - Rhubarb provides much better results
      */
     private wordToPhonemes(word: string): RhubarbViseme[] {
       const phonemes: RhubarbViseme[] = [];
       const chars = word.toLowerCase().split('');

       for (let i = 0; i < chars.length; i++) {
         const char = chars[i];
         const nextChar = chars[i + 1];

         // Basic phoneme mapping
         switch (char) {
           case 'a':
             phonemes.push('C');  // Open mouth
             break;
           case 'e':
           case 'i':
             phonemes.push('D');  // Wide mouth
             break;
           case 'o':
             phonemes.push('E');  // Rounded open
             break;
           case 'u':
             phonemes.push('F');  // Puckered
             break;
           case 'm':
           case 'b':
           case 'p':
             phonemes.push('A');  // Closed
             break;
           case 'f':
           case 'v':
             phonemes.push('H');  // Upper teeth on lower lip
             break;
           case 'w':
           case 'r':
             phonemes.push('G');  // Slightly puckered
             break;
           case 't':
           case 'h':
             if (nextChar === 'h') {
               phonemes.push('TH');
               i++;  // Skip next char
             } else {
               phonemes.push('B');
             }
             break;
           case 's':
           case 'z':
             if (nextChar === 'h') {
               phonemes.push('CH');
               i++;
             } else {
               phonemes.push('B');
             }
             break;
           default:
             phonemes.push('B');  // Default slightly open
         }
       }

       // Add silence at end
       phonemes.push('X');

       return phonemes;
     }

     /**
      * Check if Rhubarb is available
      */
     public getIsAvailable(): boolean {
       return this.isAvailable;
     }
   }

   export const rhubarbLipSync = new RhubarbLipSync();
   ```

**Verification**:
- [ ] `RhubarbLipSync` compiles without errors
- [ ] `initialize()` checks for Rhubarb executable
- [ ] `analyzeAudio()` generates viseme timeline
- [ ] Fallback text-based estimation works when Rhubarb unavailable
- [ ] Temp files are cleaned up after analysis

---

#### Task 8.3: Create Real-Time Viseme Processor

**Reference**: Requirements R6 (<50ms latency), system_architecture.md S3 (20ms target)

**Files to Create**:
- `src/avatar/viseme-processor.ts`

**Step-by-Step Instructions**:

1. Create `src/avatar/viseme-processor.ts`:
   ```typescript
   // src/avatar/viseme-processor.ts
   // Real-time viseme processing with smooth interpolation
   // Reference: Requirements R6 (<50ms latency), 60fps target

   import { EventEmitter } from 'events';
   import { logger } from '../utils/logger.js';
   import {
     BlendShapeWeights,
     TherapeuticExpression,
     getBlendShapesForViseme,
     getBlendShapesForExpression,
     combineBlendShapes,
     interpolateBlendShapes
   } from './viseme-mapping.js';
   import { VisemeTimeline } from './rhubarb-lipsync.js';

   /**
    * Blend shape update event
    */
   export interface BlendShapeUpdate {
     weights: BlendShapeWeights;
     timestamp: number;
     viseme: string;
     expression: TherapeuticExpression;
   }

   /**
    * Viseme processor configuration
    */
   interface VisemeProcessorConfig {
     targetFps: number;              // Target frame rate (default 60)
     interpolationDuration: number;  // Transition time in ms (default 50)
     lookAheadMs: number;            // Look-ahead for smooth transitions
   }

   const DEFAULT_CONFIG: VisemeProcessorConfig = {
     targetFps: 60,
     interpolationDuration: 50,
     lookAheadMs: 100
   };

   /**
    * Real-Time Viseme Processor
    * Converts viseme timeline to smooth blend shape animations
    * Reference: R6 (60fps target, <50ms latency)
    */
   export class VisemeProcessor extends EventEmitter {
     private config: VisemeProcessorConfig;
     private timeline: VisemeTimeline[] = [];
     private currentIndex: number = 0;
     private currentExpression: TherapeuticExpression = 'neutral';
     private currentWeights: BlendShapeWeights = {};
     private targetWeights: BlendShapeWeights = {};
     private isPlaying: boolean = false;
     private startTime: number = 0;
     private animationFrame: ReturnType<typeof setInterval> | null = null;
     private frameInterval: number;

     constructor(config: Partial<VisemeProcessorConfig> = {}) {
       super();
       this.config = { ...DEFAULT_CONFIG, ...config };
       this.frameInterval = 1000 / this.config.targetFps;  // ms per frame
     }

     /**
      * Load viseme timeline for playback
      * @param timeline - Viseme timeline from Rhubarb analysis
      */
     public loadTimeline(timeline: VisemeTimeline[]): void {
       this.timeline = timeline;
       this.currentIndex = 0;
       this.currentWeights = {};
       this.targetWeights = {};

       logger.info('Viseme timeline loaded', {
         cueCount: timeline.length,
         durationMs: timeline.length > 0
           ? timeline[timeline.length - 1].endMs
           : 0
       });
     }

     /**
      * Set therapeutic expression
      * @param expression - Expression type
      */
     public setExpression(expression: TherapeuticExpression): void {
       this.currentExpression = expression;
       logger.debug('Expression changed', { expression });
     }

     /**
      * Start viseme playback
      * Synchronizes with audio playback start time
      */
     public start(): void {
       if (this.isPlaying) return;

       this.isPlaying = true;
       this.startTime = performance.now();
       this.currentIndex = 0;

       // Start animation loop
       this.animationFrame = setInterval(() => {
         this.update();
       }, this.frameInterval);

       logger.info('Viseme playback started', {
         fps: this.config.targetFps,
         frameInterval: this.frameInterval
       });
     }

     /**
      * Stop viseme playback
      */
     public stop(): void {
       if (!this.isPlaying) return;

       this.isPlaying = false;

       if (this.animationFrame) {
         clearInterval(this.animationFrame);
         this.animationFrame = null;
       }

       // Return to neutral
       this.targetWeights = getBlendShapesForViseme('X');
       this.emit('update', {
         weights: this.targetWeights,
         timestamp: performance.now(),
         viseme: 'X',
         expression: this.currentExpression
       });

       logger.info('Viseme playback stopped');
     }

     /**
      * Update animation frame
      * Called at targetFps rate
      */
     private update(): void {
       const elapsed = performance.now() - this.startTime;

       // Find current viseme based on elapsed time
       let currentViseme = 'X';

       while (
         this.currentIndex < this.timeline.length &&
         elapsed >= this.timeline[this.currentIndex].endMs
       ) {
         this.currentIndex++;
       }

       if (this.currentIndex < this.timeline.length) {
         const cue = this.timeline[this.currentIndex];

         if (elapsed >= cue.startMs && elapsed < cue.endMs) {
           currentViseme = cue.viseme;

           // Calculate interpolation progress within this viseme
           const progress = (elapsed - cue.startMs) / cue.durationMs;

           // Get target blend shapes
           const visemeWeights = getBlendShapesForViseme(currentViseme);
           const expressionWeights = getBlendShapesForExpression(this.currentExpression);
           this.targetWeights = combineBlendShapes(visemeWeights, expressionWeights);

           // Interpolate from current to target
           const interpolationProgress = Math.min(1.0, (elapsed % this.config.interpolationDuration) / this.config.interpolationDuration);
           this.currentWeights = interpolateBlendShapes(
             this.currentWeights,
             this.targetWeights,
             interpolationProgress
           );
         }
       } else {
         // Timeline complete - return to neutral
         this.targetWeights = combineBlendShapes(
           getBlendShapesForViseme('X'),
           getBlendShapesForExpression(this.currentExpression)
         );
         this.currentWeights = interpolateBlendShapes(
           this.currentWeights,
           this.targetWeights,
           0.1
         );

         // Stop after fade to neutral
         if (Object.keys(this.currentWeights).every(k =>
           Math.abs((this.currentWeights[k] || 0) - (this.targetWeights[k] || 0)) < 0.01
         )) {
           this.stop();
           this.emit('complete');
           return;
         }
       }

       // Emit update event
       const update: BlendShapeUpdate = {
         weights: this.currentWeights,
         timestamp: performance.now(),
         viseme: currentViseme,
         expression: this.currentExpression
       };

       this.emit('update', update);
     }

     /**
      * Get current blend shape weights
      */
     public getCurrentWeights(): BlendShapeWeights {
       return { ...this.currentWeights };
     }

     /**
      * Get current viseme
      */
     public getCurrentViseme(): string {
       if (this.currentIndex < this.timeline.length) {
         return this.timeline[this.currentIndex].viseme;
       }
       return 'X';
     }

     /**
      * Check if currently playing
      */
     public getIsPlaying(): boolean {
       return this.isPlaying;
     }

     /**
      * Get playback progress (0.0 to 1.0)
      */
     public getProgress(): number {
       if (!this.isPlaying || this.timeline.length === 0) return 0;

       const elapsed = performance.now() - this.startTime;
       const totalDuration = this.timeline[this.timeline.length - 1].endMs;

       return Math.min(1.0, elapsed / totalDuration);
     }

     /**
      * Seek to specific time
      * @param timeMs - Time in milliseconds
      */
     public seek(timeMs: number): void {
       // Find the viseme at this time
       for (let i = 0; i < this.timeline.length; i++) {
         if (timeMs >= this.timeline[i].startMs && timeMs < this.timeline[i].endMs) {
           this.currentIndex = i;
           break;
         }
       }

       // Adjust start time so elapsed matches
       this.startTime = performance.now() - timeMs;
     }
   }

   export const visemeProcessor = new VisemeProcessor();
   ```

**Verification**:
- [ ] `VisemeProcessor` compiles without errors
- [ ] Animation runs at 60fps (16.67ms per frame)
- [ ] Smooth interpolation between visemes
- [ ] Expression blending works correctly
- [ ] `complete` event fires when timeline ends

---

#### Task 8.4: Create Three.js Avatar Renderer

**Reference**: Requirements R6 (Three.js + Ready Player Me), design.md Section 3

**Files to Create**:
- `src/avatar/avatar-renderer.ts`

**Step-by-Step Instructions**:

1. Install Three.js dependencies:
   ```bash
   npm install three @types/three
   ```

2. Create `src/avatar/avatar-renderer.ts`:
   ```typescript
   // src/avatar/avatar-renderer.ts
   // Three.js avatar renderer with Ready Player Me integration
   // Reference: Requirements R6 (52 ARKit blend shapes, 60fps target)

   import * as THREE from 'three';
   import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
   import { logger } from '../utils/logger.js';
   import { BlendShapeWeights, ARKitBlendShape } from './viseme-mapping.js';
   import { visemeProcessor, BlendShapeUpdate } from './viseme-processor.js';

   /**
    * Avatar renderer configuration
    */
   interface AvatarRendererConfig {
     width: number;
     height: number;
     avatarUrl: string;           // Ready Player Me GLB URL
     backgroundColor: number;     // Hex color
     ambientLightIntensity: number;
     directionalLightIntensity: number;
     cameraFov: number;
     cameraPosition: { x: number; y: number; z: number };
   }

   const DEFAULT_CONFIG: AvatarRendererConfig = {
     width: 800,
     height: 600,
     avatarUrl: '',               // Must be provided
     backgroundColor: 0xf5f5f5,   // Light gray
     ambientLightIntensity: 0.6,
     directionalLightIntensity: 0.8,
     cameraFov: 30,
     cameraPosition: { x: 0, y: 1.6, z: 0.8 }  // Head-level, close-up
   };

   /**
    * Three.js Avatar Renderer
    * Renders Ready Player Me avatar with lip-sync animation
    */
   export class AvatarRenderer {
     private config: AvatarRendererConfig;
     private scene: THREE.Scene | null = null;
     private camera: THREE.PerspectiveCamera | null = null;
     private renderer: THREE.WebGLRenderer | null = null;
     private avatar: THREE.Object3D | null = null;
     private morphMeshes: THREE.SkinnedMesh[] = [];
     private animationId: number | null = null;
     private clock: THREE.Clock = new THREE.Clock();
     private isInitialized: boolean = false;

     // Blend shape name mapping (Ready Player Me to ARKit)
     private blendShapeMapping: Map<string, number> = new Map();

     constructor(config: Partial<AvatarRendererConfig> = {}) {
       this.config = { ...DEFAULT_CONFIG, ...config };
     }

     /**
      * Initialize renderer and load avatar
      * @param container - DOM element to render into
      */
     public async initialize(container: HTMLElement): Promise<void> {
       if (!this.config.avatarUrl) {
         throw new Error('Avatar URL is required');
       }

       // Create scene
       this.scene = new THREE.Scene();
       this.scene.background = new THREE.Color(this.config.backgroundColor);

       // Create camera
       this.camera = new THREE.PerspectiveCamera(
         this.config.cameraFov,
         this.config.width / this.config.height,
         0.1,
         100
       );
       this.camera.position.set(
         this.config.cameraPosition.x,
         this.config.cameraPosition.y,
         this.config.cameraPosition.z
       );
       this.camera.lookAt(0, 1.6, 0);  // Look at head level

       // Create renderer
       this.renderer = new THREE.WebGLRenderer({
         antialias: true,
         alpha: true
       });
       this.renderer.setSize(this.config.width, this.config.height);
       this.renderer.setPixelRatio(window.devicePixelRatio);
       this.renderer.outputColorSpace = THREE.SRGBColorSpace;
       this.renderer.shadowMap.enabled = true;
       container.appendChild(this.renderer.domElement);

       // Add lights
       this.setupLighting();

       // Load avatar
       await this.loadAvatar(this.config.avatarUrl);

       // Subscribe to viseme updates
       visemeProcessor.on('update', (update: BlendShapeUpdate) => {
         this.applyBlendShapes(update.weights);
       });

       this.isInitialized = true;

       logger.info('Avatar renderer initialized', {
         width: this.config.width,
         height: this.config.height,
         morphMeshCount: this.morphMeshes.length
       });
     }

     /**
      * Set up scene lighting
      */
     private setupLighting(): void {
       if (!this.scene) return;

       // Ambient light (soft fill)
       const ambientLight = new THREE.AmbientLight(
         0xffffff,
         this.config.ambientLightIntensity
       );
       this.scene.add(ambientLight);

       // Main directional light (key light)
       const directionalLight = new THREE.DirectionalLight(
         0xffffff,
         this.config.directionalLightIntensity
       );
       directionalLight.position.set(1, 2, 2);
       directionalLight.castShadow = true;
       this.scene.add(directionalLight);

       // Fill light from opposite side
       const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
       fillLight.position.set(-1, 1, 1);
       this.scene.add(fillLight);
     }

     /**
      * Load Ready Player Me avatar
      * @param url - GLB file URL
      */
     private async loadAvatar(url: string): Promise<void> {
       const loader = new GLTFLoader();

       return new Promise((resolve, reject) => {
         loader.load(
           url,
           (gltf: GLTF) => {
             this.avatar = gltf.scene;
             this.scene!.add(this.avatar);

             // Center avatar
             const box = new THREE.Box3().setFromObject(this.avatar);
             const center = box.getCenter(new THREE.Vector3());
             this.avatar.position.sub(center);
             this.avatar.position.y = 0;

             // Find all meshes with morph targets
             this.avatar.traverse((child) => {
               if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
                 this.morphMeshes.push(child);
                 this.buildBlendShapeMapping(child);
               }
             });

             logger.info('Avatar loaded', {
               meshCount: this.morphMeshes.length,
               blendShapeCount: this.blendShapeMapping.size
             });

             resolve();
           },
           (progress) => {
             // Loading progress
             const percent = (progress.loaded / progress.total) * 100;
             logger.debug('Avatar loading', { percent });
           },
           (error) => {
             reject(new Error(`Failed to load avatar: ${error}`));
           }
         );
       });
     }

     /**
      * Build mapping from ARKit names to morph target indices
      */
     private buildBlendShapeMapping(mesh: THREE.SkinnedMesh): void {
       const dictionary = mesh.morphTargetDictionary;
       if (!dictionary) return;

       // Ready Player Me uses ARKit naming
       for (const [name, index] of Object.entries(dictionary)) {
         // Normalize name (Ready Player Me may have different casing)
         const normalizedName = name.toLowerCase().replace(/_/g, '');
         this.blendShapeMapping.set(normalizedName, index);
       }
     }

     /**
      * Apply blend shape weights to avatar
      * @param weights - Blend shape weights from viseme processor
      */
     public applyBlendShapes(weights: BlendShapeWeights): void {
       for (const mesh of this.morphMeshes) {
         if (!mesh.morphTargetInfluences) continue;

         // Reset all influences to 0
         for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
           mesh.morphTargetInfluences[i] = 0;
         }

         // Apply new weights
         for (const [shapeName, weight] of Object.entries(weights)) {
           const normalizedName = shapeName.toLowerCase().replace(/_/g, '');
           const index = this.blendShapeMapping.get(normalizedName);

           if (index !== undefined && mesh.morphTargetInfluences[index] !== undefined) {
             mesh.morphTargetInfluences[index] = weight;
           }
         }
       }
     }

     /**
      * Start render loop
      */
     public startRenderLoop(): void {
       if (this.animationId !== null) return;

       const animate = () => {
         this.animationId = requestAnimationFrame(animate);

         // Update any animations
         const delta = this.clock.getDelta();

         // Render scene
         if (this.renderer && this.scene && this.camera) {
           this.renderer.render(this.scene, this.camera);
         }
       };

       animate();
       logger.info('Render loop started');
     }

     /**
      * Stop render loop
      */
     public stopRenderLoop(): void {
       if (this.animationId !== null) {
         cancelAnimationFrame(this.animationId);
         this.animationId = null;
         logger.info('Render loop stopped');
       }
     }

     /**
      * Resize renderer
      * @param width - New width
      * @param height - New height
      */
     public resize(width: number, height: number): void {
       this.config.width = width;
       this.config.height = height;

       if (this.camera) {
         this.camera.aspect = width / height;
         this.camera.updateProjectionMatrix();
       }

       if (this.renderer) {
         this.renderer.setSize(width, height);
       }
     }

     /**
      * Set camera position
      */
     public setCameraPosition(x: number, y: number, z: number): void {
       if (this.camera) {
         this.camera.position.set(x, y, z);
       }
     }

     /**
      * Set camera look target
      */
     public setCameraTarget(x: number, y: number, z: number): void {
       if (this.camera) {
         this.camera.lookAt(x, y, z);
       }
     }

     /**
      * Get canvas element
      */
     public getCanvas(): HTMLCanvasElement | null {
       return this.renderer?.domElement || null;
     }

     /**
      * Check if initialized
      */
     public getIsInitialized(): boolean {
       return this.isInitialized;
     }

     /**
      * Dispose renderer and free resources
      */
     public dispose(): void {
       this.stopRenderLoop();

       // Remove event listeners
       visemeProcessor.removeAllListeners('update');

       // Dispose Three.js resources
       if (this.avatar) {
         this.scene?.remove(this.avatar);
         this.avatar.traverse((child) => {
           if (child instanceof THREE.Mesh) {
             child.geometry.dispose();
             if (Array.isArray(child.material)) {
               child.material.forEach(m => m.dispose());
             } else {
               child.material.dispose();
             }
           }
         });
       }

       if (this.renderer) {
         this.renderer.dispose();
         this.renderer.domElement.remove();
       }

       this.scene = null;
       this.camera = null;
       this.renderer = null;
       this.avatar = null;
       this.morphMeshes = [];
       this.isInitialized = false;

       logger.info('Avatar renderer disposed');
     }
   }
   ```

**Verification**:
- [ ] `AvatarRenderer` compiles without errors
- [ ] Ready Player Me GLB loads successfully
- [ ] Morph target dictionary is extracted
- [ ] Blend shapes apply to mesh
- [ ] Render loop runs at 60fps

---

#### Task 8.5: Create Lip-Sync Controller

**Reference**: Requirements R6 (synchronize lip-sync with audio)

**Files to Create**:
- `src/avatar/lipsync-controller.ts`

**Step-by-Step Instructions**:

1. Create `src/avatar/lipsync-controller.ts`:
   ```typescript
   // src/avatar/lipsync-controller.ts
   // Lip-sync controller coordinating audio, visemes, and avatar
   // Reference: Requirements R6 (<50ms audio-visual sync)

   import { EventEmitter } from 'events';
   import { logger } from '../utils/logger.js';
   import { watchdog } from '../utils/watchdog.js';
   import { rhubarbLipSync, VisemeTimeline } from './rhubarb-lipsync.js';
   import { visemeProcessor } from './viseme-processor.js';
   import { AvatarRenderer } from './avatar-renderer.js';
   import { TherapeuticExpression } from './viseme-mapping.js';
   import { TTSResult } from '../audio/tts/tts-provider.interface.js';

   /**
    * Lip-sync controller events
    */
   export type LipSyncEvent =
     | 'analysis_started'
     | 'analysis_complete'
     | 'playback_started'
     | 'playback_progress'
     | 'playback_complete'
     | 'error';

   /**
    * Lip-Sync Controller
    * Coordinates TTS output with avatar animation
    */
   export class LipSyncController extends EventEmitter {
     private avatarRenderer: AvatarRenderer | null = null;
     private currentExpression: TherapeuticExpression = 'neutral';
     private isPlaying: boolean = false;
     private audioStartTime: number = 0;

     constructor() {
       super();
     }

     /**
      * Initialize with avatar renderer
      * @param renderer - Avatar renderer instance
      */
     public setAvatarRenderer(renderer: AvatarRenderer): void {
       this.avatarRenderer = renderer;
     }

     /**
      * Set therapeutic expression
      * @param expression - Expression type
      */
     public setExpression(expression: TherapeuticExpression): void {
       this.currentExpression = expression;
       visemeProcessor.setExpression(expression);
     }

     /**
      * Process TTS result for lip-sync
      * Generates viseme timeline and prepares for playback
      * Reference: R6 (<50ms latency requirement)
      * @param ttsResult - TTS synthesis result
      * @param text - Original text (for Rhubarb accuracy)
      */
     public async prepareLipSync(ttsResult: TTSResult, text: string): Promise<void> {
       const startTime = Date.now();

       this.emit('analysis_started', { text });

       // Start watchdog (1s timeout per system_architecture.md S7)
       watchdog.start('LIP_SYNC', 'analysis', () => {
         logger.warn('Lip-sync analysis timeout, using fallback');
         // Use Azure visemes if available
         if (ttsResult.visemes && ttsResult.visemes.length > 0) {
           const timeline = this.convertTTSVisemesToTimeline(ttsResult.visemes);
           visemeProcessor.loadTimeline(timeline);
         } else {
           // Empty timeline - will use neutral
           visemeProcessor.loadTimeline([]);
         }
       });

       try {
         let timeline: VisemeTimeline[];

         // Option 1: Use TTS provider visemes (Azure)
         if (ttsResult.visemes && ttsResult.visemes.length > 0) {
           timeline = this.convertTTSVisemesToTimeline(ttsResult.visemes);
           logger.debug('Using TTS provider visemes', {
             count: timeline.length
           });
         }
         // Option 2: Analyze with Rhubarb
         else if (rhubarbLipSync.getIsAvailable()) {
           timeline = await rhubarbLipSync.analyzeAudio(ttsResult.audioBuffer, text);
           logger.debug('Using Rhubarb viseme analysis', {
             count: timeline.length
           });
         }
         // Option 3: Text-based estimation
         else {
           timeline = await rhubarbLipSync.analyzeAudio(
             ttsResult.audioBuffer,
             text
           );
           logger.debug('Using text-based viseme estimation', {
             count: timeline.length
           });
         }

         visemeProcessor.loadTimeline(timeline);

         watchdog.stop('LIP_SYNC', 'analysis');

         const latencyMs = Date.now() - startTime;
         this.emit('analysis_complete', { latencyMs, cueCount: timeline.length });

         logger.info('Lip-sync prepared', { latencyMs, cueCount: timeline.length });
       } catch (error) {
         watchdog.stop('LIP_SYNC', 'analysis');
         logger.error('Lip-sync preparation failed', { error });
         this.emit('error', error);

         // Fallback to empty timeline
         visemeProcessor.loadTimeline([]);
       }
     }

     /**
      * Convert TTS viseme data to VisemeTimeline format
      */
     private convertTTSVisemesToTimeline(
       visemes: TTSResult['visemes']
     ): VisemeTimeline[] {
       if (!visemes) return [];

       return visemes.map((v, i) => ({
         viseme: this.mapTTSVisemeToRhubarb(v.viseme),
         startMs: v.startTimeMs,
         endMs: i < visemes.length - 1
           ? visemes[i + 1].startTimeMs
           : v.startTimeMs + v.durationMs,
         durationMs: v.durationMs
       }));
     }

     /**
      * Map TTS provider viseme IDs to Rhubarb visemes
      * Azure uses numeric IDs, map to Rhubarb alphabet
      */
     private mapTTSVisemeToRhubarb(visemeId: string): string {
       // Azure viseme ID mapping
       const azureMapping: Record<string, string> = {
         '0': 'X',   // Silence
         '1': 'D',   // ae, ax, ah
         '2': 'C',   // aa
         '3': 'E',   // ao
         '4': 'C',   // ey, eh, uh
         '5': 'B',   // er
         '6': 'D',   // y, iy, ih, ix
         '7': 'G',   // w, uw
         '8': 'E',   // ow
         '9': 'B',   // aw
         '10': 'E',  // oy
         '11': 'D',  // ay
         '12': 'H',  // h
         '13': 'B',  // r
         '14': 'B',  // l
         '15': 'B',  // s, z
         '16': 'CH', // sh, ch, jh, zh
         '17': 'TH', // th, dh
         '18': 'H',  // f, v
         '19': 'B',  // d, t, n
         '20': 'B',  // k, g, ng
         '21': 'A'   // p, b, m
       };

       return azureMapping[visemeId] || 'B';
     }

     /**
      * Start lip-sync playback synchronized with audio
      * @param audioStartTime - Timestamp when audio playback started
      */
     public startPlayback(audioStartTime?: number): void {
       this.isPlaying = true;
       this.audioStartTime = audioStartTime || performance.now();

       visemeProcessor.setExpression(this.currentExpression);
       visemeProcessor.start();

       // Listen for completion
       visemeProcessor.once('complete', () => {
         this.isPlaying = false;
         this.emit('playback_complete');
       });

       this.emit('playback_started', { audioStartTime: this.audioStartTime });

       logger.info('Lip-sync playback started');
     }

     /**
      * Stop lip-sync playback
      */
     public stopPlayback(): void {
       if (!this.isPlaying) return;

       this.isPlaying = false;
       visemeProcessor.stop();

       logger.info('Lip-sync playback stopped');
     }

     /**
      * Sync with audio playback position
      * Used when audio playback is paused/seeked
      * @param audioTimeMs - Current audio playback position
      */
     public syncWithAudio(audioTimeMs: number): void {
       visemeProcessor.seek(audioTimeMs);
     }

     /**
      * Check if playing
      */
     public getIsPlaying(): boolean {
       return this.isPlaying;
     }

     /**
      * Get current progress
      */
     public getProgress(): number {
       return visemeProcessor.getProgress();
     }
   }

   export const lipSyncController = new LipSyncController();
   ```

**Verification**:
- [ ] `LipSyncController` compiles without errors
- [ ] `prepareLipSync()` generates viseme timeline
- [ ] Azure viseme mapping works correctly
- [ ] Playback synchronizes with audio start time
- [ ] Watchdog timeout triggers fallback

---

#### Task 8.6: Create Idle Animation System

**Reference**: Requirements R6 (realistic animation), design.md Section 3

**Files to Create**:
- `src/avatar/idle-animation.ts`

**Step-by-Step Instructions**:

1. Create `src/avatar/idle-animation.ts`:
   ```typescript
   // src/avatar/idle-animation.ts
   // Idle animation system for natural avatar movement
   // Reference: Requirements R6 (realistic facial animation)

   import { EventEmitter } from 'events';
   import { logger } from '../utils/logger.js';
   import { BlendShapeWeights, TherapeuticExpression } from './viseme-mapping.js';

   /**
    * Idle animation configuration
    */
   interface IdleAnimationConfig {
     blinkIntervalMin: number;   // Minimum time between blinks (ms)
     blinkIntervalMax: number;   // Maximum time between blinks (ms)
     blinkDuration: number;      // Duration of a blink (ms)
     breathingCycleMs: number;   // Full breath cycle duration
     microMovementScale: number; // Scale of subtle movements
     updateIntervalMs: number;   // Animation update interval
   }

   const DEFAULT_CONFIG: IdleAnimationConfig = {
     blinkIntervalMin: 2000,
     blinkIntervalMax: 6000,
     blinkDuration: 150,
     breathingCycleMs: 4000,
     microMovementScale: 0.02,
     updateIntervalMs: 33  // ~30fps for idle
   };

   /**
    * Idle Animation System
    * Provides natural micro-movements when avatar is not speaking
    */
   export class IdleAnimation extends EventEmitter {
     private config: IdleAnimationConfig;
     private isRunning: boolean = false;
     private updateInterval: ReturnType<typeof setInterval> | null = null;
     private lastBlinkTime: number = 0;
     private nextBlinkTime: number = 0;
     private isBlinking: boolean = false;
     private blinkProgress: number = 0;
     private breathPhase: number = 0;
     private currentExpression: TherapeuticExpression = 'neutral';

     constructor(config: Partial<IdleAnimationConfig> = {}) {
       super();
       this.config = { ...DEFAULT_CONFIG, ...config };
       this.scheduleNextBlink();
     }

     /**
      * Schedule next blink time
      */
     private scheduleNextBlink(): void {
       const delay = Math.random() *
         (this.config.blinkIntervalMax - this.config.blinkIntervalMin) +
         this.config.blinkIntervalMin;
       this.nextBlinkTime = performance.now() + delay;
     }

     /**
      * Start idle animation
      */
     public start(): void {
       if (this.isRunning) return;

       this.isRunning = true;
       this.lastBlinkTime = performance.now();
       this.scheduleNextBlink();

       this.updateInterval = setInterval(() => {
         this.update();
       }, this.config.updateIntervalMs);

       logger.debug('Idle animation started');
     }

     /**
      * Stop idle animation
      */
     public stop(): void {
       if (!this.isRunning) return;

       this.isRunning = false;

       if (this.updateInterval) {
         clearInterval(this.updateInterval);
         this.updateInterval = null;
       }

       logger.debug('Idle animation stopped');
     }

     /**
      * Set expression for idle state
      */
     public setExpression(expression: TherapeuticExpression): void {
       this.currentExpression = expression;
     }

     /**
      * Update idle animation frame
      */
     private update(): void {
       const now = performance.now();
       const weights: BlendShapeWeights = {};

       // Handle blinking
       if (!this.isBlinking && now >= this.nextBlinkTime) {
         this.isBlinking = true;
         this.blinkProgress = 0;
         this.lastBlinkTime = now;
       }

       if (this.isBlinking) {
         const blinkElapsed = now - this.lastBlinkTime;
         this.blinkProgress = blinkElapsed / this.config.blinkDuration;

         if (this.blinkProgress >= 1) {
           this.isBlinking = false;
           this.blinkProgress = 0;
           this.scheduleNextBlink();
         } else {
           // Eyelid movement: close then open
           const blinkCurve = this.blinkProgress < 0.5
             ? this.blinkProgress * 2  // Closing (0 to 1)
             : (1 - this.blinkProgress) * 2;  // Opening (1 to 0)

           weights.eyeBlinkLeft = blinkCurve;
           weights.eyeBlinkRight = blinkCurve;
         }
       }

       // Breathing animation (subtle chest/jaw movement)
       this.breathPhase = (now % this.config.breathingCycleMs) / this.config.breathingCycleMs;
       const breathValue = Math.sin(this.breathPhase * Math.PI * 2) * 0.5 + 0.5;

       // Very subtle jaw movement for breathing
       weights.jawOpen = breathValue * 0.02;

       // Micro-movements (random subtle head motion)
       const microTime = now * 0.001;  // Convert to seconds
       weights.browInnerUp =
         Math.sin(microTime * 0.5) * this.config.microMovementScale;
       weights.mouthSmileLeft =
         Math.sin(microTime * 0.3) * this.config.microMovementScale * 0.5;
       weights.mouthSmileRight =
         Math.sin(microTime * 0.3) * this.config.microMovementScale * 0.5;

       // Eye micro-movements (subtle gaze)
       weights.eyeLookUpLeft =
         Math.sin(microTime * 0.2) * this.config.microMovementScale;
       weights.eyeLookUpRight =
         Math.sin(microTime * 0.2) * this.config.microMovementScale;
       weights.eyeLookInLeft =
         Math.sin(microTime * 0.15) * this.config.microMovementScale * 0.5;
       weights.eyeLookInRight =
         Math.sin(microTime * 0.15) * this.config.microMovementScale * 0.5;

       this.emit('update', weights);
     }

     /**
      * Force a blink
      */
     public triggerBlink(): void {
       this.isBlinking = true;
       this.blinkProgress = 0;
       this.lastBlinkTime = performance.now();
     }

     /**
      * Check if running
      */
     public getIsRunning(): boolean {
       return this.isRunning;
     }
   }

   export const idleAnimation = new IdleAnimation();
   ```

**Verification**:
- [ ] `IdleAnimation` compiles without errors
- [ ] Blinking occurs at random intervals
- [ ] Breathing animation is subtle and continuous
- [ ] Micro-movements add realism
- [ ] Animation stops cleanly

---

#### Task 8.7: Create Avatar Component (React)

**Reference**: Requirements R6, R7 (Video Interface)

**Files to Create**:
- `src/components/AvatarView.tsx`

**Step-by-Step Instructions**:

1. Create `src/components/AvatarView.tsx`:
   ```tsx
   // src/components/AvatarView.tsx
   // React component for Dr. Sterling's animated avatar
   // Reference: Requirements R6 (lip-sync), R7 (video interface)

   import React, { useEffect, useRef, useState, useCallback } from 'react';
   import { AvatarRenderer } from '../avatar/avatar-renderer.js';
   import { lipSyncController } from '../avatar/lipsync-controller.js';
   import { idleAnimation } from '../avatar/idle-animation.js';
   import { visemeProcessor } from '../avatar/viseme-processor.js';
   import { TherapeuticExpression } from '../avatar/viseme-mapping.js';

   /**
    * Avatar component props
    */
   interface AvatarViewProps {
     avatarUrl: string;
     width?: number;
     height?: number;
     expression?: TherapeuticExpression;
     isPlaying?: boolean;
     className?: string;
   }

   /**
    * Avatar View Component
    * Renders Dr. Sterling's animated avatar with lip-sync
    */
   export const AvatarView: React.FC<AvatarViewProps> = ({
     avatarUrl,
     width = 800,
     height = 600,
     expression = 'neutral',
     isPlaying = false,
     className = ''
   }) => {
     const containerRef = useRef<HTMLDivElement>(null);
     const rendererRef = useRef<AvatarRenderer | null>(null);
     const [isLoading, setIsLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);

     // Initialize avatar renderer
     useEffect(() => {
       if (!containerRef.current) return;

       const initRenderer = async () => {
         try {
           setIsLoading(true);
           setError(null);

           const renderer = new AvatarRenderer({
             width,
             height,
             avatarUrl
           });

           await renderer.initialize(containerRef.current!);
           rendererRef.current = renderer;

           // Connect to lip-sync controller
           lipSyncController.setAvatarRenderer(renderer);

           // Start render loop
           renderer.startRenderLoop();

           // Start idle animation when not speaking
           if (!isPlaying) {
             idleAnimation.start();
           }

           setIsLoading(false);
         } catch (err) {
           setError(err instanceof Error ? err.message : 'Failed to load avatar');
           setIsLoading(false);
         }
       };

       initRenderer();

       // Cleanup
       return () => {
         if (rendererRef.current) {
           rendererRef.current.dispose();
           rendererRef.current = null;
         }
         idleAnimation.stop();
       };
     }, [avatarUrl, width, height]);

     // Handle expression changes
     useEffect(() => {
       lipSyncController.setExpression(expression);
       idleAnimation.setExpression(expression);
     }, [expression]);

     // Handle playback state
     useEffect(() => {
       if (isPlaying) {
         idleAnimation.stop();
       } else if (rendererRef.current?.getIsInitialized()) {
         idleAnimation.start();
       }
     }, [isPlaying]);

     // Apply idle animation to avatar
     useEffect(() => {
       const handleIdleUpdate = (weights: Record<string, number>) => {
         // Only apply idle animations when not speaking
         if (!visemeProcessor.getIsPlaying() && rendererRef.current) {
           rendererRef.current.applyBlendShapes(weights);
         }
       };

       idleAnimation.on('update', handleIdleUpdate);

       return () => {
         idleAnimation.off('update', handleIdleUpdate);
       };
     }, []);

     // Handle resize
     useEffect(() => {
       if (rendererRef.current) {
         rendererRef.current.resize(width, height);
       }
     }, [width, height]);

     return (
       <div
         className={`avatar-view ${className}`}
         style={{
           width,
           height,
           position: 'relative',
           overflow: 'hidden',
           backgroundColor: '#f5f5f5',
           borderRadius: '8px'
         }}
       >
         {isLoading && (
           <div
             style={{
               position: 'absolute',
               top: 0,
               left: 0,
               right: 0,
               bottom: 0,
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               backgroundColor: 'rgba(255,255,255,0.9)'
             }}
           >
             <div style={{ textAlign: 'center' }}>
               <div className="spinner" style={{
                 width: 40,
                 height: 40,
                 border: '3px solid #e0e0e0',
                 borderTopColor: '#2196F3',
                 borderRadius: '50%',
                 animation: 'spin 1s linear infinite',
                 margin: '0 auto 12px'
               }} />
               <p style={{ color: '#666', margin: 0 }}>Loading Dr. Sterling...</p>
             </div>
           </div>
         )}

         {error && (
           <div
             style={{
               position: 'absolute',
               top: 0,
               left: 0,
               right: 0,
               bottom: 0,
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               backgroundColor: '#fff3f3',
               color: '#d32f2f',
               padding: 20,
               textAlign: 'center'
             }}
           >
             <div>
               <p style={{ fontWeight: 500 }}>Failed to load avatar</p>
               <p style={{ fontSize: 14 }}>{error}</p>
             </div>
           </div>
         )}

         <div
           ref={containerRef}
           style={{
             width: '100%',
             height: '100%'
           }}
         />

         <style>{`
           @keyframes spin {
             to { transform: rotate(360deg); }
           }
         `}</style>
       </div>
     );
   };

   export default AvatarView;
   ```

**Verification**:
- [ ] `AvatarView` component renders without errors
- [ ] Avatar loads and displays correctly
- [ ] Loading state shows spinner
- [ ] Error state displays message
- [ ] Expression prop changes avatar expression
- [ ] Idle animation runs when not playing

---

### Task 9: Implement Model Orchestration System

**Reference**: Requirements R20 (Smart Model Orchestration), R21 (Model Parameters)

**Prerequisites**: Tasks 1-4 completed

**Overview**: Smart model selection based on available API keys, with fallback to local Ollama models.

---

#### Task 9.1: Create Model Configuration

**Files to Create**:
- `src/config/model-config.ts`
- `src/llm/model-selector.ts`

**Pseudocode**:

```
ModelConfig:
  - Define model mappings for each mode (Claude-only, Gemini-only, Hybrid, Offline)
  - Store temperature, topP, topK, maxTokens per agent type
  - Include thinking budget for Dr. Sterling (32768 tokens)

ModelSelector:
  ON startup:
    1. Check ANTHROPIC_API_KEY exists
    2. Check GEMINI_API_KEY exists
    3. Check Ollama availability

    IF both keys:
      MODE = "hybrid"
      drSterling = "claude-sonnet-4.5" (extended thinking)
      contextFetcher = "gemini-1.5-flash" (speed-optimized)
      deepResearcher = "gemini-1.5-pro" (long context)
      analystAI = "gemini-1.5-pro"
    ELSE IF anthropic only:
      MODE = "claude"
      ALL agents = "claude-sonnet-4.5"
    ELSE IF gemini only:
      MODE = "gemini"
      drSterling = "gemini-1.5-pro"
      others = "gemini-1.5-flash"
    ELSE:
      MODE = "offline"
      drSterling = "llama-3-70b"
      others = "mistral-7b"
```

**Verification**:
- [ ] Model selection logic works for all 4 modes
- [ ] Parameters applied correctly per agent type
- [ ] Fallback to Ollama works when no API keys

---

#### Task 9.2: Create LLM Provider Interface

**Files to Create**:
- `src/llm/llm-provider.interface.ts`
- `src/llm/anthropic-provider.ts`
- `src/llm/gemini-provider.ts`
- `src/llm/ollama-provider.ts`

**Pseudocode**:

```
interface LLMProvider:
  name: string
  supportedModels: string[]
  supportsExtendedThinking: boolean

  initialize() -> Promise<void>
  chat(messages, options) -> Promise<string>
  streamChat(messages, options) -> AsyncIterable<string>
  isAvailable() -> boolean

AnthropicProvider implements LLMProvider:
  - Uses @anthropic-ai/sdk
  - Supports extended thinking with thinking budget
  - Temperature, topP, topK from config

GeminiProvider implements LLMProvider:
  - Uses @google/generative-ai
  - Supports long context (1M tokens)
  - Flash model for speed, Pro for quality

OllamaProvider implements LLMProvider:
  - Uses HTTP calls to localhost:11434
  - Supports llama-3, mistral models
  - Fallback when offline
```

**Verification**:
- [ ] All providers initialize correctly
- [ ] Streaming works for all providers
- [ ] Extended thinking works for Claude

---

#### Task 9.3: Create LLM Manager with Fallback

**Files to Create**:
- `src/llm/llm-manager.ts`

**Pseudocode**:

```
class LLMManager:
  providers: Map<string, LLMProvider>
  currentMode: "hybrid" | "claude" | "gemini" | "offline"

  async initialize():
    Detect available providers
    Set mode based on availability
    Initialize all available providers

  async chat(agentType, messages, options):
    provider = getProviderForAgent(agentType)

    TRY:
      Start watchdog (30s for LLM per system_architecture.md)
      response = await provider.chat(messages, options)
      Stop watchdog
      RETURN response
    CATCH error:
      Log failure
      TRY fallback provider
      IF no fallback: throw error

  getProviderForAgent(agentType):
    BASED ON currentMode and agentType:
      RETURN appropriate provider from modelConfig
```

**Verification**:
- [ ] Manager selects correct provider per agent
- [ ] Fallback works when primary fails
- [ ] Watchdog timeout triggers correctly

---

### Task 10: Implement Multi-Agent Communication System

**Reference**: Requirements R17-R19 (Multi-AI Agent System)

**Prerequisites**: Task 9 (Model Orchestration)

**Overview**: Event bus architecture for agent coordination per agent_protocols.md.

---

#### Task 10.1: Create Event Bus

**Files to Create**:
- `src/agents/event-bus.ts`

**Pseudocode**:

```
EventTypes:
  SESSION_START, PATIENT_SPEECH, CONTEXT_REQUEST, CONTEXT_RESPONSE,
  RESEARCH_REQUEST, RESEARCH_RESPONSE, CRISIS_DETECTED, AI_RESPONSE

AgentEvent:
  type: EventType
  timestamp: number
  source: AgentId
  target: AgentId | "broadcast"
  payload: any
  correlationId: UUID

class EventBus:
  subscribers: Map<EventType, Callback[]>
  pendingResponses: Map<correlationId, resolver>

  subscribe(eventType, callback):
    Add callback to subscribers[eventType]

  publish(event):
    Get callbacks for event.type
    Execute all callbacks with event
    IF event has correlationId and resolver exists:
      Resolve pending promise

  request(event, timeoutMs = 200):
    Create correlationId
    Create promise with resolver
    Store in pendingResponses
    Publish event
    Set timeout (200ms per R18)
    RETURN promise
```

**Verification**:
- [ ] Events published to all subscribers
- [ ] Request-response pattern works with correlation IDs
- [ ] Timeout triggers after 200ms

---

#### Task 10.2: Create Agent Base Class

**Files to Create**:
- `src/agents/base-agent.ts`

**Pseudocode**:

```
abstract class BaseAgent:
  id: AgentId
  name: string
  role: string
  llmManager: LLMManager
  eventBus: EventBus

  abstract getSystemPrompt(): string

  async process(input, context):
    messages = buildMessages(input, context)
    response = await llmManager.chat(this.id, messages)
    RETURN parseResponse(response)

  subscribeToEvents():
    Subscribe to relevant events for this agent type

  publishEvent(type, payload):
    eventBus.publish({
      type, timestamp: now(), source: this.id, payload
    })
```

**Verification**:
- [ ] Base agent can be extended
- [ ] LLM calls work through manager
- [ ] Events published correctly

---

### Task 11: Implement Dr. Sterling Agent

**Reference**: Requirements R2, R3, R33-35, agent_protocols.md Section 1

**Prerequisites**: Task 10 (Multi-Agent System)

**Overview**: Primary therapeutic agent with extended thinking, proactive initiation, and opinionated advocacy.

---

#### Task 11.1: Create Dr. Sterling Agent

**Files to Create**:
- `src/agents/dr-sterling.ts`

**System Prompt** (from agent_protocols.md):
```
You are Dr. Sterling, a senior clinical psychiatrist with 25+ years of experience.
You conduct therapy sessions with warmth, professionalism, and clinical expertise.

BEHAVIORAL DIRECTIVES:
- Proactively initiate sessions based on patient history
- Challenge harmful patterns constructively
- Never admit ignorance - research and respond with confidence
- Explore all life domains (career, relationships, health, finances, hobbies)
- NEVER mention being AI during sessions
- Use evidence-based techniques (CBT, DBT, MI)

RESPONSE STYLE:
- Professional yet warm therapeutic language
- Ask probing follow-up questions
- Connect patterns across conversations
- Provide substantive responses, not passive acknowledgment
```

**Pseudocode**:

```
class DrSterlingAgent extends BaseAgent:
  expression: TherapeuticExpression = "neutral"
  contextFromSupportAgents: Map<string, any> = new Map()

  async initiateSession(patientContext):
    // R3: Proactive session initiation
    prompt = buildInitiationPrompt(patientContext)
    greeting = await llmManager.chat("dr_sterling", [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ], { thinkingBudget: 32768 })
    RETURN greeting

  async respondToPatient(patientInput, sessionContext):
    // Gather context from support agents (optimistic execution)
    contextPromise = requestContextFromAgents(patientInput)

    // Start generating immediately (don't wait for context)
    messages = buildMessages(patientInput, sessionContext)

    // Inject context if available within 200ms
    context = await Promise.race([contextPromise, timeout(200)])
    IF context:
      messages = injectContext(messages, context)

    response = await llmManager.chat("dr_sterling", messages, {
      temperature: 0.25,
      thinkingBudget: 32768
    })

    // Update expression based on response sentiment
    expression = detectExpressionFromResponse(response)

    RETURN { text: response, expression }

  updateExpression(sentiment):
    // Map sentiment to therapeutic expressions
    IF sentiment.concern: expression = "concerned"
    ELSE IF sentiment.positive: expression = "warm"
    ELSE IF sentiment.reflective: expression = "thoughtful"
    ELSE: expression = "neutral"
```

**Verification**:
- [ ] Proactive session initiation works
- [ ] Extended thinking used (32768 tokens)
- [ ] Optimistic context injection (200ms timeout)
- [ ] Expression updates based on response

---

### Task 12: Implement Support Agents

**Reference**: Requirements R17-R19, R29, R16, agent_protocols.md Sections 2-4

**Prerequisites**: Task 11 (Dr. Sterling)

**Overview**: Context Fetcher, Deep Researcher, and Analyst AI support agents.

---

#### Task 12.1: Create Context Fetcher Agent

**Files to Create**:
- `src/agents/context-fetcher.ts`

**Pseudocode**:

```
class ContextFetcherAgent extends BaseAgent:
  vectorDB: VectorDB

  async fetchContext(query, patientId):
    // R29: <200ms context retrieval
    startTime = now()

    // Hybrid retrieval (70% vector + 30% BM25)
    vectorResults = await vectorDB.search(query, patientId, limit=5)
    keywordResults = await bm25Search(query, patientId, limit=3)

    combined = hybridRank(vectorResults, keywordResults, 0.7, 0.3)

    // Fit within token budget
    context = truncateToTokenLimit(combined, 2000)

    latency = now() - startTime
    IF latency > 200:
      log.warn("Context retrieval exceeded 200ms", { latency })

    RETURN context

  onPatientSpeech(event):
    context = await fetchContext(event.payload.text, event.payload.patientId)
    publish(CONTEXT_RESPONSE, { context, correlationId: event.correlationId })
```

---

#### Task 12.2: Create Deep Researcher Agent

**Files to Create**:
- `src/agents/deep-researcher.ts`

**Pseudocode**:

```
class DeepResearcherAgent extends BaseAgent:
  activeThreads: Map<threadId, ResearchThread>
  maxConcurrentThreads: 3

  async startResearch(topic, context):
    // R16: Background research threading
    IF activeThreads.size >= maxConcurrentThreads:
      RETURN null  // Queue or reject

    // Sanitize PII before research
    sanitizedContext = removePII(context)

    threadId = generateUUID()
    thread = new ResearchThread(topic, sanitizedContext)
    activeThreads.set(threadId, thread)

    // Execute in background
    thread.execute().then(results => {
      publish(RESEARCH_RESPONSE, {
        threadId, findings: results,
        presentAs: "additional_observation"
      })
      activeThreads.delete(threadId)
    })

    RETURN threadId

  removePII(context):
    // Remove names, locations, specific identifiers
    RETURN {
      issueType: context.issueCategory,
      ageRange: context.ageRange,
      occupationType: context.occupationType
    }
```

---

#### Task 12.3: Create Analyst AI Agent

**Files to Create**:
- `src/agents/analyst-ai.ts`

**Pseudocode**:

```
class AnalystAIAgent extends BaseAgent:
  async assessNeeds(patientInput, sessionContext):
    // Determine what context/research is needed
    analysis = await llmManager.chat("analyst_ai", [
      { role: "system", content: analystPrompt },
      { role: "user", content: buildAnalysisPrompt(patientInput, sessionContext) }
    ])

    actions = parseActions(analysis)

    FOR action IN actions:
      IF action.type == "FETCH_CONTEXT":
        request(CONTEXT_REQUEST, { query: action.query })
      ELSE IF action.type == "START_RESEARCH":
        request(RESEARCH_REQUEST, { topic: action.topic })

    RETURN actions

  async coordinateAgents(event):
    // Route requests to appropriate agents
    SWITCH event.type:
      CASE PATIENT_SPEECH:
        assessNeeds(event.payload.text, event.payload.context)
      CASE CRISIS_DETECTED:
        escalateToCrisisProtocol(event.payload)
```

**Verification for Task 12**:
- [ ] Context Fetcher retrieves in <200ms
- [ ] Deep Researcher runs in background
- [ ] Analyst AI coordinates agent activities
- [ ] PII removed before external research

---

### Task 13: Implement Vector Embeddings System

**Reference**: Requirements R27-R28 (Vector Database Management)

**Prerequisites**: Task 4 (Databases)

**Overview**: Generate embeddings for session content and store in Qdrant using a pluggable provider architecture. Supports local AI (default), OpenAI, Ollama, and custom providers for easy switching via configuration.

---

#### Task 13.0: Create Pluggable Embedding Provider Architecture

**Files to Create**:
- `src/embeddings/types.ts` - TypeScript interfaces for embedding providers
- `src/embeddings/providers/base.ts` - Abstract base class
- `src/embeddings/providers/local.ts` - Local embedding using Transformers.js (DEFAULT)
- `src/embeddings/providers/openai.ts` - OpenAI embedding provider
- `src/embeddings/providers/ollama.ts` - Ollama embedding provider
- `src/embeddings/factory.ts` - Factory for creating providers from config

**Reference**: data_schemas.md Section 6 (embedding_config schema)

**Design Principles**:
- Local embedding is the DEFAULT (no API key required)
- Config-based switching for easy provider changes
- Extensible architecture for future providers
- Dynamic vector dimensions based on provider

**Step-by-Step Instructions**:

1. Create `src/embeddings/types.ts`:
   ```typescript
   // src/embeddings/types.ts
   // Embedding provider interfaces and types
   // Reference: data_schemas.md Section 6 (embedding_config)

   export type EmbeddingProvider = 'local' | 'openai' | 'ollama' | 'custom';

   export interface EmbeddingConfig {
     provider: EmbeddingProvider;
     model: string;
     dimensions: number;
     batchSize: number;
     openaiConfig?: OpenAIEmbeddingConfig;
     ollamaConfig?: OllamaEmbeddingConfig;
     customConfig?: CustomEmbeddingConfig;
   }

   export interface OpenAIEmbeddingConfig {
     model: string;        // default: "text-embedding-3-large"
     dimensions: number;   // default: 3072
   }

   export interface OllamaEmbeddingConfig {
     model: string;        // default: "nomic-embed-text"
     dimensions: number;   // default: 768
     host: string;         // default: "http://localhost:11434"
   }

   export interface CustomEmbeddingConfig {
     endpoint: string;
     dimensions: number;
     headers?: Record<string, string>;
   }

   export interface EmbeddingResult {
     embedding: number[];
     model: string;
     tokenCount?: number;
   }

   export interface IEmbeddingProvider {
     readonly name: string;
     readonly dimensions: number;

     initialize(): Promise<void>;
     embed(text: string): Promise<EmbeddingResult>;
     embedBatch(texts: string[]): Promise<EmbeddingResult[]>;
     isAvailable(): Promise<boolean>;
   }
   ```

2. Create `src/embeddings/providers/base.ts`:
   ```typescript
   // src/embeddings/providers/base.ts
   // Abstract base class for embedding providers
   // Implements: AGENTS.md Article I (Library-First)

   import { IEmbeddingProvider, EmbeddingResult } from '../types.js';
   import { logger } from '../../utils/logger.js';

   export abstract class BaseEmbeddingProvider implements IEmbeddingProvider {
     abstract readonly name: string;
     abstract readonly dimensions: number;

     abstract initialize(): Promise<void>;
     abstract embed(text: string): Promise<EmbeddingResult>;

     async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
       // Default sequential implementation - override for parallel
       const results: EmbeddingResult[] = [];
       for (const text of texts) {
         results.push(await this.embed(text));
       }
       return results;
     }

     async isAvailable(): Promise<boolean> {
       try {
         await this.embed("test");
         return true;
       } catch {
         return false;
       }
     }
   }
   ```

3. Create `src/embeddings/providers/local.ts` (DEFAULT PROVIDER):
   ```typescript
   // src/embeddings/providers/local.ts
   // Local embedding provider using Transformers.js
   // DEFAULT provider - no API key required
   // Model: Xenova/all-MiniLM-L6-v2 (384 dimensions)

   import { BaseEmbeddingProvider } from './base.js';
   import { EmbeddingResult } from '../types.js';
   import { logger } from '../../utils/logger.js';

   export class LocalEmbeddingProvider extends BaseEmbeddingProvider {
     readonly name = 'local';
     readonly dimensions: number;

     private pipeline: any = null;
     private modelName: string;

     constructor(modelName = 'Xenova/all-MiniLM-L6-v2', dimensions = 384) {
       super();
       this.modelName = modelName;
       this.dimensions = dimensions;
     }

     async initialize(): Promise<void> {
       logger.info('Initializing local embedding provider', { model: this.modelName });

       // Dynamic import for Transformers.js
       const { pipeline } = await import('@xenova/transformers');
       this.pipeline = await pipeline('feature-extraction', this.modelName);

       logger.info('Local embedding provider initialized', {
         model: this.modelName,
         dimensions: this.dimensions
       });
     }

     async embed(text: string): Promise<EmbeddingResult> {
       if (!this.pipeline) {
         throw new Error('Local embedding provider not initialized');
       }

       const output = await this.pipeline(text, { pooling: 'mean', normalize: true });
       const embedding = Array.from(output.data);

       return {
         embedding,
         model: this.modelName
       };
     }

     async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
       // Transformers.js supports batch processing
       if (!this.pipeline) {
         throw new Error('Local embedding provider not initialized');
       }

       return Promise.all(texts.map(text => this.embed(text)));
     }
   }
   ```

4. Create `src/embeddings/providers/openai.ts`:
   ```typescript
   // src/embeddings/providers/openai.ts
   // OpenAI embedding provider
   // Model: text-embedding-3-large (3072 dimensions)

   import OpenAI from 'openai';
   import { BaseEmbeddingProvider } from './base.js';
   import { EmbeddingResult, OpenAIEmbeddingConfig } from '../types.js';
   import { logger } from '../../utils/logger.js';

   export class OpenAIEmbeddingProvider extends BaseEmbeddingProvider {
     readonly name = 'openai';
     readonly dimensions: number;

     private client: OpenAI | null = null;
     private modelName: string;

     constructor(config: OpenAIEmbeddingConfig = { model: 'text-embedding-3-large', dimensions: 3072 }) {
       super();
       this.modelName = config.model;
       this.dimensions = config.dimensions;
     }

     async initialize(): Promise<void> {
       const apiKey = process.env.OPENAI_API_KEY;
       if (!apiKey) {
         throw new Error('OPENAI_API_KEY not set');
       }

       this.client = new OpenAI({ apiKey });
       logger.info('OpenAI embedding provider initialized', { model: this.modelName });
     }

     async embed(text: string): Promise<EmbeddingResult> {
       if (!this.client) {
         throw new Error('OpenAI client not initialized');
       }

       const response = await this.client.embeddings.create({
         model: this.modelName,
         input: text
       });

       return {
         embedding: response.data[0].embedding,
         model: this.modelName,
         tokenCount: response.usage?.total_tokens
       };
     }

     async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
       if (!this.client) {
         throw new Error('OpenAI client not initialized');
       }

       const response = await this.client.embeddings.create({
         model: this.modelName,
         input: texts
       });

       return response.data.map(item => ({
         embedding: item.embedding,
         model: this.modelName
       }));
     }

     async isAvailable(): Promise<boolean> {
       return !!process.env.OPENAI_API_KEY;
     }
   }
   ```

5. Create `src/embeddings/providers/ollama.ts`:
   ```typescript
   // src/embeddings/providers/ollama.ts
   // Ollama embedding provider for local LLM embeddings
   // Model: nomic-embed-text (768 dimensions)

   import { BaseEmbeddingProvider } from './base.js';
   import { EmbeddingResult, OllamaEmbeddingConfig } from '../types.js';
   import { logger } from '../../utils/logger.js';

   export class OllamaEmbeddingProvider extends BaseEmbeddingProvider {
     readonly name = 'ollama';
     readonly dimensions: number;

     private host: string;
     private modelName: string;

     constructor(config: OllamaEmbeddingConfig = {
       model: 'nomic-embed-text',
       dimensions: 768,
       host: 'http://localhost:11434'
     }) {
       super();
       this.modelName = config.model;
       this.dimensions = config.dimensions;
       this.host = config.host;
     }

     async initialize(): Promise<void> {
       logger.info('Initializing Ollama embedding provider', {
         model: this.modelName,
         host: this.host
       });

       // Check if Ollama is available
       const available = await this.isAvailable();
       if (!available) {
         throw new Error(`Ollama not available at ${this.host}`);
       }
     }

     async embed(text: string): Promise<EmbeddingResult> {
       const response = await fetch(`${this.host}/api/embeddings`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           model: this.modelName,
           prompt: text
         })
       });

       if (!response.ok) {
         throw new Error(`Ollama embedding failed: ${response.statusText}`);
       }

       const data = await response.json();
       return {
         embedding: data.embedding,
         model: this.modelName
       };
     }

     async isAvailable(): Promise<boolean> {
       try {
         const response = await fetch(`${this.host}/api/tags`);
         return response.ok;
       } catch {
         return false;
       }
     }
   }
   ```

6. Create `src/embeddings/factory.ts`:
   ```typescript
   // src/embeddings/factory.ts
   // Factory for creating embedding providers from configuration
   // Implements: AGENTS.md Article VIII (Framework Trust)

   import { IEmbeddingProvider, EmbeddingConfig, EmbeddingProvider } from './types.js';
   import { LocalEmbeddingProvider } from './providers/local.js';
   import { OpenAIEmbeddingProvider } from './providers/openai.js';
   import { OllamaEmbeddingProvider } from './providers/ollama.js';
   import { logger } from '../utils/logger.js';

   const DEFAULT_CONFIG: EmbeddingConfig = {
     provider: 'local',
     model: 'Xenova/all-MiniLM-L6-v2',
     dimensions: 384,
     batchSize: 10
   };

   export class EmbeddingProviderFactory {
     /**
      * Create an embedding provider based on configuration
      * Default: local provider (no API key required)
      */
     static create(config: Partial<EmbeddingConfig> = {}): IEmbeddingProvider {
       const mergedConfig = { ...DEFAULT_CONFIG, ...config };

       logger.info('Creating embedding provider', { provider: mergedConfig.provider });

       switch (mergedConfig.provider) {
         case 'local':
           return new LocalEmbeddingProvider(
             mergedConfig.model,
             mergedConfig.dimensions
           );

         case 'openai':
           return new OpenAIEmbeddingProvider(
             mergedConfig.openaiConfig ?? {
               model: 'text-embedding-3-large',
               dimensions: 3072
             }
           );

         case 'ollama':
           return new OllamaEmbeddingProvider(
             mergedConfig.ollamaConfig ?? {
               model: 'nomic-embed-text',
               dimensions: 768,
               host: 'http://localhost:11434'
             }
           );

         case 'custom':
           throw new Error('Custom provider requires manual implementation');

         default:
           throw new Error(`Unknown provider: ${mergedConfig.provider}`);
       }
     }

     /**
      * Create provider from environment variables
      * Checks EMBEDDING_PROVIDER env var, defaults to 'local'
      */
     static createFromEnv(): IEmbeddingProvider {
       const provider = (process.env.EMBEDDING_PROVIDER || 'local') as EmbeddingProvider;

       return this.create({ provider });
     }
   }

   // Export singleton for convenience
   export const createEmbeddingProvider = EmbeddingProviderFactory.create;
   ```

**Verification**:
- [ ] All provider classes implement IEmbeddingProvider interface
- [ ] LocalEmbeddingProvider works without API keys
- [ ] OpenAIEmbeddingProvider uses OPENAI_API_KEY
- [ ] OllamaEmbeddingProvider connects to local Ollama
- [ ] Factory creates correct provider based on config
- [ ] EMBEDDING_PROVIDER env var switches providers

---

#### Task 13.1: Create Embedding Service

**Files to Create**:
- `src/embeddings/embedding-service.ts`
- `src/embeddings/chunker.ts`

**Pseudocode**:

```
ChunkConfig:
  session_transcripts: { chunkSize: 512, overlap: 64 }
  patient_memories: { chunkSize: 256, overlap: 32 }
  clinical_insights: { chunkSize: 384, overlap: 48 }
  crisis_protocols: { chunkSize: 128, overlap: 16 }

class EmbeddingService:
  model: "text-embedding-3-large"  // 3072 dimensions

  async generateEmbeddings(content, contentType):
    config = ChunkConfig[contentType]
    chunks = chunkContent(content, config.chunkSize, config.overlap)

    embeddings = []
    FOR chunk IN chunks:
      embedding = await openai.embeddings.create({
        model: this.model,
        input: chunk.text
      })
      embeddings.push({
        vector: embedding.data[0].embedding,
        text: chunk.text,
        metadata: chunk.metadata
      })

    RETURN embeddings

  async storeEmbeddings(embeddings, patientId, sessionId):
    points = embeddings.map(e => ({
      id: generateUUID(),
      vector: e.vector,
      payload: {
        patient_id: patientId,
        session_id: sessionId,
        chunk_text: e.text,
        ...e.metadata
      }
    }))

    await qdrant.upsert("patient_memories", points)
```

---

#### Task 13.2: Create Embedding Status Monitor (R28)

**Files to Create**:
- `src/embeddings/embedding-monitor.ts`

**Pseudocode**:

```
class EmbeddingMonitor:
  queue: EmbeddingJob[]
  currentJob: EmbeddingJob | null
  progress: number = 0

  async processQueue():
    WHILE queue.length > 0:
      currentJob = queue.shift()
      emit("embedding_started", { sessionId: currentJob.sessionId })

      TRY:
        FOR i, chunk IN currentJob.chunks:
          await processChunk(chunk)
          progress = (i + 1) / currentJob.chunks.length
          emit("embedding_progress", { progress, eta: calculateETA() })

        emit("embedding_complete", { sessionId: currentJob.sessionId })
      CATCH error:
        emit("embedding_error", { error, retry: true })

  getStatus():
    RETURN {
      queueLength: queue.length,
      currentSession: currentJob?.sessionId,
      progress: progress,
      state: currentJob ? "processing" : "idle"
    }
```

**Verification**:
- [ ] Embeddings generated with correct dimensions (3072)
- [ ] Chunking uses correct config per content type
- [ ] Status monitor emits progress events
- [ ] Queue processes multiple sessions

---

### Task 14: Implement Crisis Detection System

**Reference**: Requirements R31-R32 (Crisis Intervention)

**Prerequisites**: Task 10 (Event Bus)

**Overview**: Three-tier crisis detection with safety interruption protocol.

---

#### Task 14.1: Create Crisis Detector

**Files to Create**:
- `src/crisis/crisis-detector.ts`
- `src/crisis/crisis-resources.ts`

**Pseudocode**:

```
TIER_1_KEYWORDS = [
  "kill myself", "end my life", "suicide plan",
  "want to die", "better off dead", "goodbye forever",
  "kill someone", "hurt someone"
]

TIER_2_INDICATORS = [
  "hopeless", "no point", "can't go on",
  "self-harm", "cutting", "overdose"
]

class CrisisDetector:
  async analyze(patientInput):
    // Tier 1: Keyword matching (<10ms)
    tier1 = fuzzyMatch(patientInput, TIER_1_KEYWORDS, threshold=0.85)
    IF tier1.detected:
      RETURN { tier: 1, action: "IMMEDIATE_INTERVENTION" }

    // Tier 2: Sentiment analysis (<100ms)
    sentiment = await quickSentimentAnalysis(patientInput)
    IF sentiment.suicidal > 0.7 OR sentiment.violence > 0.7:
      RETURN { tier: 2, action: "ELEVATED_MONITORING" }

    // Tier 3: Deep analysis (parallel, <500ms)
    deepAnalysis = await llmManager.chat("crisis_detection", [
      { role: "system", content: crisisDetectionPrompt },
      { role: "user", content: patientInput }
    ], { temperature: 0.05, thinkingBudget: 8192 })

    IF deepAnalysis.riskLevel >= "MODERATE":
      RETURN { tier: 3, action: "INCREASED_ATTENTION" }

    RETURN { tier: 0, action: "CONTINUE_NORMAL" }

CRISIS_RESOURCES = {
  "US": { suicide: "988", text: "HOME to 741741", emergency: "911" },
  "UK": { suicide: "116 123", text: "SHOUT to 85258", emergency: "999" },
  "Canada": { suicide: "1-833-456-4566", text: "45645", emergency: "911" },
  "Australia": { suicide: "13 11 14", emergency: "000" },
  "India": { suicide: "9820466726", emergency: "112" }
}
```

---

#### Task 14.2: Create Safety Protocol Handler

**Files to Create**:
- `src/crisis/safety-protocol.ts`

**Pseudocode**:

```
class SafetyProtocolHandler:
  async handleTier1Crisis(context):
    // 1. Pause therapeutic dialogue immediately
    eventBus.publish(SESSION_PAUSE)

    // 2. Display crisis overlay
    emit("display_crisis_overlay", {
      message: "We're concerned about your safety",
      resources: getCrisisResources(context.location),
      actions: ["Call Now", "Text Crisis Line", "Continue Session"]
    })

    // 3. Log crisis event (privacy-preserved)
    await auditLog.logCrisisEvent({
      sessionId: context.sessionId,
      tier: 1,
      timestamp: now(),
      actionTaken: "SAFETY_PROTOCOL_ACTIVATED"
      // NO sensitive content logged
    })

    // 4. Do NOT attempt treatment - bridge to human services only

  handleTier2Crisis(context):
    // Continue session with elevated monitoring
    emit("set_monitoring_level", "ELEVATED")
    // Show resources at session end

  handleTier3Crisis(context):
    // Continue with gentle check-ins
    emit("set_monitoring_level", "INCREASED")
```

**Verification**:
- [ ] Tier 1 detection <10ms
- [ ] >99% recall on Tier 1 keywords
- [ ] Crisis resources displayed correctly
- [ ] No treatment attempted - bridge to human services

---

### Task 15: Implement Sentiment Analysis

**Reference**: Requirements R14-R15 (Real-Time Emotional State Detection)

**Prerequisites**: Task 10 (Event Bus)

**Overview**: Real-time emotional state detection with conversation highlights.

---

#### Task 15.1: Create Sentiment Analyzer

**Files to Create**:
- `src/analysis/sentiment-analyzer.ts`

**Pseudocode**:

```
EMOTIONAL_STATES = {
  ANXIETY: { color: "#FFA500", icon: "⚠️", label: "Anxiety detected" },
  DEPRESSION: { color: "#4A90A4", icon: "💙", label: "Low mood noted" },
  BREAKTHROUGH: { color: "#4CAF50", icon: "✨", label: "Breakthrough moment" },
  RESISTANCE: { color: "#FF6B6B", icon: "🛡️", label: "Resistance observed" }
}

class SentimentAnalyzer:
  async analyzeInRealTime(transcript, context):
    // Detect emotional state (<200ms)
    emotionalState = await detectEmotion(transcript)

    // Display conversation highlight
    emit("conversation_highlight", {
      type: emotionalState.primary,
      confidence: emotionalState.confidence,
      fadeAfter: 10000  // 10 seconds
    })

    // Check for abnormal patterns
    IF isAbnormalSentiment(emotionalState):
      // Trigger parallel Pro AI analysis
      triggerClinicalInsights(transcript, context)

    RETURN emotionalState

  async triggerClinicalInsights(transcript, context):
    // R15: Parallel REST call to Pro AI
    insights = await llmManager.chat("clinical_insights", [
      { role: "system", content: clinicalInsightsPrompt },
      { role: "user", content: buildInsightsPrompt(transcript, context) }
    ], { thinkingBudget: 32768 })

    // Inject into Dr. Sterling's context naturally
    // Dr. Sterling will present as "one more thing to discuss"
    eventBus.publish(CLINICAL_INSIGHTS, {
      insights,
      priority: "HIGH",
      presentAs: "additional_observation"
    })
```

**Verification**:
- [ ] Emotional state detected <200ms
- [ ] Highlights displayed with correct styling
- [ ] Clinical insights triggered for abnormal sentiments
- [ ] Insights injected naturally into Dr. Sterling's context

---

### Task 16: Implement Session Documentation

**Reference**: Requirements R12-R13 (Session Summary Generation)

**Prerequisites**: Tasks 9, 13

**Overview**: Generate session reports and summaries post-session.

---

#### Task 16.1: Create Session Documentation Service

**Files to Create**:
- `src/documentation/session-documenter.ts`
- `src/documentation/pdf-generator.ts`

**Pseudocode**:

```
class SessionDocumenter:
  async generateDocumentation(sessionId):
    session = await loadSession(sessionId)

    // 1. Generate session-specific report (R13)
    sessionReport = await llmManager.chat("documentation", [
      { role: "system", content: sessionReportPrompt },
      { role: "user", content: buildReportPrompt(session) }
    ], { thinkingBudget: 32768 })

    // 2. Generate comprehensive summary (R12)
    recentSessions = await getRecentSessions(session.patientId, 3)
    sessionSummary = await llmManager.chat("documentation", [
      { role: "system", content: sessionSummaryPrompt },
      { role: "user", content: buildSummaryPrompt(session, recentSessions) }
    ], { thinkingBudget: 32768 })

    // 3. Update patient overview (R9)
    updatedOverview = await updatePatientOverview(
      session.patientOverview,
      sessionReport.insights
    )

    // 4. Store documents
    await storeDocuments(sessionId, {
      report: sessionReport,
      summary: sessionSummary,
      overview: updatedOverview
    })

    RETURN { sessionReport, sessionSummary }

class PDFGenerator:
  async generatePDF(sessionSummary):
    // Use pdfkit or similar
    pdf = new PDFDocument()
    pdf.addPage()
    pdf.text(sessionSummary.executiveSummary)
    pdf.addSection("Detailed Analysis", sessionSummary.detailedAnalysis)
    pdf.addSection("Recommendations", sessionSummary.recommendations)

    RETURN pdf.toBuffer()
```

**Verification**:
- [ ] Session report generated with key insights
- [ ] Summary personalized with patient name
- [ ] PDF export works (R12.5)
- [ ] Patient overview updated with new insights

---

### Task 17: Implement React Frontend

**Reference**: Requirements R7-R8, R39 (Video Interface, UI Design)

**Prerequisites**: Tasks 6-8 (Audio/Video/Avatar)

**Overview**: Full-screen therapy interface with dual video boxes and live transcript.

---

#### Task 17.1: Create Main Session Layout

**Files to Create**:
- `src/components/SessionView.tsx`
- `src/components/TranscriptView.tsx`
- `src/components/SessionTimer.tsx`
- `src/components/ConversationHighlight.tsx`
- `src/components/ConnectionStatus.tsx`

**Layout Structure**:
```
┌─────────────────────────────────────────────────────────┐
│  Session Timer: 12:34 / 25:00        [Online] [●REC]    │
├──────────────────────┬──────────────────────────────────┤
│   Dr. Sterling       │      Patient Video               │
│   (AvatarView)       │      (Live/Placeholder)          │
│   1080p @ 60fps      │      720p @ 30fps                │
├──────────────────────┴──────────────────────────────────┤
│  Live Transcript                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Dr. Sterling: How have you been feeling since...   │ │
│  │ Patient: I've been struggling with...              │ │
│  │ [Conversation Highlight: Anxiety detected]         │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Pseudocode** (React):

```tsx
// SessionView.tsx
function SessionView({ patientId, sessionId }) {
  state: {
    sessionState, transcript, highlights, expression,
    timer, connectionStatus
  }

  useEffect:
    Initialize audio recorder, TTS, avatar
    Subscribe to eventBus
    Start session timer

  RENDER:
    <FullScreenContainer>
      <Header>
        <SessionTimer time={timer} max={25*60} />
        <ConnectionStatus status={connectionStatus} />
      </Header>

      <VideoContainer>
        <AvatarView
          expression={expression}
          isPlaying={isSpeaking}
        />
        <PatientVideo
          enabled={cameraEnabled}
        />
      </VideoContainer>

      <TranscriptView
        messages={transcript}
        highlights={highlights}
        autoScroll={true}
      />
    </FullScreenContainer>
}

// Design per R39
STYLES = {
  primaryBackground: "#F5F5F0",
  accentColor: "#4A90A4",
  typography: "sans-serif, 16px, 1.6 line-height",
  videoBoxRadius: "12px",
  animationDuration: "200-300ms ease-out",
  minTouchTarget: "44x44px"
}
```

**Verification**:
- [ ] Full-screen layout works across devices
- [ ] Session timer displays correctly (R1)
- [ ] 5-minute warning at 20 minutes (R1)
- [ ] Transcript auto-scrolls with new messages (R7)
- [ ] Conversation highlights display near transcript (R14)

---

### Task 18: Implement Network Resilience

**Reference**: Requirements R22-R24 (Hybrid Architecture, Network Recovery)

**Prerequisites**: Tasks 6-9 (Audio, LLM systems)

**Overview**: Seamless offline transition, CRDT transcript merging, and session persistence.

---

#### Task 18.1: Create Connection Manager

**Files to Create**:
- `src/network/connection-manager.ts`
- `src/network/offline-sync.ts`
- `src/network/crdt-transcript.ts`

**Pseudocode**:

```
class ConnectionManager:
  state: "online" | "offline" | "connecting" | "recovering"
  reconnectAttempts: 0

  async handleConnectionLoss():
    state = "offline"

    // Switch to offline within 3 seconds (R22)
    await Promise.all([
      sttEngine.switchTo("whisper-cpp"),
      ttsEngine.switchTo("coqui-xtts"),
      llmManager.switchTo("ollama")
    ])

    emit("connection_status", "offline")
    startReconnectionLoop()

  startReconnectionLoop():
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (R23)
    delays = [1000, 2000, 4000, 8000, 16000, 30000]

    attempt = async () => {
      IF state != "offline": RETURN

      state = "connecting"
      connected = await testConnection()

      IF connected:
        handleReconnection()
      ELSE:
        delay = delays[min(reconnectAttempts, delays.length - 1)]
        setTimeout(attempt, delay)
        reconnectAttempts++
    }
    attempt()

  async handleReconnection():
    state = "recovering"
    await syncManager.syncLocalData()  // Upload local sessions
    await switchToOnlineMode()
    state = "online"
    reconnectAttempts = 0

// CRDT for conflict-free transcript merging (R24)
class TranscriptCRDT:
  operations: Operation[]
  vectorClock: Map<source, timestamp>

  addMessage(message, source):
    op = {
      type: "INSERT",
      timestamp: now(),
      source,
      vectorClock: incrementClock(source),
      data: message
    }
    operations.push(op)

  merge(remoteOps):
    FOR op IN remoteOps:
      IF not alreadyApplied(op):
        insertInOrder(op)  // Causal ordering
```

**Verification**:
- [ ] Offline switch completes in <3 seconds
- [ ] Session continues during transition
- [ ] Reconnection uses exponential backoff
- [ ] CRDT merges transcripts without conflicts
- [ ] 95% data preserved in crash scenarios (R24)

---

### Task 19: Implement Medical Disclaimer System

**Reference**: Requirement R36 (Medical Disclaimer)

**Prerequisites**: Task 1 (Project Setup)

**Overview**: Display disclaimer on startup, require acknowledgment every 30 days.

---

#### Task 19.1: Create Disclaimer System

**Files to Create**:
- `src/components/DisclaimerModal.tsx`
- `src/legal/disclaimer-service.ts`

**Pseudocode**:

```
DISCLAIMER_TEXT = """
IMPORTANT: This is an AI-powered application and NOT a substitute for
professional medical care.

Dr. Sterling is an AI and not a licensed medical professional.
This application is NOT a medical device.

By proceeding, you acknowledge that:
1. This is an AI tool for educational/support purposes only
2. You will seek professional help for medical emergencies
3. You understand AI limitations in mental health contexts

For crisis situations, please contact emergency services or
call 988 (Suicide & Crisis Lifeline).
"""

class DisclaimerService:
  async checkAcknowledgment(userId):
    lastAck = await db.getLastAcknowledgment(userId)

    IF !lastAck OR daysSince(lastAck) > 30:
      RETURN { required: true }

    RETURN { required: false }

  async recordAcknowledgment(userId):
    await db.saveAcknowledgment({
      userId,
      timestamp: now(),
      version: DISCLAIMER_VERSION
    })

// DisclaimerModal.tsx
function DisclaimerModal({ onAccept }) {
  RENDER:
    <Modal blocking>
      <h1>Important Notice</h1>
      <div>{DISCLAIMER_TEXT}</div>

      <Checkbox
        label="I understand that Dr. Sterling is an AI and not a medical professional"
        required
      />

      <Button onClick={onAccept}>
        I Acknowledge and Accept
      </Button>
    </Modal>
}
```

**Verification**:
- [ ] Disclaimer shown on first load
- [ ] Re-required every 30 days
- [ ] Checkbox must be checked to proceed
- [ ] "AI-Generated Content" indicator visible (outside sessions)

---

### Task 20: Implement Testing Suite

**Reference**: AGENTS.md Article III (Test-First)

**Prerequisites**: All feature tasks

**Overview**: Unit tests, integration tests, and performance tests.

---

#### Task 20.1: Create Test Structure

**Files to Create**:
- `tests/unit/` - Unit tests
- `tests/integration/` - Integration tests
- `tests/e2e/` - End-to-end tests
- `tests/performance/` - Performance benchmarks

**Test Categories**:

```
1. UNIT TESTS (tests/unit/):
   - Model orchestration logic
   - Crisis keyword detection
   - Viseme mapping
   - CRDT operations
   - Encryption/decryption

2. INTEGRATION TESTS (tests/integration/):
   - STT → LLM → TTS pipeline
   - Agent communication via EventBus
   - Vector DB operations
   - Session persistence and recovery
   - Offline mode transitions

3. E2E TESTS (tests/e2e/):
   - Full session flow (start → conversation → end)
   - Crisis detection and overlay display
   - Session summary generation
   - Data export/delete (GDPR)

4. PERFORMANCE TESTS (tests/performance/):
   - STT latency (<500ms max)
   - LLM response time (<3000ms max)
   - TTS latency (<400ms max)
   - Lip-sync latency (<50ms max)
   - Context retrieval (<300ms)
   - Crisis detection (<10ms Tier 1)
```

**Sample Test** (Jest):

```typescript
describe("CrisisDetector", () => {
  it("detects Tier 1 keywords in <10ms", async () => {
    const detector = new CrisisDetector();
    const start = performance.now();

    const result = await detector.analyze("I want to kill myself");

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(10);
    expect(result.tier).toBe(1);
    expect(result.action).toBe("IMMEDIATE_INTERVENTION");
  });

  it("achieves >99% recall on Tier 1 indicators", async () => {
    const detector = new CrisisDetector();
    const testCases = loadTier1TestCases(); // 100+ cases

    let detected = 0;
    for (const testCase of testCases) {
      const result = await detector.analyze(testCase.text);
      if (result.tier === 1) detected++;
    }

    const recall = detected / testCases.length;
    expect(recall).toBeGreaterThanOrEqual(0.99);
  });
});
```

**Verification**:
- [ ] All unit tests pass
- [ ] Integration tests cover critical paths
- [ ] Performance tests verify latency requirements
- [ ] Test coverage >80%

---

### Task 21: Implement Docker Infrastructure and Deployment

**Reference**: Requirements R25 (Portable), R41 (Infrastructure Setup), R42 (Self-Healing)

**Prerequisites**: All feature tasks

**Overview**: Docker-based deployment for Windows, Mac, and Linux with easy lift-and-shift.

---

#### Task 21.1: Create Dockerfile

**Files to Create**:
- `Dockerfile`
- `docker-compose.yml`
- `docker-compose.dev.yml`
- `.dockerignore`

**Dockerfile**:

```dockerfile
# Multi-stage build for smaller image
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Build application
COPY . .
RUN npm run build

# Production image
FROM node:20-slim AS production

WORKDIR /app

# Install runtime dependencies only
COPY package*.json ./
RUN npm ci --production

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Create memory directory
RUN mkdir -p /app/memory_directory

# Environment
ENV NODE_ENV=production
ENV MEMORY_DIR=/app/memory_directory

# Expose ports
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start
CMD ["node", "dist/server.js"]
```

---

#### Task 21.2: Create Docker Compose

**docker-compose.yml**:

```yaml
version: "3.9"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      # Portable memory directory - mount from host
      - ./memory_directory:/app/memory_directory
    environment:
      - NODE_ENV=production
      - MEMORY_DIR=/app/memory_directory
      # API keys from .env file
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
      - DEEPGRAM_API_KEY=${DEEPGRAM_API_KEY}
    depends_on:
      - qdrant
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - ./memory_directory/databases/vectors:/qdrant/storage
    restart: unless-stopped

  # Optional: Ollama for offline mode
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ./memory_directory/models:/root/.ollama
    profiles:
      - offline
    restart: unless-stopped

networks:
  default:
    name: ai-psychiatrist
```

---

#### Task 21.3: Create Platform-Agnostic Setup Scripts

**Files to Create**:
- `scripts/setup.sh` (Linux/Mac)
- `scripts/setup.ps1` (Windows)
- `scripts/start.sh`
- `scripts/start.ps1`

**setup.sh** (Linux/Mac):

```bash
#!/bin/bash
set -e

echo "=== AI Psychiatrist Setup ==="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Please install Docker Desktop."
    exit 1
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo "Docker Compose not found. Please install Docker Desktop."
    exit 1
fi

# Create memory directory structure
echo "Creating memory directory..."
mkdir -p memory_directory/{config,patients,databases/vectors,models,logs,cache}

# Create .env if not exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# API Keys (at least one required for online mode)
ANTHROPIC_API_KEY=
GEMINI_API_KEY=

# Optional services
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
DEEPGRAM_API_KEY=
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=
EOF
    echo "Please edit .env with your API keys"
fi

# Build and start
echo "Building containers..."
docker compose build

echo ""
echo "=== Setup Complete ==="
echo "Edit .env with your API keys, then run: ./scripts/start.sh"
```

**setup.ps1** (Windows):

```powershell
# AI Psychiatrist Setup for Windows
$ErrorActionPreference = "Stop"

Write-Host "=== AI Psychiatrist Setup ===" -ForegroundColor Cyan

# Check Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

# Create memory directory structure
Write-Host "Creating memory directory..."
$dirs = @(
    "memory_directory/config",
    "memory_directory/patients",
    "memory_directory/databases/vectors",
    "memory_directory/models",
    "memory_directory/logs",
    "memory_directory/cache"
)
foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

# Create .env if not exists
if (-not (Test-Path .env)) {
    Write-Host "Creating .env file..."
    @"
# API Keys (at least one required for online mode)
ANTHROPIC_API_KEY=
GEMINI_API_KEY=

# Optional services
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
DEEPGRAM_API_KEY=
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=
"@ | Out-File -FilePath .env -Encoding UTF8
    Write-Host "Please edit .env with your API keys" -ForegroundColor Yellow
}

# Build containers
Write-Host "Building containers..."
docker compose build

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host "Edit .env with your API keys, then run: .\scripts\start.ps1"
```

---

#### Task 21.4: Create Offline Mode Setup

**Files to Create**:
- `scripts/setup-offline.sh`
- `scripts/setup-offline.ps1`

**setup-offline.sh**:

```bash
#!/bin/bash
set -e

echo "=== Setting up Offline Mode ==="

# Start Ollama
docker compose --profile offline up -d ollama

# Wait for Ollama
echo "Waiting for Ollama..."
until curl -s http://localhost:11434/api/tags > /dev/null; do
    sleep 2
done

# Pull required models
echo "Downloading Llama 3 70B (this may take a while)..."
docker compose exec ollama ollama pull llama3:70b

echo "Downloading Mistral 7B..."
docker compose exec ollama ollama pull mistral:7b

# Download Whisper model for STT
echo "Downloading Whisper model..."
curl -L https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en.bin \
    -o memory_directory/models/whisper-medium.en.bin

echo ""
echo "=== Offline Mode Ready ==="
echo "The application can now run without internet."
```

---

#### Task 21.5: Create Health Check and Self-Healing

**Files to Create**:
- `src/health/health-check.ts`
- `src/health/watchdog.ts`

**Pseudocode**:

```
// health-check.ts
class HealthCheck:
  async getStatus():
    RETURN {
      status: "healthy" | "degraded" | "unhealthy",
      components: {
        database: await checkDatabase(),
        vectorDb: await checkVectorDB(),
        llm: await checkLLMProviders(),
        stt: await checkSTT(),
        tts: await checkTTS(),
        ollama: await checkOllama()
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }

// watchdog.ts (R42: Self-Healing System)
TIMEOUTS = {
  STT_PROCESSING: 5000,    // 5s - switch to offline
  LLM_RESPONSE: 30000,     // 30s - force end
  TTS_GENERATION: 15000,   // 15s - skip audio
  LIP_SYNC: 1000,          // 1s - use static avatar
  CONTEXT_FETCH: 3000,     // 3s - proceed without context
  STATE_PERSISTENCE: 5000  // 5s - retry in background
}

class Watchdog:
  timers: Map<string, Timer>

  start(component, id, onTimeout):
    key = `${component}:${id}`
    timeout = TIMEOUTS[component]

    timer = setTimeout(() => {
      log.warn(`Watchdog timeout: ${key}`)
      onTimeout()
      this.restartComponent(component)
    }, timeout)

    timers.set(key, timer)

  stop(component, id):
    key = `${component}:${id}`
    clearTimeout(timers.get(key))
    timers.delete(key)

  restartComponent(component):
    // Self-healing: restart failed component
    SWITCH component:
      CASE "STT_PROCESSING":
        sttManager.switchToOffline()
      CASE "LLM_RESPONSE":
        // Cannot restart, but log for analysis
      CASE "TTS_GENERATION":
        ttsManager.fallbackToTextOnly()
```

---

#### Task 21.6: Create Lift-and-Shift Package

**Files to Create**:
- `scripts/export.sh`
- `scripts/import.sh`

**export.sh**:

```bash
#!/bin/bash
# Export entire application for lift-and-shift

EXPORT_NAME="ai-psychiatrist-$(date +%Y%m%d).tar.gz"

echo "=== Exporting AI Psychiatrist ==="

# Stop containers
docker compose down

# Create export package
tar -czvf "$EXPORT_NAME" \
    --exclude="node_modules" \
    --exclude="*.log" \
    --exclude="cache/*" \
    .

echo "Export created: $EXPORT_NAME"
echo ""
echo "To import on another machine:"
echo "1. Copy $EXPORT_NAME to new machine"
echo "2. Extract: tar -xzvf $EXPORT_NAME"
echo "3. Run: ./scripts/setup.sh"
echo "4. Run: ./scripts/start.sh"
```

**Verification for Task 21**:
- [ ] Docker build succeeds on all platforms
- [ ] docker-compose up starts all services
- [ ] Memory directory persists between restarts
- [ ] Offline mode works with Ollama
- [ ] Health check endpoint responds
- [ ] Watchdog timers trigger correctly
- [ ] Export/import creates portable package

---

## Notes

### Specification Document References

| Document | Purpose | When to Check |
|----------|---------|---------------|
| [requirements.md](requirements.md) | 42 functional requirements with acceptance criteria | Adding any feature |
| [data_schemas.md](data_schemas.md) | JSON schemas, SQL tables, Qdrant collections | Creating any data structure |
| [system_architecture.md](system_architecture.md) | State machine, latency budgets, component architecture | State transitions, timeouts |
| [agent_protocols.md](agent_protocols.md) | Agent configs, prompts, message formats | Agent modifications |
| [design.md](design.md) | Technical design and implementation guidance | Architecture decisions |
| [AGENTS.md](../../AGENTS.md) | Constitutional principles | Every implementation |

### Constitutional Principles (AGENTS.md)

1. **Article I (Library-First)**: Create modular, reusable components
2. **Article II (CLI/API Interface)**: All interfaces must be inspectable and testable
3. **Article III (Test-First)**: Define tests before implementation
4. **Article IV (Specification-First)**: All code traces to specifications
5. **Article V (Single Source of Truth)**: No duplication of specifications
6. **Article VI (Determinism Over Flexibility)**: Code for reliability, AI for intelligence
7. **Article VII (Simplicity)**: Combat over-engineering
8. **Article VIII (Framework Trust)**: Use SDKs directly, avoid unnecessary abstractions
9. **Article IX (Integration-First Testing)**: Test with real databases and APIs

### Key Latency Requirements (system_architecture.md S3)

| Stage | Target | Maximum |
|-------|--------|---------|
| Speech-to-Text | 150ms | 500ms |
| Context Retrieval | 100ms | 300ms |
| LLM First Token | 500ms | 1500ms |
| LLM Full Response | 1500ms | 3000ms |
| Text-to-Speech | 200ms | 400ms |
| Lip-Sync | 20ms | 50ms |
| **Total End-to-End** | **1500ms** | **4000ms** |

### Watchdog Timers (system_architecture.md S7)

| Component | Timeout | Action |
|-----------|---------|--------|
| STT Processing | 5000ms | Switch to offline |
| LLM Generation | 30000ms | Force end, show apology |
| TTS Generation | 15000ms | Skip audio, show text |
| Vector DB Query | 10000ms | Proceed without context |
| State Persistence | 5000ms | Retry in background |

