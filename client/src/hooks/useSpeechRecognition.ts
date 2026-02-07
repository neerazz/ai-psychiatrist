import { useState, useCallback, useRef, useEffect } from 'react';

interface SpeechRecognitionHook {
  /** The latest interim (partial) transcript while the user is speaking */
  interimTranscript: string;
  /** Whether the mic is actively listening */
  isListening: boolean;
  /** Whether the browser supports speech recognition */
  isSupported: boolean;
  /** Start listening. Mic will auto-stop after the user finishes an utterance. */
  start: () => void;
  /** Manually stop listening and discard any pending speech. */
  stop: () => void;
  /** Any error message from the last recognition attempt */
  error: string | null;
}

/**
 * Speech recognition hook using the Web Speech API.
 *
 * Uses single-utterance mode (continuous=false). When the user finishes
 * speaking, the `onResult` callback fires with the final transcript.
 * The caller is responsible for sending the text and re-starting the mic.
 *
 * @param onResult - Called with the final transcript text when speech ends.
 *                   Uses a ref internally so the callback can change between renders
 *                   without restarting recognition.
 */
export function useSpeechRecognition(onResult?: (text: string) => void): SpeechRecognitionHook {
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);

  // Keep callback ref fresh without restarting recognition
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const SpeechRecognitionAPI =
    typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

  const isSupported = !!SpeechRecognitionAPI;

  const start = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    // Abort any running recognition first
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;      // Single utterance — stops when user pauses
      recognition.interimResults = true;   // Show partial results while speaking
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalText = '';
        let interimText = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else {
            interimText += result[0].transcript;
          }
        }

        if (finalText) {
          setInterimTranscript('');
          // Fire the callback with the final transcript
          const trimmed = finalText.trim();
          if (trimmed && onResultRef.current) {
            onResultRef.current(trimmed);
          }
        } else {
          setInterimTranscript(interimText);
        }
      };

      recognition.onerror = (event: any) => {
        const errType = event.error;
        console.warn('[mic] Recognition error:', errType);

        if (errType === 'not-allowed') {
          setError('Microphone access denied. Check browser permissions.');
        } else if (errType === 'no-speech') {
          // User was silent — not an error, just restart
          setError(null);
        } else if (errType === 'aborted') {
          // Normal when stop() or abort() is called
          setError(null);
        } else if (errType === 'network') {
          setError('Network error — speech recognition requires internet in Chrome');
        } else {
          setError(`Mic error: ${errType}`);
        }

        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('[mic] Failed to start:', err);
      setError('Failed to start microphone');
      setIsListening(false);
    }
  }, [SpeechRecognitionAPI]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  return { interimTranscript, isListening, isSupported, start, stop, error };
}
