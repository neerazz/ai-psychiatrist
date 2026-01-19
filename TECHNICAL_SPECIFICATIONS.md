# Production AI Therapy/Psychiatrist Technical Specifications

## 1. Real-Time Conversation Systems

### Latency Budgets for Therapeutic Conversations

| Component | Target Latency | Maximum Acceptable | Notes |
|-----------|---------------|-------------------|-------|
| Speech-to-Text (STT) | 150-300ms | 500ms | Streaming preferred |
| LLM Processing | 500-1500ms | 3000ms | First token latency |
| Text-to-Speech (TTS) | 200-400ms | 800ms | Streaming synthesis |
| Lip-Sync Processing | <50ms | 100ms | Real-time viseme mapping |
| **End-to-End** | **1-2 seconds** | **4 seconds** | User-perceived response |

**Research Finding**: Studies show that conversational latency >4 seconds significantly reduces therapeutic rapport and user engagement. Optimal "thinking pause" is 1.5-2.5 seconds (mimics human therapist reflection time).

### Speech-to-Text Engines

#### Online/Cloud Solutions

| Engine | Latency | WER (Word Error Rate) | Streaming | Best For |
|--------|---------|----------------------|-----------|----------|
| **OpenAI Whisper API** | 200-500ms | 4-8% | Yes (via streaming) | Accuracy, multilingual |
| **Google Speech-to-Text v2** | 100-300ms | 5-7% | Yes | Real-time, low latency |
| **Azure Speech Services** | 150-400ms | 5-8% | Yes | Enterprise, HIPAA |
| **Amazon Transcribe** | 200-500ms | 6-9% | Yes | AWS ecosystem |
| **Deepgram Nova-2** | 80-200ms | 4-6% | Yes | Fastest, conversation AI |
| **AssemblyAI** | 150-350ms | 5-7% | Yes | Sentiment analysis built-in |

#### Offline/On-Device Solutions

| Engine | Model Size | Latency | WER | Platform |
|--------|------------|---------|-----|----------|
| **Whisper.cpp** | 39MB-1.5GB | 100-500ms | 5-10% | Cross-platform |
| **Vosk** | 50MB-1.8GB | 50-200ms | 8-15% | Mobile, embedded |
| **Mozilla DeepSpeech** | 188MB | 100-300ms | 10-15% | Open source |
| **Picovoice Leopard** | 3-30MB | <100ms | 8-12% | Mobile-optimized |
| **Silero STT** | 50-100MB | 50-150ms | 8-12% | PyTorch native |

**Therapy-Specific Considerations**:
- Enable profanity filtering bypass (patients may express distress)
- Custom vocabulary for clinical terms (CBT, DBT, EMDR, etc.)
- Emotion/sentiment detection integration
- Handle crying, sighing, long pauses gracefully

### Text-to-Speech for Therapeutic Voices

#### Key Parameters for Therapeutic Voice

```json
{
  "voice_characteristics": {
    "pitch_range": "medium-low (120-180Hz for calming effect)",
    "speaking_rate": "0.85-0.95x normal (deliberate, unhurried)",
    "pitch_variance": "moderate (monotone feels robotic)",
    "breathiness": "slight (warmth without artificiality)",
    "pause_insertion": "natural at sentence boundaries"
  },
  "emotional_modulation": {
    "empathy_moments": "slower rate, softer volume",
    "affirmation": "slight uptick in energy",
    "grounding_exercises": "very slow, rhythmic",
    "crisis_response": "calm, steady, slightly lower pitch"
  }
}
```

#### TTS Engine Comparison

| Engine | Latency | Voice Quality | Emotion Control | SSML Support |
|--------|---------|---------------|-----------------|--------------|
| **ElevenLabs** | 200-500ms | Excellent | Yes (voice design) | Yes |
| **Azure Neural TTS** | 150-400ms | Excellent | Yes (SSML emotions) | Full |
| **Google Cloud TTS** | 100-300ms | Very Good | Limited | Full |
| **Amazon Polly Neural** | 150-350ms | Good | Limited | Full |
| **OpenAI TTS** | 200-400ms | Excellent | Voice selection only | No |
| **Coqui TTS (OSS)** | 100-300ms | Good | Training-based | Partial |
| **XTTS v2** | 150-400ms | Very Good | Clone-based | No |

#### SSML Example for Therapeutic Response

```xml
<speak>
  <prosody rate="90%" pitch="-5%">
    I hear you, and what you're feeling is completely valid.
  </prosody>
  <break time="800ms"/>
  <prosody rate="85%" pitch="-8%">
    Let's take a moment to breathe together.
  </prosody>
  <break time="1200ms"/>
  <prosody rate="80%">
    Breathe in slowly...
  </prosody>
  <break time="3000ms"/>
  <prosody rate="80%">
    And breathe out.
  </prosody>
</speak>
```

### Lip-Sync Technologies

#### Approaches

1. **Viseme-Based Mapping**
   - Map phonemes to 15-22 standard visemes
   - Real-time from TTS phoneme output
   - Latency: <20ms
   - Libraries: Rhubarb Lip Sync, OVRLipSync (Oculus)

2. **Audio-Driven Neural**
   - Direct audio waveform to blend shapes
   - Models: Wav2Lip, SadTalker, ER-NeRF
   - Latency: 50-200ms
   - Quality: More natural, handles emotion

3. **Real-Time Avatar Solutions**

| Solution | Latency | Quality | Integration |
|----------|---------|---------|-------------|
| **NVIDIA Audio2Face** | 30-50ms | Excellent | Unreal/Unity |
| **Ready Player Me** | 20-40ms | Good | Web/Unity |
| **Soul Machines** | 40-80ms | Excellent | Cloud API |
| **Replika Avatar System** | 30-60ms | Good | Proprietary |
| **Synthesia** | 100-200ms | Excellent | Pre-rendered |

#### Technical Requirements

```yaml
lip_sync_config:
  target_fps: 60  # minimum 30 for smoothness
  blend_shapes: 52  # ARKit standard
  viseme_set: "oculus_15"  # or "disney_extended_22"
  audio_buffer_size: 1024  # samples
  prediction_window_ms: 100
  smoothing_factor: 0.7
```

---

## 2. Multi-Agent AI Orchestration

### Architecture Patterns

#### Pattern 1: Router-Worker

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (Router)                     │
│  - Intent classification                                     │
│  - Agent selection                                          │
│  - Context management                                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┬─────────────┐
    ▼             ▼             ▼             ▼
┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐
│ CBT   │   │ Crisis│   │ Rapport│   │ Assess│
│ Agent │   │ Agent │   │ Agent  │   │ Agent │
└───────┘   └───────┘   └───────┘   └───────┘
```

#### Pattern 2: Ensemble with Voting

```python
class TherapeuticEnsemble:
    agents = [
        "empathy_agent",      # Validates emotional response
        "clinical_agent",     # Ensures therapeutic accuracy
        "safety_agent",       # Crisis/risk detection
        "continuity_agent"    # Maintains conversation coherence
    ]

    voting_strategy = "weighted_consensus"
    safety_agent_veto_power = True
    minimum_agreement = 0.6
```

### Communication Protocols

#### Message Format (JSON Schema)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "message_id": {
      "type": "string",
      "format": "uuid"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "source_agent": {
      "type": "string",
      "enum": ["orchestrator", "cbt_agent", "crisis_agent", "rapport_agent", "assessment_agent"]
    },
    "target_agent": {
      "type": "string"
    },
    "message_type": {
      "type": "string",
      "enum": ["request", "response", "broadcast", "alert", "handoff"]
    },
    "priority": {
      "type": "integer",
      "minimum": 1,
      "maximum": 5,
      "description": "1=crisis, 5=routine"
    },
    "payload": {
      "type": "object",
      "properties": {
        "user_input": {"type": "string"},
        "context_summary": {"type": "string"},
        "detected_intent": {"type": "string"},
        "emotional_state": {
          "type": "object",
          "properties": {
            "primary": {"type": "string"},
            "intensity": {"type": "number", "minimum": 0, "maximum": 1},
            "confidence": {"type": "number", "minimum": 0, "maximum": 1}
          }
        },
        "risk_indicators": {
          "type": "array",
          "items": {"type": "string"}
        },
        "suggested_response": {"type": "string"},
        "therapeutic_techniques": {
          "type": "array",
          "items": {"type": "string"}
        }
      }
    },
    "context_window": {
      "type": "object",
      "properties": {
        "session_id": {"type": "string"},
        "turn_number": {"type": "integer"},
        "compressed_history": {"type": "string"},
        "active_treatment_goals": {"type": "array"},
        "contraindications": {"type": "array"}
      }
    }
  },
  "required": ["message_id", "timestamp", "source_agent", "message_type", "payload"]
}
```

#### Context Sharing Strategy

```yaml
context_sharing:
  # Shared memory tiers
  tiers:
    - name: "hot_context"
      scope: "current_session"
      max_tokens: 4000
      refresh: "every_turn"

    - name: "warm_context"
      scope: "recent_sessions"
      max_tokens: 2000
      refresh: "session_start"

    - name: "cold_context"
      scope: "patient_profile"
      storage: "vector_db"
      retrieval: "semantic_search"

  # What each agent sees
  agent_views:
    crisis_agent:
      - "hot_context"
      - "risk_history"
      - "safety_plan"

    cbt_agent:
      - "hot_context"
      - "thought_records"
      - "behavioral_experiments"

    rapport_agent:
      - "hot_context"
      - "relationship_notes"
      - "preferences"
```

### Inter-Agent Communication Patterns

```python
# Event-driven messaging with Redis Streams or Kafka
class AgentMessage:
    TOPICS = {
        "user.input": "New user message received",
        "agent.response": "Agent generated response",
        "crisis.detected": "Safety concern identified",
        "context.update": "Shared context modified",
        "handoff.request": "Agent requesting handoff",
        "session.summary": "End of session summary"
    }

# Example crisis escalation flow
async def crisis_escalation(message):
    await publish("crisis.detected", {
        "severity": "high",
        "indicators": ["suicidal_ideation"],
        "immediate_action": "safety_protocol_1"
    })
    # All agents pause normal operation
    # Crisis agent takes control
    # Human escalation triggered if needed
```

---

## 3. Vector Databases for Therapy

### Embedding Model Selection

| Model | Dimensions | Max Tokens | Best For | Latency |
|-------|------------|------------|----------|---------|
| **OpenAI text-embedding-3-large** | 3072 | 8191 | General, high quality | 50-150ms |
| **OpenAI text-embedding-3-small** | 1536 | 8191 | Cost-effective | 30-100ms |
| **Cohere embed-english-v3** | 1024 | 512 | English, fast | 20-80ms |
| **Voyage AI voyage-large-2** | 1536 | 16000 | Long context | 50-120ms |
| **BGE-large-en-v1.5** | 1024 | 512 | Open source, fast | 10-50ms |
| **E5-large-v2** | 1024 | 512 | Sentence similarity | 10-50ms |
| **GTE-large** | 1024 | 512 | General purpose OSS | 10-50ms |
| **MedCPT** | 768 | 512 | Medical/clinical | 15-60ms |

**Therapy-Specific Recommendation**:
- Primary: `text-embedding-3-large` (nuanced emotional content)
- Fallback: `BGE-large-en-v1.5` (offline capability)
- Consider fine-tuning on therapeutic conversation data

### Chunk Size Optimization

```python
chunking_strategy = {
    # Session transcripts
    "session_notes": {
        "chunk_size": 512,      # tokens
        "chunk_overlap": 64,    # 12.5% overlap
        "splitter": "semantic", # sentence-boundary aware
        "metadata": ["session_date", "primary_topic", "emotional_valence"]
    },

    # Treatment plans
    "treatment_plans": {
        "chunk_size": 256,
        "chunk_overlap": 32,
        "splitter": "section_header",
        "metadata": ["goal_id", "technique", "progress_status"]
    },

    # Psychoeducation content
    "educational_content": {
        "chunk_size": 384,
        "chunk_overlap": 48,
        "splitter": "paragraph",
        "metadata": ["topic", "difficulty_level", "modality"]
    },

    # Crisis protocols
    "safety_protocols": {
        "chunk_size": 128,      # Smaller for precise retrieval
        "chunk_overlap": 16,
        "splitter": "step",
        "metadata": ["severity_level", "action_type"]
    }
}
```

### Retrieval Strategies

#### Hybrid Search Configuration

```python
retrieval_config = {
    "strategy": "hybrid",

    "vector_search": {
        "weight": 0.7,
        "top_k": 20,
        "similarity_metric": "cosine",
        "score_threshold": 0.75
    },

    "keyword_search": {
        "weight": 0.3,
        "algorithm": "BM25",
        "top_k": 20
    },

    "reranking": {
        "enabled": True,
        "model": "cross-encoder/ms-marco-MiniLM-L-12-v2",
        "top_k": 5
    },

    "filters": {
        "patient_id": "required",
        "date_range": "optional",
        "content_type": "optional"
    }
}
```

#### Query Expansion for Therapy

```python
def expand_therapeutic_query(query: str) -> list[str]:
    """Expand queries with therapeutic synonyms and related concepts."""
    expansions = {
        "sad": ["depressed", "down", "hopeless", "low mood", "grief"],
        "anxious": ["worried", "nervous", "panic", "fear", "dread"],
        "angry": ["frustrated", "irritated", "rage", "resentful"],
        "coping": ["managing", "handling", "dealing with", "strategies"],
        "relationship": ["partner", "spouse", "family", "interpersonal"]
    }
    # Return original + expanded queries for multi-query retrieval
```

### Vector Database Comparison

| Database | Hosted | OSS | Max Vectors | Query Latency | Best For |
|----------|--------|-----|-------------|---------------|----------|
| **Pinecone** | Yes | No | Billions | 10-50ms | Production scale |
| **Weaviate** | Both | Yes | Billions | 20-80ms | Hybrid search |
| **Qdrant** | Both | Yes | Billions | 10-40ms | High performance |
| **Milvus** | Both | Yes | Billions | 15-60ms | Enterprise |
| **Chroma** | Local | Yes | Millions | 5-30ms | Development |
| **pgvector** | Self | Yes | Millions | 20-100ms | PostgreSQL native |
| **Supabase Vector** | Yes | Yes | Millions | 20-80ms | Supabase ecosystem |

**HIPAA Consideration**: Prefer self-hosted (Qdrant, Weaviate, Milvus) or HIPAA-compliant hosted (Pinecone Enterprise, Azure AI Search).

---

## 4. Crisis Detection

### Keyword and Phrase Lists

#### Tier 1: Immediate Crisis (Highest Priority)

```python
TIER_1_CRISIS_PATTERNS = {
    "suicidal_ideation": [
        r"\b(want to|going to|planning to|thinking about) (die|kill myself|end it|end my life)\b",
        r"\b(suicide|suicidal)\b",
        r"\bno reason to (live|go on|continue)\b",
        r"\b(better off dead|better off without me)\b",
        r"\bend (it all|everything)\b",
        r"\b(can't|cannot) (take it|go on|do this) anymore\b",
        r"\bhurt myself\b",
        r"\bdon't want to (exist|be here|wake up)\b"
    ],
    "homicidal_ideation": [
        r"\b(want to|going to|planning to) (kill|hurt|harm) (someone|him|her|them)\b",
        r"\bmurder\b",
        r"\bmake (them|him|her) pay\b"
    ],
    "active_self_harm": [
        r"\b(cutting|burning|hurting) myself (right now|currently)\b",
        r"\bjust (cut|hurt|harmed) myself\b"
    ],
    "immediate_danger": [
        r"\b(have a|holding a|got a) (gun|knife|weapon|pills)\b",
        r"\babout to (do it|take|jump)\b",
        r"\bon (the ledge|the edge|the bridge|the roof)\b"
    ]
}
```

#### Tier 2: High Risk (Elevated Monitoring)

```python
TIER_2_HIGH_RISK_PATTERNS = {
    "passive_suicidal": [
        r"\bwish I (was dead|wasn't here|could disappear)\b",
        r"\bwouldn't mind (dying|not waking up)\b",
        r"\blife (isn't worth|has no meaning)\b",
        r"\bno point (in living|anymore)\b"
    ],
    "hopelessness": [
        r"\b(nothing|things) will (never|ever) (get better|change|improve)\b",
        r"\bcompletely hopeless\b",
        r"\bgiven up (on everything|completely)\b"
    ],
    "self_harm_history": [
        r"\bused to (cut|hurt|harm) myself\b",
        r"\blast time I (cut|hurt myself)\b",
        r"\bstarted (cutting|hurting myself) again\b"
    ],
    "substance_crisis": [
        r"\b(overdose|overdosed|OD)\b",
        r"\bdrinking (heavily|a lot|too much)\b",
        r"\bcan't stop (drinking|using|taking)\b"
    ]
}
```

#### Tier 3: Moderate Concern (Increased Attention)

```python
TIER_3_MODERATE_PATTERNS = {
    "depression_symptoms": [
        r"\bcan't (get out of bed|function|do anything)\b",
        r"\b(haven't|have not) (eaten|slept|showered) in days\b",
        r"\bcompletely (numb|empty|worthless)\b"
    ],
    "isolation": [
        r"\bcompletely alone\b",
        r"\bno one (cares|would notice|understands)\b",
        r"\bpushed everyone away\b"
    ],
    "trauma_disclosure": [
        r"\b(abuse|assault|rape|attack)\b",
        r"\bflashback\b",
        r"\bcan't stop thinking about (what happened|the incident|it)\b"
    ]
}
```

### Safety Protocols

#### Crisis Response Flow

```yaml
crisis_response_protocol:
  tier_1_immediate:
    actions:
      - pause_ai_response: true
      - display_crisis_resources:
          - "988 Suicide & Crisis Lifeline (US): Call or text 988"
          - "Crisis Text Line: Text HOME to 741741"
          - "International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/"
      - offer_human_escalation: true
      - log_incident:
          severity: "critical"
          requires_review: true
      - ai_response_guidelines:
          - "Express genuine concern"
          - "Do not leave user alone"
          - "Ask directly about safety"
          - "Avoid judgment or minimization"

    example_response: |
      I'm really concerned about what you're sharing with me. Your safety matters,
      and I want to make sure you get the support you need right now.

      If you're in immediate danger, please contact:
      - 988 (Suicide & Crisis Lifeline) - call or text
      - 911 for emergencies

      Are you safe right now? Can you tell me more about what's happening?

  tier_2_elevated:
    actions:
      - continue_conversation: true
      - increase_monitoring: true
      - safety_assessment:
          - "Ask about current thoughts"
          - "Assess means and access"
          - "Identify protective factors"
      - provide_resources: "end_of_session"
      - flag_for_review: true

  tier_3_monitoring:
    actions:
      - continue_conversation: true
      - log_concern: true
      - gentle_check_in: true
      - schedule_follow_up: true
```

#### Columbia Suicide Severity Rating Scale (C-SSRS) Integration

```python
class CSSRS_Screening:
    """Implementation of C-SSRS for AI-assisted screening."""

    questions = {
        1: "Have you wished you were dead or wished you could go to sleep and not wake up?",
        2: "Have you actually had any thoughts of killing yourself?",
        3: "Have you been thinking about how you might do this?",  # Method
        4: "Have you had these thoughts and had some intention of acting on them?",
        5: "Have you started to work out or worked out the details of how to kill yourself?",
        6: "Have you ever done anything, started to do anything, or prepared to do anything to end your life?"
    }

    severity_levels = {
        "wish_to_be_dead": 1,           # Question 1 yes
        "suicidal_thoughts": 2,          # Question 2 yes
        "suicidal_thoughts_method": 3,   # Question 3 yes
        "suicidal_intent": 4,            # Question 4 yes
        "suicidal_intent_plan": 5,       # Question 5 yes
        "suicidal_behavior": 6           # Question 6 yes
    }

    def route_action(self, severity: int):
        if severity >= 4:
            return "immediate_crisis_protocol"
        elif severity >= 2:
            return "elevated_monitoring"
        elif severity >= 1:
            return "supportive_monitoring"
        else:
            return "continue_session"
```

### Industry Standards and Compliance

#### Relevant Standards

| Standard | Scope | Key Requirements |
|----------|-------|------------------|
| **HIPAA** | US Healthcare | PHI protection, access controls, audit logs |
| **GDPR** | EU Data | Consent, right to erasure, data portability |
| **FDA SaMD** | Medical Devices | Risk classification, clinical validation |
| **SOC 2 Type II** | Security | Access, availability, confidentiality |
| **ISO 27001** | InfoSec | ISMS implementation |
| **HITRUST** | Healthcare IT | Comprehensive security framework |

#### Documentation Requirements

```yaml
clinical_safety_documentation:
  required_documents:
    - clinical_risk_assessment
    - hazard_log
    - incident_response_plan
    - clinical_validation_report
    - user_training_materials
    - supervision_protocols

  audit_trail_requirements:
    - all_crisis_detections
    - human_escalations
    - ai_response_overrides
    - model_version_changes
    - prompt_modifications
```

---

## 5. Claude and Gemini API Specifics

### Claude API (Anthropic)

#### Model Specifications

| Model | Context Window | Max Output | Best For |
|-------|---------------|------------|----------|
| **claude-3-opus** | 200K tokens | 4,096 tokens | Highest quality, complex reasoning |
| **claude-3.5-sonnet** | 200K tokens | 8,192 tokens | Best balance quality/speed |
| **claude-3-haiku** | 200K tokens | 4,096 tokens | Fast, cost-effective |
| **claude-3.5-haiku** | 200K tokens | 8,192 tokens | Improved fast model |

#### Recommended Parameters for Clinical Use

```python
claude_clinical_config = {
    "model": "claude-3-5-sonnet-20241022",

    # Temperature: Lower for clinical accuracy
    "temperature": 0.3,  # Range: 0.0-1.0
    # 0.2-0.4 recommended for clinical responses
    # Higher (0.5-0.7) for more creative/varied responses in rapport building

    # Top-p (nucleus sampling)
    "top_p": 0.9,  # Slightly constrained for consistency

    # Top-k (if supported)
    "top_k": 40,  # Moderate diversity

    # Max tokens
    "max_tokens": 1024,  # Therapy responses rarely need more

    # Stop sequences
    "stop_sequences": ["\n\nHuman:", "\n\nPatient:"],

    # System prompt guidelines
    "system": """You are a supportive AI therapy assistant. Guidelines:
    - Prioritize user safety above all else
    - Never provide medical diagnoses
    - Encourage professional help when appropriate
    - Use evidence-based therapeutic techniques
    - Maintain warm, empathetic tone
    - Flag crisis indicators immediately"""
}
```

#### Claude-Specific Features

```python
# Prompt caching for therapy context
cached_context = {
    "type": "ephemeral",  # Or "persistent" for longer sessions
    "cache_control": {"type": "ephemeral"},
    "content": therapy_system_prompt  # Cached to reduce latency
}

# Tool use for structured assessments
tools = [
    {
        "name": "phq9_assessment",
        "description": "Administer PHQ-9 depression screening",
        "input_schema": {
            "type": "object",
            "properties": {
                "question_number": {"type": "integer"},
                "previous_responses": {"type": "array"}
            }
        }
    },
    {
        "name": "crisis_alert",
        "description": "Escalate to crisis protocol",
        "input_schema": {
            "type": "object",
            "properties": {
                "severity": {"type": "string", "enum": ["tier1", "tier2", "tier3"]},
                "indicators": {"type": "array"}
            }
        }
    }
]
```

### Gemini API (Google)

#### Model Specifications

| Model | Context Window | Max Output | Best For |
|-------|---------------|------------|----------|
| **gemini-1.5-pro** | 2M tokens | 8,192 tokens | Very long context |
| **gemini-1.5-flash** | 1M tokens | 8,192 tokens | Fast, cost-effective |
| **gemini-1.5-flash-8b** | 1M tokens | 8,192 tokens | Fastest, cheapest |

#### Recommended Parameters for Clinical Use

```python
gemini_clinical_config = {
    "model": "gemini-1.5-pro",

    # Generation config
    "generation_config": {
        "temperature": 0.4,  # Slightly higher than Claude for naturalness
        "top_p": 0.9,
        "top_k": 40,
        "max_output_tokens": 1024,
        "stop_sequences": ["User:", "Patient:"]
    },

    # Safety settings (adjust for clinical context)
    "safety_settings": [
        {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "BLOCK_ONLY_HIGH"  # Allow clinical discussions
        },
        {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "BLOCK_ONLY_HIGH"  # Allow crisis discussions
        }
    ],

    # System instruction
    "system_instruction": """You are a therapeutic AI assistant..."""
}
```

#### Gemini-Specific Features

```python
# Multimodal capabilities (useful for art therapy, journaling)
multimodal_input = {
    "contents": [
        {
            "role": "user",
            "parts": [
                {"text": "I drew this to express how I'm feeling today"},
                {"inline_data": {
                    "mime_type": "image/jpeg",
                    "data": base64_encoded_image
                }}
            ]
        }
    ]
}

# Grounding with Google Search (for psychoeducation)
grounding_config = {
    "tools": [{"google_search": {}}],
    "tool_config": {
        "function_calling_config": {"mode": "AUTO"}
    }
}

# Context caching (for long therapy histories)
cache = {
    "model": "gemini-1.5-pro",
    "system_instruction": therapy_context,
    "contents": [patient_history],  # Up to 2M tokens
    "ttl": "3600s"  # 1 hour cache
}
```

### Comparison for Therapy Applications

| Feature | Claude | Gemini |
|---------|--------|--------|
| **Empathy/Nuance** | Excellent | Very Good |
| **Safety Handling** | Built-in guardrails | Configurable |
| **Context Length** | 200K | Up to 2M |
| **Multimodal** | Vision | Vision + Audio |
| **Latency** | ~500-1500ms | ~400-1200ms |
| **Cost (per 1K tokens)** | $3-15 (input) | $1.25-5 (input) |
| **Streaming** | Yes | Yes |
| **Function Calling** | Yes | Yes |
| **Caching** | Yes | Yes |

### Rate Limits and Quotas

#### Claude API

| Tier | RPM | TPM | Daily Tokens |
|------|-----|-----|--------------|
| Free | 5 | 20K | 300K |
| Build | 50 | 40K | 1M |
| Scale | 4,000 | 400K | Unlimited |

#### Gemini API

| Tier | RPM | TPM | Daily Requests |
|------|-----|-----|----------------|
| Free | 15 | 32K | 1,500 |
| Pay-as-you-go | 360 | 4M | Unlimited |

### Error Handling for Clinical Applications

```python
class ClinicalAPIHandler:
    """Robust API handling for therapy applications."""

    async def get_response(self, messages, config):
        try:
            response = await self.api_call(messages, config)
            return response

        except RateLimitError:
            # Fall back to secondary model
            return await self.fallback_model(messages)

        except ContentFilterError as e:
            # Log and handle blocked content
            if self.is_crisis_related(e):
                return self.crisis_fallback_response()
            raise

        except TimeoutError:
            # Provide acknowledgment while retrying
            return {
                "interim_response": "I'm taking a moment to think about what you've shared...",
                "retry": True
            }

        except APIError:
            # Generic fallback
            return {
                "response": "I want to make sure I understand you correctly. Could you tell me more?",
                "log_error": True
            }
```

---

## 6. Additional Technical Considerations

### Session State Management

```python
class TherapySession:
    """Session state for therapeutic conversations."""

    schema = {
        "session_id": str,
        "patient_id": str,
        "started_at": datetime,
        "current_turn": int,

        # Clinical state
        "presenting_concerns": list[str],
        "mood_trajectory": list[dict],  # [{turn: 1, mood: "anxious", intensity: 0.7}]
        "active_techniques": list[str],  # ["breathing", "cognitive_restructuring"]
        "homework_assigned": list[dict],

        # Safety state
        "risk_level": str,  # "low", "moderate", "high", "crisis"
        "crisis_flags": list[dict],
        "safety_plan_reviewed": bool,

        # Conversation state
        "messages": list[dict],
        "compressed_context": str,
        "retrieved_memories": list[str],

        # Technical state
        "model_version": str,
        "prompt_version": str,
        "latency_metrics": list[int]
    }
```

### Monitoring and Observability

```yaml
monitoring_requirements:
  metrics:
    - response_latency_p50_p95_p99
    - crisis_detection_rate
    - false_positive_rate
    - user_engagement_duration
    - sentiment_trajectory
    - model_confidence_scores

  alerts:
    - crisis_detection_spike
    - latency_degradation
    - error_rate_threshold
    - safety_filter_triggers

  logging:
    - all_crisis_interactions
    - model_responses_with_low_confidence
    - user_reported_issues
    - session_summaries
```

### Testing Requirements

```python
test_categories = {
    "crisis_detection": {
        "test_cases": 500,  # Minimum for statistical significance
        "metrics": ["precision", "recall", "F1"],
        "threshold": {"recall": 0.99, "precision": 0.85}  # Prioritize catching crises
    },

    "therapeutic_quality": {
        "evaluation": "human_expert_rating",
        "dimensions": ["empathy", "clinical_accuracy", "safety", "helpfulness"],
        "scale": "1-5 Likert",
        "minimum_score": 4.0
    },

    "latency": {
        "p95_target": 2000,  # ms
        "p99_target": 4000   # ms
    },

    "edge_cases": [
        "gibberish_input",
        "extremely_long_input",
        "multilingual_input",
        "adversarial_jailbreak_attempts",
        "rapid_mood_shifts"
    ]
}
```

---

## Summary: Key Technical Decisions

| Decision Area | Recommendation | Rationale |
|---------------|---------------|-----------|
| **STT Engine** | Deepgram Nova-2 or Google v2 | Lowest latency, good accuracy |
| **TTS Engine** | ElevenLabs or Azure Neural | Best emotional control |
| **Primary LLM** | Claude 3.5 Sonnet | Best empathy/safety balance |
| **Backup LLM** | Gemini 1.5 Flash | Fast, cost-effective fallback |
| **Vector DB** | Qdrant (self-hosted) | HIPAA compliant, fast |
| **Embedding Model** | text-embedding-3-large | Best semantic understanding |
| **Temperature** | 0.3-0.4 | Clinical accuracy |
| **Chunk Size** | 256-512 tokens | Optimal retrieval granularity |

---

*Last Updated: January 2025*
*Document Version: 1.0*
