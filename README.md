# AI Psychiatrist

An AI-powered psychiatry web application providing realistic, professional therapy sessions through an interactive 3D avatar interface.

## Features

- **Real-time voice conversation** with AI therapist (Dr. Sterling)
- **3D lip-synced avatar** for natural interaction
- **Multi-agent AI system** for comprehensive support
- **Hybrid cloud/local operation** for privacy and reliability
- **Crisis detection** with tiered safety protocols
- **Portable patient data** with encryption at rest

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Patient Interface                         │
│  (React + Three.js + Web Audio API)                         │
└─────────────────────┬───────────────────────────────────────┘
                      │ WebSocket / REST
┌─────────────────────▼───────────────────────────────────────┐
│                    Session Manager                           │
│  (Node.js + Express + Socket.io)                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    ▼                 ▼                 ▼
┌───────┐       ┌───────────┐     ┌───────────┐
│ SQLite│       │  Qdrant   │     │ LLM APIs  │
│Session│       │ VectorDB  │     │Claude/Gem │
└───────┘       └───────────┘     └───────────┘
```

## Quick Start

```bash
# Clone repository
git clone https://github.com/neerazz/ai-psychiatrist.git
cd ai-psychiatrist

# Install dependencies
npm install

# Configure API keys
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

## Documentation

All specifications are in `.kiro/specs/ai-psychiatrist-app/`:

| Document | Purpose |
|----------|---------|
| [AGENTS.md](.kiro/specs/ai-psychiatrist-app/AGENTS.md) | Constitutional principles |
| [requirements.md](.kiro/specs/ai-psychiatrist-app/requirements.md) | Functional requirements |
| [design.md](.kiro/specs/ai-psychiatrist-app/design.md) | Technical design |
| [data_schemas.md](.kiro/specs/ai-psychiatrist-app/data_schemas.md) | JSON/SQL schemas |
| [system_architecture.md](.kiro/specs/ai-psychiatrist-app/system_architecture.md) | State machine, latency |
| [agent_protocols.md](.kiro/specs/ai-psychiatrist-app/agent_protocols.md) | Multi-agent communication |

## Hardware Requirements

| Mode | CPU | RAM | GPU | Storage |
|------|-----|-----|-----|---------|
| Online Only | 4 cores | 8GB | - | 10GB |
| Hybrid | 6 cores | 16GB | Optional | 50GB |
| Full Offline | 8 cores | 32GB | RTX 3060+ | 100GB |

## Technology Stack

- **Frontend**: React, Three.js, Web Audio API
- **Backend**: Node.js, Express, Socket.io
- **AI**: Claude, Gemini, Ollama (offline)
- **Speech**: Deepgram STT, ElevenLabs TTS
- **Storage**: SQLite, Qdrant Vector DB

## License

MIT

## Disclaimer

This application is for educational/research purposes. It is NOT a substitute for professional mental health care. If you're experiencing a crisis, please contact emergency services or a crisis hotline.
