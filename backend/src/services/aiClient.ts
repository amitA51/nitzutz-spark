import OpenAI from 'openai';

export function createAIClient() {
  const apiKey = process.env.AI_API_KEY || process.env.HF_TOKEN;
  const baseURL = process.env.AI_BASE_URL || 'https://router.huggingface.co/v1';

  if (!apiKey) {
    console.warn('[AI] Missing API key. Set AI_API_KEY or HF_TOKEN in environment variables.');
    return null;
  }

  return new OpenAI({ apiKey, baseURL });
}

export function isAIEnabled(): boolean {
  return !!(process.env.AI_API_KEY || process.env.HF_TOKEN);
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
