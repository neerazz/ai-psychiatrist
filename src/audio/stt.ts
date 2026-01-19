// src/audio/stt.ts
// Speech-to-Text using Deepgram
// Reference: Requirements R4 (Voice Communication), R5 (Speech Interruption)

import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import { STTResult, AudioConfig, DEFAULT_AUDIO_CONFIG, VADResult } from './types.js';
import { watchdog } from '../session/watchdog.js';

/**
 * Speech-to-Text Manager
 * Uses Deepgram for real-time transcription
 */
export class SpeechToTextManager extends EventEmitter {
    private config: AudioConfig;
    private apiKey: string | undefined;
    private isListening: boolean = false;
    private silenceTimer: NodeJS.Timeout | null = null;
    private currentTranscript: string = '';
    private speechStartTime: number | null = null;

    constructor(config?: Partial<AudioConfig>) {
        super();
        this.config = { ...DEFAULT_AUDIO_CONFIG, ...config };
        this.apiKey = process.env.DEEPGRAM_API_KEY;
    }

    /**
     * Check if STT is available
     */
    public isAvailable(): boolean {
        return !!this.apiKey;
    }

    /**
     * Start listening for speech
     */
    public startListening(sessionId: string): void {
        if (this.isListening) {
            logger.warn('Already listening');
            return;
        }

        this.isListening = true;
        this.currentTranscript = '';
        this.speechStartTime = null;

        // Start silence detection timer
        this.startSilenceTimer();

        logger.info('STT listening started', { sessionId });
        this.emit('listening:start');
    }

    /**
     * Stop listening
     */
    public stopListening(): STTResult | null {
        if (!this.isListening) {
            return null;
        }

        this.isListening = false;
        this.clearSilenceTimer();

        const result: STTResult = {
            transcript: this.currentTranscript,
            confidence: 0.9,
            isFinal: true,
            durationMs: this.speechStartTime ? Date.now() - this.speechStartTime : 0
        };

        logger.info('STT listening stopped', {
            transcript: result.transcript.substring(0, 50),
            durationMs: result.durationMs
        });

        this.emit('listening:stop', result);
        return result;
    }

    /**
     * Process audio chunk (simulated for now)
     * In production, this would stream to Deepgram WebSocket
     */
    public async processAudioChunk(audioData: Buffer): Promise<void> {
        if (!this.isListening) return;

        // Simulate VAD
        const volume = this.calculateVolume(audioData);
        const isSpeaking = volume > 0.02; // Threshold

        if (isSpeaking) {
            if (!this.speechStartTime) {
                this.speechStartTime = Date.now();
                this.emit('speech:start');
            }
            this.resetSilenceTimer();
        }

        const vadResult: VADResult = {
            isSpeaking,
            silenceDurationMs: this.getSilenceDuration(),
            speechDurationMs: this.speechStartTime ? Date.now() - this.speechStartTime : 0,
            volume
        };

        this.emit('vad:update', vadResult);
    }

    /**
     * Simulate transcription from text input (for testing)
     */
    public async transcribeText(text: string, sessionId: string): Promise<STTResult> {
        const startTime = Date.now();

        // Start STT watchdog
        watchdog.start('STT_PROCESSING', sessionId, () => {
            logger.warn('STT processing timeout');
            this.emit('error', { code: 'TIMEOUT', message: 'STT timeout' });
        });

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Stop watchdog
        watchdog.stop('STT_PROCESSING', sessionId);

        const result: STTResult = {
            transcript: text,
            confidence: 0.95,
            isFinal: true,
            durationMs: Date.now() - startTime
        };

        this.emit('final:transcript', result);
        return result;
    }

    /**
     * Transcribe audio using Deepgram API
     */
    public async transcribeAudio(audioData: Buffer, sessionId: string): Promise<STTResult> {
        const startTime = Date.now();

        if (!this.apiKey) {
            logger.warn('Deepgram API key not configured, using mock STT');
            return this.mockTranscribe(audioData, startTime);
        }

        // Start STT watchdog
        watchdog.start('STT_PROCESSING', sessionId, () => {
            logger.warn('STT processing timeout');
        });

        try {
            const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${this.apiKey}`,
                    'Content-Type': 'audio/wav'
                },
                body: audioData
            });

            if (!response.ok) {
                throw new Error(`Deepgram API error: ${response.status}`);
            }

            const data = await response.json() as {
                results: {
                    channels: Array<{
                        alternatives: Array<{
                            transcript: string;
                            confidence: number;
                            words?: Array<{
                                word: string;
                                start: number;
                                end: number;
                                confidence: number;
                            }>;
                        }>;
                    }>;
                };
            };

            watchdog.stop('STT_PROCESSING', sessionId);

            const alternative = data.results?.channels?.[0]?.alternatives?.[0];
            const result: STTResult = {
                transcript: alternative?.transcript || '',
                confidence: alternative?.confidence || 0,
                isFinal: true,
                words: alternative?.words,
                durationMs: Date.now() - startTime
            };

            logger.info('STT transcription complete', {
                transcript: result.transcript.substring(0, 50),
                confidence: result.confidence,
                durationMs: result.durationMs
            });

            this.emit('final:transcript', result);
            return result;
        } catch (error) {
            watchdog.stop('STT_PROCESSING', sessionId);
            logger.error('STT transcription failed', { error });
            return this.mockTranscribe(audioData, startTime);
        }
    }

    /**
     * Mock transcription for testing
     */
    private mockTranscribe(audioData: Buffer, startTime: number): STTResult {
        return {
            transcript: '[Mock transcription - audio data received]',
            confidence: 0.8,
            isFinal: true,
            durationMs: Date.now() - startTime
        };
    }

    /**
     * Calculate audio volume (RMS)
     */
    private calculateVolume(audioData: Buffer): number {
        let sum = 0;
        const samples = audioData.length / 2; // 16-bit samples

        for (let i = 0; i < audioData.length; i += 2) {
            const sample = audioData.readInt16LE(i) / 32768;
            sum += sample * sample;
        }

        return Math.sqrt(sum / samples);
    }

    /**
     * Start silence detection timer
     */
    private startSilenceTimer(): void {
        this.silenceTimer = setInterval(() => {
            const silenceDuration = this.getSilenceDuration();

            if (silenceDuration >= this.config.maxSilenceSeconds * 1000) {
                this.emit('silence:extended', { durationMs: silenceDuration });
            }
        }, 1000);
    }

    /**
     * Reset silence timer
     */
    private resetSilenceTimer(): void {
        // Timer continues, but silence duration resets
    }

    /**
     * Clear silence timer
     */
    private clearSilenceTimer(): void {
        if (this.silenceTimer) {
            clearInterval(this.silenceTimer);
            this.silenceTimer = null;
        }
    }

    /**
     * Get current silence duration
     */
    private getSilenceDuration(): number {
        // Simplified - in production, track actual silence
        return 0;
    }

    /**
     * Clean up resources
     */
    public destroy(): void {
        this.stopListening();
        this.removeAllListeners();
    }
}

// Singleton
let sttManager: SpeechToTextManager | null = null;

export function getSTTManager(): SpeechToTextManager {
    if (!sttManager) {
        sttManager = new SpeechToTextManager();
    }
    return sttManager;
}
