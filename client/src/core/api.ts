import type { AIProvider, Message, SessionSummary, TopicBucket } from './types.ts';

const SIDECAR_URL = 'http://localhost:3001/api';

/**
 * Load config (provider, model, apiKey) from sidecar which reads .env.
 */
export async function loadConfig(): Promise<{ provider: AIProvider; model: string; apiKey: string } | null> {
  try {
    const res = await fetch(`${SIDECAR_URL}/config`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    console.warn('[api] Sidecar not available — .env config not loaded');
    return null;
  }
}

/**
 * Load external context from the sidecar server.
 */
export async function loadContext(): Promise<string> {
  try {
    const res = await fetch(`${SIDECAR_URL}/context`);
    if (!res.ok) return '';
    const data = await res.json();
    return data.context ?? '';
  } catch {
    console.warn('[api] Sidecar not available — external context disabled');
    return '';
  }
}

/**
 * Load recent past session summaries.
 */
export async function loadPastSessions(): Promise<string> {
  try {
    const res = await fetch(`${SIDECAR_URL}/sessions/recent`);
    if (!res.ok) return '';
    const data = await res.json();
    return data.summaries ?? '';
  } catch {
    console.warn('[api] Sidecar not available — past sessions disabled');
    return '';
  }
}

/**
 * Load topic buckets from past sessions for carry-over continuity.
 */
export async function loadPastTopicBuckets(): Promise<TopicBucket[]> {
  try {
    const res = await fetch(`${SIDECAR_URL}/sessions/topics`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.buckets ?? []) as TopicBucket[];
  } catch {
    console.warn('[api] Sidecar not available — past topic buckets disabled');
    return [];
  }
}

/**
 * Save session data to disk via sidecar (includes topic bucket).
 */
export async function saveSession(
  messages: Message[],
  summary: SessionSummary | null,
  topicBucket?: TopicBucket | null,
): Promise<string | null> {
  try {
    const res = await fetch(`${SIDECAR_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, summary, topicBucket }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.sessionDir ?? null;
  } catch {
    console.warn('[api] Sidecar not available — session not saved to disk');
    return null;
  }
}
