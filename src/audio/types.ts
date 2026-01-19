// src/audio/types.ts
// Audio processing type definitions
// Reference: Requirements R4 (Voice Communication), R5 (Speech Interruption)

/**
 * Audio configuration
 */
export interface AudioConfig {
    sampleRate: number;        // Default: 16000 (R4)
    silenceThresholdMs: number; // VAD threshold (R4)
    maxSilenceSeconds: number;  // Prompt after silence (R4)
    ttsVoiceId: string;        // ElevenLabs voice ID
    ttsModel: string;          // ElevenLabs model
}

/**
 * Speech-to-Text providers
 */
export type STTProvider = 'deepgram' | 'whisper' | 'local';

/**
 * Text-to-Speech providers
 */
export type TTSProvider = 'elevenlabs' | 'local';

/**
 * STT result from transcription
 */
export interface STTResult {
    transcript: string;
    confidence: number;
    isFinal: boolean;
    words?: Array<{
        word: string;
        start: number;
        end: number;
        confidence: number;
    }>;
    durationMs: number;
}

/**
 * TTS result from synthesis
 */
export interface TTSResult {
    audioData: Buffer;
    format: 'mp3' | 'wav' | 'pcm';
    durationMs: number;
    characters: number;
}

/**
 * Voice Activity Detection result
 */
export interface VADResult {
    isSpeaking: boolean;
    silenceDurationMs: number;
    speechDurationMs: number;
    volume: number;
}

/**
 * Audio stream events
 */
export interface AudioStreamEvents {
    'speech:start': void;
    'speech:end': { transcript: string };
    'interim:transcript': { text: string; confidence: number };
    'final:transcript': STTResult;
    'vad:speaking': VADResult;
    'vad:silence': VADResult;
    'error': { code: string; message: string };
}

/**
 * Default audio configuration
 */
export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
    sampleRate: 16000,
    silenceThresholdMs: 500,
    maxSilenceSeconds: 10,
    ttsVoiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah (warm, professional)
    ttsModel: 'eleven_turbo_v2'
};
