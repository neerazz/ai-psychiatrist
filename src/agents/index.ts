// src/agents/index.ts
// Agent module exports
// Reference: AGENTS.md Article I (Library-First - modular components)

// Type definitions
export * from './types.js';

// Base agent
export { BaseAgent, MockAgent } from './base-agent.js';

// Crisis detector (deterministic)
export {
    CrisisDetector,
    crisisDetector,
    type CrisisResources
} from './crisis-detector.js';

// Dr. Sterling agent
export { DrSterlingAgent, createDrSterlingAgent } from './dr-sterling.js';

// Context fetcher agent
export { ContextFetcherAgent, getContextFetcher } from './context-fetcher.js';

// Analyst AI agent
export { AnalystAIAgent, getAnalystAI } from './analyst-ai.js';

// Agent coordinator
export {
    AgentCoordinator,
    getAgentCoordinator,
    resetAgentCoordinator,
    type AgentCoordinatorEvents
} from './agent-coordinator.js';

