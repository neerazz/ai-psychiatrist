# AGENTS.md - Constitutional Foundation

> **Purpose**: This document defines the IMMUTABLE architectural principles that govern how specifications become code in the AI Psychiatrist application. **ALL AI agents and developers MUST adhere to these articles without exception.**

---

## ⚠️ CRITICAL: Before You Write ANY Code

**STOP. Read this checklist FIRST.**

Before writing a single line of code, you MUST:

1. ✅ Read the **specific requirement** in [requirements.md](.kiro/specs/ai-psychiatrist-app/requirements.md)
2. ✅ Check the **data schema** in [data_schemas.md](.kiro/specs/ai-psychiatrist-app/data_schemas.md)
3. ✅ Check the **state machine** in [system_architecture.md](.kiro/specs/ai-psychiatrist-app/system_architecture.md)
4. ✅ Check the **agent protocol** in [agent_protocols.md](.kiro/specs/ai-psychiatrist-app/agent_protocols.md)
5. ✅ Verify your approach against the **9 Articles** below

**If you skip these steps, your code WILL be rejected.**

---

## Quick Reference: Specification Files

| When You Need... | Look In | Section |
|------------------|---------|---------|
| What feature to build | [requirements.md](.kiro/specs/ai-psychiatrist-app/requirements.md) | R1-R42 |
| JSON structure for data | [data_schemas.md](.kiro/specs/ai-psychiatrist-app/data_schemas.md) | S1-S6 |
| Database table structure | [data_schemas.md](.kiro/specs/ai-psychiatrist-app/data_schemas.md) | S3 (SQLite), S4 (Qdrant) |
| Session states & transitions | [system_architecture.md](.kiro/specs/ai-psychiatrist-app/system_architecture.md) | S2 |
| Latency requirements | [system_architecture.md](.kiro/specs/ai-psychiatrist-app/system_architecture.md) | S3 |
| Agent system prompts | [agent_protocols.md](.kiro/specs/ai-psychiatrist-app/agent_protocols.md) | S4 |
| Agent message format | [agent_protocols.md](.kiro/specs/ai-psychiatrist-app/agent_protocols.md) | S2 |
| Model configurations | [agent_protocols.md](.kiro/specs/ai-psychiatrist-app/agent_protocols.md) | S5 |
| Component design details | [design.md](.kiro/specs/ai-psychiatrist-app/design.md) | Components 1-18 |

---

## The Nine Articles of Development

### Article I: Library-First Principle

> **Rule**: Every feature MUST be a standalone, modular component with clear boundaries.

#### ✅ DO

- Create separate files for each component
- Define clear input/output interfaces
- Make components testable in isolation
- Use dependency injection

#### ❌ DON'T

- Write monolithic code in a single file
- Create hidden dependencies between components
- Mix business logic with UI logic
- Hard-code values inside components

#### Example - CORRECT

```javascript
// stt/stt-engine.js - Standalone STT component
class STTEngine {
  constructor(config) {
    this.provider = config.provider; // 'deepgram' | 'whisper'
  }
  
  async transcribe(audioBuffer) {
    // Returns: { text: string, confidence: number }
  }
}
export default STTEngine;
```

#### Example - WRONG

```javascript
// BAD: STT mixed with session logic
class SessionManager {
  async handleAudio(audio) {
    const deepgramKey = process.env.DEEPGRAM_KEY; // Hard-coded dependency
    const transcript = await fetch('https://api.deepgram.com/...'); // Direct API call
    this.updateUI(transcript); // Mixed with UI
  }
}
```

#### Components That MUST Be Separate

| Component | File Location | Interface |
|-----------|---------------|-----------|
| STT Engine | `src/stt/` | `transcribe(audio) → text` |
| TTS Engine | `src/tts/` | `synthesize(text) → audio` |
| LLM Router | `src/llm/` | `generate(prompt, config) → response` |
| Vector DB | `src/storage/vector/` | `search(query) → results` |
| Session DB | `src/storage/sqlite/` | CRUD operations |
| Crisis Detector | `src/crisis/` | `detect(text) → { tier, indicators }` |
| State Machine | `src/state/` | `transition(event) → newState` |

---

### Article II: CLI/API Interface Mandate

> **Rule**: Every component MUST expose functionality through inspectable, testable interfaces.

#### ✅ DO

- Accept JSON input, return JSON output
- Log all inputs and outputs for debugging
- Provide health check endpoints
- Document every endpoint

#### ❌ DON'T

- Return unstructured data
- Hide errors silently
- Create endpoints without documentation

#### Required API Endpoints

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/health` | GET | System health check | `{ status, components }` |
| `/api/session/start` | POST | Start new session | `{ sessionId }` |
| `/api/session/:id/message` | POST | Send message | `{ response, audioUrl }` |
| `/api/session/:id/end` | POST | End session | `{ summary }` |
| `/api/patient/:id/overview` | GET | Get patient overview | See data_schemas.md S1 |

#### WebSocket Events

| Event | Direction | Purpose | Payload |
|-------|-----------|---------|---------|
| `audio_chunk` | Client→Server | Stream audio | `{ data: base64 }` |
| `transcript` | Server→Client | Partial transcript | `{ text, final }` |
| `response_start` | Server→Client | AI starts speaking | `{ }` |
| `audio_response` | Server→Client | Stream audio back | `{ data: base64 }` |
| `viseme` | Server→Client | Lip-sync data | `{ viseme, duration }` |
| `state_change` | Server→Client | Session state changed | `{ from, to }` |

---

### Article III: Test-First Imperative

> **Rule**: NO implementation code before tests exist and fail.

#### The TDD Cycle (MANDATORY)

```
1. WRITE TEST → 2. RUN TEST (must FAIL) → 3. WRITE CODE → 4. RUN TEST (must PASS) → 5. REFACTOR
```

#### Required Tests Per Component

| Component | Unit Tests | Integration Tests | Performance Tests |
|-----------|------------|-------------------|-------------------|
| STT Engine | ✅ | ✅ | ✅ (< 500ms) |
| TTS Engine | ✅ | ✅ | ✅ (< 400ms) |
| LLM Router | ✅ | ✅ | ✅ (< 3000ms) |
| State Machine | ✅ | ✅ | N/A |
| Crisis Detector | ✅ | ✅ | ✅ (< 10ms) |
| Vector Search | ✅ | ✅ | ✅ (< 300ms) |

#### Test File Naming Convention

```
src/stt/stt-engine.js       → tests/stt/stt-engine.test.js
src/llm/router.js           → tests/llm/router.test.js
src/crisis/detector.js      → tests/crisis/detector.test.js
```

#### Example Test Template

```javascript
// tests/crisis/detector.test.js
describe('CrisisDetector', () => {
  describe('detect()', () => {
    it('returns tier1 for "I want to kill myself"', async () => {
      const result = await detector.detect('I want to kill myself');
      expect(result.tier).toBe(1);
      expect(result.indicators).toContain('suicidal_ideation');
    });
    
    it('returns null for neutral text', async () => {
      const result = await detector.detect('The weather is nice today');
      expect(result).toBeNull();
    });
    
    it('completes within 10ms', async () => {
      const start = Date.now();
      await detector.detect('test input');
      expect(Date.now() - start).toBeLessThan(10);
    });
  });
});
```

---

### Article IV: Specification-First Development

> **Rule**: Every line of code MUST trace back to a specification.

#### Before Writing Code, Answer These Questions

| Question | Where to Find Answer |
|----------|---------------------|
| "What feature am I building?" | requirements.md → R# |
| "What data does this feature use?" | data_schemas.md → Schema name |
| "What states does this affect?" | system_architecture.md → S2 |
| "Does this involve an AI agent?" | agent_protocols.md → Agent name |

#### Code Comment Requirements

Every function MUST include a reference comment:

```javascript
/**
 * Implements: R4 (Speech-to-Text Streaming)
 * Schema: data_schemas.md S5 (Transcript Schema)
 * States: LISTENING → PROCESSING_STT
 */
async function processAudio(audioStream) {
  // ...
}
```

#### Traceability Table (Fill This For Every Feature)

| Field | Value |
|-------|-------|
| Feature Name | |
| Requirement ID | R__ |
| Data Schema | S__ |
| State Transitions | _**→**_ |
| Agent Involved | Dr. Sterling / Context Fetcher / etc. |
| Latency Budget | __ms |
| Tests Written | tests/___.test.js |

---

### Article V: Single Source of Truth

> **Rule**: NO duplication of specifications. Link, don't copy.

#### Consolidation Map

| Information Type | ONLY Lives In | NEVER Duplicate To |
|-----------------|---------------|-------------------|
| JSON Schemas | data_schemas.md | design.md, code comments |
| SQL Tables | data_schemas.md S3 | migration files (generate from schema) |
| State Definitions | system_architecture.md S2 | state machine code |
| Latency Budgets | system_architecture.md S3 | code constants |
| Agent Prompts | agent_protocols.md S4 | LLM call code |
| Model Configs | agent_protocols.md S5 | config files |
| Crisis Keywords | requirements.md R31 | crisis detector code |

#### ✅ DO

```javascript
// GOOD: Reference the source
const LATENCY_BUDGET = require('../config/latency.json');
// latency.json is generated from system_architecture.md S3
```

#### ❌ DON'T

```javascript
// BAD: Hard-coded value that duplicates spec
const MAX_LLM_LATENCY = 3000; // This will get out of sync!
```

---

### Article VI: Determinism Over Flexibility

> **Rule**: Use deterministic code for critical paths. AI is ONLY for intelligence tasks.

#### Decision Matrix

| Task | Implementation | Reason |
|------|----------------|--------|
| Crisis keyword detection | Regex + Fuzzy match | MUST be < 10ms, 99.9% recall |
| State transitions | Finite State Machine | MUST be predictable |
| Session timer | `setInterval()` | MUST be exact |
| Latency timeouts | `Promise.race()` | MUST be enforced |
| Data validation | JSON Schema validator | MUST be consistent |
| Audio format conversion | FFmpeg/WebAudio | MUST be reliable |
| Therapeutic response | **LLM (Claude/Gemini)** | Needs intelligence |
| Sentiment analysis | **LLM** | Needs understanding |
| Context retrieval ranking | **Hybrid (Vector + BM25)** | Deterministic algorithm |

#### Crisis Detection - MANDATORY Implementation

```javascript
// This MUST be implemented exactly as specified
const TIER_1_PATTERNS = [
  /\b(want to|going to|planning to) (die|kill myself|end it)\b/i,
  /\bsuicid(e|al)\b/i,
  /\b(better off dead|no reason to live)\b/i
];

const TIER_2_PATTERNS = [
  /\bwish I (was dead|wasn't here)\b/i,
  /\bcompletely hopeless\b/i
];

function detectCrisis(text) {
  // TIER 1 - Check first (highest priority)
  for (const pattern of TIER_1_PATTERNS) {
    if (pattern.test(text)) {
      return { tier: 1, pattern: pattern.source };
    }
  }
  // TIER 2
  for (const pattern of TIER_2_PATTERNS) {
    if (pattern.test(text)) {
      return { tier: 2, pattern: pattern.source };
    }
  }
  return null;
}
```

---

### Article VII: Simplicity Principle

> **Rule**: Combat over-engineering. Start simple, justify complexity.

#### Hard Limits

| Category | Maximum Allowed | Current Count |
|----------|-----------------|---------------|
| AI Agents | 4 | 4 (Dr. Sterling, Context Fetcher, Deep Researcher, Analyst AI) |
| Database Types | 3 | 3 (SQLite, Qdrant, Files) |
| Fallback Levels | 3 | 3 (Primary → Secondary → Offline) |
| Config Files | 5 | TBD |
| NPM Dependencies | 50 | TBD |

#### Complexity Justification Process

If you want to add complexity beyond these limits:

1. Document the reason in design.md "Implementation Challenges"
2. Get explicit approval
3. Update the count in this table

#### ✅ DO

```javascript
// SIMPLE: Direct function call
const response = await llm.generate(prompt);
```

#### ❌ DON'T

```javascript
// OVERENGINEERED: Factory pattern for no reason
const llmFactory = new LLMFactoryFactoryBuilder()
  .withStrategy(new CloudFirstStrategy())
  .withFallbackHandler(new GracefulDegradationHandler())
  .build();
const llm = llmFactory.createLLM();
const response = await llm.generate(prompt);
```

---

### Article VIII: Framework Trust (Anti-Abstraction)

> **Rule**: Use framework features directly. Don't wrap what doesn't need wrapping.

#### Abstraction Decision Tree

```
Need to support multiple providers? (e.g., Claude AND Gemini)
├── YES → Create a thin adapter
└── NO → Use the SDK directly

Is the SDK well-documented?
├── YES → Use it directly
└── NO → Still use it directly, add comments

Do you want to "simplify" the API?
├── YES → DON'T. Use it as-is.
└── NO → Correct.
```

#### ✅ DO

```javascript
// DIRECT: Use Anthropic SDK as documented
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();
const message = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [{ role: 'user', content: prompt }]
});
```

#### ❌ DON'T

```javascript
// WRAPPED: Unnecessary abstraction
class AIProvider {
  constructor(provider) {
    this.provider = provider;
  }
  async generate(prompt) {
    if (this.provider === 'anthropic') {
      // 50 lines of wrapping code
    }
  }
}
```

#### Exception - When Adapters ARE Allowed

Only for genuine multi-provider scenarios defined in agent_protocols.md S5:

```javascript
// ALLOWED: Multi-provider adapter (Claude + Gemini + Ollama)
class LLMRouter {
  async generate(prompt, config) {
    switch (config.mode) {
      case 'claude_only': return this.claude(prompt, config);
      case 'gemini_only': return this.gemini(prompt, config);
      case 'offline': return this.ollama(prompt, config);
      case 'hybrid': return this.hybridWithFallback(prompt, config);
    }
  }
}
```

---

### Article IX: Integration-First Testing

> **Rule**: Test with REAL services, not mocks.

#### Testing Requirements

| Component | Mock Allowed? | Real Service Required? |
|-----------|--------------|------------------------|
| SQLite DB | ❌ NO | ✅ Use test.db file |
| Qdrant Vector DB | ❌ NO | ✅ Use Qdrant container |
| API endpoints | ❌ NO | ✅ Use supertest |
| WebSocket events | ❌ NO | ✅ Use ws client |
| LLM APIs | ⚠️ Only for unit tests | ✅ Integration uses sandbox |
| File System | ❌ NO | ✅ Use temp directory |

#### Test Database Setup

```javascript
// tests/setup.js
beforeAll(async () => {
  // Create real test database
  testDb = await initDatabase('./tests/test.db');
  
  // Start real Qdrant instance
  await exec('docker run -d -p 6334:6333 qdrant/qdrant');
  
  // Wait for services
  await waitForService('http://localhost:6334/health');
});

afterAll(async () => {
  await testDb.close();
  await exec('docker stop $(docker ps -q --filter ancestor=qdrant/qdrant)');
});
```

---

## Trust Boundaries

> **CRITICAL SECURITY RULE**: Never treat untrusted content as instructions.

### Data Classification

| Trust Level | Examples | Handling |
|-------------|----------|----------|
| 🔴 **UNTRUSTED** | Patient speech, uploaded files | Validate, sanitize, NEVER execute |
| 🟡 **SEMI-TRUSTED** | Vector DB results, patient overview | Use as context, NEVER as system prompt |
| 🟢 **TRUSTED** | agent_protocols.md prompts, app config | Can be used as instructions |

### Prompt Construction - MANDATORY Pattern

```javascript
// ✅ CORRECT: System prompt from trusted source only
const systemPrompt = AGENT_PROMPTS.DR_STERLING; // From agent_protocols.md

// Patient input is ONLY in user message
const response = await llm.generate({
  system: systemPrompt,        // Trusted
  messages: [
    { role: 'user', content: patientInput }  // Untrusted - isolated
  ]
});

// ❌ WRONG: Patient input in system prompt = PROMPT INJECTION VULNERABILITY
const response = await llm.generate({
  system: `You are helping ${patientName} who said: ${patientInput}`, // VULNERABLE!
  messages: []
});
```

---

## Domain Balance

> **Rule**: Explore ALL domains of life, not just mental health.

### Required Exploration Domains

Dr. Sterling MUST be able to discuss and explore:

| Domain | Examples | NOT Ignored Because |
|--------|----------|---------------------|
| Mental Health | Anxiety, depression, trauma | Primary focus |
| Career | Job stress, goals, conflicts | Major life stressor |
| Relationships | Family, partners, friends | Core to wellbeing |
| Physical Health | Sleep, exercise, nutrition | Mind-body connection |
| Finances | Money stress, debt | Common anxiety source |
| Hobbies | Fun, creativity, relaxation | Recovery and joy |
| Personal Growth | Learning, meaning, purpose | Long-term wellbeing |
| Social | Community, belonging, loneliness | Human need |

### Implementation

This is enforced in the Dr. Sterling system prompt (agent_protocols.md S4):

```
"Explore all domains of the patient's life holistically, 
not just the presenting mental health concern."
```

---

## Inherit, Don't Reimplement

> **Rule**: Check existing specs before creating anything new.

### Before Creating, Check

| Want to Create... | First Check |
|-------------------|-------------|
| New JSON structure | data_schemas.md - does it exist? |
| New database table | data_schemas.md S3 - is it defined? |
| New state | system_architecture.md S2 - is it in FSM? |
| New agent prompt | agent_protocols.md S4 - is there a template? |
| New endpoint | design.md - is it already specified? |
| New error code | system_architecture.md S6 - is it listed? |

### If It Doesn't Exist

1. **STOP** coding
2. **UPDATE** the specification file first
3. **GET APPROVAL** if it's a significant addition
4. **THEN** implement

---

## Pre-Implementation Checklist

**Print this. Check EVERY box before writing code.**

### 1. Requirement Check

- [ ] I have read the specific requirement (R__) in requirements.md
- [ ] I understand ALL acceptance criteria
- [ ] I know the success metrics

### 2. Schema Check

- [ ] I have checked data_schemas.md for relevant schemas
- [ ] I am using the EXACT field names from the schema
- [ ] I am using the CORRECT data types

### 3. State Check

- [ ] I have checked system_architecture.md S2 for state machine
- [ ] I know which state(s) this feature affects
- [ ] I know the valid transitions

### 4. Agent Check (if applicable)

- [ ] I have checked agent_protocols.md for agent configuration
- [ ] I am using the system prompt from S4, NOT writing my own
- [ ] I am using the model config from S5

### 5. Test Check

- [ ] I have written tests BEFORE implementation
- [ ] Tests are in the correct location: `tests/[component]/[file].test.js`
- [ ] Tests include unit, integration, and performance (if applicable)

### 6. Latency Check

- [ ] I know the latency budget from system_architecture.md S3
- [ ] I have implemented timeouts
- [ ] I have performance tests proving compliance

### 7. Security Check

- [ ] User input is validated and sanitized
- [ ] User input is NEVER in system prompt
- [ ] Sensitive data is encrypted
- [ ] Audit logging is implemented

---

## Error Handling Standards

### Error Response Format (MANDATORY)

```javascript
// ALL errors MUST follow this format
{
  "error": {
    "code": "ERR_SESSION_NOT_FOUND",  // From system_architecture.md S6
    "message": "Session with ID xyz not found",
    "details": { "sessionId": "xyz" },
    "timestamp": "2025-01-18T12:00:00Z"
  }
}
```

### Error Code Prefixes

| Prefix | Category | Example |
|--------|----------|---------|
| `ERR_AUTH_` | Authentication | `ERR_AUTH_INVALID_TOKEN` |
| `ERR_SESSION_` | Session management | `ERR_SESSION_EXPIRED` |
| `ERR_STT_` | Speech-to-text | `ERR_STT_TIMEOUT` |
| `ERR_LLM_` | LLM processing | `ERR_LLM_RATE_LIMITED` |
| `ERR_TTS_` | Text-to-speech | `ERR_TTS_VOICE_UNAVAILABLE` |
| `ERR_DB_` | Database | `ERR_DB_CONNECTION_FAILED` |
| `ERR_CRISIS_` | Crisis handling | `ERR_CRISIS_ESCALATION_FAILED` |

---

## Logging Standards

### Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `ERROR` | Something failed | `Failed to connect to LLM API` |
| `WARN` | Degraded but working | `Fallback to offline mode` |
| `INFO` | Key events | `Session started`, `Session ended` |
| `DEBUG` | Detailed for debugging | `LLM response received in 1200ms` |

### Required Log Fields

```javascript
logger.info({
  event: 'session_started',
  sessionId: 'uuid',
  patientId: 'uuid',
  timestamp: new Date().toISOString(),
  // Optional context
  mode: 'hybrid',
  models: { primary: 'claude', fallback: 'gemini' }
});
```

---

## File Structure (MANDATORY)

```
ai-psychiatrist/
├── AGENTS.md                    # This file - constitution
├── README.md                    # Quick start guide
├── .gitignore                   # Git exclusions
├── package.json                 # Dependencies
├── .env.example                 # Environment template
│
├── .kiro/specs/ai-psychiatrist-app/
│   ├── requirements.md          # R1-R42 requirements
│   ├── design.md               # Technical design
│   ├── data_schemas.md         # S1-S6 schemas
│   ├── system_architecture.md  # State machine, latency
│   └── agent_protocols.md      # Agent configs
│
├── src/
│   ├── index.js                # Entry point
│   ├── server.js               # Express server
│   │
│   ├── stt/                    # Speech-to-text
│   │   ├── stt-engine.js
│   │   └── providers/
│   │       ├── deepgram.js
│   │       └── whisper.js
│   │
│   ├── tts/                    # Text-to-speech
│   │   ├── tts-engine.js
│   │   └── providers/
│   │       ├── elevenlabs.js
│   │       └── coqui.js
│   │
│   ├── llm/                    # LLM integration
│   │   ├── router.js           # Model selection
│   │   └── providers/
│   │       ├── claude.js
│   │       ├── gemini.js
│   │       └── ollama.js
│   │
│   ├── agents/                 # AI agents
│   │   ├── dr-sterling.js
│   │   ├── context-fetcher.js
│   │   ├── deep-researcher.js
│   │   └── analyst-ai.js
│   │
│   ├── crisis/                 # Crisis detection
│   │   └── detector.js
│   │
│   ├── state/                  # State machine
│   │   └── session-fsm.js
│   │
│   ├── storage/                # Data storage
│   │   ├── sqlite/
│   │   │   └── session-db.js
│   │   ├── vector/
│   │   │   └── qdrant.js
│   │   └── files/
│   │       └── memory-directory.js
│   │
│   └── api/                    # API routes
│       ├── session.js
│       ├── patient.js
│       └── health.js
│
├── tests/                      # Tests mirror src/
│   ├── stt/
│   ├── tts/
│   ├── llm/
│   ├── crisis/
│   └── integration/
│
└── memory_directory/           # Runtime data (gitignored)
    ├── patients/
    ├── databases/
    ├── models/
    └── logs/

---

## 🚨 ARTICLE X: Task Completion Verification (MANDATORY)

> **Rule**: A task is NEVER complete until the ENTIRE system works end-to-end. Unit tests passing is NOT enough.

### Before Marking ANY Task as "Complete":

**You MUST perform ALL of the following verification steps. No exceptions.**

#### Step 1: Run ALL Unit Tests
```bash
npm test
# ALL tests must pass. Zero failures.
```

#### Step 2: Run ALL Integration Tests

```bash
npm run test:integration
# ALL integration tests must pass.
```

#### Step 3: Start the Full Application

```bash
npm run dev
# Application must start without errors
```

#### Step 4: Open the Web Application in Browser

**DO NOT just open the home page and call it done.**

You MUST:

1. **Open browser** at `http://localhost:3000`
2. **Verify home page loads** completely (no console errors)
3. **Navigate to EVERY page** in the application
4. **Test EVERY button** and interactive element
5. **Submit EVERY form** with both valid and invalid data
6. **Check browser console** for JavaScript errors on EVERY page

#### Step 5: Simulate COMPLETE User Flows

**Test EVERY user flow end-to-end:**

| User Flow | Steps to Test | Verify |
|-----------|---------------|--------|
| **New Session** | Click start → Speak → Wait for response → End session | Full conversation works |
| **Session with Crisis** | Speak crisis keywords → Verify crisis detection triggers | Safety protocol activates |
| **Session Resume** | End session → Start new session → Verify context loaded | Memory persists |
| **Offline Mode** | Disconnect internet → Start session → Verify offline works | Fallback LLM works |
| **Patient Overview** | Complete session → Check patient overview updated | Data saved correctly |
| **Audio Quality** | Listen to AI response → Verify clear audio, lip-sync | TTS and avatar work |
| **Error Handling** | Force errors → Verify graceful handling | No crashes |

#### Step 6: Deep Verification Checklist

**Check EVERY aspect of the feature you implemented:**

- [ ] **UI renders correctly** on desktop, tablet, mobile
- [ ] **All buttons work** and trigger correct actions
- [ ] **All forms validate** correctly (try empty, invalid, edge cases)
- [ ] **Data persists** correctly (refresh page, check database)
- [ ] **Audio works** (microphone input, speaker output)
- [ ] **Video/Avatar works** (3D renders, lip-sync animates)
- [ ] **State transitions** work (check state machine)
- [ ] **Error messages** display correctly
- [ ] **Loading states** show when processing
- [ ] **Latency acceptable** (measure with dev tools)
- [ ] **No console errors** in browser
- [ ] **No server errors** in terminal
- [ ] **Memory not leaking** (check memory usage)

#### Step 7: Cross-Feature Verification

**Your change MUST NOT break other features:**

- [ ] Run full test suite again after your changes
- [ ] Manually test 3 random OTHER features (not yours)
- [ ] Verify navigation still works throughout app
- [ ] Verify logout/login still works
- [ ] Verify data from before your changes still loads

### ❌ TASK IS NOT COMPLETE IF

- Any test fails
- Browser shows any console errors
- Any user flow is broken
- Any button doesn't work
- Any page crashes
- Any form submission fails
- Audio doesn't play
- Avatar doesn't animate
- Data doesn't persist
- Errors aren't handled gracefully

### Verification Evidence Required

When marking a task complete, you MUST provide:

```markdown
## Verification Report

### Tests
- Unit tests: ✅ X passed, 0 failed
- Integration tests: ✅ X passed, 0 failed

### Manual Testing
- Home page: ✅ Loads without errors
- Feature page: ✅ All elements functional
- User flow tested: ✅ [describe the flow]

### Browser Console
- Errors: 0
- Warnings: 0 (or list acceptable warnings)

### Cross-Feature Check
- [Feature 1]: ✅ Still works
- [Feature 2]: ✅ Still works
- [Feature 3]: ✅ Still works
```

---

## 🔥 ARTICLE XI: Full Ownership (NO EXCUSES)

> **Rule**: YOU are the sole owner. YOU solve the problem. Do NOT expect help.

### The Ownership Mindset

When you encounter a problem:

1. **DO NOT** say "I need more information"
2. **DO NOT** say "Can you check this for me"
3. **DO NOT** say "Someone else should look at this"
4. **DO NOT** leave problems for others to fix
5. **DO** research the solution yourself
6. **DO** read documentation
7. **DO** search for similar issues
8. **DO** experiment and debug
9. **DO** solve it completely

### Problem-Solving Protocol

When something doesn't work:

```
1. READ the error message carefully
   ↓
2. SEARCH for the error (Google, Stack Overflow, docs)
   ↓
3. CHECK the relevant specification files
   ↓
4. ADD console.log/debugging to understand
   ↓
5. ISOLATE the problem to smallest reproducible case
   ↓
6. FIX the root cause (not symptoms)
   ↓
7. VERIFY the fix works
   ↓
8. CHECK nothing else broke
   ↓
9. DOCUMENT what was wrong and how you fixed it
```

### Research Requirements

Before asking for help, you MUST have:

- [ ] Read the FULL error message and stack trace
- [ ] Searched Google for the error message
- [ ] Checked Stack Overflow for similar issues
- [ ] Read the relevant library's documentation
- [ ] Checked the library's GitHub issues
- [ ] Tried at least 3 different approaches to fix it
- [ ] Spent minimum 30 minutes debugging

### ❌ UNACCEPTABLE Responses

```
❌ "I'm not sure what's causing this"
❌ "You might want to check..."
❌ "This needs further investigation by someone with more context"
❌ "I recommend asking the team about this"
❌ "There seems to be an issue that I can't diagnose"
```

### ✅ ACCEPTABLE Responses

```
✅ "The error was caused by X. I fixed it by doing Y. Here's the code change."
✅ "After investigating, I found the root cause was A. I solved it by B."
✅ "I debugged this and discovered the issue was in file Z, line N. Fixed."
```

### You Are The Expert

- **You ARE** the senior developer on this project
- **You DO** have access to all the information
- **You CAN** read documentation and source code
- **You ARE** capable of solving any problem
- **You WILL** figure out the solution

### Error Handling Standard

When an error occurs during your work:

1. **Capture** the full error (message, stack trace, context)
2. **Diagnose** the root cause (not just the symptom)
3. **Research** if you don't immediately know the solution
4. **Implement** the fix
5. **Test** that the fix works
6. **Verify** nothing else broke
7. **Document** what was wrong and how you fixed it

### Knowledge Sources to Use

| Resource | When to Use |
|----------|-------------|
| Google | Any error message |
| Stack Overflow | Code-specific issues |
| MDN Web Docs | JavaScript/Web APIs |
| Library docs | Library-specific issues |
| GitHub Issues | Bug reports for libraries |
| Source code | Understanding how things work |
| Console/DevTools | Debugging runtime issues |
| Network tab | API and request issues |
| Database viewer | Data issues |

---

## Amendment Process

Modifications to this constitution require:

1. ✅ Explicit documentation of the rationale for change
2. ✅ Review and approval by project maintainers
3. ✅ Backwards compatibility assessment
4. ✅ Update all affected specification files
5. ✅ Add dated amendment note below

### Amendment Log

| Date | Article | Change | Approved By |
|------|---------|--------|-------------|
| 2025-01-18 | Initial | Created constitution | - |

---

_Document Version: 2.0.0_
_Created: January 2025_
_Based on: [spec-kit Constitutional Foundation](https://github.com/neerazz/spec-kit/blob/main/spec-driven.md)_

---

## Summary: The Golden Rules

1. **READ** the specs before coding
2. **WRITE** tests before implementation  
3. **LINK** to sources, don't duplicate
4. **USE** frameworks directly
5. **TEST** with real services
6. **VALIDATE** all user input
7. **LOG** everything important
8. **ISOLATE** components cleanly
9. **CHECK** existing solutions first
10. **VERIFY** end-to-end before closing ANY task
11. **OWN** every problem - research and solve it yourself
