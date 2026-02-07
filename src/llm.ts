import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIProvider, Message } from './types.js';

// Lazy-initialized clients (only created when first used)
let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;
let googleClient: GoogleGenerativeAI | null = null;

function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

function getGoogle(): GoogleGenerativeAI {
  if (!googleClient) {
    googleClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  return googleClient;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

/**
 * Unified chat function that routes to the correct LLM provider.
 */
export async function chat(
  provider: AIProvider,
  model: string,
  systemPrompt: string,
  messages: Message[],
  options?: ChatOptions,
): Promise<string> {
  const temperature = options?.temperature ?? 0.7;
  const maxTokens = options?.maxTokens ?? 1024;

  switch (provider) {
    case 'anthropic':
      return chatAnthropic(model, systemPrompt, messages, temperature, maxTokens);
    case 'openai':
      return chatOpenAI(model, systemPrompt, messages, temperature, maxTokens);
    case 'google':
      return chatGoogle(model, systemPrompt, messages, temperature, maxTokens);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

async function chatAnthropic(
  model: string,
  systemPrompt: string,
  messages: Message[],
  temperature: number,
  maxTokens: number,
): Promise<string> {
  const client = getAnthropic();

  const anthropicMessages = messages
    .filter(m => m.role !== 'system' && m.content.trim().length > 0)
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: anthropicMessages,
  });

  const block = response.content[0];
  if (block.type === 'text') {
    return block.text;
  }
  return '';
}

async function chatOpenAI(
  model: string,
  systemPrompt: string,
  messages: Message[],
  temperature: number,
  maxTokens: number,
): Promise<string> {
  const client = getOpenAI();

  const openaiMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages
      .filter(m => m.content.trim().length > 0)
      .map(m => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
  ];

  const response = await client.chat.completions.create({
    model,
    messages: openaiMessages,
    temperature,
    max_tokens: maxTokens,
  });

  return response.choices[0]?.message?.content ?? '';
}

async function chatGoogle(
  model: string,
  systemPrompt: string,
  messages: Message[],
  temperature: number,
  maxTokens: number,
): Promise<string> {
  const client = getGoogle();
  const genModel = client.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });

  // Build content history from messages, filtering out empty content
  const history = messages
    .slice(0, -1)
    .filter(m => m.content.trim().length > 0)
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Gemini requires history to start with 'user' — drop leading 'model' entries
  while (history.length > 0 && history[0].role === 'model') {
    history.shift();
  }

  const chatSession = genModel.startChat({ history });
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage) {
    return '';
  }

  const result = await chatSession.sendMessage(lastMessage.content);
  return result.response.text();
}
