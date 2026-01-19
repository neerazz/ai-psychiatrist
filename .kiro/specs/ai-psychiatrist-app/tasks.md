# Implementation Tasks: AI Psychiatrist Web Application

> **Status**: Not Started  
> **Last Updated**: 2026-01-18  
> **Total Tasks**: 21 major tasks with subtasks

---

## Phase 1: Foundation & Infrastructure

### Task 1: Project Setup and Configuration
**References**: Requirements R41, Design Component 18, AGENTS.md Article I-II

- [ ] 1.1 Initialize Node.js project with TypeScript and configure tsconfig.json
- [ ] 1.2 Set up project directory structure (src/, memory_directory/, scripts/, tests/)
- [ ] 1.3 Create Memory_Directory structure following data_schemas.md S3 (config/, patients/, databases/, models/, logs/, cache/)
- [ ] 1.4 Implement environment configuration system (.env file with ANTHROPIC_API_KEY, GEMINI_API_KEY validation)
- [ ] 1.5 Set up logging system using Winston with structured logging (audit.log, errors.log, crisis_events.log)
- [ ] 1.6 Create package.json with all required dependencies (express, socket.io, sqlite3, @anthropic-ai/sdk, @google/generative-ai, etc.)
- [ ] 1.7 Implement configuration validation system for API keys and hardware requirements

### Task 2: Database Infrastructure
**References**: Requirements R25-R27, data_schemas.md S3-S4, AGENTS.md Article IX

- [ ] 2.1 Install and configure SQLite with SQLCipher for encryption
- [ ] 2.2 Implement database schema from data_schemas.md (patients, sessions, session_metadata, audit_log tables)
- [ ] 2.3 Create database initialization script (creates tables, indexes, constraints)
- [ ] 2.4 Set up Qdrant vector database locally (Docker or standalone) with patient_memories collection
- [ ] 2.5 Implement database connection manager with health checks
- [ ] 2.6 Create database utility functions (query, insert, update, delete with error handling)
- [ ] 2.7 Implement audit logging system with HMAC signatures for tamper detection

### Task 3: Security and Encryption System
**References**: Requirements R37-R38, Design Component 16, AGENTS.md Article VI

- [ ] 3.1 Implement EncryptionManager class with AES-256-GCM encryption for data at rest
- [ ] 3.2 Create patient-specific key derivation using PBKDF2 (100,000 iterations, SHA-256)
- [ ] 3.3 Implement master key generation and secure storage (encrypted with system key)
- [ ] 3.4 Create encryption/decryption utilities for files (encryptFile, decryptFile functions)
- [ ] 3.5 Implement TLS 1.3 configuration for Express server (HTTPS)
- [ ] 3.6 Create data export functionality (exportPatientData function for GDPR/CCPA compliance)
- [ ] 3.7 Implement secure data deletion with audit trail preservation (deletePatientData function)

---

## Phase 2: Core Session Management

### Task 4: Session State Machine
**References**: Requirements R1, system_architecture.md S2, AGENTS.md Article VI

- [ ] 4.1 Implement SessionStateMachine class with all states (INIT, LOADING, READY, ACTIVE_LISTENING, PROCESSING_STT, PROCESSING_LLM, PROCESSING_TTS, SPEAKING, PAUSED, COMPLETE, ERROR)
- [ ] 4.2 Create state transition logic with guards and validation
- [ ] 4.3 Implement watchdog timers for each state (STT: 5s, LLM: 30s, TTS: 5s, Vector DB: 10s)
- [ ] 4.4 Create state persistence system (auto-save every 30 seconds to memory_directory)
- [ ] 4.5 Implement CRDT-based TranscriptCRDT class for transcript merging during offline/online transitions
- [ ] 4.6 Create session recovery system (resumeSession function for crash scenarios)
- [ ] 4.7 Implement SessionTimer class with 5-minute warning at 20 minutes and auto-end at 25 minutes

### Task 5: Patient Data Management
**References**: Requirements R9-R11, data_schemas.md S1, AGENTS.md Article IV

- [ ] 5.1 Implement Patient_Overview schema validation using JSON Schema (validate against data_schemas.md S1)
- [ ] 5.2 Create PatientContextLoader class with two-phase loading (executive summary 500 tokens + on-demand details)
- [ ] 5.3 Implement comprehensive memory capture system (extract hobbies, aspirations, casual mentions from transcripts)
- [ ] 5.4 Create MedicationTracker class with structured medication schema (name, dosage, effects, side effects, temporal tracking)
- [ ] 5.5 Implement patient overview update system with conflict resolution (latest-wins with audit trail)
- [ ] 5.6 Create patient overview versioning system (store revision history with timestamps)
- [ ] 5.7 Implement patient data validation and sanitization utilities

---

## Phase 3: Real-Time Communication Pipeline

### Task 6: Speech-to-Text System
**References**: Requirements R4, Design Component 2, AGENTS.md Article VIII

- [ ] 6.1 Implement STTEngine interface with switchable providers (Deepgram, Google, Whisper)
- [ ] 6.2 Create DeepgramSTT class for online primary STT (Nova-2 model, streaming transcription)
- [ ] 6.3 Create GoogleSTT class for online fallback (Speech-to-Text v2 API)
- [ ] 6.4 Create WhisperSTT class for offline STT (whisper.cpp integration, medium.en model)
- [ ] 6.5 Implement streaming transcription pipeline with VAD-based silence detection (500ms threshold)
- [ ] 6.6 Create automatic fallback chain (Deepgram → Google → Whisper with error handling)
- [ ] 6.7 Implement audio buffer management (16kHz, 16-bit PCM, mono) and graceful handling of pauses/emotional speech

### Task 7: Text-to-Speech System
**References**: Requirements R5, Design Component 2, AGENTS.md Article VIII

- [ ] 7.1 Implement TTSEngine interface with switchable providers (ElevenLabs, Azure, Coqui)
- [ ] 7.2 Create ElevenLabsTTS class for online primary TTS (custom "Dr. Sterling" voice)
- [ ] 7.3 Create AzureTTS class for online fallback (Neural TTS, en-US-GuyNeural voice)
- [ ] 7.4 Create CoquiTTS class for offline TTS (XTTS v2 with cloned voice)
- [ ] 7.5 Configure voice parameters (pitch: 120-180Hz, rate: 0.85-0.95x, SSML support for emotional modulation)
- [ ] 7.6 Implement streaming TTS synthesis pipeline (chunk-based audio generation)
- [ ] 7.7 Create automatic fallback chain (ElevenLabs → Azure → Coqui with error handling)

### Task 8: Lip-Sync Animation System
**References**: Requirements R6, Design Component 3

- [ ] 8.1 Integrate Rhubarb Lip Sync library for viseme generation from audio
- [ ] 8.2 Set up Three.js scene with Ready Player Me avatar rendering
- [ ] 8.3 Configure 52 ARKit blend shapes for facial expressions (neutral, concerned, warm, thoughtful)
- [ ] 8.4 Create real-time viseme-to-blend-shape animation pipeline (<50ms audio-visual sync)
- [ ] 8.5 Implement emotional expression system (map therapeutic states to blend shape combinations)
- [ ] 8.6 Optimize rendering for 60fps target (WebGL hardware acceleration, LOD optimization)
- [ ] 8.7 Create AvatarRenderer component with performance monitoring (minimum 30fps enforcement)

---

## Phase 4: AI Agent Architecture

### Task 9: Model Orchestration System
**References**: Requirements R20-R21, agent_protocols.md S5, AGENTS.md Article VIII

- [ ] 9.1 Implement ModelOrchestrator class with smart model selection based on available API keys
- [ ] 9.2 Create ClaudeProvider class (Anthropic SDK, Claude Sonnet 4.5 with extended thinking)
- [ ] 9.3 Create GeminiProvider class (Google Generative AI SDK, Gemini 1.5 Pro/Flash)
- [ ] 9.4 Create OllamaProvider class for offline mode (Llama 3 70B, Mistral 7B, Llama 3 8B)
- [ ] 9.5 Implement model configuration system (temperature, top-p, top-k, thinking budget per agent)
- [ ] 9.6 Create model health checks and automatic failover logic
- [ ] 9.7 Implement model parameter enforcement (Dr. Sterling: temp 0.25, thinking budget 32768)

### Task 10: Multi-Agent Communication System
**References**: Requirements R17-R19, agent_protocols.md S2-S3, AGENTS.md Article II

- [ ] 10.1 Implement AgentEventBus class for inter-agent communication (event-driven architecture)
- [ ] 10.2 Create agent message protocol (JSON schema from agent_protocols.md with correlation IDs)
- [ ] 10.3 Implement OptimisticExecutor class (Dr. Sterling starts immediately, context injected if <200ms)
- [ ] 10.4 Create agent coordination system with timeout-based fallbacks (200ms context timeout)
- [ ] 10.5 Implement context pipelining for late-arriving context (queue for next turn)
- [ ] 10.6 Create agent health monitoring and error recovery system
- [ ] 10.7 Implement request-response tracking with correlation IDs and latency monitoring

### Task 11: Dr. Sterling Agent
**References**: Requirements R2-R3, R33-R35, agent_protocols.md S4.1, AGENTS.md Article VI

- [ ] 11.1 Implement DrSterlingAgent class with Claude Sonnet 4.5 (primary) or Gemini 1.5 Pro (fallback)
- [ ] 11.2 Configure system prompt with therapeutic directives from agent_protocols.md S4.1
- [ ] 11.3 Implement proactive session initiation (load patient context, generate opening based on history)
- [ ] 11.4 Create opinionated therapeutic advocacy behavior (challenge harmful statements constructively)
- [ ] 11.5 Implement holistic life exploration across 8 domains (mental health, career, relationships, physical health, finances, hobbies, personal growth, social connections)
- [ ] 11.6 Create research-based response system (never "I don't know", conduct research before responding)
- [ ] 11.7 Implement extended thinking budget (32768 tokens) for complex cases and document generation

### Task 12: Support Agents (Context Fetcher, Deep Researcher, Analyst AI)
**References**: Requirements R17-R19, R29, agent_protocols.md S4.2-S4.4, AGENTS.md Article VI

- [ ] 12.1 Implement ContextFetcherAgent class with vector DB retrieval (Gemini Flash or Claude)
- [ ] 12.2 Create hybrid retrieval system (70% vector similarity + 30% BM25 keyword matching)
- [ ] 12.3 Implement DeepResearcherAgent class for background research (Gemini Pro or Claude)
- [ ] 12.4 Create parallel research threading system (max 3 concurrent threads with PII sanitization)
- [ ] 12.5 Implement AnalystAIAgent class for needs assessment and coordination (Gemini Pro or Claude)
- [ ] 12.6 Create agent perspective diversity system for end-of-session discussion (different analytical viewpoints)
- [ ] 12.7 Implement PII sanitization for external research queries (remove names, locations, specific details)

---

## Phase 5: Advanced Features

### Task 13: Vector Database and Embeddings
**References**: Requirements R27-R28, data_schemas.md S4, AGENTS.md Article IX

- [ ] 13.1 Implement EmbeddingManager class using text-embedding-3-large (OpenAI)
- [ ] 13.2 Create chunking strategy (transcripts: 512 tokens/64 overlap, memories: 256/32, insights: 384/48)
- [ ] 13.3 Implement batch embedding processing (10 chunks at a time with rate limiting)
- [ ] 13.4 Create embedding job queue and status monitoring (PENDING, PROCESSING, COMPLETE, ERROR)
- [ ] 13.5 Implement on-demand embedding rebuild functionality (rebuildEmbeddings function)
- [ ] 13.6 Create embedding cache to avoid re-processing unchanged content
- [ ] 13.7 Implement embedding status UI indicators (progress percentage, ETA, queue status)

### Task 14: Crisis Detection System
**References**: Requirements R31-R32, Design Component 10, AGENTS.md Article VI

- [ ] 14.1 Implement CrisisDetector class with three-tier detection (Tier 1: <10ms keywords, Tier 2: <100ms sentiment, Tier 3: <500ms deep analysis)
- [ ] 14.2 Create crisis keyword database with fuzzy matching (Levenshtein distance, threshold 0.85)
- [ ] 14.3 Implement safety interruption protocol for Tier 1 crises (pause session, display crisis overlay)
- [ ] 14.4 Create crisis resources database by region (US, UK, Canada, Australia, India, International)
- [ ] 14.5 Implement crisis overlay UI with emergency contacts (phone, text, emergency services)
- [ ] 14.6 Create crisis event logging (privacy-preserved, no sensitive content details)
- [ ] 14.7 Implement >99% recall target for Tier 1 indicators (test with crisis keyword dataset)

### Task 15: Sentiment Analysis and Clinical Insights
**References**: Requirements R14-R16, Design Component 11

- [ ] 15.1 Implement SentimentAnalyzer class for real-time emotional state detection (<200ms)
- [ ] 15.2 Create conversation highlights display system (anxiety, depression, breakthrough, resistance indicators)
- [ ] 15.3 Implement parallel Pro AI analysis for abnormal sentiments (REST API call to Claude/Gemini Pro)
- [ ] 15.4 Create clinical insight injection system (inject into Dr. Sterling's context with HIGH priority)
- [ ] 15.5 Implement background research threading (parallel execution, non-blocking)
- [ ] 15.6 Create emotional trajectory tracking (start, middle, end states per session)
- [ ] 15.7 Implement sentiment-based response modulation (adjust Dr. Sterling's tone based on patient state)

### Task 16: Session Documentation System
**References**: Requirements R12-R13, R30, data_schemas.md S2, AGENTS.md Article IV

- [ ] 16.1 Implement session summary generation with extended thinking (32768 tokens, Claude/Gemini Pro)
- [ ] 16.2 Create session report generation (session-specific insights, breakthrough moments, emotional trajectory)
- [ ] 16.3 Implement patient overview update system (merge new insights, resolve conflicts with latest-wins)
- [ ] 16.4 Create memory update with conflict resolution (audit trail preservation)
- [ ] 16.5 Implement PDF export for session summaries (patient name personalization)
- [ ] 16.6 Create patient name personalization throughout documents (replace placeholders with actual name)
- [ ] 16.7 Implement post-session embedding generation queue (batch process after session completion)

---

## Phase 6: User Interface

### Task 17: React Frontend Application
**References**: Requirements R8, R39-R40, Design Component 17, AGENTS.md Article I

- [ ] 17.1 Set up React 18 project with TypeScript and Vite
- [ ] 17.2 Implement full-screen immersive layout (AppLayout component)
- [ ] 17.3 Create dual video box layout (Dr. Sterling avatar + Patient video with placeholder)
- [ ] 17.4 Implement live transcript display with auto-scroll (TranscriptPanel component)
- [ ] 17.5 Create session timer UI with 5-minute warning (SessionTimer component)
- [ ] 17.6 Implement connection status indicators (ConnectionStatus component)
- [ ] 17.7 Create conversation highlights display (ConversationHighlights component)
- [ ] 17.8 Implement responsive design (desktop, tablet, mobile breakpoints)
- [ ] 17.9 Create progress tracking dashboard (MoodTrajectory, SessionMetrics, TreatmentGoals, TopicsExplored)
- [ ] 17.10 Implement calming color palette and professional typography (Tailwind CSS design system)

### Task 18: Network Resilience and Offline Mode
**References**: Requirements R22-R24, Design Component 15, AGENTS.md Article VI

- [ ] 18.1 Implement ConnectionManager class with state machine (ONLINE, OFFLINE, CONNECTING, OFFLINE_RECOVERY)
- [ ] 18.2 Create <3 second offline transition system (switch STT/TTS/LLM to local models)
- [ ] 18.3 Implement automatic reconnection with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- [ ] 18.4 Create SyncManager for local-to-cloud data synchronization (upload local state on reconnection)
- [ ] 18.5 Implement CRDT-based transcript merging (merge local and cloud operations deterministically)
- [ ] 18.6 Create session state persistence (every 30 seconds to local storage and cloud if online)
- [ ] 18.7 Implement "Resume Previous Session" functionality (load most recent state, merge if needed)

---

## Phase 7: Compliance and Polish

### Task 19: Medical Disclaimer and Compliance
**References**: Requirements R36, R38, AGENTS.md Article VI

- [ ] 19.1 Implement DisclaimerManager class with startup medical disclaimer modal
- [ ] 19.2 Create 30-day re-acknowledgment system (track last acknowledgment date)
- [ ] 19.3 Implement Terms of Service acceptance flow (modal with "I Understand" button)
- [ ] 19.4 Create "AI-Generated Content" indicator (subtle, permanent display outside session view)
- [ ] 19.5 Implement audit log retention (6 years minimum, append-only with HMAC signatures)
- [ ] 19.6 Create data export functionality (GDPR/CCPA, exportPatientData function)
- [ ] 19.7 Implement secure data deletion with confirmation (deletePatientData with "DELETE-{patientId}" confirmation)

### Task 20: Testing and Quality Assurance
**References**: Design Testing Strategy, AGENTS.md Article III

- [ ] 20.1 Write unit tests for state machine transitions (SessionStateMachine, all states and guards)
- [ ] 20.2 Write integration tests for session lifecycle (start, conversation, end, summary generation)
- [ ] 20.3 Write performance tests for latency requirements (P95 < 4000ms end-to-end, measure STT/LLM/TTS stages)
- [ ] 20.4 Write security tests for encryption and access controls (test AES-256-GCM, key derivation, audit logs)
- [ ] 20.5 Implement end-to-end tests for complete user flows (session start to completion with all agents)
- [ ] 20.6 Create load testing for concurrent session handling (test multiple simultaneous sessions)
- [ ] 20.7 Implement monitoring and observability (MetricsCollector for P50/P95/P99 latencies)

### Task 21: Documentation and Deployment
**References**: Requirements R41-R42, AGENTS.md Article I

- [ ] 21.1 Create user documentation and quick start guide (README.md with setup instructions)
- [ ] 21.2 Write developer documentation for architecture and APIs (API.md with endpoints, schemas)
- [ ] 21.3 Create deployment guides for Windows, Mac, Linux (platform-specific setup.sh/setup.ps1)
- [ ] 21.4 Implement automated infrastructure setup scripts (install Node.js, Ollama, Whisper.cpp, Coqui XTTS, Qdrant)
- [ ] 21.5 Create Docker Compose configuration for production deployment (backend, frontend, Qdrant services)
- [ ] 21.6 Implement health check endpoints (/health, /api/health with component status)
- [ ] 21.7 Create monitoring dashboards and alerting (Grafana/Prometheus or simple logging dashboard)

---

## Notes

- All tasks must strictly adhere to schemas defined in data_schemas.md
- All state transitions must follow system_architecture.md state machine
- All agent communication must use protocols from agent_protocols.md
- All implementations must follow AGENTS.md constitutional principles
- Latency requirements from system_architecture.md S3 must be met
- Security requirements from requirements.md R37-R38 are mandatory
- Follow AGENTS.md Article I (Library-First Principle) - create modular, reusable components
- Follow AGENTS.md Article VI (Determinism Over Flexibility) - use code for reliability, AI for intelligence
- Follow AGENTS.md Article VIII (Framework Trust) - use SDKs directly, avoid unnecessary abstractions
- Follow AGENTS.md Article IX (Integration-First Testing) - test with real databases and APIs

