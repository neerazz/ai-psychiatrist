import { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  voiceEnabled: boolean;
  voiceSupported: boolean;
  voiceError: string | null;
  isListening: boolean;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  interimTranscript?: string;
}

export function ChatInput({
  onSend,
  disabled,
  voiceEnabled,
  voiceSupported,
  voiceError,
  isListening,
  onVoiceStart,
  onVoiceStop,
  interimTranscript,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-800 p-4 bg-sterling-900/80 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto">
        {/* Interim transcript display */}
        {isListening && interimTranscript && (
          <div className="text-xs text-slate-400 italic mb-2 px-1 truncate">
            {interimTranscript}...
          </div>
        )}

        {/* Listening indicator when mic is on but no interim text yet */}
        {isListening && !interimTranscript && (
          <div className="text-xs text-blue-400 mb-2 px-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Listening...
          </div>
        )}

        {/* Voice error display */}
        {voiceError && !isListening && (
          <div className="text-xs text-red-400 mb-2 px-1">
            {voiceError}
          </div>
        )}

        <div className="flex gap-3 items-end">
          {/* Voice button */}
          {voiceEnabled && (
            <button
              onClick={isListening ? onVoiceStop : onVoiceStart}
              disabled={disabled || !voiceSupported}
              className={`flex-shrink-0 p-2.5 rounded-full transition-all ${
                isListening
                  ? 'bg-crisis-red text-white animate-pulse'
                  : voiceError
                    ? 'bg-red-900/30 text-red-400 border border-red-800'
                    : 'bg-sterling-800 text-slate-400 hover:text-white hover:bg-sterling-700'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title={
                !voiceSupported
                  ? 'Voice input not supported in this browser'
                  : voiceError
                    ? voiceError
                    : isListening
                      ? 'Stop listening'
                      : 'Start voice input'
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </button>
          )}

          {/* Text input */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder={disabled ? 'Dr. Sterling is thinking...' : 'Type your message...'}
            className="flex-1 bg-sterling-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sterling-500 resize-none disabled:opacity-40"
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={disabled || !text.trim()}
            className="flex-shrink-0 bg-sterling-600 hover:bg-sterling-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-2.5 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
