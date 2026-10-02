import express from 'express';
import crypto from 'crypto';

import { findDocument, readDocumentChunks, saveMessage } from '../data/store.js';
import { embedText } from '../services/vectorStore.js';
import { generateAnswer } from '../services/llmService.js';

const router = express.Router();

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const magA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const magB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));

  if (!magA || !magB) return 0;
  return dot / (magA * magB);
}

router.post('/', async (req, res) => {
  const { document_id, question } = req.body;
  const userId = req.user?.id;

  if (!document_id || !question) {
    return res.status(400).json({ error: 'document_id and question are required' });
  }

  const document = findDocument(document_id);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const chunks = readDocumentChunks(document_id);
  if (!chunks || chunks.length === 0) {
    return res.status(404).json({ error: 'No indexed content found for this document yet' });
  }

  const queryEmbedding = await embedText(question);

  const rankedChunks = chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding || Array(1536).fill(0.01))
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (rankedChunks.length === 0) {
    return res.status(404).json({ error: 'No relevant content found' });
  }

  const context = rankedChunks
    .map((chunk) => `Page ${chunk.page}: ${chunk.text}`)
    .join('\n\n');

  const answer = await generateAnswer(question, context);

  saveMessage({
    id: crypto.randomUUID(),
    userId,
    documentId: document_id,
    role: 'user',
    content: question,
    createdAt: new Date().toISOString()
  });

  saveMessage({
    id: crypto.randomUUID(),
    userId,
    documentId: document_id,
    role: 'assistant',
    content: answer,
    createdAt: new Date().toISOString()
  });

  return res.json({
    answer,
    sources: rankedChunks.map((chunk) => ({
      page: chunk.page,
      excerpt: chunk.text.slice(0, 220)
    }))
  });
});

export default router;
