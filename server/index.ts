import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { loadExternalContext } from '../src/context.js';
import { saveSession, loadPastSessions, loadPastTopicBuckets } from '../src/session.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const DATA_DIR = process.env.DATA_DIR || './data/sessions';
const CONTEXT_PATHS = (process.env.EXTERNAL_CONTEXT_PATHS || '')
  .split(',')
  .map((p: string) => p.trim())
  .filter(Boolean);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Serve config from .env so the client auto-configures on startup
app.get('/api/config', (_req, res) => {
  const model = process.env.AI_MODEL || 'claude-sonnet-4-5';
  let provider = 'anthropic';
  let apiKey = '';

  if (model.startsWith('claude')) {
    provider = 'anthropic';
    apiKey = process.env.ANTHROPIC_API_KEY || '';
  } else if (model.startsWith('gpt')) {
    provider = 'openai';
    apiKey = process.env.OPENAI_API_KEY || '';
  } else if (model.startsWith('gemini')) {
    provider = 'google';
    apiKey = process.env.GEMINI_API_KEY || '';
  }

  res.json({ provider, model, apiKey });
});

// Load external context
app.get('/api/context', async (_req, res) => {
  try {
    const context = await loadExternalContext(CONTEXT_PATHS);
    res.json({ context });
  } catch (err) {
    console.error('[server] Error loading context:', err);
    res.json({ context: '' });
  }
});

// Load recent session summaries
app.get('/api/sessions/recent', async (_req, res) => {
  try {
    const summaries = await loadPastSessions(DATA_DIR, 3);
    res.json({ summaries });
  } catch (err) {
    console.error('[server] Error loading sessions:', err);
    res.json({ summaries: '' });
  }
});

// Load topic buckets from past sessions (for carry-over)
app.get('/api/sessions/topics', async (_req, res) => {
  try {
    const buckets = await loadPastTopicBuckets(DATA_DIR, 3);
    res.json({ buckets });
  } catch (err) {
    console.error('[server] Error loading topic buckets:', err);
    res.json({ buckets: [] });
  }
});

// Save a session (now includes topicBucket)
app.post('/api/sessions', async (req, res) => {
  try {
    const { messages, summary, topicBucket } = req.body;
    const sessionDir = await saveSession(messages, summary, DATA_DIR, topicBucket);
    res.json({ sessionDir });
  } catch (err) {
    console.error('[server] Error saving session:', err);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[sidecar] File I/O server running on http://localhost:${PORT}`);
  console.log(`[sidecar] Context paths: ${CONTEXT_PATHS.length} configured`);
  console.log(`[sidecar] Data dir: ${DATA_DIR}`);
});
