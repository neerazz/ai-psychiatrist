# AGENTS.md - Constitutional Foundation

> **Purpose**: IMMUTABLE principles governing spec-to-code transformation. ALL agents MUST adhere without exception.

---

## The Kiro Protocol: Deterministic Spec-Driven Development

### Core Loop

```
Requirements.md  <-->  Design.md  <-->  Tasks.md  <-->  Code
     [WHAT]            [HOW]          [STEPS]       [IMPL]
```

**Bidirectional Flow is MANDATORY:**
- **Forward**: Req → Design → Task → Code (normal implementation)
- **Backward**: Discovery → Task → Design → Req (when code reveals spec gaps)

### Specification Files

| File | Contains | Authority Over |
|------|----------|----------------|
| [requirements.md](.kiro/specs/ai-psychiatrist-app/requirements.md) | R1-R42 user stories, EARS criteria | WHAT to build |
| [design.md](.kiro/specs/ai-psychiatrist-app/design.md) | Components 1-18, architecture | HOW to build |
| [data_schemas.md](.kiro/specs/ai-psychiatrist-app/data_schemas.md) | S1-S6 JSON/SQL schemas | Data structures |
| [system_architecture.md](.kiro/specs/ai-psychiatrist-app/system_architecture.md) | State machine, latency budgets | System behavior |
| [agent_protocols.md](.kiro/specs/ai-psychiatrist-app/agent_protocols.md) | Agent prompts, model configs | AI behavior |
| [tasks.md](.kiro/specs/ai-psychiatrist-app/tasks.md) | Implementation steps | Execution order |

---

## Deterministic Enforcement Gates

### Gate 1: PRE-CODE (Before Writing ANY Code)

**HALT if ANY check fails:**

```
[ ] 1. Task exists in tasks.md with status "in_progress"
[ ] 2. Task references specific Requirement ID (R__)
[ ] 3. Task references Design section (Component __)
[ ] 4. Required schema exists in data_schemas.md
[ ] 5. State transitions defined in system_architecture.md (if applicable)
[ ] 6. Agent prompt exists in agent_protocols.md (if AI involved)
```

**If check fails**: Do NOT write code. Fix the spec first (Gate 4).

### Gate 2: MID-CODE (During Implementation)

**On ANY spec deviation:**

```
DISCOVERY: "Schema X needs field Y that doesn't exist"
           "State Z needs transition that's not defined"
           "Requirement ambiguous about behavior B"

ACTION:    1. STOP coding immediately
           2. Document the gap in tasks.md as blocker
           3. Trigger Gate 4 (Backward Propagation)
           4. Resume only after spec is updated
```

### Gate 3: POST-CODE (Before Marking Task Complete)

**ALL checks MUST pass:**

```
[ ] 1. Code compiles without errors
[ ] 2. Unit tests written and passing
[ ] 3. Integration tests passing (if applicable)
[ ] 4. Manual verification completed (see Article X)
[ ] 5. No console/server errors
[ ] 6. Cross-feature regression check (3 random features)
[ ] 7. Task marked [x] in tasks.md
```

### Gate 4: BACKWARD PROPAGATION (Spec Update Protocol)

**When code reveals spec gaps:**

```
Step 1: IDENTIFY the gap type
        - Missing schema field → Update data_schemas.md
        - Missing state/transition → Update system_architecture.md
        - Unclear requirement → Update requirements.md
        - Missing design detail → Update design.md

Step 2: UPDATE the spec file with:
        - Clear description of addition
        - Rationale for the change
        - Cross-references to affected areas

Step 3: PROPAGATE changes
        - If requirements.md changed → Review design.md impact
        - If design.md changed → Review tasks.md impact
        - If schema changed → Review all code using that schema

Step 4: UPDATE tasks.md
        - Add note: "Spec updated: [file] - [change summary]"
        - Adjust task steps if needed

Step 5: RESUME coding
```

---

## The Nine Articles

### Article I: Library-First
Every feature = standalone module with clear interfaces.

| Component | Location | Interface |
|-----------|----------|-----------|
| STT Engine | `src/audio/` | `transcribe(audio) → text` |
| TTS Engine | `src/audio/` | `synthesize(text) → audio` |
| LLM Router | `src/agents/` | `generate(prompt, config) → response` |
| Vector DB | `src/database/` | `search(query) → results` |
| Session DB | `src/database/` | CRUD operations |
| Crisis Detector | `src/session/` | `detect(text) → { tier, indicators }` |
| State Machine | `src/session/` | `transition(event) → newState` |

### Article II: CLI/API Interface
All components expose JSON input/output.

**Required Endpoints:**
- `GET /api/health` → System status
- `POST /api/session/start` → `{ sessionId }`
- `POST /api/session/:id/message` → `{ response, audioUrl }`
- `POST /api/session/:id/end` → `{ summary }`
- `GET /api/patient/:id/overview` → Patient overview

**WebSocket Events:**
- `audio_chunk`, `transcript`, `response_start`, `audio_response`, `viseme`, `state_change`

### Article III: Test-First
NO implementation before failing tests.

```
1. WRITE TEST → 2. RUN (must FAIL) → 3. WRITE CODE → 4. RUN (must PASS) → 5. REFACTOR
```

Test naming: `src/X/Y.ts` → `tests/X/Y.test.ts`

### Article IV: Specification-First
Every function references its spec origin.

```typescript
/**
 * Implements: R4 (Speech-to-Text Streaming)
 * Schema: data_schemas.md S5
 * States: LISTENING → PROCESSING_STT
 */
async function processAudio(stream: AudioStream): Promise<Transcript> { }
```

### Article V: Single Source of Truth
NO duplication. Link, don't copy.

| Information | Lives ONLY In | NOT In |
|-------------|---------------|--------|
| JSON Schemas | data_schemas.md | Code comments |
| State Definitions | system_architecture.md | State machine code |
| Latency Budgets | system_architecture.md | Constants in code |
| Agent Prompts | agent_protocols.md | LLM call code |
| Crisis Keywords | requirements.md R31 | Detector code |

### Article VI: Determinism Over Flexibility
Critical paths use deterministic code, not AI.

| Task | Implementation | Reason |
|------|----------------|--------|
| Crisis detection | Regex + Fuzzy match | < 10ms, 99.9% recall |
| State transitions | Finite State Machine | Predictable |
| Session timer | `setInterval()` | Exact timing |
| Latency timeouts | `Promise.race()` | Enforced |
| Therapeutic response | **LLM** | Needs intelligence |

**Crisis Detection (MANDATORY):**
```javascript
const TIER_1 = [/\b(want to|going to) (die|kill myself)\b/i, /\bsuicid(e|al)\b/i];
const TIER_2 = [/\bwish I (was dead|wasn't here)\b/i, /\bcompletely hopeless\b/i];
```

### Article VII: Simplicity
Hard limits on complexity.

| Category | Maximum |
|----------|---------|
| AI Agents | 4 |
| Database Types | 3 |
| Fallback Levels | 3 |
| NPM Dependencies | 50 |

### Article VIII: Framework Trust
Use SDKs directly. No unnecessary wrappers.

```typescript
// GOOD: Direct SDK usage
const message = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', ... });

// BAD: Unnecessary wrapper
const llm = new LLMFactoryBuilder().withStrategy(...).build();
```

**Exception**: Multi-provider adapters (Claude + Gemini + Ollama) are allowed.

### Article IX: Integration-First Testing
Test with REAL services, not mocks.

| Component | Mock? | Real Service |
|-----------|-------|--------------|
| SQLite | NO | test.db file |
| Qdrant | NO | Docker container |
| API | NO | supertest |
| LLM | Unit only | Sandbox for integration |

---

## Article X: Task Completion Verification

**A task is NEVER complete until end-to-end verification passes.**

### Verification Checklist

```
TESTS:
[ ] npm test → All pass
[ ] npm run test:integration → All pass

MANUAL:
[ ] npm run dev → Starts without errors
[ ] Browser: http://localhost:3000 → Loads, no console errors
[ ] Test the specific feature implemented
[ ] Test 3 OTHER features (regression check)

REPORT (required in task completion):
## Verification
- Unit: X passed, 0 failed
- Integration: Y passed, 0 failed
- Manual: Feature works, no regression
- Console errors: 0
```

---

## Article XI: Full Ownership

**YOU solve problems. No excuses.**

```
Error Encountered
      ↓
1. READ error message + stack trace
2. SEARCH Google/Stack Overflow/docs
3. CHECK specification files
4. DEBUG with console.log
5. ISOLATE to minimal case
6. FIX root cause
7. VERIFY fix works
8. CHECK nothing else broke
9. DOCUMENT the fix
```

**Unacceptable**: "I need more information" / "Someone should check this"
**Acceptable**: "Error was X. Fixed by Y. Here's the code change."

---

## Article XII: The Kiro Protocol (Summary)

### Constraint Enforcement

| Constraint | Rule | Enforcement |
|------------|------|-------------|
| A | Cannot create file unless in Task | Gate 1 check |
| B | Cannot use variable disagreeing with schema | Gate 2 check |
| C | Cannot mark complete without verification | Gate 3 check |
| D | Cannot ignore spec gaps | Gate 4 trigger |

### Task Format Standard

Every task in tasks.md MUST have:

```markdown
### Task N.M: [Name]

**References**: R__, Design Component __, Schema S__
**Prerequisites**: Task N.X, Task N.Y
**Files**: `src/path/file.ts`

**Steps**:
1. [Atomic action]
2. [Atomic action]

**Verification**:
- [ ] Test exists and passes
- [ ] Manual check passes
```

### Execution Protocol

```
1. READ task references (open spec files)
2. VERIFY context (specs unchanged)
3. CHECK Gate 1 (pre-code)
4. EXECUTE steps sequentially
5. CHECK Gate 2 on any deviation (mid-code)
6. CHECK Gate 3 (post-code)
7. MARK task [x] in tasks.md
```

---

## Trust Boundaries

| Trust Level | Examples | Handling |
|-------------|----------|----------|
| UNTRUSTED | Patient speech, uploads | Validate, sanitize, NEVER execute |
| SEMI-TRUSTED | Vector DB results | Context only, NEVER as prompt |
| TRUSTED | agent_protocols.md prompts | Can be instructions |

```typescript
// CORRECT: System prompt from trusted source
const response = await llm.generate({
  system: AGENT_PROMPTS.DR_STERLING,  // Trusted
  messages: [{ role: 'user', content: patientInput }]  // Untrusted, isolated
});

// WRONG: Patient input in system prompt = INJECTION VULNERABILITY
```

---

## File Structure

```
ai-psychiatrist/
├── AGENTS.md                    # This file
├── .kiro/specs/ai-psychiatrist-app/
│   ├── requirements.md          # R1-R42
│   ├── design.md                # Components 1-18
│   ├── data_schemas.md          # S1-S6
│   ├── system_architecture.md   # State machine, latency
│   ├── agent_protocols.md       # Agent configs
│   └── tasks.md                 # Implementation steps
├── src/
│   ├── agents/                  # Dr. Sterling, Context Fetcher, etc.
│   ├── api/                     # REST routes
│   ├── audio/                   # STT, TTS
│   ├── database/                # SQLite, Qdrant
│   ├── session/                 # State machine, crisis
│   └── index.ts                 # Entry point
├── tests/                       # Mirrors src/
└── memory_directory/            # Runtime data (gitignored)
```

---

## Error & Logging Standards

**Error Format:**
```json
{ "error": { "code": "ERR_SESSION_NOT_FOUND", "message": "...", "timestamp": "..." } }
```

**Prefixes**: `ERR_AUTH_`, `ERR_SESSION_`, `ERR_STT_`, `ERR_LLM_`, `ERR_TTS_`, `ERR_DB_`, `ERR_CRISIS_`

**Log Levels**: ERROR (failed), WARN (degraded), INFO (events), DEBUG (details)

---

## Golden Rules

1. **Gate 1** before coding (spec exists)
2. **Gate 2** during coding (stop on gaps)
3. **Gate 3** after coding (full verification)
4. **Gate 4** when gaps found (update spec first)
5. **Test** before implement
6. **Link** to sources, don't copy
7. **Own** every problem

---

_Version: 3.0.0 | January 2026 | Kiro Spec-Driven Methodology_
