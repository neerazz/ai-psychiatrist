# Agent Protocols

This document defines the communication protocols, message formats, and behavioral specifications for the multi-agent AI system in the AI Psychiatrist application.

---

## 1. Agent Overview

### 1.1 Agent Roles and Responsibilities

| Agent | Primary Role | Model Priority | Key Responsibilities |
|-------|--------------|----------------|---------------------|
| **Dr. Sterling** | Therapeutic Lead | Claude Sonnet 4.5 | Patient interaction, therapeutic dialogue, final decisions, crisis response |
| **Context Fetcher** | Memory Retrieval | Gemini Flash | Vector DB queries, context injection, historical pattern retrieval |
| **Deep Researcher** | Background Research | Gemini Pro | Topic research, evidence gathering, psychoeducation content |
| **Analyst AI** | Coordination | Gemini Pro | Needs assessment, agent coordination, session planning |

### 1.2 Agent Hierarchy

```
                    ┌─────────────────────────────┐
                    │       Dr. Sterling          │
                    │   (Therapeutic Authority)   │
                    │                             │
                    │  • Final decision maker     │
                    │  • Patient-facing           │
                    │  • Crisis authority         │
                    └─────────────┬───────────────┘
                                  │
                                  │ Commands / Synthesizes
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Context Fetcher │    │ Deep Researcher │    │   Analyst AI    │
│                 │    │                 │    │                 │
│ Responds to:    │    │ Responds to:    │    │ Responds to:    │
│ • Analyst AI    │    │ • Analyst AI    │    │ • Dr. Sterling  │
│ • Dr. Sterling  │    │ • Dr. Sterling  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 2. Message Protocol

### 2.1 Message Format (JSON Schema)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AgentMessage",
  "type": "object",
  "required": ["message_id", "timestamp", "source_agent", "message_type", "payload"],
  "properties": {
    "message_id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier for this message"
    },
    "correlation_id": {
      "type": "string",
      "format": "uuid",
      "description": "Links related messages in a conversation flow"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp"
    },
    "source_agent": {
      "type": "string",
      "enum": ["dr_sterling", "context_fetcher", "deep_researcher", "analyst_ai", "orchestrator", "crisis_detector"]
    },
    "target_agent": {
      "type": "string",
      "enum": ["dr_sterling", "context_fetcher", "deep_researcher", "analyst_ai", "all", "orchestrator"],
      "description": "Recipient of the message. 'all' for broadcasts"
    },
    "message_type": {
      "type": "string",
      "enum": [
        "request",           // Request action from another agent
        "response",          // Response to a request
        "broadcast",         // Information to all agents
        "alert",            // High-priority notification
        "handoff",          // Transfer control/context
        "status_update",    // Progress update
        "crisis_alert"      // Crisis-related communication
      ]
    },
    "priority": {
      "type": "integer",
      "minimum": 1,
      "maximum": 5,
      "description": "1=crisis (highest), 2=urgent, 3=normal, 4=low, 5=background"
    },
    "ttl_ms": {
      "type": "integer",
      "description": "Message expiry in milliseconds. Default: 5000",
      "default": 5000
    },
    "payload": {
      "type": "object",
      "description": "Message-specific content",
      "properties": {
        "action": {
          "type": "string",
          "description": "Specific action requested or performed"
        },
        "data": {
          "type": "object",
          "description": "Action-specific data"
        },
        "context": {
          "type": "object",
          "description": "Relevant context for the action"
        },
        "result": {
          "type": "object",
          "description": "Result of a completed action"
        },
        "error": {
          "type": "object",
          "description": "Error information if action failed"
        }
      }
    },
    "session_context": {
      "type": "object",
      "properties": {
        "session_id": {"type": "string"},
        "patient_id": {"type": "string"},
        "turn_number": {"type": "integer"},
        "current_state": {"type": "string"}
      }
    }
  }
}
```

### 2.2 Action Types by Agent

#### Dr. Sterling Actions

| Action | Description | Payload |
|--------|-------------|---------|
| `generate_response` | Generate therapeutic response | `{user_input, context, emotional_state}` |
| `synthesize_insights` | Combine agent inputs | `{agent_contributions: {...}}` |
| `crisis_intervention` | Handle crisis | `{tier, indicators, patient_state}` |
| `conclude_session` | End session summary | `{session_data}` |

#### Context Fetcher Actions

| Action | Description | Payload |
|--------|-------------|---------|
| `retrieve_context` | Fetch relevant memories | `{query, patient_id, max_results, filters}` |
| `retrieve_medication_history` | Get medication data | `{patient_id}` |
| `retrieve_session_history` | Get past session data | `{patient_id, limit}` |
| `retrieve_risk_factors` | Get risk assessment data | `{patient_id}` |

#### Deep Researcher Actions

| Action | Description | Payload |
|--------|-------------|---------|
| `research_topic` | Research therapeutic topic | `{topic, depth, max_sources}` |
| `research_condition` | Research mental health condition | `{condition_name}` |
| `research_technique` | Research therapeutic technique | `{technique_name}` |
| `validate_claim` | Verify clinical claim | `{claim, sources}` |

#### Analyst AI Actions

| Action | Description | Payload |
|--------|-------------|---------|
| `assess_needs` | Determine session needs | `{user_input, context, emotional_state}` |
| `coordinate_agents` | Direct support agents | `{required_context, research_topics}` |
| `evaluate_response` | Review response quality | `{proposed_response, context}` |
| `plan_session_focus` | Determine session priorities | `{patient_overview, recent_sessions}` |

---

## 3. Communication Patterns

### 3.1 Standard Conversation Turn Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STANDARD CONVERSATION TURN                              │
│                                                                              │
│  PHASE 1: INPUT PROCESSING (0-200ms)                                        │
│  ─────────────────────────────────────                                      │
│                                                                              │
│  [User Input] ──► [Orchestrator] ──► Parallel dispatch:                     │
│                                     ├──► [Crisis Detector] (priority)       │
│                                     └──► [Analyst AI] (assessment)          │
│                                                                              │
│  PHASE 2: CONTEXT GATHERING (200-400ms)                                     │
│  ──────────────────────────────────────                                     │
│                                                                              │
│  [Analyst AI] assesses needs ──► dispatches:                                │
│       │                                                                      │
│       ├──► [Context Fetcher]: retrieve_context                              │
│       │    {query: <semantic_query>, max_results: 5}                        │
│       │                                                                      │
│       └──► [Deep Researcher]: research_topic (if needed)                    │
│            {topic: <identified_topic>, depth: "quick"}                      │
│                                                                              │
│  PHASE 3: RESPONSE GENERATION (400-2000ms)                                  │
│  ──────────────────────────────────────────                                 │
│                                                                              │
│  [Analyst AI] aggregates context ──► sends to [Dr. Sterling]:               │
│       {                                                                      │
│         user_input: "...",                                                  │
│         retrieved_context: [...],                                           │
│         research_findings: {...},                                           │
│         emotional_assessment: {...},                                        │
│         recommended_approach: "..."                                         │
│       }                                                                      │
│                                                                              │
│  [Dr. Sterling] generates response with extended thinking                   │
│                                                                              │
│  PHASE 4: OUTPUT (2000-3000ms)                                              │
│  ─────────────────────────────                                              │
│                                                                              │
│  [Dr. Sterling] ──► [Orchestrator] ──► TTS ──► Lip-Sync ──► User           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Crisis Intervention Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CRISIS INTERVENTION FLOW                             │
│                                                                              │
│  [Crisis Detector] detects Tier-1 indicators                                │
│       │                                                                      │
│       ▼                                                                      │
│  BROADCAST (priority: 1) to ALL agents:                                     │
│  {                                                                           │
│    "message_type": "crisis_alert",                                          │
│    "payload": {                                                             │
│      "action": "crisis_detected",                                           │
│      "data": {                                                              │
│        "tier": 1,                                                           │
│        "indicators": ["suicidal_ideation", "plan_mentioned"],               │
│        "immediate_action_required": true                                    │
│      }                                                                       │
│    }                                                                         │
│  }                                                                           │
│       │                                                                      │
│       ▼                                                                      │
│  [All Agents] PAUSE normal processing                                       │
│       │                                                                      │
│       ▼                                                                      │
│  [Dr. Sterling] takes SOLE CONTROL:                                         │
│  {                                                                           │
│    "message_type": "handoff",                                               │
│    "payload": {                                                             │
│      "action": "assume_crisis_control",                                     │
│      "data": {                                                              │
│        "protocol": "safety_first",                                          │
│        "disable_normal_flow": true,                                         │
│        "enable_resources": true                                             │
│      }                                                                       │
│    }                                                                         │
│  }                                                                           │
│       │                                                                      │
│       ▼                                                                      │
│  [Orchestrator] displays crisis resources UI                                │
│  [Dr. Sterling] delivers safety-focused response                            │
│                                                                              │
│  RESOLUTION:                                                                │
│  [Dr. Sterling] broadcasts when crisis de-escalates:                        │
│  {                                                                           │
│    "message_type": "broadcast",                                             │
│    "payload": {                                                             │
│      "action": "crisis_resolved",                                           │
│      "data": {                                                              │
│        "resolution_type": "de-escalated",                                   │
│        "resume_normal_flow": true,                                          │
│        "monitoring_level": "elevated"                                       │
│      }                                                                       │
│    }                                                                         │
│  }                                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Context Retrieval Pattern

```typescript
// Analyst AI requests context
const contextRequest: AgentMessage = {
  message_id: uuid(),
  correlation_id: currentTurnId,
  timestamp: new Date().toISOString(),
  source_agent: "analyst_ai",
  target_agent: "context_fetcher",
  message_type: "request",
  priority: 3,
  ttl_ms: 3000,
  payload: {
    action: "retrieve_context",
    data: {
      query: "patient mentions feeling anxious about work deadlines",
      patient_id: "patient_123",
      max_results: 5,
      filters: {
        memory_types: ["coping_strategy", "trigger", "past_discussion"],
        recency_weight: 0.3,
        relevance_threshold: 0.72
      }
    },
    context: {
      current_emotional_state: "anxious",
      session_topics: ["work_stress", "anxiety"]
    }
  },
  session_context: {
    session_id: "session_456",
    patient_id: "patient_123",
    turn_number: 7,
    current_state: "PROCESSING_LLM"
  }
};

// Context Fetcher responds
const contextResponse: AgentMessage = {
  message_id: uuid(),
  correlation_id: currentTurnId,
  timestamp: new Date().toISOString(),
  source_agent: "context_fetcher",
  target_agent: "analyst_ai",
  message_type: "response",
  priority: 3,
  payload: {
    action: "retrieve_context",
    result: {
      success: true,
      retrieved_count: 4,
      memories: [
        {
          memory_id: "mem_001",
          content: "Patient previously mentioned that deep breathing helps with work anxiety",
          memory_type: "coping_strategy",
          relevance_score: 0.89,
          source_session: "session_445",
          timestamp: "2025-01-10T14:30:00Z"
        },
        {
          memory_id: "mem_002",
          content: "Deadline pressure is a known trigger for patient's anxiety",
          memory_type: "trigger",
          relevance_score: 0.85,
          source_session: "session_440"
        }
        // ... more memories
      ],
      retrieval_latency_ms: 87
    }
  }
};
```

---

## 4. Agent System Prompts

### 4.1 Dr. Sterling System Prompt

```markdown
# Dr. Sterling - AI Psychiatrist

You are Dr. Sterling, an experienced psychiatrist conducting a therapy session. You combine the warmth of a compassionate counselor with the expertise of a clinical professional.

## Core Principles

1. **Patient Safety First**: Always prioritize patient wellbeing. Monitor for crisis indicators.
2. **Therapeutic Alliance**: Build trust through empathy, validation, and genuine interest.
3. **Evidence-Based Practice**: Use CBT, DBT, MI, and other proven therapeutic techniques.
4. **Opinionated Advocacy**: Be direct when patient wellbeing requires it. Challenge harmful patterns.
5. **Holistic Perspective**: Address all life domains, not just presenting symptoms.

## Behavioral Guidelines

### DO:
- Respond with warmth and professional confidence
- Ask probing follow-up questions to understand underlying issues
- Connect patterns across conversations
- Provide substantive, meaningful guidance
- Use therapeutic techniques naturally in conversation
- Remember and reference patient history appropriately
- Challenge cognitive distortions gently but clearly

### DO NOT:
- Provide AI disclaimers during the session
- Say "I don't know" - research before responding if uncertain
- Give passive, generic acknowledgments
- Diagnose specific conditions (you can discuss symptoms/patterns)
- Prescribe medication (you can discuss medication experiences)
- Minimize patient concerns

## Response Format

Your responses should:
1. Acknowledge what the patient shared (validation)
2. Demonstrate understanding (reflection)
3. Provide therapeutic value (insight, technique, or exploration)
4. Move the conversation forward (question or invitation)

## Context Integration

You will receive context from support agents:
- **Retrieved Memories**: Past conversations, preferences, history
- **Research Findings**: Evidence-based information on relevant topics
- **Emotional Assessment**: Real-time emotional state analysis
- **Session Recommendations**: Suggested approaches and focus areas

Integrate this context naturally. Never reference "the system" or "other agents."

## Crisis Protocol

If you detect crisis indicators:
1. Shift immediately to safety-focused dialogue
2. Express genuine concern
3. Assess immediate safety
4. Provide crisis resources
5. Do NOT attempt to resolve acute crises through therapy alone
```

### 4.2 Context Fetcher System Prompt

```markdown
# Context Fetcher Agent

You are a specialized retrieval agent for therapeutic context. Your role is to query patient memory systems and return relevant historical information.

## Responsibilities

1. Execute semantic searches against the Vector_Database
2. Retrieve relevant patient memories, past discussions, and clinical insights
3. Filter and rank results by relevance to current context
4. Return structured, actionable context for Dr. Sterling

## Query Optimization

- Use query expansion for emotional terms (sad → depressed, down, blue)
- Include temporal context (recent memories weighted higher for acute issues)
- Consider memory type filters based on query intent
- Apply patient-specific relevance thresholds

## Response Format

Always return structured results:
```json
{
  "memories": [
    {
      "memory_id": "...",
      "content": "...",
      "memory_type": "...",
      "relevance_score": 0.0-1.0,
      "source_session": "...",
      "timestamp": "..."
    }
  ],
  "retrieval_metadata": {
    "total_candidates": int,
    "filtered_count": int,
    "latency_ms": int
  }
}
```

## Performance Requirements

- Target latency: <200ms
- Maximum latency: 300ms
- If exceeding timeout, return partial results
```

### 4.3 Deep Researcher System Prompt

```markdown
# Deep Researcher Agent

You are a research specialist providing evidence-based information to support therapeutic conversations.

## Responsibilities

1. Research mental health topics, conditions, and treatments
2. Gather psychoeducational content
3. Validate clinical claims with authoritative sources
4. Provide evidence summaries for therapeutic use

## Research Guidelines

- Prioritize peer-reviewed and authoritative sources
- Synthesize information for practical therapeutic application
- Flag any controversial or uncertain findings
- Provide balanced perspectives where evidence is mixed

## Response Format

```json
{
  "topic": "...",
  "summary": "2-3 sentence synthesis",
  "key_points": ["..."],
  "therapeutic_applications": ["..."],
  "sources_confidence": "high|medium|low",
  "caveats": ["..."]
}
```

## Performance Requirements

- Quick research: <3 seconds
- Deep research: <10 seconds (background thread)
- Always provide useful partial results if time-constrained
```

### 4.4 Analyst AI System Prompt

```markdown
# Analyst AI - Session Coordinator

You are the analytical coordinator for therapy sessions. You assess conversation needs and direct support agents to gather appropriate resources.

## Responsibilities

1. Analyze user input to determine required context and research
2. Dispatch requests to Context Fetcher and Deep Researcher
3. Aggregate agent responses for Dr. Sterling
4. Evaluate session progress and recommend focus areas

## Analysis Framework

For each user input, assess:
1. **Emotional State**: What emotions are present? Intensity?
2. **Underlying Needs**: What does the patient actually need right now?
3. **Context Required**: What historical information would help?
4. **Research Needed**: Are there topics requiring evidence-based input?
5. **Therapeutic Approach**: What techniques might be most effective?

## Coordination Protocol

```json
{
  "assessment": {
    "emotional_state": "...",
    "intensity": 0.0-1.0,
    "underlying_needs": ["..."],
    "recommended_approach": "..."
  },
  "context_requests": [
    {
      "target": "context_fetcher",
      "action": "retrieve_context",
      "query": "...",
      "filters": {...}
    }
  ],
  "research_requests": [
    {
      "target": "deep_researcher",
      "action": "research_topic",
      "topic": "...",
      "depth": "quick|deep"
    }
  ]
}
```

## Performance Requirements

- Assessment latency: <100ms
- Coordination dispatch: <50ms
- Context aggregation: <100ms
```

---

## 5. Agent Configuration

### 5.1 Model Configuration by Mode

#### Claude-Only Mode (ANTHROPIC_API_KEY only)

```json
{
  "mode": "claude_only",
  "agents": {
    "dr_sterling": {
      "model": "claude-sonnet-4-5-20241022",
      "temperature": 0.25,
      "max_tokens": 2048,
      "thinking": {
        "type": "enabled",
        "budget_tokens": 32768
      }
    },
    "context_fetcher": {
      "model": "claude-sonnet-4-5-20241022",
      "temperature": 0.1,
      "max_tokens": 1024
    },
    "deep_researcher": {
      "model": "claude-sonnet-4-5-20241022",
      "temperature": 0.3,
      "max_tokens": 4096
    },
    "analyst_ai": {
      "model": "claude-sonnet-4-5-20241022",
      "temperature": 0.2,
      "max_tokens": 2048
    }
  }
}
```

#### Gemini-Only Mode (GEMINI_API_KEY only)

```json
{
  "mode": "gemini_only",
  "agents": {
    "dr_sterling": {
      "model": "gemini-1.5-pro",
      "temperature": 0.35,
      "max_tokens": 2048,
      "safety_settings": "clinical_adjusted"
    },
    "context_fetcher": {
      "model": "gemini-1.5-flash",
      "temperature": 0.1,
      "max_tokens": 1024
    },
    "deep_researcher": {
      "model": "gemini-1.5-pro",
      "temperature": 0.4,
      "max_tokens": 4096
    },
    "analyst_ai": {
      "model": "gemini-1.5-pro",
      "temperature": 0.25,
      "max_tokens": 2048
    }
  }
}
```

#### Hybrid Mode (Both API keys present)

```json
{
  "mode": "hybrid",
  "agents": {
    "dr_sterling": {
      "provider": "anthropic",
      "model": "claude-sonnet-4-5-20241022",
      "temperature": 0.25,
      "max_tokens": 2048,
      "thinking": {
        "type": "enabled",
        "budget_tokens": 32768
      },
      "rationale": "Best empathy, theory of mind, and therapeutic reasoning"
    },
    "context_fetcher": {
      "provider": "google",
      "model": "gemini-1.5-flash",
      "temperature": 0.1,
      "max_tokens": 1024,
      "rationale": "Fastest for retrieval tasks"
    },
    "deep_researcher": {
      "provider": "google",
      "model": "gemini-1.5-pro",
      "temperature": 0.4,
      "max_tokens": 4096,
      "rationale": "2M context window for comprehensive research"
    },
    "analyst_ai": {
      "provider": "google",
      "model": "gemini-1.5-pro",
      "temperature": 0.25,
      "max_tokens": 2048,
      "rationale": "Cost-effective for analytical tasks"
    }
  }
}
```

#### Offline Mode (No API keys)

```json
{
  "mode": "offline",
  "agents": {
    "dr_sterling": {
      "provider": "ollama",
      "model": "llama3:70b-instruct-q4_K_M",
      "temperature": 0.3,
      "max_tokens": 2048,
      "fallback": "llama3:8b-instruct-q4_K_M"
    },
    "context_fetcher": {
      "provider": "ollama",
      "model": "mistral:7b-instruct-q4_K_M",
      "temperature": 0.1,
      "max_tokens": 1024
    },
    "deep_researcher": {
      "provider": "ollama",
      "model": "llama3:8b-instruct-q4_K_M",
      "temperature": 0.4,
      "max_tokens": 2048
    },
    "analyst_ai": {
      "provider": "ollama",
      "model": "mistral:7b-instruct-q4_K_M",
      "temperature": 0.2,
      "max_tokens": 1024
    }
  }
}
```

---

## 6. Error Handling

### 6.1 Agent Error Types

| Error Type | Description | Recovery Action |
|------------|-------------|-----------------|
| `TIMEOUT` | Agent did not respond within TTL | Use cached/default response |
| `RATE_LIMIT` | API rate limit exceeded | Fallback to secondary model |
| `API_ERROR` | API returned error | Retry with backoff, then fallback |
| `INVALID_RESPONSE` | Response failed validation | Request regeneration |
| `CONTEXT_OVERFLOW` | Context too large | Compress and retry |

### 6.2 Fallback Chain

```typescript
const fallbackChain = {
  dr_sterling: {
    primary: "claude-sonnet-4.5",
    fallback_1: "gemini-1.5-pro",
    fallback_2: "llama3:70b",
    emergency: "safe_response_template"
  },
  context_fetcher: {
    primary: "gemini-1.5-flash",
    fallback_1: "claude-haiku",
    fallback_2: "mistral:7b",
    emergency: "empty_context"
  },
  deep_researcher: {
    primary: "gemini-1.5-pro",
    fallback_1: "claude-sonnet-4.5",
    fallback_2: "llama3:8b",
    emergency: "no_research"
  },
  analyst_ai: {
    primary: "gemini-1.5-pro",
    fallback_1: "claude-sonnet-4.5",
    fallback_2: "mistral:7b",
    emergency: "default_assessment"
  }
};
```

### 6.3 Error Recovery Messages

```typescript
const emergencyResponses = {
  safe_response_template: {
    dr_sterling: "I want to make sure I understand you correctly. Could you tell me a bit more about what you're experiencing right now?",
    context: "Neutral, open-ended response when all models fail"
  },
  empty_context: {
    context_fetcher: { memories: [], retrieval_metadata: { error: "fallback" } },
    context: "Return empty context when retrieval fails"
  },
  no_research: {
    deep_researcher: { topic: null, summary: "Research unavailable", key_points: [] },
    context: "Skip research when unavailable"
  },
  default_assessment: {
    analyst_ai: {
      assessment: { emotional_state: "unknown", recommended_approach: "supportive_listening" },
      context_requests: [],
      research_requests: []
    },
    context: "Default to supportive listening when analysis fails"
  }
};
```

---

## 7. End-of-Session Protocol

### 7.1 Session Conclusion Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        END-OF-SESSION PROTOCOL                               │
│                                                                              │
│  TRIGGER: timer_25min OR user_ends_session                                  │
│                                                                              │
│  PHASE 1: CONCLUDE DIALOGUE (30s)                                           │
│  ──────────────────────────────────                                         │
│  [Dr. Sterling] delivers closing therapeutic message                        │
│  [Dr. Sterling] summarizes key session points                               │
│  [Dr. Sterling] assigns any homework                                        │
│                                                                              │
│  PHASE 2: AGENT DISCUSSION (optional, 60s)                                  │
│  ─────────────────────────────────────────                                  │
│  If enabled in settings:                                                    │
│                                                                              │
│  [Analyst AI] → broadcast: "session_conclude_request"                       │
│       │                                                                      │
│       ├──► [Context Fetcher] provides: historical_perspective              │
│       │    "Based on the patient's history, today's discussion of..."      │
│       │                                                                      │
│       ├──► [Deep Researcher] provides: research_perspective                │
│       │    "The evidence suggests that the approach we took..."            │
│       │                                                                      │
│       └──► [Analyst AI] provides: needs_assessment                         │
│            "For the next session, I recommend focusing on..."              │
│                                                                              │
│  [Dr. Sterling] synthesizes perspectives into final summary                 │
│                                                                              │
│  PHASE 3: DOCUMENTATION (30s)                                               │
│  ────────────────────────────                                               │
│  [Analyst AI] generates Session_Summary document                            │
│  [Context Fetcher] extracts new memories for Vector_Database                │
│  [Deep Researcher] identifies follow-up research needs                      │
│                                                                              │
│  PHASE 4: UPDATES (background, async)                                       │
│  ─────────────────────────────────────                                      │
│  - Update Patient_Overview with new insights                                │
│  - Queue embedding jobs for transcript and memories                         │
│  - Update session database                                                  │
│  - Log session metrics                                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Agent Contribution Format for Session Summary

```json
{
  "agent_contributions": {
    "dr_sterling_summary": {
      "session_narrative": "Today we explored [patient]'s anxiety around work deadlines...",
      "therapeutic_techniques_used": ["cognitive_restructuring", "behavioral_activation"],
      "key_insights": ["Patient shows awareness of catastrophizing pattern"],
      "homework_assigned": ["Practice deep breathing before meetings"],
      "next_session_focus": "Follow up on breathing exercise effectiveness"
    },
    "context_fetcher_insights": {
      "historical_patterns": "This anxiety pattern first appeared in Session 3...",
      "progress_indicators": ["Patient's anxiety vocabulary has expanded (progress in awareness)"],
      "memory_updates_needed": ["Add new coping strategy: meeting preparation routine"]
    },
    "deep_researcher_findings": {
      "relevant_research": "Studies show progressive muscle relaxation reduces...",
      "recommended_resources": ["Jacobson's Progressive Relaxation guide"],
      "evidence_gaps": "More research needed on workplace-specific interventions"
    },
    "analyst_ai_assessment": {
      "session_effectiveness": 0.78,
      "engagement_level": "highly_engaged",
      "goal_progress": {"anxiety_management": "+15%"},
      "recommended_focus_next": ["Expand coping toolkit", "Address underlying perfectionism"]
    }
  }
}
```

---

## 8. Performance Monitoring

### 8.1 Agent Metrics

```typescript
interface AgentMetrics {
  agent_name: string;

  // Latency metrics
  avg_response_time_ms: number;
  p50_response_time_ms: number;
  p95_response_time_ms: number;
  p99_response_time_ms: number;

  // Reliability metrics
  success_rate: number;  // 0.0-1.0
  timeout_rate: number;
  error_rate: number;
  fallback_rate: number;

  // Usage metrics
  requests_total: number;
  tokens_input_total: number;
  tokens_output_total: number;

  // Quality metrics (sampled)
  avg_response_relevance: number;  // 0.0-1.0
  therapeutic_quality_score: number;  // 0.0-10.0
}
```

### 8.2 Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Agent response p95 | >2000ms | >4000ms |
| Agent error rate | >1% | >5% |
| Agent timeout rate | >2% | >10% |
| Fallback rate | >5% | >20% |
| Crisis detection latency | >200ms | >500ms |

---

*Document Version: 1.0.0*
*Last Updated: January 2025*
