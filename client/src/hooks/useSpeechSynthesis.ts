import { useState, useCallback, useEffect, useRef } from 'react';

interface SpeechSynthesisHook {
  /** Speak full text (cancels any current speech). Used for greetings. */
  speak: (text: string) => void;
  /** Enqueue a sentence to be spoken next. Starts immediately if idle. */
  enqueue: (sentence: string) => void;
  /** Call after streaming ends to speak any queued remainder. */
  flush: () => void;
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
  const queueRef = useRef<string[]>([]);
  const playingRef = useRef(false);

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

  /** Speak the next item in the queue. Recurses via onend. */
  const drainQueue = useCallback(() => {
    if (cancelledRef.current || queueRef.current.length === 0) {
      playingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    playingRef.current = true;
    const text = queueRef.current.shift()!;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.1;

    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
    }

    utterance.onstart = () => setIsSpeaking(true);

    utterance.onend = () => {
      // Drain the next sentence in the queue
      drainQueue();
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('[speech] Error:', e.error);
      }
      playingRef.current = false;
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  /** Enqueue a sentence. Starts speaking immediately if idle. */
  const enqueue = useCallback((sentence: string) => {
    if (!isSupported || !sentence.trim() || cancelledRef.current) return;

    // Split long sentences to avoid Chrome 15s cutoff
    const chunks = splitIntoChunks(sentence);
    queueRef.current.push(...chunks);

    // Kick off playback if not already playing
    if (!playingRef.current) {
      drainQueue();
    }
  }, [isSupported, drainQueue]);

  /** No-op for now — queue drains automatically. Exists for API symmetry. */
  const flush = useCallback(() => {
    // If nothing is playing but there are queued items, start draining
    if (!playingRef.current && queueRef.current.length > 0) {
      drainQueue();
    }
  }, [drainQueue]);

  /** Speak full text at once (cancels current). Used for greetings etc. */
  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) return;

    cancelledRef.current = false;
    window.speechSynthesis.cancel();
    queueRef.current = [];
    playingRef.current = false;

    const chunks = splitIntoChunks(text);
    queueRef.current.push(...chunks);
    drainQueue();
  }, [isSupported, drainQueue]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    cancelledRef.current = true;
    queueRef.current = [];
    playingRef.current = false;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { speak, enqueue, flush, stop, isSpeaking, isSupported };
}
