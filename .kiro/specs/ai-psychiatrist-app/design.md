# Design Document: AI Psychiatrist Web Application

## Overview

This document outlines the technical design for an AI-powered psychiatrist web application that provides realistic, professional therapy sessions through an interactive interface. The system features a multi-agent AI architecture with real-time audio/video processing, comprehensive session management, and hybrid cloud/local operation capabilities.

> [!IMPORTANT]
> **Deterministic Compliance**: All implementations MUST strictly adhere to the technical contracts defined in the companion documents:
>
> | Document | Purpose | Critical Sections |
> |----------|---------|-------------------|
> | [AGENTS.md](AGENTS.md) | Constitutional principles, trust boundaries | 9 Articles, Enforcement Gates |
> | [data_schemas.md](data_schemas.md) | JSON schemas, database models | Patient_Overview, Session_Summary, SQLite/Qdrant |
> | [system_architecture.md](system_architecture.md) | State machine, latency budgets | Session FSM, Latency Requirements |
> | [agent_protocols.md](agent_protocols.md) | Multi-agent communication | Message Protocol, Agent Prompts, Model Config |
> | [requirements.md](requirements.md) | Functional requirements | All 42 requirements with acceptance criteria |

---

## Design Principles

This design adheres to the constitutional principles defined in [AGENTS.md](AGENTS.md):

### Core Axioms

| Principle | Implementation | Reference |
|-----------|----------------|-----------|
| **Scaffolding > Model** | Agent interfaces are model-agnostic; switching Claude/Gemini requires config only | [agent_protocols.md](agent_protocols.md) S5 |
| **Code Before Prompt** | Crisis detection uses regex (<10ms), state machine uses FSM with guards | [system_architecture.md](system_architecture.md) S2 |
| **Single Entry Point** | All patient interactions flow through Dr. Sterling exclusively | [agent_protocols.md](agent_protocols.md) S1.2 |
| **Lift and Shift Ready** | All data in `Memory_Directory/`, cross-platform, zero external dependencies | [requirements.md](requirements.md) R25 |
| **Self-Healing** | Watchdog timers (STT: 5s, LLM: 30s), automatic fallback chains, CRDT recovery | Component 18 |
| **Observability** | MetricsCollector tracks P50/P95/P99 latencies, agent thoughts panel | Component 17 |
| **AI Only for Intelligence** | Therapeutic dialogue = AI; State transitions = Code; Timers = Code | [AGENTS.md](AGENTS.md) Article VI |
| **Deep GoT** | 4-agent multi-source reasoning (Context + Research + Analysis → Synthesis) | [agent_protocols.md](agent_protocols.md) S3 |
| **Domain Balance** | 8 life domains explored, not just mental health | Component 14 |
| **Inherit, Don't Reimplement** | All schemas from data_schemas.md, all prompts from agent_protocols.md | [AGENTS.md](AGENTS.md) |
| **Explicit Trust Boundaries** | User input validated, retrieved content = context only, never instructions | [AGENTS.md](AGENTS.md) |

## Architecture Overview

### System Architecture

The application follows a **Hybrid Cloud-Local Architecture** with three operational tiers:

1. **Tier 1 (Cloud Primary)**: Uses cloud-based AI models (Claude Sonnet 4.5, Gemini 1.5 Pro/Flash) for optimal performance
2. **Tier 2 (Hybrid)**: Seamlessly switches between cloud and local models based on connectivity
3. **Tier 3 (Full Offline)**: Operates entirely on local models (Ollama) when internet is unavailable

**Design Rationale**: This tiered approach ensures continuous therapeutic service regardless of network conditions while optimizing for quality when connectivity allows. The hybrid architecture addresses Requirement 22 (Hybrid Cloud/Local Architecture) and Requirement 23 (Network Status and Recovery).

### Multi-Agent System Design

The system employs a **4-Agent Collaborative Architecture**:

1. **Dr. Sterling** (Primary Therapist Agent)
   - Role: Patient-facing therapeutic dialogue and clinical decision-making
   - Model: Claude Sonnet 4.5 (with extended thinking) or Gemini 1.5 Pro
   - Temperature: 0.25 for clinical accuracy
   - Thinking Budget: 32768 tokens for deep reasoning

2. **Context Fetcher** (Memory Retrieval Agent)
   - Role: Retrieve relevant patient history from Vector Database
   - Model: Gemini 1.5 Flash (speed-optimized) or Claude Sonnet 4.5
   - Latency Target: <200ms for context injection

3. **Deep Researcher** (Research Agent)
   - Role: Background research on clinical topics and conditions
   - Model: Gemini 1.5 Pro or Claude Sonnet 4.5
   - Operates in parallel research threads

4. **Analyst AI** (Coordination Agent)
   - Role: Needs assessment and agent coordination
   - Model: Gemini 1.5 Pro or Claude Sonnet 4.5
   - Orchestrates support agent activities

**Design Rationale**: The multi-agent architecture separates concerns and enables parallel processing. Dr. Sterling focuses exclusively on therapeutic dialogue while support agents handle context retrieval and research, preventing cognitive overload and maintaining response quality. This addresses Requirements 17-19 (Multi-AI Agent System, Agent Coordination, Agent Perspective Diversity).

## Component Design

### 1. Session Management System

**Components**:

- Session Controller: Manages session lifecycle and state transitions
- Timer Service: Tracks session duration with 5-minute warning at 20 minutes
- State Persistence Service: Auto-saves session state every 30 seconds
- Session Completion Handler: Generates summaries and updates patient overview

**Design Decisions**:

- **25-minute session limit**: Enforced at the controller level with automatic termination (Requirement 1)
- **State persistence strategy**: Uses CRDT (Conflict-free Replicated Data Types) for transcript merging to handle offline/online transitions without data loss (Requirement 24)
- **Proactive session initiation**: Dr. Sterling receives patient context before session start and initiates conversation based on history (Requirement 3)

**Data Flow**:

```
Session Start → Load Patient Overview → Initialize Dr. Sterling Context → 
Start Timer → Enable Audio/Video → Begin Conversation → 
Auto-save (every 30s) → Session End → Generate Summary → Update Overview
```

### 2. Real-Time Communication Pipeline

**Speech-to-Text (STT) Pipeline**:

| Mode | Engine | Model | Latency Target | Fallback |
|------|--------|-------|----------------|----------|
| Online Primary | Deepgram | Nova-2 | 80ms | Google STT v2 |
| Online Fallback | Google STT | v2 | 100ms | Whisper.cpp |
| Offline | Whisper.cpp | medium.en | 200ms | None |

**Design Decisions**:

- **Streaming transcription**: Implements continuous streaming to minimize perceived latency (Requirement 4)
- **VAD-based silence detection**: 500ms threshold prevents premature cutoff during emotional pauses (crying, sighs)
- **Graceful degradation**: Automatic fallback chain ensures service continuity

**Text-to-Speech (TTS) Pipeline**:

| Mode | Engine | Voice | Latency Target |
|------|--------|-------|----------------|
| Online Primary | ElevenLabs | Custom "Dr. Sterling" | 200ms |
| Online Fallback | Azure Neural TTS | en-US-GuyNeural | 150ms |
| Offline | Coqui XTTS v2 | Cloned voice | 300ms |

**Voice Parameters**:

- Pitch: 120-180Hz (calming, professional)
- Speaking Rate: 0.85-0.95x (deliberate, therapeutic)
- SSML Support: Emotional modulation for empathy, affirmation, grounding

**Design Rationale**: The voice parameters are specifically tuned for therapeutic contexts. Slower speaking rate (0.85-0.95x) conveys thoughtfulness and allows patient processing time. Lower pitch range creates a calming effect. SSML enables dynamic emotional expression while maintaining professional boundaries (Requirement 5).

### 3. Lip-Sync Animation System

**Technology Stack**:

- Viseme Mapping: Rhubarb Lip Sync (15 standard visemes)
- Avatar Rendering: Three.js + Ready Player Me
- Blend Shapes: 52 ARKit blend shapes for facial expressions
- Frame Rate: Target 60fps, minimum 30fps

**Animation Pipeline**:

```
TTS Audio Output → Rhubarb Viseme Analysis → 
Viseme Timeline Generation → Three.js Blend Shape Animation → 
Render at 60fps → Display with <50ms audio sync
```

**Design Decisions**:

- **Real-time viseme generation**: Processes audio in 64ms chunks (1024 samples at 16kHz) for minimal latency
- **Emotional expression system**: Maps therapeutic states (neutral, concerned, warm, thoughtful) to blend shape combinations
- **Performance optimization**: Uses WebGL hardware acceleration and LOD (Level of Detail) for consistent frame rates

**Design Rationale**: Realistic lip-sync is critical for therapeutic presence. The <50ms audio-visual sync threshold prevents uncanny valley effects. 60fps target ensures smooth, natural movement that enhances patient engagement (Requirement 6).

### 4. Video Interface Design

**Layout Architecture**:

```
┌─────────────────────────────────────────────────────────┐
│  Session Timer: 12:34 / 25:00        [Online] [●REC]   │
├──────────────────────┬──────────────────────────────────┤
│                      │                                  │
│   Dr. Sterling       │      Patient Video               │
│   (Animated Avatar)  │      (Live/Placeholder)          │
│   1080p @ 60fps      │      720p @ 30fps                │
│                      │                                  │
├──────────────────────┴──────────────────────────────────┤
│  Live Transcript                                        │
│  ┌────────────────────────────────────────────────────┐│
│  │ Dr. Sterling: How have you been feeling since...  ││
│  │ Patient: I've been struggling with...             ││
│  │ [Conversation Highlight: Anxiety detected]        ││
│  └────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

**Design Decisions**:

- **Dual-box layout**: Equal visual weight for both participants creates therapeutic parity
- **Avatar priority**: Dr. Sterling rendered at higher quality (1080p/60fps) for professional presence
- **Patient camera optional**: Placeholder avatar when camera disabled respects privacy preferences
- **Transcript auto-scroll**: Latest conversation always visible with smooth scrolling

**Responsive Design**:

- Desktop: Side-by-side video boxes (16:9 each)
- Tablet: Stacked layout with Dr. Sterling on top
- Mobile: Single video focus with swipe to switch, transcript overlay

**Design Rationale**: The full-screen layout minimizes distractions and creates an immersive therapeutic environment. Higher rendering quality for Dr. Sterling ensures professional presentation while patient video can be lower quality since it's primarily for Dr. Sterling's analysis (Requirement 8).

### 5. Data Storage Architecture

**Memory Directory Structure**:

> [!NOTE]
> All file formats in this directory MUST conform to schemas defined in [data_schemas.md](data_schemas.md). See Section 1 (Patient_Overview), Section 2 (Session_Summary), and Section 5 (Transcript Schema).

```
./memory_directory/
├── config/
│   ├── settings.json              # System configuration
│   ├── encryption.key.enc         # Encrypted master key
│   └── api_keys.env              # API credentials
├── patients/
│   └── {patient_id}/
│       ├── overview.json          # Patient Overview Document
│       ├── sessions/
│       │   └── {session_id}/
│       │       ├── transcript.json
│       │       ├── audio/
│       │       │   ├── patient_audio.wav
│       │       │   └── ai_audio.wav
│       │       ├── report.json
│       │       └── metadata.json
│       └── exports/
│           └── session_summaries/
├── databases/
│   ├── sessions.db               # SQLite session database
│   └── vectors/
│       ├── qdrant_storage/       # Vector database files
│       └── embeddings_cache/
├── models/                        # Offline AI models
│   ├── whisper-medium.en.bin
│   ├── llama-3-70b.gguf
│   └── coqui-xtts-v2/
├── logs/
│   ├── audit.log                 # Security audit trail
│   ├── errors.log                # Error tracking
│   └── crisis_events.log         # Crisis detection log
└── cache/
    ├── context_cache/
    └── research_cache/
```

**Design Decisions**:

- **Portable structure**: All data in working directory enables easy backup/migration
- **Patient isolation**: Each patient has separate encrypted directory
- **Session granularity**: Individual session folders for detailed record-keeping
- **Audit trail**: Comprehensive logging for compliance and debugging

**Design Rationale**: The portable directory structure addresses Requirement 25 (Portable Memory Directory) and enables GDPR/CCPA compliance through easy data export and deletion. Encryption at rest (AES-256-GCM) protects sensitive therapeutic data (Requirement 37).

### 6. Database Design

> [!IMPORTANT]
> The schemas below are summaries. For the authoritative, complete schemas including indexes, constraints, and validation rules, see [data_schemas.md](data_schemas.md) Sections 3-4.

**Session Database (SQLite)**:

```sql
-- Patients table
CREATE TABLE patients (
    patient_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_session TIMESTAMP,
    overview_version INTEGER DEFAULT 1
);

-- Sessions table
CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    status TEXT CHECK(status IN ('active', 'completed', 'interrupted')),
    summary_generated BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

-- Session metadata
CREATE TABLE session_metadata (
    session_id TEXT PRIMARY KEY,
    word_count INTEGER,
    turn_count INTEGER,
    crisis_events INTEGER DEFAULT 0,
    emotional_states TEXT, -- JSON array
    topics_discussed TEXT, -- JSON array
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Audit log
CREATE TABLE audit_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL,
    patient_id TEXT,
    session_id TEXT,
    details TEXT,
    ip_address TEXT
);
```

**Design Decisions**:

- **SQLite choice**: Lightweight, portable, zero-configuration database perfect for local storage
- **Referential integrity**: Foreign keys ensure data consistency
- **JSON fields**: Flexible storage for complex data (emotional states, topics) without schema changes
- **Audit table**: Comprehensive logging for compliance (6-year retention per HIPAA)

**Vector Database (Qdrant)**:

```javascript
// Collection schema
{
  "collection_name": "patient_memories",
  "vectors": {
    "size": 3072,  // text-embedding-3-large dimension
    "distance": "Cosine"
  },
  "payload_schema": {
    "patient_id": "keyword",
    "session_id": "keyword",
    "content_type": "keyword",  // transcript, insight, memory
    "timestamp": "integer",
    "emotional_context": "text",
    "topics": "keyword[]",
    "chunk_text": "text"
  }
}
```

**Embedding Strategy**:

| Content Type | Chunk Size | Overlap | Purpose |
|--------------|------------|---------|---------|
| Session Transcripts | 512 tokens | 64 tokens | Conversation retrieval |
| Patient Memories | 256 tokens | 32 tokens | Personal detail recall |
| Clinical Insights | 384 tokens | 48 tokens | Pattern recognition |
| Crisis Protocols | 128 tokens | 16 tokens | Safety procedures |

**Hybrid Retrieval Algorithm**:

```
Final_Score = (0.7 × Vector_Similarity) + (0.3 × BM25_Score)
```

**Design Rationale**: Qdrant provides high-performance vector search with local deployment capability. The hybrid retrieval (70% semantic + 30% keyword) balances contextual understanding with exact term matching, crucial for medical terminology (Requirements 26-27).

### 7. AI Model Orchestration

> [!NOTE]
> For authoritative model configurations per mode (Claude-only, Gemini-only, Hybrid, Offline), see [agent_protocols.md](agent_protocols.md) Section 5. The examples below are illustrative.

**Smart Model Selection Logic**:

```javascript
function selectModels() {
  const hasAnthropic = process.env.ANTHROPIC_API_KEY;
  const hasGemini = process.env.GEMINI_API_KEY;
  
  if (hasAnthropic && hasGemini) {
    // Hybrid Mode (Optimal)
    return {
      drSterling: "claude-sonnet-4.5",
      contextFetcher: "gemini-1.5-flash",
      deepResearcher: "gemini-1.5-pro",
      analystAI: "gemini-1.5-pro"
    };
  } else if (hasAnthropic) {
    // Claude-Only Mode
    return {
      drSterling: "claude-sonnet-4.5",
      contextFetcher: "claude-sonnet-4.5",
      deepResearcher: "claude-sonnet-4.5",
      analystAI: "claude-sonnet-4.5"
    };
  } else if (hasGemini) {
    // Gemini-Only Mode
    return {
      drSterling: "gemini-1.5-pro",
      contextFetcher: "gemini-1.5-flash",
      deepResearcher: "gemini-1.5-pro",
      analystAI: "gemini-1.5-pro"
    };
  } else {
    // Offline Mode
    return {
      drSterling: "llama-3-70b",
      contextFetcher: "mistral-7b",
      deepResearcher: "llama-3-8b",
      analystAI: "mistral-7b"
    };
  }
}
```

**Model Parameters by Agent**:

| Agent | Temperature | Top-P | Top-K | Max Tokens | Thinking Budget |
|-------|-------------|-------|-------|------------|-----------------|
| Dr. Sterling | 0.25 | 0.9 | 40 | 2048 | 32768 |
| Context Fetcher | 0.1 | 0.8 | 30 | 1024 | N/A |
| Deep Researcher | 0.3 | 0.9 | 50 | 4096 | N/A |
| Analyst AI | 0.2 | 0.85 | 40 | 2048 | N/A |
| Crisis Detection | 0.05 | 0.7 | 20 | 512 | 8192 |

**Design Decisions**:

- **Claude Sonnet 4.5 for Dr. Sterling**: Superior theory of mind and therapeutic reasoning capabilities
- **Gemini Flash for Context Fetcher**: Speed-optimized for <200ms retrieval latency
- **Low temperature for clinical accuracy**: 0.25 for Dr. Sterling minimizes hallucinations
- **Extended thinking budget**: 32768 tokens enables deep reasoning for complex cases

**Design Rationale**: The smart orchestration prioritizes Claude Sonnet 4.5 for therapeutic dialogue due to its superior reasoning and empathy modeling. Gemini Flash handles speed-critical tasks (context retrieval) while Gemini Pro handles research requiring long context windows. This addresses Requirements 20-21 (Smart Model Orchestration, Model Parameters).

### 8. Agent Communication Protocol

**Event Bus Architecture**:

```javascript
// Event types
const EventTypes = {
  SESSION_START: 'session.start',
  PATIENT_SPEECH: 'patient.speech',
  CONTEXT_REQUEST: 'context.request',
  CONTEXT_RESPONSE: 'context.response',
  RESEARCH_REQUEST: 'research.request',
  RESEARCH_RESPONSE: 'research.response',
  AI_RESPONSE: 'ai.response',
  CRISIS_DETECTED: 'crisis.detected'
};

// Event structure
{
  type: EventTypes.CONTEXT_REQUEST,
  timestamp: Date.now(),
  source: 'analyst_ai',
  target: 'context_fetcher',
  payload: {
    query: "patient's previous mentions of anxiety",
    max_results: 5,
    time_range: "last_3_sessions"
  },
  correlation_id: "uuid-v4"
}
```

**Optimistic Execution Pattern**:

```
Patient Speech → STT → Analyst AI (parallel) → Dr. Sterling starts generating
                                              ↓
                                    Context Fetcher retrieves
                                              ↓
                                    If <200ms: Inject into Dr. Sterling
                                    If >200ms: Queue for next turn
```

**Design Decisions**:

- **Async event bus**: Enables parallel agent execution without blocking
- **Optimistic execution**: Dr. Sterling starts generating immediately, context injected if available
- **Context pipelining**: Late-arriving context queued for next response prevents wasted work
- **Correlation IDs**: Track request-response pairs for debugging and latency analysis

**Design Rationale**: The optimistic execution pattern ensures Dr. Sterling meets the 1500ms response target even if context retrieval is slow. This prevents the "waiting for context" bottleneck while still leveraging historical information when available (Requirement 18).

### 9. Context Management System

**Patient Overview Processing**:

```javascript
// Two-phase overview loading
async function loadPatientContext(patientId) {
  // Phase 1: Pre-session (before Dr. Sterling initialization)
  const overview = await loadOverviewDocument(patientId);
  const summary = generateExecutiveSummary(overview); // 500 tokens max
  
  // Phase 2: During session (on-demand)
  const contextLoader = new LazyContextLoader(overview);
  
  return {
    executiveSummary: summary,  // Always loaded
    detailLoader: contextLoader  // Loaded on-demand
  };
}

// Intelligent context loading
class LazyContextLoader {
  async getRelevantContext(query, maxTokens = 2000) {
    // Vector search for relevant sections
    const results = await vectorDB.search(query, topK: 5);
    
    // Rank by relevance and recency
    const ranked = rankByRelevanceAndRecency(results);
    
    // Fit within token budget
    return truncateToTokenLimit(ranked, maxTokens);
  }
}
```

**Memory Update Strategy**:

```javascript
// Post-session memory update
async function updatePatientMemory(sessionId) {
  const transcript = await loadTranscript(sessionId);
  
  // 1. Extract new information
  const newInfo = await extractNewInformation(transcript);
  
  // 2. Detect conflicts with existing overview
  const conflicts = await detectConflicts(newInfo, currentOverview);
  
  // 3. Resolve conflicts (latest-wins with audit trail)
  const resolved = resolveConflicts(conflicts, {
    strategy: 'latest-wins',
    preserveHistory: true
  });
  
  // 4. Update overview document
  await updateOverview(resolved);
  
  // 5. Generate new embeddings
  await generateEmbeddings(newInfo);
  
  // 6. Update vector database
  await vectorDB.upsert(embeddings);
}
```

**Design Decisions**:

- **Two-phase loading**: Executive summary (500 tokens) loaded upfront, details on-demand
- **Lazy context loading**: Prevents context bloating while ensuring relevant information available
- **Latest-wins conflict resolution**: New information overrides old with audit trail preservation
- **Comprehensive memory capture**: Every detail stored, including casual mentions (dancer, singer, etc.)

**Design Rationale**: The two-phase loading strategy addresses Requirement 10 (Comprehensive Patient Memory) by processing overview information twice - once for initialization and once during context loading. This prevents overwhelming Dr. Sterling with information while ensuring comprehensive memory recall. The lazy loading prevents context bloating while maintaining quality responses.

### 10. Crisis Detection System

**Three-Tier Detection Architecture**:

```javascript
// Crisis detection pipeline
class CrisisDetector {
  async analyze(patientInput) {
    // Tier 1: Keyword matching (immediate, <10ms)
    const tier1 = this.keywordMatch(patientInput);
    if (tier1.detected) {
      return { tier: 1, action: 'IMMEDIATE_INTERVENTION' };
    }
    
    // Tier 2: Sentiment analysis (fast, <100ms)
    const tier2 = await this.sentimentAnalysis(patientInput);
    if (tier2.riskLevel === 'HIGH') {
      return { tier: 2, action: 'ELEVATED_MONITORING' };
    }
    
    // Tier 3: Deep analysis (parallel, <500ms)
    const tier3 = await this.deepAnalysis(patientInput);
    if (tier3.concernLevel === 'MODERATE') {
      return { tier: 3, action: 'INCREASED_ATTENTION' };
    }
    
    return { tier: 0, action: 'CONTINUE_NORMAL' };
  }
  
  keywordMatch(text) {
    const tier1Keywords = [
      'kill myself', 'end my life', 'suicide plan',
      'want to die', 'better off dead', 'goodbye forever'
    ];
    // Fuzzy matching with Levenshtein distance
    return fuzzyMatch(text, tier1Keywords, threshold: 0.85);
  }
}
```

**Safety Interruption Protocol**:

```javascript
// Tier 1 crisis response
async function handleTier1Crisis(context) {
  // 1. Pause therapeutic dialogue
  await pauseSession();
  
  // 2. Display crisis overlay
  displayCrisisOverlay({
    message: "We're concerned about your safety",
    resources: getCrisisResources(context.location),
    actions: ['Call Now', 'Text Crisis Line', 'Continue Session']
  });
  
  // 3. Log crisis event (privacy-preserved)
  await logCrisisEvent({
    sessionId: context.sessionId,
    tier: 1,
    timestamp: Date.now(),
    actionTaken: 'SAFETY_PROTOCOL_ACTIVATED'
  });
  
  // 4. Do NOT attempt treatment
  // Bridge to human emergency services only
}
```

**Crisis Resources Database**:

```javascript
const crisisResources = {
  'US': {
    suicide: { phone: '988', text: 'HOME to 741741' },
    emergency: '911'
  },
  'UK': {
    suicide: { phone: '116 123', text: 'SHOUT to 85258' },
    emergency: '999'
  },
  // ... other regions
};
```

**Design Decisions**:

- **Three-tier detection**: Balances speed (Tier 1 keywords) with accuracy (Tier 3 deep analysis)
- **>99% recall target**: Prioritizes false positives over false negatives for safety
- **No treatment attempt**: System bridges to human services, never attempts crisis intervention
- **Privacy-preserved logging**: Crisis events logged without sensitive content details

**Design Rationale**: The three-tier system ensures immediate response to acute crises (Tier 1) while avoiding false alarms for lower-risk situations (Tiers 2-3). The "bridge, don't treat" philosophy acknowledges AI limitations in crisis situations and prioritizes patient safety (Requirements 31-32).

### 11. Sentiment Analysis and Clinical Insights

**Real-Time Sentiment Pipeline**:

```javascript
// Parallel sentiment analysis
class SentimentAnalyzer {
  async analyzeInRealTime(transcript, context) {
    // 1. Detect emotional state (fast, <200ms)
    const emotionalState = await this.detectEmotion(transcript);
    
    // 2. Check for abnormal patterns
    if (this.isAbnormalSentiment(emotionalState)) {
      // 3. Trigger Pro AI analysis (parallel)
      this.triggerClinicalInsights(transcript, context);
    }
    
    // 4. Display conversation highlight
    displayHighlight({
      type: emotionalState.primary,
      confidence: emotionalState.confidence,
      timestamp: Date.now()
    });
    
    return emotionalState;
  }
  
  async triggerClinicalInsights(transcript, context) {
    // Parallel REST call to Pro AI
    const insights = await fetch('/api/clinical-insights', {
      method: 'POST',
      body: JSON.stringify({
        transcript: transcript,
        patientContext: context.summary,
        analysisType: 'abnormal_sentiment'
      })
    });
    
    // Inject into Dr. Sterling's context
    await injectInsights(insights, priority: 'HIGH');
  }
}
```

**Conversation Highlights Display**:

```javascript
// Real-time emotional state indicators
const highlightTypes = {
  ANXIETY: { color: '#FFA500', icon: '⚠️', label: 'Anxiety detected' },
  DEPRESSION: { color: '#4A90A4', icon: '💙', label: 'Low mood noted' },
  BREAKTHROUGH: { color: '#4CAF50', icon: '✨', label: 'Breakthrough moment' },
  RESISTANCE: { color: '#FF6B6B', icon: '🛡️', label: 'Resistance observed' }
};

function displayConversationHighlight(emotionalState) {
  const highlight = highlightTypes[emotionalState.type];
  
  // Display near transcript with 2-second update latency
  renderHighlight({
    ...highlight,
    timestamp: emotionalState.timestamp,
    confidence: emotionalState.confidence,
    fadeAfter: 10000  // 10 seconds
  });
}
```

**Design Decisions**:

- **Parallel Pro AI analysis**: Triggered only for abnormal sentiments to optimize costs
- **Natural insight injection**: Dr. Sterling presents insights as "having one more thing to discuss"
- **Real-time highlights**: <2 second latency for emotional state display
- **Non-blocking analysis**: Sentiment processing doesn't delay conversation flow

**Design Rationale**: The parallel analysis architecture ensures clinical insights enhance rather than interrupt therapeutic flow. Pro AI models (Claude Sonnet 4.5 with extended thinking) provide deep clinical analysis only when needed, balancing quality with cost efficiency (Requirements 14-15).

### 12. Background Research System

**Research Thread Architecture**:

```javascript
// Parallel research threads
class ResearchManager {
  constructor() {
    this.activeThreads = new Map();
    this.maxConcurrentThreads = 3;
  }
  
  async startResearch(topic, context) {
    const threadId = generateThreadId();
    
    // Create research thread
    const thread = new ResearchThread({
      topic: topic,
      patientContext: sanitizeContext(context),  // Remove PII
      depth: 'detailed',
      sources: ['clinical_guidelines', 'research_papers', 'treatment_protocols']
    });
    
    // Execute in background
    this.activeThreads.set(threadId, thread);
    thread.execute().then(results => {
      this.onResearchComplete(threadId, results);
    });
    
    return threadId;
  }
  
  onResearchComplete(threadId, results) {
    // Queue findings for Dr. Sterling
    queueForInjection({
      type: 'RESEARCH_FINDINGS',
      threadId: threadId,
      findings: results,
      priority: 'MEDIUM',
      presentAs: 'additional_observation'
    });
    
    this.activeThreads.delete(threadId);
  }
}
```

**Context Sanitization**:

```javascript
// Remove PII before external research
function sanitizeContext(context) {
  return {
    issueType: context.issueCategory,  // e.g., "procrastination"
    demographics: {
      ageRange: context.ageRange,      // e.g., "25-35"
      occupation: context.occupationType // e.g., "professional"
    },
    // NO names, locations, specific details
  };
}
```

**Design Decisions**:

- **Multiple parallel threads**: Up to 3 concurrent research threads for different topics
- **PII sanitization**: Remove patient identifiers before external research queries
- **Natural integration**: Findings presented as "additional observations" not interruptions
- **Priority queuing**: Research findings queued at medium priority, injected naturally

**Design Rationale**: The background research system enables Dr. Sterling to provide evidence-based guidance without interrupting conversation flow. PII sanitization ensures patient privacy while still enabling relevant research (e.g., "procrastination patterns in young professionals" vs. "John Smith's procrastination"). This addresses Requirement 16 (Background Research Threading).

### 13. Session Documentation System

**Summary Generation Pipeline**:

```javascript
// Post-session documentation
async function generateSessionDocumentation(sessionId) {
  const session = await loadSession(sessionId);
  
  // 1. Generate session-specific report
  const sessionReport = await generateSessionReport({
    transcript: session.transcript,
    emotionalStates: session.metadata.emotionalStates,
    highlights: session.highlights,
    duration: session.duration,
    thinkingBudget: 32768  // Extended thinking for quality
  });
  
  // 2. Generate comprehensive session summary
  const sessionSummary = await generateSessionSummary({
    sessionReport: sessionReport,
    patientOverview: session.patientOverview,
    previousSessions: await getRecentSessions(session.patientId, limit: 3),
    thinkingBudget: 32768
  });
  
  // 3. Update patient overview
  const updatedOverview = await updatePatientOverview({
    currentOverview: session.patientOverview,
    sessionInsights: sessionReport.insights,
    newInformation: sessionReport.newInformation,
    progressNotes: sessionReport.progressNotes
  });
  
  // 4. Store all documents
  await storeDocuments({
    sessionReport: sessionReport,
    sessionSummary: sessionSummary,
    updatedOverview: updatedOverview
  });
  
  return { sessionReport, sessionSummary, updatedOverview };
}
```

**Document Schemas** (see `data_schemas.md` for complete definitions):

```javascript
// Session Report structure
{
  sessionId: string,
  patientId: string,
  timestamp: ISO8601,
  duration: number,
  keyInsights: string[],
  emotionalTrajectory: {
    start: string,
    middle: string,
    end: string
  },
  breakthroughMoments: Array<{
    timestamp: number,
    description: string,
    significance: string
  }>,
  topicsDiscussed: string[],
  therapeuticTechniques: string[],
  progressNotes: string
}

// Session Summary structure
{
  sessionId: string,
  patientName: string,  // Personalized
  executiveSummary: string,
  detailedAnalysis: string,
  recommendations: string[],
  nextSessionFocus: string[],
  riskAssessment: {
    level: 'low' | 'moderate' | 'high',
    factors: string[]
  }
}
```

**Design Decisions**:

- **Two-document approach**: Session Report (detailed) + Session Summary (patient-facing)
- **Extended thinking budget**: 32768 tokens for high-quality document generation
- **Patient name personalization**: All documents use patient's actual name
- **Version control**: Overview updates preserve revision history with timestamps

**Design Rationale**: The two-document approach separates clinical documentation (Session Report) from patient-facing summaries (Session Summary). Extended thinking budget ensures comprehensive, accurate documentation. Automatic overview updates maintain continuity across sessions (Requirements 12-13).

### 14. Therapeutic Quality System

**Dr. Sterling Persona Configuration**:

```javascript
// Clinical directives for therapeutic quality
const drSterlingDirectives = {
  therapeuticStance: {
    opinionated: true,
    advocacy: 'patient_wellbeing',
    directness: 'constructive_challenge',
    passivity: false
  },
  
  responseGuidelines: {
    avoidPassiveAcknowledgment: true,
    provideSubstantiveResponses: true,
    challengeHarmfulStatements: true,
    prioritizeLongTermBenefit: true
  },
  
  explorationDomains: [
    'mental_health',
    'career',
    'relationships',
    'physical_health',
    'finances',
    'hobbies',
    'personal_growth',
    'social_connections'
  ],
  
  aiDisclaimer: {
    duringSession: false,  // Never mention being AI during session
    beforeSession: true    // Disclaimer shown at startup
  },
  
  uncertaintyHandling: {
    admitIgnorance: false,
    conductResearch: true,
    provideConfidentGuidance: true
  }
};
```

**Holistic Life Exploration**:

```javascript
// Multi-domain analysis
async function analyzePatientSituation(issue, patientContext) {
  const domains = [
    'mental_health',
    'career',
    'relationships',
    'physical_health',
    'finances',
    'hobbies',
    'social_life'
  ];
  
  // Analyze interconnections
  const analysis = await analyzeInterconnections({
    primaryIssue: issue,
    domains: domains,
    patientContext: patientContext,
    lookForPatterns: true
  });
  
  // Generate holistic recommendations
  return generateHolisticRecommendations(analysis);
}
```

**Research-Based Response System**:

```javascript
// Never respond with "I don't know"
async function generateResponse(patientInput, context) {
  // 1. Check if confident response possible
  const confidence = assessConfidence(patientInput, context);
  
  if (confidence < 0.7) {
    // 2. Conduct research before responding
    const research = await conductResearch({
      topic: extractTopic(patientInput),
      depth: 'detailed',
      sources: 'authoritative'
    });
    
    // 3. Generate confident, researched response
    return generateConfidentResponse({
      input: patientInput,
      context: context,
      research: research,
      tone: 'professional_authority'
    });
  }
  
  // 4. Generate direct response
  return generateDirectResponse(patientInput, context);
}
```

**Design Decisions**:

- **Opinionated advocacy**: Dr. Sterling challenges harmful patterns constructively
- **No AI disclaimers during sessions**: Maintains therapeutic presence (disclaimer at startup only)
- **Holistic exploration**: Investigates all life domains, not just mental health
- **Research-backed confidence**: Never admits ignorance, conducts research instead

**Design Rationale**: The opinionated therapeutic stance addresses Requirement 33 (Opinionated Therapeutic Advocacy) by enabling Dr. Sterling to act as a genuine advocate rather than passive listener. Holistic life exploration (Requirement 34) recognizes that mental health is interconnected with all life domains. Research-based responses (Requirement 35) maintain professional authority and therapeutic effectiveness.

### 15. Network Resilience System

**Connection State Machine**:

```javascript
// Network state management
const ConnectionStates = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  CONNECTING: 'connecting',
  OFFLINE_RECOVERY: 'offline_recovery'
};

class ConnectionManager {
  constructor() {
    this.state = ConnectionStates.ONLINE;
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 30000; // 30 seconds
  }
  
  async handleConnectionLoss() {
    this.state = ConnectionStates.OFFLINE;
    
    // 1. Switch to offline models (<3 seconds)
    await this.switchToOfflineMode();
    
    // 2. Notify user
    this.displayConnectionStatus('offline');
    
    // 3. Start reconnection attempts
    this.startReconnectionLoop();
  }
  
  async switchToOfflineMode() {
    // Switch STT to Whisper.cpp
    await sttEngine.switchTo('whisper-cpp');
    
    // Switch TTS to Coqui XTTS
    await ttsEngine.switchTo('coqui-xtts');
    
    // Switch LLMs to Ollama
    await modelOrchestrator.switchTo('ollama');
    
    // Total transition time: <3 seconds
  }
  
  startReconnectionLoop() {
    const delays = [1000, 2000, 4000, 8000, 16000, 30000]; // Exponential backoff
    
    const attempt = async () => {
      if (this.state !== ConnectionStates.OFFLINE) return;
      
      this.state = ConnectionStates.CONNECTING;
      const connected = await this.testConnection();
      
      if (connected) {
        await this.handleReconnection();
      } else {
        this.reconnectAttempts++;
        const delay = delays[Math.min(this.reconnectAttempts, delays.length - 1)];
        setTimeout(attempt, delay);
      }
    };
    
    attempt();
  }
  
  async handleReconnection() {
    this.state = ConnectionStates.OFFLINE_RECOVERY;
    
    // 1. Sync local data to cloud
    await this.syncManager.syncLocalData();
    
    // 2. Switch back to cloud models
    await this.switchToOnlineMode();
    
    // 3. Update status
    this.state = ConnectionStates.ONLINE;
    this.displayConnectionStatus('online');
    this.reconnectAttempts = 0;
  }
}
```

**CRDT-Based Transcript Merging**:

```javascript
// Conflict-free transcript synchronization
class TranscriptCRDT {
  constructor() {
    this.operations = [];
    this.vectorClock = {};
  }
  
  addMessage(message, source) {
    const operation = {
      type: 'INSERT',
      timestamp: Date.now(),
      source: source,
      vectorClock: this.incrementVectorClock(source),
      data: message
    };
    
    this.operations.push(operation);
    return operation;
  }
  
  merge(remoteOperations) {
    // Merge remote operations with local operations
    const merged = [...this.operations, ...remoteOperations];
    
    // Sort by vector clock (deterministic ordering)
    merged.sort((a, b) => this.compareVectorClocks(a.vectorClock, b.vectorClock));
    
    // Remove duplicates
    const deduplicated = this.removeDuplicates(merged);
    
    this.operations = deduplicated;
    return this.reconstructTranscript();
  }
  
  reconstructTranscript() {
    return this.operations
      .filter(op => op.type === 'INSERT')
      .map(op => op.data);
  }
}
```

**Session State Persistence**:

```javascript
// Auto-save every 30 seconds
class SessionPersistence {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.saveInterval = 30000; // 30 seconds
    this.startAutoSave();
  }
  
  startAutoSave() {
    this.intervalId = setInterval(async () => {
      await this.saveSessionState();
    }, this.saveInterval);
  }
  
  async saveSessionState() {
    const state = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      transcript: transcriptCRDT.operations,
      metadata: {
        duration: sessionTimer.elapsed,
        turnCount: transcript.length,
        emotionalStates: emotionalStateHistory
      },
      checksum: this.calculateChecksum()
    };
    
    // Save to local storage
    await localStorage.saveSessionState(state);
    
    // If online, also save to cloud
    if (connectionManager.state === ConnectionStates.ONLINE) {
      await cloudStorage.saveSessionState(state);
    }
  }
  
  async resumeSession() {
    // Load most recent state
    const localState = await localStorage.loadSessionState(this.sessionId);
    const cloudState = await cloudStorage.loadSessionState(this.sessionId);
    
    // Merge using CRDT
    const mergedState = transcriptCRDT.merge([
      localState.transcript,
      cloudState.transcript
    ]);
    
    // Restore session
    return this.restoreSession(mergedState);
  }
}
```

**Design Decisions**:

- **<3 second offline transition**: Ensures minimal disruption to therapeutic flow
- **CRDT for transcript merging**: Guarantees eventual consistency without conflicts
- **Exponential backoff**: Prevents network flooding during reconnection attempts
- **Dual persistence**: Save to both local and cloud (when available) for redundancy

**Design Rationale**: The CRDT-based approach ensures zero data loss during network transitions. The <3 second transition time maintains therapeutic continuity. Exponential backoff prevents resource exhaustion while ensuring eventual reconnection. This addresses Requirements 22-24 (Hybrid Architecture, Network Status, Session State Persistence).

### 16. Security and Compliance System

**Encryption Architecture**:

```javascript
// AES-256-GCM encryption for data at rest
class EncryptionManager {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keySize = 256;
    this.ivLength = 16;
  }
  
  async encryptFile(filePath, data) {
    // Generate patient-specific key
    const key = await this.deriveKey(patientId);
    
    // Generate random IV
    const iv = crypto.randomBytes(this.ivLength);
    
    // Encrypt data
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final()
    ]);
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    // Store: IV + AuthTag + Encrypted Data
    const combined = Buffer.concat([iv, authTag, encrypted]);
    await fs.writeFile(filePath, combined);
  }
  
  async deriveKey(patientId) {
    // PBKDF2 key derivation
    const masterKey = await this.getMasterKey();
    const salt = crypto.createHash('sha256').update(patientId).digest();
    
    return crypto.pbkdf2Sync(
      masterKey,
      salt,
      100000,  // 100,000 iterations
      32,      // 256 bits
      'sha256'
    );
  }
}
```

**Audit Logging System**:

```javascript
// Comprehensive audit trail
class AuditLogger {
  async logEvent(event) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      eventType: event.type,
      patientId: this.hashPatientId(event.patientId),  // Hashed for privacy
      sessionId: event.sessionId,
      action: event.action,
      ipAddress: this.hashIP(event.ipAddress),
      userAgent: event.userAgent,
      result: event.result,
      details: this.sanitizeDetails(event.details)
    };
    
    // Append-only log (tamper-evident)
    await this.appendToLog(auditEntry);
    
    // Also store in database for querying
    await db.auditLog.insert(auditEntry);
  }
  
  async appendToLog(entry) {
    const logLine = JSON.stringify(entry) + '\n';
    const signature = this.signEntry(entry);
    
    await fs.appendFile(
      './memory_directory/logs/audit.log',
      logLine + signature + '\n'
    );
  }
  
  signEntry(entry) {
    // HMAC signature for tamper detection
    const hmac = crypto.createHmac('sha256', this.auditKey);
    hmac.update(JSON.stringify(entry));
    return hmac.digest('hex');
  }
}
```

**Medical Disclaimer System**:

```javascript
// Startup disclaimer and periodic re-acknowledgment
class DisclaimerManager {
  async checkDisclaimer(userId) {
    const lastAcknowledged = await this.getLastAcknowledgment(userId);
    const daysSince = this.daysSince(lastAcknowledged);
    
    if (!lastAcknowledged || daysSince >= 30) {
      return this.showDisclaimer();
    }
    
    return true;
  }
  
  async showDisclaimer() {
    const disclaimer = {
      title: 'Important Medical Disclaimer',
      content: `
        Dr. Sterling is an AI-powered therapeutic tool and NOT a licensed 
        medical professional. This application:
        
        • Does NOT replace professional medical advice, diagnosis, or treatment
        • Should NOT be used for medical emergencies
        • Is NOT a substitute for in-person psychiatric care
        • Does NOT prescribe medications or provide medical diagnoses
        
        If you are experiencing a medical emergency, call 911 (US) or your 
        local emergency number immediately.
        
        By continuing, you acknowledge that you understand these limitations.
      `,
      buttons: ['I Understand', 'Cancel']
    };
    
    const acknowledged = await this.displayModal(disclaimer);
    
    if (acknowledged) {
      await this.recordAcknowledgment(userId);
      return true;
    }
    
    return false;
  }
}
```

**Data Export and Deletion**:

```javascript
// GDPR/CCPA compliance
class DataManagement {
  async exportPatientData(patientId) {
    // Collect all patient data
    const data = {
      overview: await this.loadOverview(patientId),
      sessions: await this.loadAllSessions(patientId),
      reports: await this.loadAllReports(patientId),
      auditLog: await this.loadAuditLog(patientId)
    };
    
    // Generate encrypted archive
    const archive = await this.createEncryptedArchive(data);
    
    // Log export event
    await auditLogger.logEvent({
      type: 'DATA_EXPORT',
      patientId: patientId,
      action: 'EXPORT_REQUESTED',
      result: 'SUCCESS'
    });
    
    return archive;
  }
  
  async deletePatientData(patientId, confirmation) {
    if (confirmation !== `DELETE-${patientId}`) {
      throw new Error('Invalid confirmation');
    }
    
    // Log deletion request (before deletion)
    await auditLogger.logEvent({
      type: 'DATA_DELETION',
      patientId: patientId,
      action: 'DELETION_REQUESTED',
      result: 'PENDING'
    });
    
    // Delete all patient data
    await this.deleteOverview(patientId);
    await this.deleteAllSessions(patientId);
    await this.deleteVectorEmbeddings(patientId);
    await this.deleteFromDatabase(patientId);
    
    // Keep audit log (compliance requirement)
    await auditLogger.logEvent({
      type: 'DATA_DELETION',
      patientId: patientId,
      action: 'DELETION_COMPLETED',
      result: 'SUCCESS'
    });
  }
}
```

**Design Decisions**:

- **AES-256-GCM encryption**: Industry-standard encryption for data at rest
- **Patient-specific keys**: Derived from master key + patient ID for isolation
- **Append-only audit logs**: Tamper-evident with HMAC signatures
- **30-day disclaimer re-acknowledgment**: Ensures ongoing informed consent
- **Audit log retention**: 6 years minimum (HIPAA requirement)

**Design Rationale**: The encryption architecture ensures HIPAA-aligned data protection. Append-only audit logs with HMAC signatures provide tamper-evident compliance records. The 30-day disclaimer re-acknowledgment ensures users maintain awareness of AI limitations. Data export and deletion capabilities address GDPR/CCPA requirements (Requirements 36-38).

### 17. User Interface Design

**Component Architecture**:

```javascript
// Main application layout
<AppLayout>
  <Header>
    <SessionTimer elapsed={elapsed} total={1500} />
    <ConnectionStatus status={connectionState} />
    <RecordingIndicator active={isRecording} />
  </Header>
  
  <VideoContainer>
    <VideoBox position="left">
      <AvatarRenderer
        model={drSterlingAvatar}
        visemes={currentVisemes}
        expression={currentExpression}
        quality="1080p"
        fps={60}
      />
    </VideoBox>
    
    <VideoBox position="right">
      {cameraEnabled ? (
        <PatientVideo stream={cameraStream} quality="720p" />
      ) : (
        <PlaceholderAvatar />
      )}
    </VideoBox>
  </VideoContainer>
  
  <TranscriptPanel>
    <ConversationHighlights highlights={emotionalStates} />
    <Transcript
      messages={transcript}
      autoScroll={true}
      highlightRecent={true}
    />
  </TranscriptPanel>
  
  <Controls>
    <MicrophoneToggle />
    <CameraToggle />
    <EndSessionButton />
  </Controls>
</AppLayout>
```

**Design System**:

```css
/* Color palette */
:root {
  --bg-primary: #F5F5F0;
  --bg-secondary: #E8E8E0;
  --accent-primary: #4A90A4;
  --accent-secondary: #6BA5B8;
  --text-primary: #2C3E50;
  --text-secondary: #7F8C8D;
  --success: #4CAF50;
  --warning: #FFA500;
  --danger: #FF6B6B;
}

/* Typography */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
}

/* Video boxes */
.video-box {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 200ms ease-out;
}

.video-box:hover {
  transform: scale(1.02);
}

/* Transcript styling */
.transcript-message {
  padding: 12px 16px;
  margin: 8px 0;
  border-radius: 8px;
  animation: fadeIn 300ms ease-out;
}

.transcript-message.patient {
  background: var(--bg-secondary);
  margin-left: 20px;
}

.transcript-message.ai {
  background: var(--accent-secondary);
  color: white;
  margin-right: 20px;
}
```

**Responsive Breakpoints**:

```javascript
const breakpoints = {
  mobile: '320px - 767px',
  tablet: '768px - 1023px',
  desktop: '1024px+'
};

// Mobile layout
@media (max-width: 767px) {
  .video-container {
    flex-direction: column;
  }
  
  .video-box {
    width: 100%;
    height: 40vh;
  }
  
  .transcript-panel {
    height: 20vh;
    overflow-y: scroll;
  }
}

// Tablet layout
@media (min-width: 768px) and (max-width: 1023px) {
  .video-container {
    flex-direction: column;
  }
  
  .video-box {
    width: 100%;
    height: 35vh;
  }
}

// Desktop layout
@media (min-width: 1024px) {
  .video-container {
    flex-direction: row;
  }
  
  .video-box {
    width: 50%;
    height: 60vh;
  }
}
```

**Progress Tracking Visualization**:

```javascript
// Patient progress dashboard
<ProgressDashboard>
  <MoodTrajectory
    data={moodHistory}
    timeRange="last_30_days"
    chartType="line"
  />
  
  <SessionMetrics>
    <Metric label="Total Sessions" value={sessionCount} />
    <Metric label="Avg Duration" value={avgDuration} />
    <Metric label="Breakthrough Moments" value={breakthroughCount} />
  </SessionMetrics>
  
  <TreatmentGoals>
    {goals.map(goal => (
      <GoalProgress
        goal={goal.description}
        progress={goal.progress}
        status={goal.status}
      />
    ))}
  </TreatmentGoals>
  
  <TopicsExplored
    topics={topicFrequency}
    visualization="wordcloud"
  />
</ProgressDashboard>
```

**Design Decisions**:

- **Full-screen immersive layout**: Minimizes distractions, focuses on therapy
- **Calming color palette**: Soft neutrals with calming blue accents
- **High-quality avatar rendering**: 1080p/60fps for professional presence
- **Accessible design**: 44x44px minimum touch targets, WCAG AA contrast ratios
- **Smooth animations**: 200-300ms transitions for polished feel

**Design Rationale**: The full-screen layout creates an immersive therapeutic environment. Calming colors (soft neutrals, blues) reduce anxiety and promote focus. Higher rendering quality for Dr. Sterling ensures professional presence. Progress tracking visualizations help patients see their therapeutic journey (Requirements 39-40).

### 18. Infrastructure and Deployment

**Automated Setup System**:

```bash
#!/bin/bash
# setup.sh - Cross-platform infrastructure setup

echo "AI Psychiatrist Infrastructure Setup"
echo "===================================="

# Detect OS
OS=$(uname -s)
case "$OS" in
  Linux*)   PLATFORM=linux;;
  Darwin*)  PLATFORM=mac;;
  MINGW*)   PLATFORM=windows;;
  *)        echo "Unsupported OS: $OS"; exit 1;;
esac

echo "Detected platform: $PLATFORM"

# 1. Check Node.js
if ! command -v node &> /dev/null; then
  echo "Installing Node.js..."
  install_nodejs_$PLATFORM
fi

# 2. Install Ollama (for offline mode)
if ! command -v ollama &> /dev/null; then
  echo "Installing Ollama..."
  curl -fsSL https://ollama.com/install.sh | sh
fi

# 3. Download offline models
echo "Downloading offline models..."
ollama pull llama3:70b
ollama pull mistral:7b
ollama pull llama3:8b

# 4. Install Whisper.cpp
echo "Installing Whisper.cpp..."
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp
make
./models/download-ggml-model.sh medium.en
cd ..

# 5. Install Coqui XTTS
echo "Installing Coqui XTTS..."
pip install TTS

# 6. Setup Qdrant
echo "Installing Qdrant..."
docker pull qdrant/qdrant
docker run -d -p 6333:6333 -v $(pwd)/memory_directory/databases/vectors:/qdrant/storage qdrant/qdrant

# 7. Install dependencies
echo "Installing application dependencies..."
npm install

# 8. Initialize memory directory
echo "Initializing memory directory..."
node scripts/init-memory-directory.js

# 9. Validate setup
echo "Validating installation..."
node scripts/validate-setup.js

echo "Setup complete!"
```

**Hardware Requirements Validation**:

```javascript
// Validate system meets minimum requirements
class SystemValidator {
  async validate() {
    const results = {
      cpu: await this.checkCPU(),
      memory: await this.checkMemory(),
      gpu: await this.checkGPU(),
      storage: await this.checkStorage(),
      network: await this.checkNetwork()
    };
    
    const mode = this.determineOperationalMode(results);
    
    return {
      results: results,
      mode: mode,
      recommendations: this.generateRecommendations(results, mode)
    };
  }
  
  determineOperationalMode(results) {
    if (results.cpu.cores >= 8 && results.memory.total >= 32 && results.gpu.vram >= 12) {
      return 'FULL_OFFLINE';
    } else if (results.cpu.cores >= 6 && results.memory.total >= 16) {
      return 'HYBRID';
    } else if (results.cpu.cores >= 4 && results.memory.total >= 8) {
      return 'ONLINE_ONLY';
    } else {
      return 'INSUFFICIENT';
    }
  }
}
```

**Self-Healing System**:

```javascript
// Automated error detection and recovery
class SelfHealingSystem {
  constructor() {
    this.watchdogs = new Map();
    this.errorHandlers = new Map();
    this.recoveryStrategies = new Map();
  }
  
  registerWatchdog(component, timeout) {
    const watchdog = {
      component: component,
      timeout: timeout,
      lastHeartbeat: Date.now(),
      timer: null
    };
    
    watchdog.timer = setInterval(() => {
      const elapsed = Date.now() - watchdog.lastHeartbeat;
      if (elapsed > timeout) {
        this.handleTimeout(component);
      }
    }, timeout / 2);
    
    this.watchdogs.set(component, watchdog);
  }
  
  async handleTimeout(component) {
    console.error(`Watchdog timeout: ${component}`);
    
    // 1. Log error
    await errorLogger.log({
      type: 'WATCHDOG_TIMEOUT',
      component: component,
      timestamp: Date.now()
    });
    
    // 2. Attempt recovery
    const strategy = this.recoveryStrategies.get(component);
    if (strategy) {
      try {
        await strategy.recover();
        console.log(`Recovery successful: ${component}`);
      } catch (error) {
        console.error(`Recovery failed: ${component}`, error);
        await this.escalateError(component, error);
      }
    }
  }
  
  async escalateError(component, error) {
    // Generate detailed error report
    const report = {
      component: component,
      error: error,
      systemState: await this.captureSystemState(),
      logs: await this.collectRelevantLogs(),
      timestamp: Date.now()
    };
    
    // Save error report
    await fs.writeFile(
      `./memory_directory/logs/error_report_${Date.now()}.json`,
      JSON.stringify(report, null, 2)
    );
    
    // Notify user
    this.displayErrorNotification(report);
  }
}

// Watchdog timers for critical components
selfHealing.registerWatchdog('STT_ENGINE', 5000);      // 5s max for STT
selfHealing.registerWatchdog('LLM_GENERATION', 30000); // 30s max for LLM
selfHealing.registerWatchdog('TTS_ENGINE', 5000);      // 5s max for TTS
selfHealing.registerWatchdog('VECTOR_DB', 10000);      // 10s max for vector search
```

**Design Decisions**:

- **Cross-platform setup script**: Supports Windows, Mac, Linux
- **Automated model downloads**: Installs all required offline models
- **Hardware validation**: Determines optimal operational mode based on system capabilities
- **Watchdog timers**: Prevent system deadlocks with automatic recovery
- **Detailed error reporting**: Comprehensive diagnostics for troubleshooting

**Design Rationale**: The automated setup system reduces deployment complexity and ensures consistent configuration across platforms. Hardware validation prevents users from attempting offline mode on insufficient hardware. Watchdog timers with automatic recovery address Requirement 42 (Self-Healing System) by detecting and recovering from component failures (Requirements 41-42).

## Implementation Challenges

> [!WARNING]
> The strict requirements defined in [requirements.md](requirements.md) introduce significant architectural challenges that must be addressed carefully.

### 1. Hybrid Architecture State Synchronization

**Challenge**: Seamless switching between Cloud (Tier 1) and Local (Tier 2) introduces a "Split Brain" risk where session state exists on both but is not synced.

**Mitigation Strategy**:

- Use CRDTs (Conflict-free Replicated Data Types) for the Session Transcript
- Design a "Sync Manager" service that runs during the `OFFLINE_RECOVERY` -> `CONNECTING` transition
- Implement vector clocks for deterministic operation ordering
- Maintain checksums for data integrity verification

**Implementation Details**:

```javascript
class SyncManager {
  async syncOnReconnection() {
    // 1. Load local state
    const localState = await this.loadLocalState();
    
    // 2. Load cloud state
    const cloudState = await this.loadCloudState();
    
    // 3. Merge using CRDT
    const mergedState = this.transcriptCRDT.merge(
      localState.operations,
      cloudState.operations
    );
    
    // 4. Verify integrity
    if (!this.verifyChecksum(mergedState)) {
      throw new Error('State corruption detected');
    }
    
    // 5. Upload merged state to cloud
    await this.uploadToCloud(mergedState);
    
    // 6. Update local state
    await this.updateLocalState(mergedState);
  }
}
```

### 2. Event Bus Latency

**Challenge**: The 4-agent team uses an async Event Bus. If `Dr. Sterling` waits for `Context Fetcher` indefinitely, the 1500ms latency budget will be breached.

**Mitigation Strategy**:

- Implement "Optimistic Execution": Dr. Sterling starts generating assuming no context is needed
- If Context arrives within <200ms, it is injected (Prompt Injection)
- If Context arrives late, it is queued for the *next* turn (Context Pipelining)
- Use timeout-based fallbacks for all inter-agent communication

**Implementation Details**:

```javascript
class OptimisticExecutor {
  async generateResponse(patientInput) {
    // Start Dr. Sterling generation immediately
    const responsePromise = drSterling.generate(patientInput);
    
    // Request context in parallel
    const contextPromise = this.requestContext(patientInput);
    
    // Race with 200ms timeout
    const context = await Promise.race([
      contextPromise,
      this.timeout(200)
    ]);
    
    if (context) {
      // Context arrived in time - inject
      await drSterling.injectContext(context);
    } else {
      // Context late - queue for next turn
      this.contextQueue.push(contextPromise);
    }
    
    return responsePromise;
  }
}
```

### 3. FSM Deadlocks

**Challenge**: The strict Global State Machine can deadlock (e.g., stuck in `PROCESSING_STT` if VAD never sends `speech_end`).

**Mitigation Strategy**:

- Implement "Watchdog Timers" for every state transition
- Max time in `PROCESSING_STT` = 5000ms -> Force transition to `IDLE` or `ERROR`
- Provide manual override controls for stuck states
- Log all timeout events for debugging

**Implementation Details**:

```javascript
class StateMachine {
  async transition(fromState, toState, timeout) {
    const watchdog = setTimeout(() => {
      console.error(`State transition timeout: ${fromState} -> ${toState}`);
      this.forceTransition(toState, 'ERROR');
    }, timeout);
    
    try {
      await this.executeTransition(fromState, toState);
      clearTimeout(watchdog);
    } catch (error) {
      clearTimeout(watchdog);
      await this.handleTransitionError(error);
    }
  }
  
  forceTransition(fromState, toState) {
    console.warn(`Forcing transition: ${fromState} -> ${toState}`);
    this.currentState = toState;
    this.emit('state_changed', { from: fromState, to: toState, forced: true });
  }
}

// State timeouts
const STATE_TIMEOUTS = {
  PROCESSING_STT: 5000,
  PROCESSING_LLM: 30000,
  PROCESSING_TTS: 5000,
  VECTOR_SEARCH: 10000
};
```

### 4. Latency Budget Management

**Challenge**: The end-to-end latency budget of 1500ms (target) / 4000ms (max) is tight given multiple processing stages.

**Mitigation Strategy**:

- Implement streaming at every stage (STT, LLM, TTS)
- Use parallel processing wherever possible (context retrieval, sentiment analysis)
- Optimize critical path: STT -> LLM -> TTS
- Monitor latency in real-time and adjust strategies dynamically

**Latency Breakdown**:

```
Target Path (1500ms):
├─ STT: 150ms (streaming)
├─ Context Retrieval: 100ms (parallel)
├─ LLM First Token: 500ms
├─ LLM Streaming: 500ms
├─ TTS: 200ms (streaming)
└─ Lip-Sync: 50ms

Maximum Path (4000ms):
├─ STT: 500ms
├─ Context Retrieval: 300ms
├─ LLM First Token: 1500ms
├─ LLM Streaming: 1000ms
├─ TTS: 400ms
└─ Lip-Sync: 50ms
```

### 5. Context Bloating

**Challenge**: Loading entire patient history into Dr. Sterling's context can exceed token limits and degrade response quality.

**Mitigation Strategy**:

- Two-phase loading: Executive summary (500 tokens) + on-demand details
- Lazy context loading with vector search
- Intelligent context pruning based on relevance
- Token budget monitoring and enforcement

**Implementation Details**:

```javascript
class ContextManager {
  async loadContext(patientId, query) {
    // Phase 1: Always load executive summary
    const summary = await this.loadExecutiveSummary(patientId); // 500 tokens
    
    // Phase 2: Load relevant details on-demand
    const relevantContext = await this.vectorSearch(query, maxTokens: 2000);
    
    // Total context: ~2500 tokens (well within limits)
    return {
      summary: summary,
      relevantDetails: relevantContext,
      totalTokens: this.countTokens(summary) + this.countTokens(relevantContext)
    };
  }
}
```

### 6. Medication Tracking Complexity

**Challenge**: Tracking comprehensive medication history including dosages, effects, interactions requires structured data management.

**Mitigation Strategy**:

- Dedicated medication schema in Patient Overview
- Automatic extraction from conversation using NER (Named Entity Recognition)
- Structured storage with temporal tracking
- Integration with drug interaction databases

**Implementation Details**:

```javascript
// Medication schema
{
  medications: [
    {
      name: "Sertraline",
      dosage: "50mg",
      frequency: "daily",
      startDate: "2024-01-15",
      endDate: null,
      prescribedBy: "Dr. Smith",
      effects: ["improved mood", "reduced anxiety"],
      sideEffects: ["mild nausea", "sleep disturbance"],
      effectiveness: "moderate",
      notes: "Patient reports gradual improvement over 4 weeks"
    }
  ],
  medicationHistory: [
    // Previous medications with end dates
  ]
}
```

### 7. Vector Embedding Performance

**Challenge**: Generating embeddings for all session content can be slow and expensive.

**Mitigation Strategy**:

- Batch embedding generation post-session (not real-time)
- Use efficient embedding models (text-embedding-3-large)
- Implement embedding cache to avoid re-processing
- Provide manual rebuild option for data corrections

**Implementation Details**:

```javascript
class EmbeddingManager {
  async processSession(sessionId) {
    const transcript = await this.loadTranscript(sessionId);
    
    // 1. Chunk transcript
    const chunks = this.chunkTranscript(transcript, {
      size: 512,
      overlap: 64
    });
    
    // 2. Batch embed (10 chunks at a time)
    const embeddings = [];
    for (let i = 0; i < chunks.length; i += 10) {
      const batch = chunks.slice(i, i + 10);
      const batchEmbeddings = await this.embedBatch(batch);
      embeddings.push(...batchEmbeddings);
    }
    
    // 3. Store in vector DB
    await this.vectorDB.upsert(embeddings);
    
    // 4. Update embedding status
    await this.updateEmbeddingStatus(sessionId, 'COMPLETE');
  }
}
```

## Technology Stack

### Frontend

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | React 18 | Component-based architecture, hooks for state management |
| 3D Rendering | Three.js | WebGL-based avatar rendering with blend shapes |
| Avatar System | Ready Player Me | Pre-built avatar system with 52 ARKit blend shapes |
| State Management | Zustand | Lightweight, performant state management |
| Styling | Tailwind CSS | Utility-first CSS for rapid UI development |
| Audio Processing | Web Audio API | Native browser audio processing |
| Video | WebRTC | Real-time video streaming |

### Backend

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Runtime | Node.js 20+ | JavaScript runtime for full-stack development |
| Framework | Express.js | Lightweight HTTP server |
| WebSocket | Socket.io | Real-time bidirectional communication |
| Database | SQLite + SQLCipher | Portable, encrypted relational database |
| Vector DB | Qdrant | High-performance vector search with local deployment |
| Encryption | Node.js Crypto | Built-in AES-256-GCM encryption |

### AI/ML Services

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Primary LLM | Claude Sonnet 4.5 | Superior reasoning and theory of mind |
| Secondary LLM | Gemini 1.5 Pro/Flash | Long context, speed optimization |
| Offline LLM | Ollama (Llama 3, Mistral) | Local model serving |
| STT (Online) | Deepgram Nova-2 | Low latency streaming transcription |
| STT (Offline) | Whisper.cpp | Local speech recognition |
| TTS (Online) | ElevenLabs | High-quality voice synthesis |
| TTS (Offline) | Coqui XTTS v2 | Local voice cloning |
| Embeddings | OpenAI text-embedding-3-large | High-quality semantic embeddings |
| Lip-Sync | Rhubarb Lip Sync | Phoneme-to-viseme mapping |

### Infrastructure

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Containerization | Docker | Consistent deployment across platforms |
| Process Management | PM2 | Process monitoring and auto-restart |
| Logging | Winston | Structured logging with rotation |
| Monitoring | Custom Watchdog System | Component health monitoring |

## Performance Optimization Strategies

### 1. Streaming Architecture

**Strategy**: Implement streaming at every processing stage to minimize perceived latency.

```javascript
// Streaming pipeline
async function* streamingPipeline(audioInput) {
  // Stream 1: STT
  for await (const transcript of sttEngine.stream(audioInput)) {
    yield { type: 'TRANSCRIPT', data: transcript };
    
    // Stream 2: LLM (starts as soon as first transcript chunk arrives)
    for await (const token of llmEngine.stream(transcript)) {
      yield { type: 'TOKEN', data: token };
      
      // Stream 3: TTS (starts as soon as first token arrives)
      for await (const audio of ttsEngine.stream(token)) {
        yield { type: 'AUDIO', data: audio };
        
        // Stream 4: Lip-sync (starts as soon as first audio chunk arrives)
        const visemes = lipSyncEngine.process(audio);
        yield { type: 'VISEMES', data: visemes };
      }
    }
  }
}
```

### 2. Parallel Processing

**Strategy**: Execute independent operations in parallel to reduce total latency.

```javascript
// Parallel execution
async function processPatientInput(input) {
  const [transcript, sentiment, context] = await Promise.all([
    sttEngine.transcribe(input),           // 200ms
    sentimentAnalyzer.analyze(input),      // 150ms
    contextFetcher.retrieve(input)         // 200ms
  ]);
  
  // Total time: 200ms (not 550ms sequential)
  return { transcript, sentiment, context };
}
```

### 3. Caching Strategy

**Strategy**: Cache frequently accessed data to reduce database queries and API calls.

```javascript
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttl = 300000; // 5 minutes
  }
  
  async get(key, fetchFn) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    const data = await fetchFn();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }
}

// Cache patient overview, embeddings, research results
```

### 4. Resource Pooling

**Strategy**: Maintain connection pools for databases and API clients to reduce connection overhead.

```javascript
// Database connection pool
const dbPool = new Pool({
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000
});

// API client pool
const apiClients = {
  anthropic: new AnthropicClient({ maxConnections: 5 }),
  gemini: new GeminiClient({ maxConnections: 5 }),
  deepgram: new DeepgramClient({ maxConnections: 3 })
};
```

### 5. Lazy Loading

**Strategy**: Load resources on-demand rather than upfront to reduce initial load time.

```javascript
// Lazy load offline models
class ModelLoader {
  async loadModel(modelName) {
    if (!this.models.has(modelName)) {
      console.log(`Loading model: ${modelName}`);
      const model = await this.loadFromDisk(modelName);
      this.models.set(modelName, model);
    }
    return this.models.get(modelName);
  }
}
```

## Testing Strategy

### Unit Tests

**Coverage Target**: 80% code coverage

```javascript
// Example: Context Manager unit tests
describe('ContextManager', () => {
  test('loads executive summary within token limit', async () => {
    const summary = await contextManager.loadExecutiveSummary('patient-123');
    expect(countTokens(summary)).toBeLessThan(500);
  });
  
  test('retrieves relevant context based on query', async () => {
    const context = await contextManager.getRelevantContext('anxiety');
    expect(context).toContain('previous anxiety discussions');
  });
});
```

### Integration Tests

**Focus**: Test component interactions and data flow

```javascript
// Example: Session lifecycle integration test
describe('Session Lifecycle', () => {
  test('complete session flow', async () => {
    // 1. Start session
    const session = await sessionController.startSession('patient-123');
    expect(session.status).toBe('ACTIVE');
    
    // 2. Process patient input
    const response = await session.processInput('I feel anxious');
    expect(response.transcript).toBeDefined();
    expect(response.aiResponse).toBeDefined();
    
    // 3. End session
    await session.end();
    expect(session.status).toBe('COMPLETED');
    
    // 4. Verify summary generated
    const summary = await session.getSummary();
    expect(summary).toBeDefined();
  });
});
```

### Performance Tests

**Focus**: Validate latency requirements

```javascript
// Example: Latency performance test
describe('Latency Requirements', () => {
  test('STT latency under 500ms', async () => {
    const start = Date.now();
    const transcript = await sttEngine.transcribe(audioSample);
    const latency = Date.now() - start;
    expect(latency).toBeLessThan(500);
  });
  
  test('end-to-end latency under 4000ms', async () => {
    const start = Date.now();
    const response = await processPatientInput(audioSample);
    const latency = Date.now() - start;
    expect(latency).toBeLessThan(4000);
  });
});
```

### Security Tests

**Focus**: Validate encryption and access controls

```javascript
// Example: Encryption security test
describe('Data Encryption', () => {
  test('encrypts patient data at rest', async () => {
    const data = { sensitive: 'patient information' };
    await storage.save('patient-123', data);
    
    const rawFile = await fs.readFile('./memory_directory/patients/patient-123/data.enc');
    expect(rawFile.toString()).not.toContain('patient information');
  });
  
  test('requires authentication for data access', async () => {
    await expect(
      storage.load('patient-123', { authenticated: false })
    ).rejects.toThrow('Authentication required');
  });
});
```

## Deployment Architecture

### Development Environment

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src
      - ./memory_directory:/app/memory_directory
    environment:
      - NODE_ENV=development
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
  
  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
    volumes:
      - ./memory_directory/databases/vectors:/qdrant/storage
  
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ./memory_directory/models:/root/.ollama
```

### Production Environment

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "443:443"
    volumes:
      - ./memory_directory:/app/memory_directory
    environment:
      - NODE_ENV=production
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    restart: always
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 16G
  
  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
    volumes:
      - ./memory_directory/databases/vectors:/qdrant/storage
    restart: always
  
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ./memory_directory/models:/root/.ollama
    restart: always
    deploy:
      resources:
        limits:
          cpus: '8'
          memory: 32G
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

## Monitoring and Observability

### Metrics Collection

```javascript
// Performance metrics
class MetricsCollector {
  constructor() {
    this.metrics = {
      latency: {
        stt: [],
        llm: [],
        tts: [],
        endToEnd: []
      },
      errors: {
        count: 0,
        types: {}
      },
      sessions: {
        total: 0,
        completed: 0,
        interrupted: 0
      }
    };
  }
  
  recordLatency(component, duration) {
    this.metrics.latency[component].push(duration);
    
    // Alert if exceeding thresholds
    if (component === 'endToEnd' && duration > 4000) {
      this.alert('HIGH_LATENCY', { component, duration });
    }
  }
  
  getStats() {
    return {
      latency: {
        stt: this.calculateStats(this.metrics.latency.stt),
        llm: this.calculateStats(this.metrics.latency.llm),
        tts: this.calculateStats(this.metrics.latency.tts),
        endToEnd: this.calculateStats(this.metrics.latency.endToEnd)
      },
      errorRate: this.metrics.errors.count / this.metrics.sessions.total,
      completionRate: this.metrics.sessions.completed / this.metrics.sessions.total
    };
  }
}
```

### Health Checks

```javascript
// System health monitoring
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    components: {
      database: await checkDatabase(),
      vectorDB: await checkVectorDB(),
      sttEngine: await checkSTT(),
      ttsEngine: await checkTTS(),
      llmService: await checkLLM()
    }
  };
  
  const allHealthy = Object.values(health.components).every(c => c.status === 'healthy');
  health.status = allHealthy ? 'healthy' : 'degraded';
  
  res.status(allHealthy ? 200 : 503).json(health);
});
```

## Conclusion

This design document provides a comprehensive technical blueprint for implementing the AI Psychiatrist Web Application. The architecture prioritizes:

1. **Therapeutic Quality**: Multi-agent AI system with specialized roles and clinical accuracy
2. **Performance**: Streaming architecture and parallel processing to meet latency requirements
3. **Resilience**: Hybrid cloud/local operation with seamless failover
4. **Security**: End-to-end encryption and HIPAA-aligned data protection
5. **Scalability**: Modular design enabling future enhancements

The implementation should follow this design while remaining flexible to adapt to emerging requirements and technological improvements.
