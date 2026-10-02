import dotenv from 'dotenv';

dotenv.config();

export async function embedText(text) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Array(1536).fill(0.01);
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small'
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Embedding request failed: ${errText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}
