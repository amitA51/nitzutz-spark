import OpenAI from 'openai';
import { prisma } from '../db';

export function createAIClient() {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.HF_TOKEN;
  const baseURL = process.env.AI_BASE_URL || (process.env.OPENAI_API_KEY ? 'https://api.openai.com/v1' : 'https://router.huggingface.co/v1');

  if (!apiKey) {
    console.warn('[AI] Missing API key. Set AI_API_KEY or HF_TOKEN in environment variables.');
    return null;
  }

  return new OpenAI({ apiKey, baseURL });
}

export function isAIEnabled(): boolean {
  return !!(process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.HF_TOKEN);
}

// Async helpers that also read from DB settings (fallback for local/dev where env may be missing)
export async function getAICredentialsFromAny() {
  // Try env first
  let apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.HF_TOKEN || null;
  const baseURL = process.env.AI_BASE_URL || (process.env.OPENAI_API_KEY ? 'https://api.openai.com/v1' : 'https://router.huggingface.co/v1');

  if (!apiKey) {
    try {
      const settings = await prisma.userSettings.findUnique({ where: { id: 'default-user' } });
      if (settings?.aiApiKey) {
        apiKey = settings.aiApiKey;
      }
    } catch (e) {
      console.warn('[AI] Failed to read user settings for AI key:', e);
    }
  }

  return { apiKey, baseURL } as { apiKey: string | null; baseURL: string };
}

export async function createAIClientFromAny(): Promise<OpenAI | null> {
  const { apiKey, baseURL } = await getAICredentialsFromAny();
  if (!apiKey) return null;
  return new OpenAI({ apiKey, baseURL });
}

export async function isAIEnabledAsync(): Promise<boolean> {
  const { apiKey } = await getAICredentialsFromAny();
  return !!apiKey;
}

export function getDefaultModel(): string {
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  if (process.env.OPENAI_API_KEY || (process.env.AI_BASE_URL || '').includes('openai.com')) {
    return 'gpt-4o-mini';
  }
  // Default to HF router compatible model id
  return 'deepseek-ai/DeepSeek-V3.2-Exp:novita';
}

export async function chatCompletion(
  client: OpenAI | null,
  model: string,
  messages: { role: 'system'|'user'|'assistant'; content: string }[],
) {
  if (!client) {
    throw new Error('AI client not initialized. Please configure AI_API_KEY.');
  }
  
  return client.chat.completions.create({
    model,
    messages,
  });
}
