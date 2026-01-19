
## Implementation Challenges

> [!WARNING]
> The strict requirements defined in [requirements.md](requirements.md) introduce significant architectural challenges that must be addressed carefully.

### 1. Hybrid Architecture State Synchronization

**Challenge**: seamless switching between Cloud (Tier 1) and Local (Tier 2) introduces a "Split Brain" risk where session state exists on both but is not synced.
**Mitigation Strategy**:

- Use CRDTs (Conflict-free Replicated Data Types) for the Session Transcript.
- Design a "Sync Manager" service that runs during the `OFFLINE_RECOVERY` -> `CONNECTING` transition.

### 2. Event Bus Latency

**Challenge**: The 4-agent team uses an async Event Bus. If `Dr. Sterling` waits for `Context Fetcher` indefinitely, the 1200ms latency budget will be breached.
**Mitigation Strategy**:

- Implement "Optimistic Execution": Dr. Sterling starts generating assuming no context is needed.
- If Context arrives within <200ms, it is injected (Prompt Injection).
- If Context arrives late, it is queued for the *next* turn (Context Pipelining).

### 3. FSM Deadlocks

**Challenge**: The strict Global State Machine can deadlock (e.g., stuck in `PROCESSING_STT` if VAD never sends `speech_end`).
**Mitigation Strategy**:

- Implement "Watchdog Timers" for every state transition.
- Max time in `PROCESSING_STT` = 5000ms -> Force transition to `IDLE` or `ERROR`.
