import { useState, useCallback, useEffect, useRef } from 'react';

interface SpeechSynthesisHook {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

/**
 * Pick the best female English voice available.
 * Prefers natural/premium voices, falls back to any female English voice.
 */
function pickFemaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Prefer these voice names (macOS/Chrome high-quality)
  const preferred = [
    'Samantha', 'Karen', 'Moira', 'Tessa', 'Fiona',
    'Google UK English Female', 'Google US English',
    'Microsoft Zira', 'Microsoft Jenny',
  ];

  for (const name of preferred) {
    const match = voices.find(v => v.name.includes(name) && v.lang.startsWith('en'));
    if (match) return match;
  }

  // Fallback: any English voice with "female" in the name
  const female = voices.find(v => v.lang.startsWith('en') && /female/i.test(v.name));
  if (female) return female;

  // Fallback: first English voice
  return voices.find(v => v.lang.startsWith('en')) ?? voices[0];
}

/**
 * Chrome has a bug where long utterances stop after ~15s.
 * Split text into sentence-sized chunks to work around it.
 */
function splitIntoChunks(text: string, maxLen = 200): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+\s*|[^.!?]+$/g) ?? [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxLen && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }
  return chunks;
}

export function useSpeechSynthesis(): SpeechSynthesisHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const cancelledRef = useRef(false);

  // Pre-load voices (Chrome fires voiceschanged async)
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      voiceRef.current = pickFemaleVoice();
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [isSupported]);

  // Chrome pauses speechSynthesis after ~15s unless we resume it.
  // This interval keeps it alive.
  useEffect(() => {
    if (!isSupported) return;
    const interval = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) return;

    cancelledRef.current = false;
    window.speechSynthesis.cancel();

    const chunks = splitIntoChunks(text);

    const speakChunk = (index: number) => {
      if (cancelledRef.current || index >= chunks.length) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.rate = 0.95;
      utterance.pitch = 1.1;

      if (voiceRef.current) {
        utterance.voice = voiceRef.current;
      }

      utterance.onstart = () => setIsSpeaking(true);

      utterance.onend = () => {
        if (index < chunks.length - 1 && !cancelledRef.current) {
          speakChunk(index + 1);
        } else {
          setIsSpeaking(false);
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('[speech] Error:', e.error);
        }
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    };

    speakChunk(0);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    cancelledRef.current = true;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported };
}
