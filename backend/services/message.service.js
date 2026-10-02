import { query, transaction } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export async function getOrCreateConversation(userId, documentId) {
  let result = await query(
    'SELECT id FROM conversations WHERE user_id = $1 AND document_id = $2',
    [userId, documentId]
  );

  if (result.rows.length > 0) {
    return result.rows[0].id;
  }

  result = await query(
    'INSERT INTO conversations (user_id, document_id) VALUES ($1, $2) RETURNING id',
    [userId, documentId]
  );
  return result.rows[0].id;
}

export async function getConversationMessages(conversationId) {
  const result = await query(
    'SELECT id, role, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
    [conversationId]
  );
  return result.rows;
}

export async function addMessage(conversationId, role, content, sourceChunkIds = []) {
  const result = await query(
    'INSERT INTO messages (id, conversation_id, role, content, source_chunk_ids) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [uuidv4(), conversationId, role, content, sourceChunkIds]
  );
  return result.rows[0];
}
