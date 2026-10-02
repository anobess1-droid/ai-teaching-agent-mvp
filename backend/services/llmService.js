import dotenv from 'dotenv';

dotenv.config();

export async function generateAnswer(question, context) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return `I can only answer from the uploaded PDF. Based on the provided material, the topic in question appears to be: ${context.slice(0, 250)}...`;
  }

  const prompt = `You are a helpful teaching assistant. Use only the provided context and answer clearly. If the answer cannot be found, say so.\n\nContext:\n${context}\n\nQuestion:\n${question}\n\nAnswer:`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI request failed: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No answer returned';
}
