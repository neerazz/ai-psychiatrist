import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from './components/ChatMessage.tsx';
import { ChatInput } from './components/ChatInput.tsx';
import { TypingIndicator } from './components/TypingIndicator.tsx';
import { CrisisBanner } from './components/CrisisBanner.tsx';
import { SettingsPanel } from './components/SettingsPanel.tsx';
import { VideoPanel } from './components/VideoPanel.tsx';
import { TopicBucketPanel } from './components/TopicBucketPanel.tsx';
import { AgentCoordinator } from './core/coordinator.ts';
import { TopicTrackerAgent } from './core/agents/topic-tracker.ts';
import { createChatFunction, createStreamChatFunction } from './core/llm.ts';
import { PROMPTS } from './core/prompts.ts';
import { loadConfig, loadContext, loadPastSessions, loadPastTopicBuckets, saveSession } from './core/api.ts';
import { useSpeechRecognition } from './hooks/useSpeechRecognition.ts';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis.ts';
import { emptyBucket } from './core/types.ts';
import type { AIProvider, AppSettings, CrisisResult, Message, TopicBucket } from './core/types.ts';

const STORAGE_KEY = 'dr-sterling-settings';

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppSettings;
      parsed.voiceEnabled = true;
      return parsed;
    }
  } catch { /* ignore */ }
  return { provider: 'anthropic' as AIProvider, model: 'claude-sonnet-4-5', apiKey: '', voiceEnabled: true };
}

function saveSettingsToStorage(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [latestCrisis, setLatestCrisis] = useState<CrisisResult | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidecarOk, setSidecarOk] = useState<boolean | null>(null);
  // Loading phase: null → idle, 'data' → fetching context/sessions, 'greeting' → generating opening
  const [loadingPhase, setLoadingPhase] = useState<'data' | 'greeting' | null>(null);

  // Topic bucket state
  const [topicBucket, setTopicBucket] = useState<TopicBucket>(emptyBucket());
  const [showBucket, setShowBucket] = useState(false);

  const coordinatorRef = useRef<AgentCoordinator | null>(null);
  const contextRef = useRef('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { speak, enqueue: enqueueSpeech, flush: flushSpeech, stop: stopSpeaking, isSpeaking, isSupported: voiceOutputSupported } = useSpeechSynthesis();

  // Buffer for accumulating streamed tokens into sentences for TTS
  const ttsBufferRef = useRef('');

  // --- Voice send handler (called directly by mic when speech is finalized) ---
  const handleSend = useCallback(async (input: string) => {
    if (!coordinatorRef.current) {
      setError('Please configure your API key in Settings.');
      return;
    }

    stopSpeaking();
    ttsBufferRef.current = '';
    setError(null);
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setStreamingContent('');

    try {
      // Reset TTS buffer for this turn
      ttsBufferRef.current = '';
      const shouldSpeak = settings.voiceEnabled && voiceOutputSupported;

      // Dr. Sterling streams tokens — we update UI incrementally
      // and enqueue complete sentences for TTS as they arrive
      const result = await coordinatorRef.current.processInput(
        input,
        messages,
        (token: string) => {
          setStreamingContent(prev => prev + token);

          // Incrementally enqueue sentences for TTS as they stream in
          if (shouldSpeak) {
            ttsBufferRef.current += token;

            // Check for sentence boundaries: .  !  ?  followed by space or end
            // Also handle "..." as a pause boundary
            const sentenceEndPattern = /([.!?]+["'\u201d\u2019)}\]]*\s)|(\.\.\.\s)/;
            let match: RegExpExecArray | null;
            while ((match = sentenceEndPattern.exec(ttsBufferRef.current)) !== null) {
              const endIdx = match.index + match[0].length;
              const sentence = ttsBufferRef.current.slice(0, endIdx).trim();
              ttsBufferRef.current = ttsBufferRef.current.slice(endIdx);
              if (sentence) {
                enqueueSpeech(sentence);
              }
            }
          }
        },
      );

      // Streaming done — flush any remaining buffered text to TTS
      if (shouldSpeak && ttsBufferRef.current.trim()) {
        enqueueSpeech(ttsBufferRef.current.trim());
        ttsBufferRef.current = '';
      }
      flushSpeech();

      // Commit the final message
      setStreamingContent('');
      setLatestCrisis(result.crisis);
      setTopicBucket(result.topicBucket);
      const assistantMessage: Message = { role: 'assistant', content: result.response };
      setMessages(prev => [...prev, assistantMessage]);

      // Auto-show bucket once topics start appearing
      if (result.topicBucket.active.length > 0 || result.topicBucket.pending.length > 0) {
        setShowBucket(true);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMsg);
      setStreamingContent('');
    }

    setIsProcessing(false);
  }, [messages, settings.voiceEnabled, voiceOutputSupported, enqueueSpeech, flushSpeech, stopSpeaking]);

  // --- Speech recognition with callback that auto-sends ---
  const handleVoiceResult = useCallback((text: string) => {
    // Stop any TTS that might be playing (user started talking over it)
    stopSpeaking();
    ttsBufferRef.current = '';
    handleSend(text);
  }, [handleSend, stopSpeaking]);

  const {
    interimTranscript,
    isListening,
    isSupported: voiceInputSupported,
    start: startListening,
    stop: stopListening,
    error: voiceError,
  } = useSpeechRecognition(handleVoiceResult);

  // --- Refs for auto-restart logic ---
  const prevSpeakingRef = useRef(false);
  const prevProcessingRef = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, isProcessing]);

  // Auto-restart listening after TTS finishes speaking
  // Skip if the last mic attempt ended with an error (e.g. network unavailable)
  useEffect(() => {
    if (prevSpeakingRef.current && !isSpeaking && settings.voiceEnabled && voiceInputSupported && sessionActive && !isProcessing && !voiceError) {
      const timer = setTimeout(() => startListening(), 300);
      return () => clearTimeout(timer);
    }
    prevSpeakingRef.current = isSpeaking;
  }, [isSpeaking, settings.voiceEnabled, voiceInputSupported, sessionActive, isProcessing, startListening, voiceError]);

  // Auto-restart listening after AI processing completes (covers case where TTS is unavailable or disabled)
  // Skip if the last mic attempt ended with an error (e.g. network unavailable)
  useEffect(() => {
    if (prevProcessingRef.current && !isProcessing && settings.voiceEnabled && voiceInputSupported && sessionActive && !voiceError) {
      // Wait 700ms to let TTS start if it's going to.
      // If TTS does start, the TTS-based auto-restart will handle mic restart instead.
      const timer = setTimeout(() => {
        if (!window.speechSynthesis?.speaking) {
          startListening();
        }
      }, 700);
      return () => clearTimeout(timer);
    }
    prevProcessingRef.current = isProcessing;
  }, [isProcessing, settings.voiceEnabled, voiceInputSupported, sessionActive, startListening, voiceError]);

  // Auto-load config from .env via sidecar — always applies on startup
  useEffect(() => {
    loadConfig().then(config => {
      if (config) {
        setSidecarOk(true);
        if (!config.apiKey) return;
        // .env always wins — update settings with the latest values
        const envSettings: AppSettings = {
          provider: config.provider,
          model: config.model,
          apiKey: config.apiKey,
          voiceEnabled: true,
        };
        setSettings(envSettings);
        saveSettingsToStorage(envSettings);
      } else {
        setSidecarOk(false);
      }
    });
  }, []);

  // Show settings if no API key (but wait for sidecar to try loading .env first)
  useEffect(() => {
    if (!settings.apiKey && sidecarOk !== null) {
      setShowSettings(true);
    }
  }, [settings.apiKey, sidecarOk]);

  // Re-init coordinator when settings change
  useEffect(() => {
    if (!settings.apiKey) {
      coordinatorRef.current = null;
      return;
    }

    const chatFn = createChatFunction(settings.provider, settings.model, settings.apiKey);
    const streamFn = createStreamChatFunction(settings.provider, settings.model, settings.apiKey);
    const coordinator = new AgentCoordinator(chatFn, PROMPTS, streamFn);

    // Register bucket update callback — fires asynchronously when tracker finishes
    coordinator.setBucketUpdateCallback((updatedBucket: TopicBucket) => {
      setTopicBucket(updatedBucket);
    });

    coordinatorRef.current = coordinator;
  }, [settings.provider, settings.model, settings.apiKey]);

  const handleSettingsSave = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettingsToStorage(newSettings);
  };

  const startSession = useCallback(async () => {
    setSessionActive(true);
    setMessages([]);
    setStreamingContent('');
    setLatestCrisis(null);
    setError(null);
    setIsProcessing(true);
    setTopicBucket(emptyBucket());

    // Chrome TTS warmup (user-gesture context)
    if (settings.voiceEnabled && voiceOutputSupported) {
      const warmup = new SpeechSynthesisUtterance('');
      warmup.volume = 0;
      window.speechSynthesis.speak(warmup);
    }

    // ── Phase 1: Load user data & historic sessions ──
    setLoadingPhase('data');

    const [externalContext, pastSessions, pastBuckets] = await Promise.all([
      loadContext(),
      loadPastSessions(),
      loadPastTopicBuckets(),
    ]);

    const fullContext = [externalContext, pastSessions].filter(Boolean).join('\n');
    contextRef.current = fullContext;

    // Build carry-over bucket from past sessions
    const carryOverBucket = pastBuckets.length > 0
      ? TopicTrackerAgent.buildCarryOverBucket(pastBuckets as TopicBucket[])
      : emptyBucket();

    if (coordinatorRef.current) {
      coordinatorRef.current.setSessionContext(fullContext);
      coordinatorRef.current.setInitialBucket(carryOverBucket);
      setTopicBucket(carryOverBucket);

      // Auto-show bucket if there are carry-over topics
      if (carryOverBucket.pending.length > 0 || carryOverBucket.active.length > 0) {
        setShowBucket(true);
      }

      // ── Phase 2: Data ready — generate greeting with full context ──
      setLoadingPhase('greeting');

      try {
        const greeting = await coordinatorRef.current.generateGreeting(fullContext);
        const greetingMessage: Message = { role: 'assistant', content: greeting };
        setMessages([greetingMessage]);

        if (settings.voiceEnabled && voiceOutputSupported) {
          speak(greeting);
        }
      } catch (err) {
        console.warn('[session] Could not generate greeting:', err);
      }
    }

    setLoadingPhase(null);
    setIsProcessing(false);
  }, [settings.voiceEnabled, voiceOutputSupported, speak]);

  const endSession = useCallback(async () => {
    if (!coordinatorRef.current || messages.length === 0) {
      setSessionActive(false);
      return;
    }

    stopSpeaking();
    stopListening();
    setIsProcessing(true);
    try {
      const { summary, topicBucket: finalBucket } = await coordinatorRef.current.endSession(messages);
      setTopicBucket(finalBucket);
      await saveSession(messages, summary, finalBucket);
    } catch (err) {
      console.warn('[session] Error ending session:', err);
    }
    setIsProcessing(false);
    setSessionActive(false);
  }, [messages, stopSpeaking, stopListening]);

  // Wrapper for mic button: stop TTS if playing, then start mic
  const handleVoiceStart = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking();
      ttsBufferRef.current = '';
    }
    startListening();
  }, [isSpeaking, stopSpeaking, startListening]);

  const needsSetup = !settings.apiKey;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-sterling-900/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sterling-600/20 flex items-center justify-center">
            <span className="text-sterling-500 text-sm font-bold">DS</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Dr. Sterling</h1>
            <p className="text-xs text-slate-400">AI Psychiatrist</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sidecar indicator */}
          {sidecarOk !== null && (
            <div
              className={`w-2 h-2 rounded-full ${sidecarOk ? 'bg-green-500' : 'bg-yellow-500'}`}
              title={sidecarOk ? 'Sidecar connected' : 'Sidecar offline — sessions won\'t persist'}
            />
          )}

          {/* Topic bucket toggle */}
          {sessionActive && (
            <button
              onClick={() => setShowBucket(prev => !prev)}
              className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                showBucket
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle session topics"
            >
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 15.25a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 10a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1V10z" clipRule="evenodd" />
                </svg>
                Topics
                {(topicBucket.active.length + topicBucket.pending.length) > 0 && (
                  <span className="bg-blue-500/30 text-blue-200 text-[10px] rounded-full px-1.5">
                    {topicBucket.active.length + topicBucket.pending.length}
                  </span>
                )}
              </span>
            </button>
          )}

          {sessionActive ? (
            <button
              onClick={endSession}
              disabled={isProcessing}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
            >
              End Session
            </button>
          ) : (
            <button
              onClick={startSession}
              disabled={needsSetup}
              className="text-xs bg-sterling-600 hover:bg-sterling-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              New Session
            </button>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Main area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {sessionActive && (
            <VideoPanel isSpeaking={isSpeaking} />
          )}

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6">
              {/* Empty state */}
              {!sessionActive && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
                  <div className="w-16 h-16 rounded-full bg-sterling-600/20 flex items-center justify-center mb-4">
                    <span className="text-sterling-500 text-2xl font-bold">DS</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">Welcome</h2>
                  <p className="text-slate-400 max-w-md text-sm leading-relaxed mb-6">
                    I'm Dr. Sterling, your AI therapist. I'm here to listen, reflect, and help you explore your thoughts and feelings.
                  </p>
                  {needsSetup ? (
                    <button
                      onClick={() => setShowSettings(true)}
                      className="bg-sterling-600 hover:bg-sterling-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      Configure API Key to Start
                    </button>
                  ) : (
                    <button
                      onClick={startSession}
                      className="bg-sterling-600 hover:bg-sterling-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      Start a Session
                    </button>
                  )}
                </div>
              )}

              {/* Session preparation loader */}
              {loadingPhase === 'data' && (
                <div className="flex flex-col items-center justify-center min-h-[40vh] text-center animate-fade-in">
                  {/* Spinner */}
                  <div className="relative w-16 h-16 mb-6">
                    <div className="absolute inset-0 rounded-full border-2 border-sterling-600/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-sterling-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sterling-500 text-lg font-bold">DS</span>
                    </div>
                  </div>
                  <h3 className="text-white font-medium text-lg mb-2">Preparing your session</h3>
                  <p className="text-slate-400 text-sm max-w-xs">
                    Loading your profile and past session history&hellip;
                  </p>
                  <div className="flex gap-2 mt-4">
                    <div className="w-2 h-2 rounded-full bg-sterling-500 animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-sterling-500 animate-pulse" style={{ animationDelay: '200ms' }} />
                    <div className="w-2 h-2 rounded-full bg-sterling-500 animate-pulse" style={{ animationDelay: '400ms' }} />
                  </div>
                </div>
              )}

              {/* Crisis banner */}
              {latestCrisis && latestCrisis.detected && (
                <CrisisBanner crisis={latestCrisis} />
              )}

              {/* Messages */}
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}

              {/* Streaming bubble — shows Dr. Sterling's partial response */}
              {streamingContent && (
                <ChatMessage message={{ role: 'assistant', content: streamingContent }} />
              )}

              {/* Typing indicator: shown during greeting gen or response gen (no tokens yet) */}
              {isProcessing && !streamingContent && loadingPhase !== 'data' && <TypingIndicator />}

              {/* Error */}
              {error && (
                <div className="bg-crisis-red/10 border border-crisis-red/30 rounded-lg px-4 py-3 mb-4 text-sm text-crisis-red">
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Topic Bucket panel — slides in from the right */}
        {sessionActive && (
          <div className="shrink-0 p-3 pt-4">
            <TopicBucketPanel
              bucket={topicBucket}
              isVisible={showBucket}
              onClose={() => setShowBucket(false)}
            />
          </div>
        )}
      </main>

      {/* Input — hidden during initial data loading phase */}
      {sessionActive && loadingPhase !== 'data' && (
        <ChatInput
          onSend={handleSend}
          disabled={isProcessing || needsSetup}
          voiceEnabled={settings.voiceEnabled}
          voiceSupported={voiceInputSupported}
          voiceError={voiceError}
          isListening={isListening}
          onVoiceStart={handleVoiceStart}
          onVoiceStop={stopListening}
          interimTranscript={interimTranscript}
        />
      )}

      {/* Settings modal */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
