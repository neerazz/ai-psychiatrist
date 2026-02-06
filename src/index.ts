import { createInterface } from 'node:readline';
import { loadConfig } from './config.js';
import { loadExternalContext } from './context.js';
import { AgentCoordinator } from './agents/coordinator.js';
import { saveSession, loadPastSessions } from './session.js';
import { AudioInterface, TextProvider } from './audio/audio-interface.js';
import { WhisperTTSProvider } from './audio/whisper-tts.js';
import { GeminiLiveProvider } from './audio/gemini-live.js';
import type { Config, Message } from './types.js';

function createAudioProvider(config: Config): AudioInterface {
  switch (config.audioProvider) {
    case 'gemini_live':
      return new GeminiLiveProvider(config);
    case 'whisper_tts':
      return new WhisperTTSProvider(config);
    case 'text':
    default:
      return new TextProvider();
  }
}

async function main() {
  const config = loadConfig();
  console.log(`\n🧠 AI Psychiatrist — Dr. Sterling`);
  console.log(`   Model: ${config.model} (${config.provider})`);
  console.log(`   Audio: ${config.audioProvider}\n`);

  // Load external context + past sessions
  const externalContext = await loadExternalContext(config.externalContextPaths);
  const pastSessions = await loadPastSessions(config.dataDir, 3);
  const fullContext = [externalContext, pastSessions].filter(Boolean).join('\n\n');

  if (externalContext) {
    console.log(`[context] Loaded external context (${externalContext.length} chars)`);
  }
  if (pastSessions) {
    console.log(`[context] Loaded past session summaries`);
  }

  // Initialize audio provider
  const audio = createAudioProvider(config);
  await audio.start();

  // Initialize agents
  const coordinator = new AgentCoordinator(config);
  await coordinator.initialize();

  // Listen for crisis events
  coordinator.on('crisis:detected', (crisis) => {
    console.log(`\n⚠️  [CRISIS] Tier ${crisis.tier}: ${crisis.indicators.join(', ')}`);
    // If audio is active and crisis is severe, interject
    if (crisis.tier && crisis.tier >= 2 && crisis.interventionMessage) {
      audio.interject(crisis.interventionMessage).catch(() => {});
    }
  });

  const messages: Message[] = [];
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let rlClosed = false;
  rl.on('close', () => { rlClosed = true; });

  const prompt = (query: string): Promise<string | null> =>
    new Promise((resolve) => {
      if (rlClosed) { resolve(null); return; }
      rl.question(query, (answer) => resolve(answer));
    });

  console.log('Type "goodbye" or "quit" to end the session.\n');
  console.log('Dr. Sterling: Hello. How are you feeling today?\n');

  // Conversation loop
  while (true) {
    const input = await prompt('You: ');

    // EOF or readline closed
    if (input === null || rlClosed) break;

    const trimmed = input.trim();

    if (!trimmed) continue;
    if (['goodbye', 'quit', 'exit', 'bye'].includes(trimmed.toLowerCase())) {
      break;
    }

    try {
      const { response, crisis: _crisis } = await coordinator.processInput(
        trimmed,
        messages,
        fullContext,
      );

      messages.push({ role: 'user', content: trimmed });
      messages.push({ role: 'assistant', content: response });

      console.log(`\nDr. Sterling: ${response}\n`);

      // Speak response if audio provider is active
      if (config.audioProvider !== 'text') {
        await audio.speak(response);
      }
    } catch (error) {
      console.error('\n[error] Failed to generate response:', (error as Error).message);
      console.log('Dr. Sterling: I apologize, I had a brief difficulty. Could you repeat that?\n');
    }
  }

  // End session
  console.log('\n[session] Ending session...');

  if (messages.length > 0) {
    let summary = null;
    try {
      console.log('[session] Generating summary...');
      summary = await coordinator.endSession(messages);
    } catch {
      console.warn('[session] Summary generation failed, saving transcript only');
    }

    const sessionDir = await saveSession(messages, summary, config.dataDir);
    console.log(`[session] Saved to: ${sessionDir}`);
  }

  await audio.stop();
  rl.close();
  console.log('\nDr. Sterling: Take care. I\'ll be here when you need me.\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
