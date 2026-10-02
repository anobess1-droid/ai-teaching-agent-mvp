import dotenv from 'dotenv';

dotenv.config();

export async function generateAnswer(question, context) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return `Based on the provided material, I can see the context is about: ${context.slice(0, 250)}...`;
  }

  const prompt = `You are a helpful teaching assistant.
Use ONLY the provided context to answer the question.
If the answer cannot be found in the context, say: "I don't have this information in the provided material."

Context:
${context}

Question:
${question}

Answer:`;

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
    throw new Error(`LLM request failed: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No answer generated';
}
