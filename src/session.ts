import { writeFile, readFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Message, SessionSummary } from './types.js';

/**
 * Creates a timestamped session directory and writes transcript + metadata + summary.
 */
export async function saveSession(
  messages: Message[],
  summary: SessionSummary | null,
  dataDir: string,
): Promise<string> {
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const sessionDir = join(dataDir, `session_${ts}`);

  await mkdir(sessionDir, { recursive: true });

  // Write transcript.md
  const transcript = messages
    .map(m => `**${m.role}**: ${m.content}`)
    .join('\n\n');
  await writeFile(join(sessionDir, 'transcript.md'), `# Session Transcript\n\n${transcript}\n`);

  // Write metadata.json
  const metadata = {
    date: now.toISOString(),
    messageCount: messages.length,
    duration: null,
  };
  await writeFile(join(sessionDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

  // Write summary.md (if analyst generated one)
  if (summary) {
    const summaryMd = [
      '# Session Summary\n',
      `## Main Topics\n${summary.mainTopics.map(t => `- ${t}`).join('\n')}\n`,
      `## Emotional Journey\n${summary.emotionalJourney}\n`,
      `## Key Insights\n${summary.keyInsights.map(i => `- ${i}`).join('\n')}\n`,
      `## Recommendations\n${summary.recommendations.map(r => `- ${r}`).join('\n')}\n`,
      `## Risk Assessment\n${summary.riskAssessment}\n`,
    ].join('\n');
    await writeFile(join(sessionDir, 'summary.md'), summaryMd);
    await writeFile(join(sessionDir, 'summary.json'), JSON.stringify(summary, null, 2));
  }

  return sessionDir;
}

/**
 * Reads the last N session summaries for context continuity.
 */
export async function loadPastSessions(dataDir: string, limit: number = 3): Promise<string> {
  try {
    const entries = await readdir(dataDir, { withFileTypes: true });
    const sessionDirs = entries
      .filter(e => e.isDirectory() && e.name.startsWith('session_'))
      .map(e => e.name)
      .sort()
      .reverse()
      .slice(0, limit);

    const summaries: string[] = [];
    for (const dir of sessionDirs) {
      try {
        const summaryPath = join(dataDir, dir, 'summary.md');
        const content = await readFile(summaryPath, 'utf-8');
        summaries.push(`\n--- Past Session: ${dir} ---\n${content}`);
      } catch {
        // No summary for this session, skip
      }
    }

    return summaries.join('\n');
  } catch {
    // data dir doesn't exist yet
    return '';
  }
}
