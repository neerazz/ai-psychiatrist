// src/audio/tts.ts
// Text-to-Speech with Open Source Support
// Reference: Requirements R6 (Voice Selection)
// Providers: Coqui TTS (XTTS), Piper TTS (local), with ElevenLabs fallback

import { spawn, ChildProcess } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import { TTSResult, AudioConfig, DEFAULT_AUDIO_CONFIG } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * TTS Provider types - prioritizing open source
 */
export type TTSProvider = 'piper' | 'coqui' | 'edge-tts' | 'elevenlabs' | 'mock';

/**
 * Provider configuration
 */
export interface TTSProviderConfig {
    piper?: {
        modelPath: string;
        configPath?: string;
    };
    coqui?: {
        modelName: string;
        speakerId?: string;
        language?: string;
    };
    edgeTts?: {
        voice: string;  // e.g., 'en-US-AriaNeural'
    };
    elevenlabs?: {
        apiKey: string;
        voiceId: string;
        model: string;
    };
}

/**
 * Text-to-Speech Manager with Open Source Priority
 * 
 * Priority order:
 * 1. Piper TTS (local, fast, high quality) - Recommended
 * 2. Coqui TTS/XTTS (local, very high quality, GPU recommended)
 * 3. Edge TTS (free Microsoft voices via edge-tts)
 * 4. ElevenLabs (paid, highest quality - fallback only)
 */
export class TextToSpeechManager {
    private config: AudioConfig;
    private provider: TTSProvider = 'mock';
    private providerConfig: TTSProviderConfig = {};
    private outputDir: string;

    constructor(config?: Partial<AudioConfig>) {
        this.config = { ...DEFAULT_AUDIO_CONFIG, ...config };
        this.outputDir = path.join(__dirname, '../../memory_directory/audio/tts');
        this.detectAvailableProvider();
    }

    /**
     * Detect best available TTS provider
     */
    private async detectAvailableProvider(): Promise<void> {
        // Check for Piper TTS (fastest, recommended)
        try {
            await this.checkPiper();
            if (this.provider === 'piper') return;
        } catch { /* not available */ }

        // Check for Edge TTS (free Microsoft voices)
        try {
            await this.checkEdgeTts();
            if (this.provider === 'edge-tts') return;
        } catch { /* not available */ }

        // Check for Coqui TTS
        try {
            await this.checkCoqui();
            if (this.provider === 'coqui') return;
        } catch { /* not available */ }

        // Check for ElevenLabs (paid fallback)
        if (process.env.ELEVENLABS_API_KEY) {
            this.provider = 'elevenlabs';
            this.providerConfig.elevenlabs = {
                apiKey: process.env.ELEVENLABS_API_KEY,
                voiceId: this.config.ttsVoiceId,
                model: this.config.ttsModel
            };
            logger.info('TTS provider: ElevenLabs (paid)');
            return;
        }

        // Fall back to mock
        this.provider = 'mock';
        logger.warn('No TTS provider available, using mock synthesis');
    }

    /**
     * Check if Piper TTS is available
     */
    private async checkPiper(): Promise<void> {
        return new Promise((resolve, reject) => {
            const proc = spawn('piper', ['--version']);
            proc.on('close', (code) => {
                if (code === 0) {
                    this.provider = 'piper';
                    logger.info('TTS provider: Piper TTS (open source, recommended)');
                    resolve();
                } else {
                    reject(new Error('Piper not available'));
                }
            });
            proc.on('error', () => reject(new Error('Piper not found')));
        });
    }

    /**
     * Check if Edge TTS is available (Python package)
     */
    private async checkEdgeTts(): Promise<void> {
        return new Promise((resolve, reject) => {
            const proc = spawn('edge-tts', ['--list-voices']);
            proc.on('close', (code) => {
                if (code === 0) {
                    this.provider = 'edge-tts';
                    this.providerConfig.edgeTts = {
                        voice: 'en-US-AriaNeural' // Professional female voice
                    };
                    logger.info('TTS provider: Edge TTS (free Microsoft voices)');
                    resolve();
                } else {
                    reject(new Error('Edge TTS not available'));
                }
            });
            proc.on('error', () => reject(new Error('Edge TTS not found')));
        });
    }

    /**
     * Check if Coqui TTS is available
     */
    private async checkCoqui(): Promise<void> {
        return new Promise((resolve, reject) => {
            const proc = spawn('tts', ['--list_models']);
            proc.on('close', (code) => {
                if (code === 0) {
                    this.provider = 'coqui';
                    this.providerConfig.coqui = {
                        modelName: 'tts_models/en/ljspeech/tacotron2-DDC',
                        language: 'en'
                    };
                    logger.info('TTS provider: Coqui TTS (open source)');
                    resolve();
                } else {
                    reject(new Error('Coqui TTS not available'));
                }
            });
            proc.on('error', () => reject(new Error('Coqui TTS not found')));
        });
    }

    /**
     * Check if TTS is available
     */
    public isAvailable(): boolean {
        return this.provider !== 'mock';
    }

    /**
     * Get current provider info
     */
    public getProviderInfo(): { provider: TTSProvider; isOpenSource: boolean } {
        const openSourceProviders: TTSProvider[] = ['piper', 'coqui', 'edge-tts'];
        return {
            provider: this.provider,
            isOpenSource: openSourceProviders.includes(this.provider)
        };
    }

    /**
     * Synthesize speech from text
     */
    public async synthesize(text: string): Promise<TTSResult> {
        const startTime = Date.now();

        // Ensure output directory exists
        await fs.mkdir(this.outputDir, { recursive: true });

        switch (this.provider) {
            case 'piper':
                return this.synthesizePiper(text, startTime);
            case 'edge-tts':
                return this.synthesizeEdgeTts(text, startTime);
            case 'coqui':
                return this.synthesizeCoqui(text, startTime);
            case 'elevenlabs':
                return this.synthesizeElevenLabs(text, startTime);
            default:
                return this.mockSynthesize(text, startTime);
        }
    }

    /**
     * Synthesize using Piper TTS (fast, local, open source)
     * Install: pip install piper-tts
     * Models: https://github.com/rhasspy/piper/releases
     */
    private async synthesizePiper(text: string, startTime: number): Promise<TTSResult> {
        const outputFile = path.join(this.outputDir, `piper_${Date.now()}.wav`);

        return new Promise((resolve, reject) => {
            // Use default en_US voice if no model specified
            const args = ['--output_file', outputFile];

            if (this.providerConfig.piper?.modelPath) {
                args.push('--model', this.providerConfig.piper.modelPath);
            }

            const proc = spawn('piper', args);
            proc.stdin.write(text);
            proc.stdin.end();

            proc.on('close', async (code) => {
                if (code === 0) {
                    try {
                        const audioData = await fs.readFile(outputFile);
                        const durationMs = Date.now() - startTime;

                        logger.info('Piper TTS synthesis complete', {
                            characters: text.length,
                            durationMs,
                            audioSize: audioData.length
                        });

                        resolve({
                            audioData,
                            format: 'wav',
                            durationMs,
                            characters: text.length
                        });
                    } catch (err) {
                        reject(err);
                    }
                } else {
                    reject(new Error(`Piper exited with code ${code}`));
                }
            });

            proc.on('error', reject);
        });
    }

    /**
     * Synthesize using Edge TTS (free Microsoft voices)
     * Install: pip install edge-tts
     */
    private async synthesizeEdgeTts(text: string, startTime: number): Promise<TTSResult> {
        const outputFile = path.join(this.outputDir, `edge_${Date.now()}.mp3`);
        const voice = this.providerConfig.edgeTts?.voice || 'en-US-AriaNeural';

        return new Promise((resolve, reject) => {
            const proc = spawn('edge-tts', [
                '--voice', voice,
                '--text', text,
                '--write-media', outputFile
            ]);

            proc.on('close', async (code) => {
                if (code === 0) {
                    try {
                        const audioData = await fs.readFile(outputFile);
                        const durationMs = Date.now() - startTime;

                        logger.info('Edge TTS synthesis complete', {
                            characters: text.length,
                            durationMs,
                            audioSize: audioData.length,
                            voice
                        });

                        resolve({
                            audioData,
                            format: 'mp3',
                            durationMs,
                            characters: text.length
                        });
                    } catch (err) {
                        reject(err);
                    }
                } else {
                    reject(new Error(`Edge TTS exited with code ${code}`));
                }
            });

            proc.on('error', reject);
        });
    }

    /**
     * Synthesize using Coqui TTS (XTTS, high quality)
     * Install: pip install TTS
     */
    private async synthesizeCoqui(text: string, startTime: number): Promise<TTSResult> {
        const outputFile = path.join(this.outputDir, `coqui_${Date.now()}.wav`);
        const model = this.providerConfig.coqui?.modelName || 'tts_models/en/ljspeech/tacotron2-DDC';

        return new Promise((resolve, reject) => {
            const args = [
                '--model_name', model,
                '--text', text,
                '--out_path', outputFile
            ];

            const proc = spawn('tts', args);

            proc.on('close', async (code) => {
                if (code === 0) {
                    try {
                        const audioData = await fs.readFile(outputFile);
                        const durationMs = Date.now() - startTime;

                        logger.info('Coqui TTS synthesis complete', {
                            characters: text.length,
                            durationMs,
                            audioSize: audioData.length,
                            model
                        });

                        resolve({
                            audioData,
                            format: 'wav',
                            durationMs,
                            characters: text.length
                        });
                    } catch (err) {
                        reject(err);
                    }
                } else {
                    reject(new Error(`Coqui TTS exited with code ${code}`));
                }
            });

            proc.on('error', reject);
        });
    }

    /**
     * Synthesize using ElevenLabs (paid fallback)
     */
    private async synthesizeElevenLabs(text: string, startTime: number): Promise<TTSResult> {
        const config = this.providerConfig.elevenlabs;
        if (!config?.apiKey) {
            return this.mockSynthesize(text, startTime);
        }

        try {
            const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': config.apiKey
                    },
                    body: JSON.stringify({
                        text,
                        model_id: config.model,
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75
                        }
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`ElevenLabs API error: ${response.status}`);
            }

            const audioBuffer = await response.arrayBuffer();
            const durationMs = Date.now() - startTime;

            logger.info('ElevenLabs TTS synthesis complete', {
                characters: text.length,
                durationMs,
                audioSize: audioBuffer.byteLength
            });

            return {
                audioData: Buffer.from(audioBuffer),
                format: 'mp3',
                durationMs,
                characters: text.length
            };
        } catch (error) {
            logger.error('ElevenLabs TTS failed', { error });
            return this.mockSynthesize(text, startTime);
        }
    }

    /**
     * Generate mock audio for testing
     */
    private mockSynthesize(text: string, startTime: number): TTSResult {
        const estimatedDurationMs = (text.length / 5) * (60000 / 150);
        const sampleRate = this.config.sampleRate;
        const duration = estimatedDurationMs / 1000;
        const numSamples = Math.floor(sampleRate * duration);
        const dataSize = numSamples * 2;

        // Create WAV header
        const wavHeader = Buffer.alloc(44);
        wavHeader.write('RIFF', 0);
        wavHeader.writeUInt32LE(36 + dataSize, 4);
        wavHeader.write('WAVE', 8);
        wavHeader.write('fmt ', 12);
        wavHeader.writeUInt32LE(16, 16);
        wavHeader.writeUInt16LE(1, 20);
        wavHeader.writeUInt16LE(1, 22);
        wavHeader.writeUInt32LE(sampleRate, 24);
        wavHeader.writeUInt32LE(sampleRate * 2, 28);
        wavHeader.writeUInt16LE(2, 32);
        wavHeader.writeUInt16LE(16, 34);
        wavHeader.write('data', 36);
        wavHeader.writeUInt32LE(dataSize, 40);

        const audioData = Buffer.alloc(44 + dataSize);
        wavHeader.copy(audioData);

        return {
            audioData,
            format: 'wav',
            durationMs: Date.now() - startTime,
            characters: text.length
        };
    }

    /**
     * Set TTS provider manually
     */
    public setProvider(provider: TTSProvider, config?: TTSProviderConfig): void {
        this.provider = provider;
        if (config) {
            this.providerConfig = { ...this.providerConfig, ...config };
        }
        logger.info('TTS provider changed', { provider });
    }

    /**
     * Get available voices for current provider
     */
    public async getVoices(): Promise<Array<{ id: string; name: string }>> {
        switch (this.provider) {
            case 'edge-tts':
                return [
                    { id: 'en-US-AriaNeural', name: 'Aria (US Female)' },
                    { id: 'en-US-GuyNeural', name: 'Guy (US Male)' },
                    { id: 'en-GB-SoniaNeural', name: 'Sonia (UK Female)' },
                    { id: 'en-AU-NatashaNeural', name: 'Natasha (AU Female)' }
                ];
            case 'piper':
                return [
                    { id: 'en_US-lessac-medium', name: 'Lessac (Female)' },
                    { id: 'en_US-ryan-medium', name: 'Ryan (Male)' }
                ];
            default:
                return [{ id: 'default', name: 'Default Voice' }];
        }
    }
}

// Singleton
let ttsManager: TextToSpeechManager | null = null;

export function getTTSManager(): TextToSpeechManager {
    if (!ttsManager) {
        ttsManager = new TextToSpeechManager();
    }
    return ttsManager;
}
