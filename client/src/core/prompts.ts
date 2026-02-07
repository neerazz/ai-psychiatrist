import drSterlingPrompt from '../../../prompts/dr-sterling.md?raw';
import crisisDetectorPrompt from '../../../prompts/crisis-detector.md?raw';
import contextFetcherPrompt from '../../../prompts/context-fetcher.md?raw';
import analystPrompt from '../../../prompts/analyst.md?raw';
import topicTrackerPrompt from '../../../prompts/topic-tracker.md?raw';

export const PROMPTS = {
  drSterling: drSterlingPrompt,
  crisisDetector: crisisDetectorPrompt,
  contextFetcher: contextFetcherPrompt,
  analyst: analystPrompt,
  topicTracker: topicTrackerPrompt,
} as const;
