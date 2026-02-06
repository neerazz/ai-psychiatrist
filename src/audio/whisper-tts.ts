import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { AudioInterface } from './audio-interface.js';
import type { Config } from '../types.js';

const execAsync = promisify(exec);

/**
 * WhisperTTSProvider — local whisper.cpp for STT + configurable TTS.
 *
 * STT: Uses nodejs-whisper to transcribe recorded audio.
 * TTS: Switches on config.ttsProvider (say/piper/edge).
 *
 * Note: Full mic recording integration requires native audio bindings
 * (e.g., sox, rec, or node-record-lpcm16). This implementation provides
 * the framework; actual mic capture can be wired in per platform.
 */
export class WhisperTTSProvider extends AudioInterface {
  private config: Config;
  private active: boolean = false;

  constructor(config: Config) {
    super();
    this.config = config;
  }

  get providerName(): string {
    return 'whisper_tts';
  }

  async start(): Promise<void> {
    // Verify whisper model is available
    console.log(`[whisper] Initializing with model: ${this.config.whisperModel}`);
    console.log(`[whisper] TTS provider: ${this.config.ttsProvider}`);
    this.active = true;
    this.emit('connected');
  }

  async stop(): Promise<void> {
    this.active = false;
    this.emit('disconnected', 'stopped');
  }

  /**
   * Listen: Record from mic → transcribe with whisper.
   * Placeholder: requires platform-specific mic recording.
   * For now, falls back to a message explaining setup.
   */
  async listen(): Promise<string> {
    // TODO: Integrate mic recording (sox/rec/node-record-lpcm16)
    // Steps:
    // 1. Record audio to temp .wav file
    // 2. Transcribe with nodejs-whisper
    // 3. Return transcribed text
    //
    // Example with nodejs-whisper:
    //   import { nodeWhisper } from 'nodejs-whisper';
    //   const whisper = await nodeWhisper(tempWavPath, {
    //     modelName: this.config.whisperModel,
    //     autoDownloadModelName: this.config.whisperModel,
    //   });
    //   const text = whisper.map(s => s.speech).join(' ');

    console.warn('[whisper] Mic recording not yet wired — use text mode for now');
    return '';
  }

  /**
   * Speak text using the configured TTS provider.
   */
  async speak(text: string): Promise<void> {
    this.emit('transcript:ai', text);

    try {
      switch (this.config.ttsProvider) {
        case 'say':
          await this.speakWithSay(text);
          break;
        case 'piper':
          await this.speakWithPiper(text);
          break;
        case 'edge':
          await this.speakWithEdge(text);
          break;
        default:
          console.log(`[tts] ${text}`);
      }
    } catch (error) {
      console.warn(`[tts] TTS failed, printing instead: ${(error as Error).message}`);
      console.log(`Dr. Sterling: ${text}`);
    }
  }

  /**
   * Interject — speak with priority (interrupt current TTS if playing).
   */
  async interject(text: string): Promise<void> {
    // Kill any running TTS process first
    try {
      await execAsync('killall say 2>/dev/null || true');
    } catch {
      // No running TTS to kill
    }
    await this.speak(text);
  }

  isActive(): boolean {
    return this.active;
  }

  // ─── TTS Implementations ──────────────────────────────────────────────

  private async speakWithSay(text: string): Promise<void> {
    // macOS built-in 'say' command
    const escaped = text.replace(/'/g, "'\\''");
    await execAsync(`say '${escaped}'`);
  }

  private async speakWithPiper(text: string): Promise<void> {
    // Piper TTS (requires piper binary installed)
    const escaped = text.replace(/'/g, "'\\''");
    await execAsync(`echo '${escaped}' | piper --output-raw | aplay -r 22050 -f S16_LE -t raw -`);
  }

  private async speakWithEdge(text: string): Promise<void> {
    // Edge TTS (requires edge-tts Python package)
    const escaped = text.replace(/'/g, "'\\''");
    await execAsync(`edge-tts --text '${escaped}' --write-media /tmp/edge-tts-out.mp3 && afplay /tmp/edge-tts-out.mp3`);
  }
}
