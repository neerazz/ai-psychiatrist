import { EventEmitter } from 'node:events';
import type { Config } from '../types.js';

export interface AudioEvents {
  'transcript:user': (text: string) => void;
  'transcript:ai': (text: string) => void;
  'connected': () => void;
  'disconnected': (reason: string) => void;
  'error': (error: Error) => void;
}

/**
 * Abstract AudioInterface — all audio providers extend this.
 * Uses EventEmitter for lifecycle events (connected, disconnected, error, transcripts).
 */
export abstract class AudioInterface extends EventEmitter {
  abstract get providerName(): string;

  /** Start the audio session (initialize mic, connect to service, etc.) */
  abstract start(): Promise<void>;

  /** Stop the audio session and clean up resources */
  abstract stop(): Promise<void>;

  /** Listen for user speech and return the transcribed text */
  abstract listen(): Promise<string>;

  /** Speak text to the user via the configured TTS method */
  abstract speak(text: string): Promise<void>;

  /** Inject a message mid-session (e.g., crisis intervention) */
  abstract interject(text: string): Promise<void>;

  /** Whether the audio provider is currently active */
  abstract isActive(): boolean;
}

/**
 * TextProvider — readline/console fallback for text-only mode.
 * No actual audio, just stdin/stdout.
 */
export class TextProvider extends AudioInterface {
  private active: boolean = false;

  get providerName(): string {
    return 'text';
  }

  async start(): Promise<void> {
    this.active = true;
    this.emit('connected');
  }

  async stop(): Promise<void> {
    this.active = false;
    this.emit('disconnected', 'stopped');
  }

  async listen(): Promise<string> {
    // In text mode, listening is handled by the main loop's readline
    // This is a no-op; the coordinator calls readline directly
    return '';
  }

  async speak(text: string): Promise<void> {
    // In text mode, speaking is handled by console.log in the main loop
    this.emit('transcript:ai', text);
  }

  async interject(text: string): Promise<void> {
    console.log(`\n[URGENT] ${text}\n`);
    this.emit('transcript:ai', text);
  }

  isActive(): boolean {
    return this.active;
  }
}
