import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIProvider, Message, ChatOptions, ChatFunction, StreamChatFunction } from './types.ts';

/**
 * Create a standard (non-streaming) chat function.
 * Used for crisis detection, context enrichment, analyst, etc.
 */
export function createChatFunction(provider: AIProvider, model: string, apiKey: string): ChatFunction {
  let anthropicClient: Anthropic | null = null;
  let openaiClient: OpenAI | null = null;
  let googleClient: GoogleGenerativeAI | null = null;

  return async (systemPrompt: string, messages: Message[], options?: ChatOptions): Promise<string> => {
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 1024;

    switch (provider) {
      case 'anthropic': {
        if (!anthropicClient) {
          anthropicClient = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
        }
        const anthropicMessages = messages
          .filter(m => m.role !== 'system' && m.content.trim().length > 0)
          .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
        console.log('[DEBUG anthropic non-streaming]', JSON.stringify(anthropicMessages, null, 2));
        const response = await anthropicClient.messages.create({
          model, max_tokens: maxTokens, temperature, system: systemPrompt, messages: anthropicMessages,
        });
        const block = response.content[0];
        return block.type === 'text' ? block.text : '';
      }

      case 'openai': {
        if (!openaiClient) {
          openaiClient = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
        }
        const openaiMessages = [
          { role: 'system' as const, content: systemPrompt },
          ...messages
            .filter(m => m.content.trim().length > 0)
            .map(m => ({ role: m.role as 'system' | 'user' | 'assistant', content: m.content })),
        ];
        const response = await openaiClient.chat.completions.create({
          model, messages: openaiMessages, temperature, max_tokens: maxTokens,
        });
        return response.choices[0]?.message?.content ?? '';
      }

      case 'google': {
        if (!googleClient) {
          googleClient = new GoogleGenerativeAI(apiKey);
        }
        const genModel = googleClient.getGenerativeModel({
          model, systemInstruction: systemPrompt,
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        });
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
        if (!lastMessage) return '';
        const result = await chatSession.sendMessage(lastMessage.content);
        return result.response.text();
      }

      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  };
}

/**
 * Create a STREAMING chat function.
 * Used for Dr. Sterling's responses — tokens arrive in real time.
 */
export function createStreamChatFunction(provider: AIProvider, model: string, apiKey: string): StreamChatFunction {
  let anthropicClient: Anthropic | null = null;
  let openaiClient: OpenAI | null = null;
  let googleClient: GoogleGenerativeAI | null = null;

  return async (
    systemPrompt: string,
    messages: Message[],
    onToken: (token: string) => void,
    options?: ChatOptions,
  ): Promise<string> => {
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 1024;
    let fullText = '';

    switch (provider) {
      case 'anthropic': {
        if (!anthropicClient) {
          anthropicClient = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
        }
        const anthropicMessages = messages
          .filter(m => m.role !== 'system' && m.content.trim().length > 0)
          .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
        console.log('[DEBUG anthropic streaming]', JSON.stringify(anthropicMessages, null, 2));

        const stream = anthropicClient.messages.stream({
          model, max_tokens: maxTokens, temperature, system: systemPrompt, messages: anthropicMessages,
        });

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const token = event.delta.text;
            fullText += token;
            onToken(token);
          }
        }
        return fullText;
      }

      case 'openai': {
        if (!openaiClient) {
          openaiClient = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
        }
        const openaiMessages = [
          { role: 'system' as const, content: systemPrompt },
          ...messages
            .filter(m => m.content.trim().length > 0)
            .map(m => ({ role: m.role as 'system' | 'user' | 'assistant', content: m.content })),
        ];
        const stream = await openaiClient.chat.completions.create({
          model, messages: openaiMessages, temperature, max_tokens: maxTokens, stream: true,
        });
        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content ?? '';
          if (token) {
            fullText += token;
            onToken(token);
          }
        }
        return fullText;
      }

      case 'google': {
        if (!googleClient) {
          googleClient = new GoogleGenerativeAI(apiKey);
        }
        const genModel = googleClient.getGenerativeModel({
          model, systemInstruction: systemPrompt,
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        });
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
        if (!lastMessage) return '';

        const result = await chatSession.sendMessageStream(lastMessage.content);
        for await (const chunk of result.stream) {
          const token = chunk.text();
          if (token) {
            fullText += token;
            onToken(token);
          }
        }
        return fullText;
      }

      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  };
}

/**
 * Infer provider from model name prefix.
 */
export function inferProvider(model: string): AIProvider {
  const lower = model.toLowerCase();
  if (lower.startsWith('claude')) return 'anthropic';
  if (lower.startsWith('gpt')) return 'openai';
  if (lower.startsWith('gemini')) return 'google';
  return 'anthropic';
}
