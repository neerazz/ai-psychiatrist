# Data Schemas & JSON Models

This document defines all data structures, JSON schemas, and database models for the AI Psychiatrist application. All implementations MUST conform to these schemas for deterministic behavior.

---

## 1. Patient Overview Schema

The Patient_Overview is the master document containing all patient information.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Patient_Overview",
  "type": "object",
  "required": ["patient_id", "created_at", "basic_info", "clinical_profile"],
  "properties": {
    "patient_id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier for the patient"
    },
    "schema_version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "default": "1.0.0"
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    },
    "version": {
      "type": "integer",
      "minimum": 1,
      "description": "Document version for conflict resolution"
    },

    "basic_info": {
      "type": "object",
      "required": ["name"],
      "properties": {
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 100
        },
        "preferred_name": {
          "type": "string",
          "maxLength": 50
        },
        "age": {
          "type": "integer",
          "minimum": 13,
          "maximum": 120
        },
        "date_of_birth": {
          "type": "string",
          "format": "date"
        },
        "pronouns": {
          "type": "string",
          "enum": ["he/him", "she/her", "they/them", "other"]
        },
        "occupation": {
          "type": "string",
          "maxLength": 100
        },
        "relationship_status": {
          "type": "string",
          "enum": ["single", "in_relationship", "married", "divorced", "widowed", "separated", "prefer_not_to_say"]
        },
        "living_situation": {
          "type": "string",
          "maxLength": 200
        },
        "location": {
          "type": "object",
          "properties": {
            "country": {"type": "string"},
            "timezone": {"type": "string"}
          }
        }
      }
    },

    "clinical_profile": {
      "type": "object",
      "properties": {
        "presenting_concerns": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "concern": {"type": "string"},
              "severity": {"type": "string", "enum": ["mild", "moderate", "severe"]},
              "onset_date": {"type": "string", "format": "date"},
              "notes": {"type": "string"}
            }
          }
        },
        "diagnosis_history": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "diagnosis": {"type": "string"},
              "icd_code": {"type": "string"},
              "diagnosed_date": {"type": "string", "format": "date"},
              "diagnosed_by": {"type": "string"},
              "status": {"type": "string", "enum": ["active", "in_remission", "resolved"]}
            }
          }
        },
        "treatment_goals": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "goal_id": {"type": "string", "format": "uuid"},
              "description": {"type": "string"},
              "target_date": {"type": "string", "format": "date"},
              "progress": {"type": "number", "minimum": 0, "maximum": 100},
              "status": {"type": "string", "enum": ["active", "achieved", "modified", "abandoned"]},
              "milestones": {"type": "array", "items": {"type": "string"}}
            }
          }
        },
        "therapeutic_approaches": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["CBT", "DBT", "ACT", "EMDR", "Psychodynamic", "Humanistic", "Motivational_Interviewing", "Solution_Focused", "Narrative", "Other"]
          }
        },
        "contraindications": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Approaches or topics to avoid"
        },
        "triggers": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "trigger": {"type": "string"},
              "severity": {"type": "string", "enum": ["mild", "moderate", "severe"]},
              "coping_strategy": {"type": "string"}
            }
          }
        },
        "coping_strategies": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "strategy": {"type": "string"},
              "effectiveness": {"type": "string", "enum": ["very_effective", "somewhat_effective", "not_effective"]},
              "context": {"type": "string"}
            }
          }
        },
        "support_system": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": {"type": "string"},
              "relationship": {"type": "string"},
              "availability": {"type": "string"},
              "notes": {"type": "string"}
            }
          }
        }
      }
    },

    "medication_history": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["medication_name"],
        "properties": {
          "medication_id": {"type": "string", "format": "uuid"},
          "medication_name": {"type": "string"},
          "generic_name": {"type": "string"},
          "dosage": {"type": "string"},
          "frequency": {"type": "string"},
          "route": {"type": "string", "enum": ["oral", "injection", "topical", "other"]},
          "start_date": {"type": "string", "format": "date"},
          "end_date": {"type": "string", "format": "date"},
          "prescriber": {"type": "string"},
          "reason": {"type": "string"},
          "effectiveness": {
            "type": "string",
            "enum": ["very_effective", "somewhat_effective", "not_effective", "unknown"]
          },
          "side_effects": {
            "type": "array",
            "items": {"type": "string"}
          },
          "reason_discontinued": {"type": "string"},
          "is_current": {"type": "boolean"}
        }
      }
    },

    "personal_context": {
      "type": "object",
      "description": "Hobbies, interests, aspirations mentioned casually",
      "properties": {
        "hobbies": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "hobby": {"type": "string"},
              "engagement_level": {"type": "string", "enum": ["active", "occasional", "past"]},
              "first_mentioned": {"type": "string", "format": "date-time"}
            }
          }
        },
        "aspirations": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "aspiration": {"type": "string"},
              "timeframe": {"type": "string"},
              "first_mentioned": {"type": "string", "format": "date-time"}
            }
          }
        },
        "values": {
          "type": "array",
          "items": {"type": "string"}
        },
        "cultural_background": {"type": "string"},
        "spiritual_beliefs": {"type": "string"},
        "important_relationships": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": {"type": "string"},
              "relationship": {"type": "string"},
              "significance": {"type": "string"},
              "notes": {"type": "string"}
            }
          }
        },
        "life_events": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "event": {"type": "string"},
              "date": {"type": "string"},
              "impact": {"type": "string", "enum": ["positive", "negative", "neutral", "mixed"]},
              "notes": {"type": "string"}
            }
          }
        }
      }
    },

    "session_history": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "session_id": {"type": "string", "format": "uuid"},
          "date": {"type": "string", "format": "date-time"},
          "duration_minutes": {"type": "integer"},
          "key_topics": {"type": "array", "items": {"type": "string"}},
          "mood_start": {"type": "string"},
          "mood_end": {"type": "string"},
          "breakthroughs": {"type": "array", "items": {"type": "string"}},
          "homework_assigned": {"type": "array", "items": {"type": "string"}},
          "homework_completed": {"type": "boolean"},
          "summary_snippet": {"type": "string", "maxLength": 500}
        }
      }
    },

    "risk_assessment": {
      "type": "object",
      "properties": {
        "current_risk_level": {
          "type": "string",
          "enum": ["low", "moderate", "high", "crisis"]
        },
        "last_assessed": {"type": "string", "format": "date-time"},
        "risk_factors": {
          "type": "array",
          "items": {"type": "string"}
        },
        "protective_factors": {
          "type": "array",
          "items": {"type": "string"}
        },
        "safety_plan": {
          "type": "object",
          "properties": {
            "warning_signs": {"type": "array", "items": {"type": "string"}},
            "coping_strategies": {"type": "array", "items": {"type": "string"}},
            "support_contacts": {"type": "array", "items": {"type": "object"}},
            "professional_contacts": {"type": "array", "items": {"type": "object"}},
            "environment_safety": {"type": "string"},
            "reasons_to_live": {"type": "array", "items": {"type": "string"}}
          }
        },
        "crisis_history": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "date": {"type": "string", "format": "date-time"},
              "description": {"type": "string"},
              "intervention": {"type": "string"},
              "outcome": {"type": "string"}
            }
          }
        }
      }
    }
  }
}
```

---

## 2. Session Summary Schema

Generated at the end of each session.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Session_Summary",
  "type": "object",
  "required": ["session_id", "patient_id", "start_time", "end_time"],
  "properties": {
    "session_id": {"type": "string", "format": "uuid"},
    "patient_id": {"type": "string", "format": "uuid"},
    "schema_version": {"type": "string", "default": "1.0.0"},
    "start_time": {"type": "string", "format": "date-time"},
    "end_time": {"type": "string", "format": "date-time"},
    "duration_minutes": {"type": "integer"},
    "session_number": {"type": "integer", "description": "Sequential session count for this patient"},

    "session_overview": {
      "type": "object",
      "properties": {
        "primary_topics": {
          "type": "array",
          "items": {"type": "string"},
          "maxItems": 5
        },
        "therapeutic_techniques_used": {
          "type": "array",
          "items": {"type": "string"}
        },
        "patient_engagement_level": {
          "type": "string",
          "enum": ["highly_engaged", "engaged", "somewhat_engaged", "disengaged"]
        },
        "session_quality_score": {
          "type": "number",
          "minimum": 0,
          "maximum": 10
        },
        "session_type": {
          "type": "string",
          "enum": ["initial_assessment", "regular", "crisis_intervention", "follow_up", "termination"]
        }
      }
    },

    "emotional_analysis": {
      "type": "object",
      "properties": {
        "mood_at_start": {
          "type": "object",
          "properties": {
            "primary_emotion": {"type": "string"},
            "intensity": {"type": "number", "minimum": 0, "maximum": 1},
            "valence": {"type": "number", "minimum": -1, "maximum": 1}
          }
        },
        "mood_at_end": {
          "type": "object",
          "properties": {
            "primary_emotion": {"type": "string"},
            "intensity": {"type": "number", "minimum": 0, "maximum": 1},
            "valence": {"type": "number", "minimum": -1, "maximum": 1}
          }
        },
        "emotional_trajectory": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "timestamp_minutes": {"type": "number"},
              "emotion": {"type": "string"},
              "intensity": {"type": "number"},
              "trigger": {"type": "string"}
            }
          }
        },
        "dominant_emotions": {
          "type": "array",
          "items": {"type": "string"},
          "maxItems": 3
        },
        "emotional_shifts": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "from": {"type": "string"},
              "to": {"type": "string"},
              "timestamp_minutes": {"type": "number"},
              "context": {"type": "string"}
            }
          }
        }
      }
    },

    "clinical_insights": {
      "type": "object",
      "properties": {
        "cognitive_distortions_identified": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "distortion_type": {
                "type": "string",
                "enum": [
                  "all_or_nothing", "overgeneralization", "mental_filter",
                  "disqualifying_positive", "jumping_to_conclusions", "magnification",
                  "emotional_reasoning", "should_statements", "labeling", "personalization"
                ]
              },
              "example": {"type": "string"},
              "addressed": {"type": "boolean"}
            }
          }
        },
        "behavioral_patterns": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "pattern": {"type": "string"},
              "frequency": {"type": "string"},
              "impact": {"type": "string", "enum": ["positive", "negative", "neutral"]}
            }
          }
        },
        "breakthrough_moments": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "description": {"type": "string"},
              "timestamp_minutes": {"type": "number"},
              "significance": {"type": "string", "enum": ["minor", "moderate", "major"]}
            }
          }
        },
        "areas_of_concern": {
          "type": "array",
          "items": {"type": "string"}
        },
        "progress_indicators": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "area": {"type": "string"},
              "direction": {"type": "string", "enum": ["improving", "stable", "declining"]},
              "evidence": {"type": "string"}
            }
          }
        }
      }
    },

    "conversation_highlights": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "timestamp_minutes": {"type": "number"},
          "highlight_type": {
            "type": "string",
            "enum": ["insight", "emotional_peak", "breakthrough", "concern", "resistance", "homework_discussion"]
          },
          "speaker": {"type": "string", "enum": ["patient", "dr_sterling"]},
          "content_summary": {"type": "string", "maxLength": 200},
          "clinical_significance": {"type": "string", "maxLength": 500}
        }
      }
    },

    "risk_assessment": {
      "type": "object",
      "properties": {
        "crisis_events": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "timestamp_minutes": {"type": "number"},
              "tier": {"type": "integer", "enum": [1, 2, 3]},
              "indicators": {"type": "array", "items": {"type": "string"}},
              "response": {"type": "string"}
            }
          }
        },
        "risk_level_start": {"type": "string", "enum": ["low", "moderate", "high", "crisis"]},
        "risk_level_end": {"type": "string", "enum": ["low", "moderate", "high", "crisis"]},
        "safety_interventions": {"type": "array", "items": {"type": "string"}}
      }
    },

    "recommendations": {
      "type": "object",
      "properties": {
        "homework_assignments": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "assignment": {"type": "string"},
              "rationale": {"type": "string"},
              "due_date": {"type": "string", "format": "date"}
            }
          }
        },
        "topics_for_next_session": {
          "type": "array",
          "items": {"type": "string"},
          "maxItems": 5
        },
        "referrals": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "type": {"type": "string"},
              "reason": {"type": "string"},
              "urgency": {"type": "string", "enum": ["routine", "soon", "urgent"]}
            }
          }
        },
        "treatment_adjustments": {
          "type": "array",
          "items": {"type": "string"}
        }
      }
    },

    "agent_contributions": {
      "type": "object",
      "description": "Insights from each AI agent",
      "properties": {
        "dr_sterling_summary": {"type": "string"},
        "context_fetcher_insights": {"type": "string"},
        "deep_researcher_findings": {"type": "string"},
        "analyst_ai_assessment": {"type": "string"}
      }
    },

    "metadata": {
      "type": "object",
      "properties": {
        "model_versions": {
          "type": "object",
          "properties": {
            "dr_sterling": {"type": "string"},
            "context_fetcher": {"type": "string"},
            "deep_researcher": {"type": "string"},
            "analyst_ai": {"type": "string"}
          }
        },
        "processing_metrics": {
          "type": "object",
          "properties": {
            "avg_response_latency_ms": {"type": "number"},
            "total_tokens_used": {"type": "integer"},
            "context_retrievals": {"type": "integer"}
          }
        },
        "transcript_word_count": {"type": "integer"},
        "generated_at": {"type": "string", "format": "date-time"}
      }
    }
  }
}
```

---

## 3. Session Database Schema (SQLite)

```sql
-- ============================================
-- PATIENTS TABLE
-- ============================================
CREATE TABLE patients (
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

CREATE INDEX idx_patients_active ON patients(is_active);
CREATE INDEX idx_patients_risk ON patients(current_risk_level);

-- ============================================
-- SESSIONS TABLE
-- ============================================
CREATE TABLE sessions (
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
    model_configuration TEXT, -- JSON
    session_quality_score REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_patient ON sessions(patient_id);
CREATE INDEX idx_sessions_status ON sessions(session_status);
CREATE INDEX idx_sessions_date ON sessions(started_at);

-- ============================================
-- SESSION EVENTS TABLE (Audit Trail)
-- ============================================
CREATE TABLE session_events (
    event_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'session_start', 'session_end', 'session_pause', 'session_resume',
        'speech_detected', 'response_generated', 'crisis_detected',
        'context_retrieved', 'research_completed', 'state_persisted',
        'connection_lost', 'connection_restored', 'error_occurred'
    )),
    event_timestamp TEXT NOT NULL,
    event_data TEXT, -- JSON
    agent_source TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX idx_events_session ON session_events(session_id);
CREATE INDEX idx_events_type ON session_events(event_type);
CREATE INDEX idx_events_timestamp ON session_events(event_timestamp);

-- ============================================
-- CRISIS EVENTS TABLE
-- ============================================
CREATE TABLE crisis_events (
    crisis_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    detected_at TEXT NOT NULL,
    severity_tier INTEGER NOT NULL CHECK (severity_tier IN (1, 2, 3)),
    trigger_indicators TEXT NOT NULL, -- JSON array
    response_actions TEXT, -- JSON array
    resolved_at TEXT,
    reviewed_at TEXT,
    reviewer_notes TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
);

CREATE INDEX idx_crisis_severity ON crisis_events(severity_tier);
CREATE INDEX idx_crisis_patient ON crisis_events(patient_id);
CREATE INDEX idx_crisis_date ON crisis_events(detected_at);

-- ============================================
-- EMBEDDING JOBS TABLE
-- ============================================
CREATE TABLE embedding_jobs (
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

CREATE INDEX idx_embedding_status ON embedding_jobs(status);
CREATE INDEX idx_embedding_patient ON embedding_jobs(patient_id);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================
CREATE TABLE audit_log (
    log_id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    event_type TEXT NOT NULL CHECK (event_type IN (
        'data_access', 'data_modify', 'data_delete', 'data_export',
        'auth_success', 'auth_failure', 'crisis_detection', 'session_event'
    )),
    patient_id TEXT,
    session_id TEXT,
    action TEXT NOT NULL,
    details TEXT, -- JSON
    ip_address TEXT,
    user_agent TEXT,
    checksum TEXT -- SHA-256 of previous + current entry for tamper detection
);

CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_patient ON audit_log(patient_id);
CREATE INDEX idx_audit_type ON audit_log(event_type);

-- ============================================
-- CONVERSATION HIGHLIGHTS TABLE
-- ============================================
CREATE TABLE conversation_highlights (
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

CREATE INDEX idx_highlights_session ON conversation_highlights(session_id);
CREATE INDEX idx_highlights_type ON conversation_highlights(highlight_type);
```

---

## 4. Vector Database Schema (Qdrant)

```yaml
# Vector Database Configuration
engine: "Qdrant"
version: "1.7+"
storage_path: "Memory_Directory/databases/vectors"

collections:
  # ==========================================
  # SESSION TRANSCRIPTS COLLECTION
  # ==========================================
  session_transcripts:
    vector_config:
      size: 3072  # text-embedding-3-large
      distance: "Cosine"
      on_disk: true

    payload_schema:
      session_id:
        type: "keyword"
        indexed: true
      patient_id:
        type: "keyword"
        indexed: true
      turn_number:
        type: "integer"
        indexed: true
      speaker:
        type: "keyword"
        indexed: true
        values: ["patient", "dr_sterling", "system"]
      timestamp_iso:
        type: "datetime"
        indexed: true
      timestamp_minutes:
        type: "float"
      emotional_state:
        type: "keyword"
        indexed: true
      emotion_intensity:
        type: "float"
      content_type:
        type: "keyword"
        values: ["dialogue", "summary", "insight", "homework"]
      chunk_index:
        type: "integer"
      chunk_total:
        type: "integer"
      text_preview:
        type: "text"
        max_length: 200

    indexes:
      - field: "session_id"
        type: "keyword"
      - field: "patient_id"
        type: "keyword"
      - field: "emotional_state"
        type: "keyword"

  # ==========================================
  # PATIENT MEMORIES COLLECTION
  # ==========================================
  patient_memories:
    vector_config:
      size: 3072
      distance: "Cosine"
      on_disk: true

    payload_schema:
      patient_id:
        type: "keyword"
        indexed: true
      memory_type:
        type: "keyword"
        indexed: true
        values: [
          "hobby", "aspiration", "relationship", "medication",
          "trigger", "coping_strategy", "value", "life_event",
          "preference", "casual_mention"
        ]
      source_session_id:
        type: "keyword"
      created_at:
        type: "datetime"
        indexed: true
      updated_at:
        type: "datetime"
      importance_score:
        type: "float"
        indexed: true
      last_accessed:
        type: "datetime"
      access_count:
        type: "integer"
      content_preview:
        type: "text"
        max_length: 300

  # ==========================================
  # CLINICAL INSIGHTS COLLECTION
  # ==========================================
  clinical_insights:
    vector_config:
      size: 3072
      distance: "Cosine"

    payload_schema:
      patient_id:
        type: "keyword"
        indexed: true
      insight_type:
        type: "keyword"
        indexed: true
        values: [
          "cognitive_distortion", "behavioral_pattern", "breakthrough",
          "treatment_progress", "risk_indicator", "protective_factor"
        ]
      session_id:
        type: "keyword"
      generated_at:
        type: "datetime"
      confidence_score:
        type: "float"
        indexed: true
      validated:
        type: "bool"
        indexed: true
      source_agent:
        type: "keyword"
        values: ["dr_sterling", "analyst_ai", "deep_researcher"]
      content_preview:
        type: "text"
        max_length: 500

# Retrieval Configuration
retrieval_config:
  default_strategy: "hybrid"

  vector_search:
    weight: 0.7
    top_k: 20
    score_threshold: 0.72

  keyword_search:
    weight: 0.3
    algorithm: "BM25"
    top_k: 20

  reranking:
    enabled: true
    model: "cross-encoder/ms-marco-MiniLM-L-12-v2"
    final_top_k: 5

  filters:
    required: ["patient_id"]
    optional: ["session_id", "memory_type", "date_range"]
```

---

## 5. Transcript Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Session_Transcript",
  "type": "object",
  "required": ["session_id", "patient_id", "turns"],
  "properties": {
    "session_id": {"type": "string", "format": "uuid"},
    "patient_id": {"type": "string", "format": "uuid"},
    "started_at": {"type": "string", "format": "date-time"},
    "ended_at": {"type": "string", "format": "date-time"},

    "turns": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["turn_id", "speaker", "content", "timestamp"],
        "properties": {
          "turn_id": {"type": "integer"},
          "speaker": {"type": "string", "enum": ["patient", "dr_sterling", "system"]},
          "content": {"type": "string"},
          "timestamp": {"type": "string", "format": "date-time"},
          "timestamp_minutes": {"type": "number"},
          "duration_seconds": {"type": "number"},

          "audio_metadata": {
            "type": "object",
            "properties": {
              "audio_file": {"type": "string"},
              "duration_ms": {"type": "integer"},
              "sample_rate": {"type": "integer"},
              "stt_confidence": {"type": "number"}
            }
          },

          "analysis": {
            "type": "object",
            "properties": {
              "detected_emotion": {"type": "string"},
              "emotion_confidence": {"type": "number"},
              "sentiment_score": {"type": "number", "minimum": -1, "maximum": 1},
              "topics": {"type": "array", "items": {"type": "string"}},
              "crisis_indicators": {"type": "array", "items": {"type": "string"}},
              "is_highlight": {"type": "boolean"},
              "highlight_reason": {"type": "string"}
            }
          },

          "agent_context": {
            "type": "object",
            "description": "For dr_sterling turns only",
            "properties": {
              "context_retrieved": {"type": "array", "items": {"type": "string"}},
              "research_used": {"type": "array", "items": {"type": "string"}},
              "techniques_applied": {"type": "array", "items": {"type": "string"}},
              "thinking_tokens_used": {"type": "integer"}
            }
          }
        }
      }
    },

    "metadata": {
      "type": "object",
      "properties": {
        "total_turns": {"type": "integer"},
        "patient_turns": {"type": "integer"},
        "dr_sterling_turns": {"type": "integer"},
        "total_words": {"type": "integer"},
        "avg_turn_duration_seconds": {"type": "number"}
      }
    }
  }
}
```

---

## 6. Configuration Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Application_Configuration",
  "type": "object",
  "properties": {
    "version": {"type": "string"},

    "api_keys": {
      "type": "object",
      "description": "Stored encrypted, referenced by key_id",
      "properties": {
        "anthropic_key_id": {"type": "string"},
        "gemini_key_id": {"type": "string"},
        "elevenlabs_key_id": {"type": "string"},
        "deepgram_key_id": {"type": "string"}
      }
    },

    "model_config": {
      "type": "object",
      "properties": {
        "mode": {
          "type": "string",
          "enum": ["claude_only", "gemini_only", "hybrid", "offline"]
        },
        "dr_sterling": {
          "type": "object",
          "properties": {
            "model": {"type": "string"},
            "temperature": {"type": "number"},
            "max_tokens": {"type": "integer"},
            "thinking_budget": {"type": "integer"}
          }
        },
        "support_agents": {
          "type": "object",
          "properties": {
            "context_fetcher": {"type": "object"},
            "deep_researcher": {"type": "object"},
            "analyst_ai": {"type": "object"}
          }
        }
      }
    },

    "session_config": {
      "type": "object",
      "properties": {
        "max_duration_minutes": {"type": "integer", "default": 25},
        "warning_at_minutes": {"type": "integer", "default": 20},
        "min_duration_minutes": {"type": "integer", "default": 5},
        "auto_save_interval_seconds": {"type": "integer", "default": 30}
      }
    },

    "audio_config": {
      "type": "object",
      "properties": {
        "sample_rate": {"type": "integer", "default": 16000},
        "silence_threshold_ms": {"type": "integer", "default": 500},
        "max_silence_seconds": {"type": "integer", "default": 10}
      }
    },

    "embedding_config": {
      "type": "object",
      "description": "Vector embedding provider configuration for semantic search",
      "properties": {
        "provider": {
          "type": "string",
          "enum": ["local", "openai", "ollama", "custom"],
          "default": "local",
          "description": "Embedding provider to use. 'local' uses Transformers.js (no API key required)"
        },
        "model": {
          "type": "string",
          "description": "Model identifier for the selected provider",
          "default": "Xenova/all-MiniLM-L6-v2"
        },
        "dimensions": {
          "type": "integer",
          "description": "Vector dimensions produced by the embedding model",
          "default": 384
        },
        "batch_size": {
          "type": "integer",
          "description": "Number of texts to embed in a single batch",
          "default": 10,
          "minimum": 1,
          "maximum": 100
        },
        "openai_config": {
          "type": "object",
          "description": "OpenAI-specific configuration (when provider='openai')",
          "properties": {
            "model": {"type": "string", "default": "text-embedding-3-large"},
            "dimensions": {"type": "integer", "default": 3072}
          }
        },
        "ollama_config": {
          "type": "object",
          "description": "Ollama-specific configuration (when provider='ollama')",
          "properties": {
            "model": {"type": "string", "default": "nomic-embed-text"},
            "dimensions": {"type": "integer", "default": 768},
            "host": {"type": "string", "default": "http://localhost:11434"}
          }
        },
        "custom_config": {
          "type": "object",
          "description": "Custom provider configuration (when provider='custom')",
          "properties": {
            "endpoint": {"type": "string"},
            "dimensions": {"type": "integer"},
            "headers": {"type": "object"}
          }
        }
      }
    },

    "ui_config": {
      "type": "object",
      "properties": {
        "theme": {"type": "string", "enum": ["light", "dark", "auto"]},
        "show_debug_panel": {"type": "boolean", "default": false},
        "show_agent_thoughts": {"type": "boolean", "default": false}
      }
    },

    "privacy_config": {
      "type": "object",
      "properties": {
        "encryption_enabled": {"type": "boolean", "default": true},
        "audit_logging_enabled": {"type": "boolean", "default": true},
        "data_retention_days": {"type": "integer", "default": -1}
      }
    }
  }
}
```

---

## 7. Inter-Agent Message Schema

See `agent_protocols.md` for complete message format specification.

---

## Validation Rules

1. **UUID Format:** All `*_id` fields must be valid UUIDv4
2. **Timestamps:** All datetime fields must be ISO 8601 format
3. **Enums:** All enum fields must match exactly (case-sensitive)
4. **Required Fields:** Missing required fields must cause validation failure
5. **Array Limits:** Arrays should not exceed 1000 items for performance
6. **String Limits:** Text fields should enforce maxLength where specified
7. **Numeric Ranges:** Scores/intensities must be within specified min/max

---

*Document Version: 1.0.0*
*Last Updated: January 2025*
