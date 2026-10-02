import { query, transaction } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export async function createDocument(userId, filename) {
  const result = await query(
    'INSERT INTO documents (user_id, filename, status) VALUES ($1, $2, $3) RETURNING *',
    [userId, filename, 'processing']
  );
  return result.rows[0];
}

export async function getDocument(documentId) {
  const result = await query('SELECT * FROM documents WHERE id = $1', [documentId]);
  return result.rows[0] || null;
}

export async function getUserDocuments(userId) {
  const result = await query(
    'SELECT id, filename, status, chunk_count, created_at FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

export async function updateDocumentStatus(documentId, status) {
  const result = await query(
    'UPDATE documents SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, documentId]
  );
  return result.rows[0];
}

export async function updateDocumentChunkCount(documentId, count) {
  const result = await query(
    'UPDATE documents SET chunk_count = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [count, documentId]
  );
  return result.rows[0];
}

export async function saveChunks(documentId, chunks) {
  return transaction(async (client) => {
    const chunkIds = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const result = await client.query(
        'INSERT INTO chunks (id, document_id, chunk_index, text, page_number) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [uuidv4(), documentId, i, chunk.text, chunk.page]
      );
      chunkIds.push(result.rows[0].id);
    }
    
    return chunkIds;
  });
}

export async function getDocumentChunks(documentId) {
  const result = await query(
    'SELECT id, text, page_number FROM chunks WHERE document_id = $1 ORDER BY chunk_index',
    [documentId]
  );
  return result.rows;
}
