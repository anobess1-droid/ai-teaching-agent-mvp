import dotenv from 'dotenv';

dotenv.config();

const MODEL = 'text-embedding-3-small';
const DIMENSION = 1536;
const BATCH_SIZE = 100;

export async function embedText(text) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('⚠ No OPENAI_API_KEY provided, returning mock embeddings');
    return Array(DIMENSION).fill(0.01);
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      input: text,
      model: MODEL
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Embedding request failed: ${errText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

export async function embedBatch(texts) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return texts.map(() => Array(DIMENSION).fill(0.01));
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      input: texts,
      model: MODEL
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Embedding batch request failed: ${errText}`);
  }

  const data = await response.json();
  return data.data.sort((a, b) => a.index - b.index).map(item => item.embedding);
}

export function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const magA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const magB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));

  if (!magA || !magB) return 0;
  return dot / (magA * magB);
}
