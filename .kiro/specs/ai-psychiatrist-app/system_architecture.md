# System Architecture & State Machine

This document defines the system architecture, state machines, latency requirements, and component interactions for the AI Psychiatrist application.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │  Avatar Box │  │ Patient Box │  │  Transcript │  │   Controls/Timer    ││
│  │  (Dr.S)     │  │  (Camera)   │  │    View     │  │   Highlights        ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘│
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────┐
│                           ORCHESTRATION LAYER                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Session State Manager                             │   │
│  │  • State Machine Control  • Timer Management  • Event Dispatch       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌──────────────┬─────────────────┼──────────────────┬─────────────────┐   │
│  │              │                 │                  │                 │   │
│  ▼              ▼                 ▼                  ▼                 ▼   │
│ ┌────┐      ┌────────┐      ┌──────────┐      ┌──────────┐      ┌──────┐  │
│ │STT │      │  LLM   │      │   TTS    │      │ Lip-Sync │      │Crisis│  │
│ │Mgr │      │ Router │      │  Engine  │      │  Engine  │      │ Det. │  │
│ └────┘      └────────┘      └──────────┘      └──────────┘      └──────┘  │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────┐
│                             AI AGENT LAYER                                   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Agent Coordinator                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│           │                │                │                │              │
│  ┌────────▼───────┐ ┌──────▼──────┐ ┌───────▼──────┐ ┌───────▼──────┐     │
│  │  Dr. Sterling  │ │  Context    │ │    Deep      │ │   Analyst    │     │
│  │  (Primary)     │ │  Fetcher    │ │  Researcher  │ │     AI       │     │
│  │                │ │             │ │              │ │              │     │
│  │ Claude 4.5    │ │ Gemini Flash│ │ Gemini Pro   │ │ Gemini Pro   │     │
│  └────────────────┘ └─────────────┘ └──────────────┘ └──────────────┘     │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────┐
│                              DATA LAYER                                      │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │ Session_Database│  │ Vector_Database │  │      Memory_Directory       │ │
│  │    (SQLite)     │  │    (Qdrant)     │  │   (File System Storage)     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Session State Machine

### 2.1 Primary State Diagram

```
                              ┌──────────────┐
                              │    INIT      │
                              │              │
                              └──────┬───────┘
                                     │ load_application
                                     ▼
                    ┌────────────────────────────────┐
                    │           LOADING              │
                    │  • Load config                 │
                    │  • Initialize databases        │
                    │  • Check API keys              │
                    └────────────────┬───────────────┘
                                     │ config_loaded
        ┌────────────────────────────▼────────────────────────────┐
        │                      AWAITING_PATIENT                    │
        │  • Display patient upload UI                             │
        │  • No active session                                     │
        └─────────────────────────┬────────────────────────────────┘
                                  │ patient_overview_loaded
                                  ▼
        ┌─────────────────────────────────────────────────────────┐
        │                         READY                            │
        │  • Patient context loaded                                │
        │  • "Start Session" button enabled                        │
        │  • Timer: 30s inactivity → stay in READY                │
        └─────────────────────────┬────────────────────────────────┘
                                  │ session_started
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ACTIVE SESSION                                  │
│                                                                              │
│   ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐ │
│   │ ACTIVE_LISTENING │◄────►│  PROCESSING_STT  │◄────►│  PROCESSING_LLM  │ │
│   │                  │      │                  │      │                  │ │
│   │ • Waiting for    │      │ • Converting     │      │ • Generating     │ │
│   │   patient input  │      │   speech→text    │      │   response       │ │
│   │ • VAD active     │      │ • Max 5000ms     │      │ • Max 30000ms    │ │
│   └────────┬─────────┘      └──────────────────┘      └────────┬─────────┘ │
│            │                                                    │           │
│            │                                                    ▼           │
│            │                                          ┌──────────────────┐ │
│            │                                          │     SPEAKING     │ │
│            │                                          │                  │ │
│            │                                          │ • TTS active     │ │
│            │◄─────────────────────────────────────────│ • Lip-sync on    │ │
│            │            speech_complete               │ • Max 60000ms    │ │
│            │                                          └──────────────────┘ │
│                                                                              │
│   ┌──────────────────┐                              ┌──────────────────┐   │
│   │ CRISIS_PROTOCOL  │◄─────── crisis_detected ─────│   Any State      │   │
│   │                  │                              └──────────────────┘   │
│   │ • Safety first   │                                                     │
│   │ • Display help   │────── crisis_resolved ──────►│ ACTIVE_LISTENING │   │
│   │ • No timeout     │                              └──────────────────┘   │
│   └──────────────────┘                                                     │
│                                                                              │
│   ┌──────────────────┐                                                     │
│   │  WARNING_5MIN    │◄─────── timer_20min ────────────────────────────────│
│   │                  │                                                     │
│   │ • Visual warning │                                                     │
│   │ • Continue       │                                                     │
│   │   session        │────── timer_25min ──────────►┌──────────────────┐  │
│   └──────────────────┘                              │  SESSION_ENDING  │  │
│                                                     │                  │  │
│                                                     │ • Stop input     │  │
│                                                     │ • Generate       │  │
│                                                     │   summary        │  │
│                                                     └────────┬─────────┘  │
└──────────────────────────────────────────────────────────────┼────────────┘
                                                               │
                                                               ▼
                              ┌─────────────────────────────────────────────┐
                              │              SESSION_COMPLETE               │
                              │  • Summary displayed                        │
                              │  • Patient overview updated                 │
                              │  • Embeddings queued                        │
                              │  • "New Session" / "End" options            │
                              └─────────────────────────────────────────────┘
```

### 2.2 State Definitions

| State | Description | Entry Actions | Exit Actions | Timeout |
|-------|-------------|---------------|--------------|---------|
| `INIT` | Application starting | None | None | None |
| `LOADING` | Loading configuration and databases | Show loading UI | Hide loading | 30s → ERROR |
| `AWAITING_PATIENT` | Waiting for patient overview upload | Show upload UI | Validate overview | None |
| `READY` | Patient loaded, ready to start | Load patient context, init agents | None | None |
| `ACTIVE_LISTENING` | Waiting for patient speech | Enable VAD, show listening indicator | None | 120s → gentle prompt |
| `PROCESSING_STT` | Converting speech to text | Disable mic, show processing | None | 5s → ERROR_RECOVERY |
| `PROCESSING_LLM` | Generating AI response | Show thinking indicator, start agents | None | 30s → ERROR_RECOVERY |
| `SPEAKING` | Dr. Sterling responding | Start TTS, enable lip-sync | Stop TTS | 60s → force stop |
| `CRISIS_PROTOCOL` | Safety intervention active | Display crisis resources, pause therapy | Log event | None (manual) |
| `WARNING_5MIN` | 5-minute warning active | Show warning UI | Clear warning | 5min → SESSION_ENDING |
| `SESSION_ENDING` | Session concluding | Stop input, start summary generation | None | 60s → force complete |
| `SESSION_COMPLETE` | Session finished | Show summary, offer export | Clear session state | None |
| `ERROR_RECOVERY` | Handling errors | Log error, attempt recovery | None | 10s → ERROR |
| `ERROR` | Unrecoverable error | Show error UI, offer restart | None | None |

### 2.3 State Transitions

```typescript
interface StateTransition {
  from: SessionState;
  to: SessionState;
  trigger: string;
  guard?: () => boolean;
  action?: () => void;
}

const transitions: StateTransition[] = [
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
  { from: 'SESSION_COMPLETE', to: 'AWAITING_PATIENT', trigger: 'end_session' },
];
```

---

## 3. Latency Requirements

### 3.1 Latency Budget Breakdown

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        END-TO-END LATENCY BUDGET                            │
│                                                                              │
│  Patient Speaks                                          Dr. Sterling Speaks│
│       │                                                          ▲          │
│       ▼                                                          │          │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │   STT   │───►│ Context │───►│   LLM   │───►│   TTS   │───►│Lip-Sync │  │
│  │         │    │ Fetch   │    │         │    │         │    │         │  │
│  │150-500ms│    │ 100ms   │    │500-3000ms│   │200-400ms│    │  <50ms  │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                                                                              │
│  TOTAL TARGET: 1.5 seconds                                                  │
│  TOTAL MAXIMUM: 4.0 seconds                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Latency Specifications

| Component | Target Latency | Maximum Latency | P95 Requirement | Timeout Action |
|-----------|---------------|-----------------|-----------------|----------------|
| **Speech-to-Text** | 150ms | 500ms | 300ms | Switch to offline STT |
| **VAD Detection** | 50ms | 100ms | 80ms | Use fixed threshold |
| **Context Retrieval** | 100ms | 300ms | 200ms | Proceed without context |
| **Intent Classification** | 30ms | 80ms | 50ms | Skip classification |
| **LLM First Token** | 500ms | 1500ms | 1000ms | Show "thinking" indicator |
| **LLM Full Response** | 1500ms | 3000ms | 2500ms | Stream partial response |
| **Extended Thinking** | +1000ms | +2000ms | +1500ms | Reduce thinking budget |
| **Text-to-Speech** | 200ms | 400ms | 300ms | Switch to offline TTS |
| **Lip-Sync Processing** | 20ms | 50ms | 35ms | Use simpler animation |
| **State Persistence** | 50ms | 200ms | 100ms | Background write |
| **Vector DB Query** | 50ms | 150ms | 100ms | Reduce result count |
| **Inter-Agent Message** | 20ms | 100ms | 50ms | Direct call fallback |

### 3.3 Latency Monitoring

```typescript
interface LatencyMetrics {
  // Per-request metrics
  stt_latency_ms: number;
  context_fetch_latency_ms: number;
  llm_first_token_ms: number;
  llm_total_ms: number;
  tts_latency_ms: number;
  lipsync_latency_ms: number;
  total_e2e_ms: number;

  // Aggregated metrics (rolling window)
  p50: number;
  p95: number;
  p99: number;
  error_rate: number;
}

// Alert thresholds
const LATENCY_ALERTS = {
  p95_warning: 3000,  // ms
  p95_critical: 4000, // ms
  p99_warning: 4500,  // ms
  p99_critical: 6000, // ms
  error_rate_warning: 0.01,  // 1%
  error_rate_critical: 0.05, // 5%
};
```

---

## 4. Component Architecture

### 4.1 Speech-to-Text Manager

```typescript
interface STTManager {
  // Configuration
  config: {
    primary_engine: 'deepgram' | 'google' | 'whisper';
    fallback_engine: 'whisper';
    sample_rate: 16000;
    language: 'en-US';
    enable_streaming: true;
    silence_threshold_ms: 500;
    max_silence_seconds: 10;
  };

  // State
  current_state: 'idle' | 'listening' | 'processing' | 'error';
  connection_status: 'online' | 'offline';

  // Methods
  startListening(): Promise<void>;
  stopListening(): Promise<string>;
  processAudio(buffer: AudioBuffer): Promise<PartialTranscript>;
  switchToOffline(): void;
  switchToOnline(): void;
}
```

### 4.2 LLM Router

```typescript
interface LLMRouter {
  // Configuration based on available API keys
  mode: 'claude_only' | 'gemini_only' | 'hybrid' | 'offline';

  agents: {
    dr_sterling: {
      model: string;
      temperature: number;
      max_tokens: number;
      thinking_budget: number;
      system_prompt: string;
    };
    context_fetcher: AgentConfig;
    deep_researcher: AgentConfig;
    analyst_ai: AgentConfig;
  };

  // Routing logic
  routeRequest(request: AgentRequest): Promise<AgentResponse>;
  handleFailover(agent: string, error: Error): Promise<AgentResponse>;
  updateModelConfig(mode: string): void;
}
```

### 4.3 Crisis Detection Engine

```typescript
interface CrisisDetectionEngine {
  // Real-time monitoring
  monitorInput(text: string): CrisisAssessment;

  // Tiered response
  assessSeverity(indicators: string[]): CrisisTier;
  triggerProtocol(tier: CrisisTier): void;

  // C-SSRS Integration
  conductSafetyAssessment(): SafetyAssessmentResult;
}

interface CrisisAssessment {
  detected: boolean;
  tier: 1 | 2 | 3 | null;
  indicators: string[];
  confidence: number;
  recommended_action: string;
}

// Crisis detection runs on EVERY user input
// Latency requirement: <100ms
// Must not block main conversation flow
```

---

## 5. Data Flow Architecture

### 5.1 Conversation Turn Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CONVERSATION TURN FLOW                            │
│                                                                              │
│  1. AUDIO CAPTURE                                                           │
│     └──► VAD Detection ──► Audio Buffer ──► STT Engine                      │
│                                                                              │
│  2. PARALLEL PROCESSING (after transcription)                               │
│     ┌──────────────────────────────────────────────────────────────┐       │
│     │                                                              │       │
│     │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │       │
│     │  │Crisis Check │  │Context Fetch│  │ Emotion Analysis    │  │       │
│     │  │   <100ms    │  │  <200ms     │  │     <150ms          │  │       │
│     │  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │       │
│     │         │                │                     │            │       │
│     │         ▼                ▼                     ▼            │       │
│     │  ┌────────────────────────────────────────────────────────┐│       │
│     │  │                   CONTEXT AGGREGATOR                    ││       │
│     │  └────────────────────────────────────────────────────────┘│       │
│     └──────────────────────────────────────────────────────────────┘       │
│                                      │                                      │
│  3. LLM PROCESSING                   ▼                                      │
│     ┌──────────────────────────────────────────────────────────────┐       │
│     │  Dr. Sterling LLM                                            │       │
│     │  • System prompt + Patient context                           │       │
│     │  • Retrieved memories                                        │       │
│     │  • Current emotional state                                   │       │
│     │  • Conversation history (compressed)                         │       │
│     │  • User input                                                │       │
│     └──────────────────────────────────────────────────────────────┘       │
│                                      │                                      │
│  4. OUTPUT GENERATION                ▼                                      │
│     ┌──────────────────────────────────────────────────────────────┐       │
│     │  Response Text ──► TTS Engine ──► Audio Stream               │       │
│     │                         │                                    │       │
│     │                         ▼                                    │       │
│     │                   Lip-Sync Engine ──► Avatar Animation       │       │
│     └──────────────────────────────────────────────────────────────┘       │
│                                                                              │
│  5. BACKGROUND TASKS (non-blocking)                                         │
│     • Update conversation highlights                                         │
│     • Persist session state                                                  │
│     • Queue research threads (if needed)                                    │
│     • Update emotional trajectory                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Session Persistence Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SESSION PERSISTENCE FLOW                             │
│                                                                              │
│  EVERY 30 SECONDS (or on significant event):                                │
│                                                                              │
│  1. Capture Current State                                                   │
│     ├── Conversation transcript (last N turns)                              │
│     ├── Current emotional state                                             │
│     ├── Agent contexts                                                      │
│     ├── Pending research threads                                            │
│     └── Crisis flags (if any)                                               │
│                                                                              │
│  2. Write to Local Storage                                                  │
│     ├── Memory_Directory/patients/{id}/sessions/{session_id}/               │
│     │   ├── state.json (current state)                                      │
│     │   ├── transcript_partial.json (conversation)                          │
│     │   └── checkpoint_{timestamp}.json (backup)                            │
│     │                                                                        │
│     └── Session_Database                                                    │
│         └── UPDATE sessions SET last_checkpoint = NOW()                     │
│                                                                              │
│  3. Sync Queue (for reconnection)                                           │
│     └── Add to pending_sync_queue if offline                                │
│                                                                              │
│  ON SESSION END:                                                            │
│                                                                              │
│  4. Generate Final Documents                                                │
│     ├── Complete transcript                                                 │
│     ├── Session summary                                                     │
│     └── Patient overview updates                                            │
│                                                                              │
│  5. Queue Embedding Jobs                                                    │
│     ├── Session transcript → Vector_Database                                │
│     ├── New memories → patient_memories collection                          │
│     └── Clinical insights → clinical_insights collection                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Failover and Recovery

### 6.1 Network Failover

```typescript
interface NetworkFailover {
  // Detection
  connectivity_check_interval_ms: 5000;
  offline_threshold_failures: 2;

  // Failover chain
  api_failover: {
    anthropic: {
      fallback: 'gemini' | 'local';
      max_retries: 2;
      retry_delay_ms: 1000;
    };
    gemini: {
      fallback: 'local';
      max_retries: 2;
      retry_delay_ms: 1000;
    };
  };

  stt_failover: {
    primary: 'deepgram';
    fallback_chain: ['google', 'whisper_local'];
  };

  tts_failover: {
    primary: 'elevenlabs';
    fallback_chain: ['azure', 'coqui_local'];
  };
}
```

### 6.2 Recovery Procedures

```typescript
// Session recovery after crash
async function recoverSession(sessionId: string): Promise<RecoveryResult> {
  // 1. Load last checkpoint
  const checkpoint = await loadLatestCheckpoint(sessionId);

  // 2. Validate data integrity
  const isValid = await validateCheckpoint(checkpoint);

  // 3. Restore state
  if (isValid) {
    await restoreSessionState(checkpoint);
    await reloadAgentContexts(checkpoint.agentStates);
    return { success: true, recoveredTurns: checkpoint.turnCount };
  }

  // 4. Fallback to partial recovery
  const partialData = await loadPartialTranscript(sessionId);
  return { success: false, partialRecovery: true, turns: partialData.length };
}

// Error recovery during session
async function handleSessionError(error: SessionError): Promise<void> {
  // 1. Log error with full context
  await logError(error, getCurrentState());

  // 2. Attempt automatic recovery based on error type
  switch (error.type) {
    case 'STT_TIMEOUT':
      await switchToOfflineSTT();
      break;
    case 'LLM_TIMEOUT':
      await fallbackToSecondaryModel();
      break;
    case 'TTS_ERROR':
      await switchToFallbackTTS();
      break;
    case 'NETWORK_ERROR':
      await enterOfflineMode();
      break;
    default:
      await enterErrorRecoveryState();
  }

  // 3. Resume session if possible
  if (canResumeSession()) {
    await transitionToActiveListening();
  }
}
```

---

## 7. Watchdog Timers

| Component | Timeout | Action on Timeout |
|-----------|---------|-------------------|
| STT Processing | 5000ms | Force end, switch to offline |
| LLM Response | 30000ms | Force end, show apology message |
| TTS Generation | 15000ms | Skip audio, show text only |
| Lip-Sync | 1000ms | Use static avatar |
| Context Fetch | 3000ms | Proceed without additional context |
| State Persistence | 5000ms | Retry in background |
| Agent Communication | 2000ms | Direct call fallback |
| Crisis Detection | 500ms | Async processing (never blocks) |

---

## 8. Resource Management

### 8.1 Memory Limits

| Component | Soft Limit | Hard Limit | Action at Limit |
|-----------|------------|------------|-----------------|
| Conversation History | 50 turns | 100 turns | Compress older turns |
| Context Window | 150K tokens | 180K tokens | Aggressive summarization |
| Audio Buffer | 60 seconds | 120 seconds | Drop oldest segments |
| Vector Cache | 500MB | 1GB | LRU eviction |
| Embedding Queue | 10 jobs | 20 jobs | Pause new embeds |

### 8.2 Concurrent Limits

| Resource | Limit | Behavior at Limit |
|----------|-------|-------------------|
| Active Sessions | 1 | Queue or reject |
| Parallel Agent Calls | 4 | Queue excess |
| Background Research Threads | 3 | Queue excess |
| Embedding Workers | 2 | Queue jobs |
| Vector DB Queries | 5/second | Rate limit |

---

## 9. Security Architecture

### 9.1 Data Encryption Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ENCRYPTION ARCHITECTURE                            │
│                                                                              │
│  AT REST (Memory_Directory)                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Master Key (derived from user password via PBKDF2)                  │   │
│  │           │                                                          │   │
│  │           ▼                                                          │   │
│  │  ┌─────────────────┐                                                │   │
│  │  │ Patient Key     │───► Encrypts: overview.json, transcripts       │   │
│  │  │ (AES-256-GCM)   │              session data, reports             │   │
│  │  └─────────────────┘                                                │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐                                                │   │
│  │  │ Database Key    │───► Encrypts: SQLite database (SQLCipher)      │   │
│  │  │ (AES-256-GCM)   │                                                │   │
│  │  └─────────────────┘                                                │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐                                                │   │
│  │  │ Vector DB Key   │───► Encrypts: Vector embeddings at rest        │   │
│  │  │ (AES-256-GCM)   │                                                │   │
│  │  └─────────────────┘                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  IN TRANSIT                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  All API calls: TLS 1.3                                              │   │
│  │  Certificate pinning for known API endpoints                         │   │
│  │  API keys stored in OS secure storage (Keychain/Credential Manager) │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Deployment Topology

### 10.1 Single-User Local Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                       LOCAL MACHINE                              │
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  Web Browser     │◄──►│  Local Server    │                   │
│  │  (UI)            │    │  (Node.js)       │                   │
│  └──────────────────┘    └────────┬─────────┘                   │
│                                   │                              │
│  ┌────────────────────────────────┼───────────────────────────┐ │
│  │                   Memory_Directory                         │ │
│  │  ├── databases/                                            │ │
│  │  │   ├── sessions.db                                       │ │
│  │  │   └── vectors/                                          │ │
│  │  ├── patients/                                             │ │
│  │  ├── models/ (offline models)                              │ │
│  │  └── logs/                                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│                           │                                      │
│                           ▼                                      │
│               ┌───────────────────────┐                         │
│               │    Ollama (Local)     │                         │
│               │    - Llama 3          │                         │
│               │    - Mistral          │                         │
│               │    - Whisper          │                         │
│               └───────────────────────┘                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (when online)
                              ▼
          ┌───────────────────────────────────────────┐
          │             CLOUD SERVICES                 │
          │  ┌─────────┐ ┌─────────┐ ┌─────────┐     │
          │  │ Claude  │ │ Gemini  │ │ Eleven  │     │
          │  │  API    │ │  API    │ │ Labs    │     │
          │  └─────────┘ └─────────┘ └─────────┘     │
          └───────────────────────────────────────────┘
```

---

*Document Version: 1.0.0*
*Last Updated: January 2025*
