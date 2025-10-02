import OpenAI from 'openai';

export function createAIClient() {
  const apiKey = process.env.AI_API_KEY || process.env.HF_TOKEN;
  const baseURL = process.env.AI_BASE_URL || 'https://router.huggingface.co/v1';

  if (!apiKey) {
    console.warn('[AI] Missing API key. Set AI_API_KEY or HF_TOKEN in environment variables.');
  }

  return new OpenAI({ apiKey, baseURL });
}

export async function chatCompletion(
  client: OpenAI,
  model: string,
  messages: { role: 'system'|'user'|'assistant'; content: string }[],
) {
  return client.chat.completions.create({
    model,
    messages,
  });
}
