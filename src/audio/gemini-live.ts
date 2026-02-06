import { GoogleGenAI, Modality } from '@google/genai';
import { AudioInterface } from './audio-interface.js';
import type { Config } from '../types.js';

/**
 * GeminiLiveProvider — bidirectional streaming audio via Google's Gemini Live API.
 *
 * Uses @google/genai SDK to establish a live session with audio input/output.
 * The Gemini model handles both STT and response generation in one stream.
 *
 * Note: Full implementation requires WebSocket audio streaming and platform-specific
 * mic/speaker bindings. This provides the framework and API connection.
 */
export class GeminiLiveProvider extends AudioInterface {
  private config: Config;
  private active: boolean = false;
  private client: GoogleGenAI | null = null;
  private session: unknown = null; // Live session handle
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(config: Config) {
    super();
    this.config = config;
  }

  get providerName(): string {
    return 'gemini_live';
  }

  async start(): Promise<void> {
    const apiKey = this.config.apiKeys.google;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY required for Gemini Live provider');
    }

    this.client = new GoogleGenAI({ apiKey });

    try {
      await this.connect();
      this.active = true;
      this.emit('connected');
      console.log('[gemini-live] Connected to Gemini Live API');
    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.active = false;
    this.session = null;
    this.emit('disconnected', 'stopped');
    console.log('[gemini-live] Disconnected');
  }

  /**
   * Listen: In Gemini Live mode, the model handles STT internally.
   * Audio streams in, text comes back via the session.
   * This method would read from the session's output stream.
   */
  async listen(): Promise<string> {
    // TODO: Wire platform-specific mic audio streaming to the live session
    // The Gemini Live API accepts raw audio chunks and returns text/audio
    //
    // Example flow:
    // 1. Stream mic audio bytes to session.sendRealtimeInput()
    // 2. Read response from session output
    // 3. Return transcribed user speech
    //
    // For now, this is a placeholder until native audio bindings are added

    console.warn('[gemini-live] Audio streaming not yet wired — use text mode for now');
    return '';
  }

  /**
   * Speak: Send text to the Gemini session for voice synthesis.
   */
  async speak(text: string): Promise<void> {
    this.emit('transcript:ai', text);

    // In full implementation, the Gemini Live session generates audio
    // which would be piped to the speaker.
    // For now, log the text.
    console.log(`[gemini-live] Would speak: ${text.slice(0, 80)}...`);
  }

  /**
   * Interject: Inject text into the live session mid-conversation.
   */
  async interject(text: string): Promise<void> {
    console.log(`\n[URGENT via Gemini Live] ${text}\n`);
    this.emit('transcript:ai', text);
  }

  isActive(): boolean {
    return this.active;
  }

  // ─── Private ──────────────────────────────────────────────────────────

  private async connect(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    // Establish live session with audio modality
    // Using the @google/genai Live API
    const session = await this.client.live.connect({
      model: 'gemini-2.0-flash-exp',
      callbacks: {
        onopen: () => {
          console.log('[gemini-live] Session opened');
        },
        onmessage: (msg) => {
          // Handle incoming messages from Gemini
          console.log('[gemini-live] Message received');
        },
        onerror: (err) => {
          console.error('[gemini-live] Session error:', err);
          this.emit('error', err instanceof Error ? err : new Error(String(err)));
        },
        onclose: (ev) => {
          console.log('[gemini-live] Session closed');
          this.emit('disconnected', 'session closed');
        },
      },
      config: {
        responseModalities: [Modality.TEXT],
        systemInstruction: {
          parts: [
            {
              text: 'You are Dr. Eleanor Sterling, a warm and experienced AI psychiatrist. Keep responses short and specific.',
            },
          ],
        },
      },
    });

    this.session = session;
    this.reconnectAttempts = 0;
  }

  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      const error = new Error('Max reconnect attempts reached');
      this.emit('error', error);
      throw error;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`[gemini-live] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    await new Promise(resolve => setTimeout(resolve, delay));
    await this.connect();
  }
}
