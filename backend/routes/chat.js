import express from 'express';
import { getDocument, getDocumentChunks } from '../services/document.service.js';
import { getOrCreateConversation, getConversationMessages, addMessage } from '../services/message.service.js';
import { embedText, cosineSimilarity } from '../services/embedding.service.js';
import { generateAnswer } from '../services/llm.service.js';
import { query } from '../config/database.js';

const router = express.Router();

router.post('/ask', async (req, res) => {
  const { document_id, question } = req.body;
  const userId = req.user.id;

  if (!document_id || !question) {
    return res.status(400).json({ error: 'document_id and question are required' });
  }

  try {
    // Verify document ownership
    const document = await getDocument(document_id);
    if (!document || document.user_id !== userId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.status !== 'ready') {
      return res.status(400).json({ error: `Document is ${document.status}. Please wait until it's ready.` });
    }

    // Get or create conversation
    const conversationId = await getOrCreateConversation(userId, document_id);

    // Get document chunks with embeddings
    const chunks = await getDocumentChunks(document_id);
    if (!chunks.length) {
      return res.status(404).json({ error: 'No content available in this document' });
    }

    // Embed the question
    const questionEmbedding = await embedText(question);

    // Get chunks with embeddings and score them
    const chunksWithScores = await Promise.all(
      chunks.map(async (chunk) => {
        const result = await query(
          'SELECT embedding FROM chunks WHERE id = $1',
          [chunk.id]
        );
        const embedding = result.rows[0]?.embedding ? JSON.parse(result.rows[0].embedding) : null;
        return {
          ...chunk,
          score: embedding ? cosineSimilarity(questionEmbedding, embedding) : 0
        };
      })
    );

    // Get top 5 relevant chunks
    const topChunks = chunksWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (!topChunks.length || topChunks[0].score < 0.1) {
      return res.status(404).json({ error: 'No relevant content found' });
    }

    // Generate answer
    const context = topChunks
      .map((chunk) => `Page ${chunk.page_number}: ${chunk.text}`)
      .join('\n\n');
    const answer = await generateAnswer(question, context);

    // Save messages
    await addMessage(conversationId, 'user', question);
    await addMessage(conversationId, 'assistant', answer, topChunks.map(c => c.id));

    return res.json({
      answer,
      sources: topChunks.map((chunk) => ({
        page: chunk.page_number,
        excerpt: chunk.text.slice(0, 220)
      }))
    });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Failed to generate answer' });
  }
});

router.get('/conversations/:document_id', async (req, res) => {
  const { document_id } = req.params;
  const userId = req.user.id;

  try {
    const document = await getDocument(document_id);
    if (!document || document.user_id !== userId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const conversationId = await getOrCreateConversation(userId, document_id);
    const messages = await getConversationMessages(conversationId);

    return res.json({ conversation_id: conversationId, messages });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

export default router;
