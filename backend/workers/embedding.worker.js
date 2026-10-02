import { embeddingQueue, answerQueue } from '../config/queue.js';
import { embedBatch } from '../services/embedding.service.js';
import { query } from '../config/database.js';
import { updateDocumentStatus } from '../services/document.service.js';

export async function setupEmbeddingWorker() {
  embeddingQueue.process('embed-chunks', 10, async (job) => {
    const { documentId, chunks, chunkIds } = job.data;

    try {
      console.log(`🔍 Embedding chunks for document ${documentId}`);
      const texts = chunks.map(c => c.text);
      const embeddings = await embedBatch(texts);

      // Store embeddings in database
      for (let i = 0; i < chunkIds.length; i++) {
        await query(
          'UPDATE chunks SET embedding = $1 WHERE id = $2',
          [JSON.stringify(embeddings[i]), chunkIds[i]]
        );
      }

      console.log(`✓ Embedded ${chunkIds.length} chunks`);

      // Check if all chunks are embedded
      const result = await query(
        'SELECT COUNT(*) as total, COUNT(embedding) as embedded FROM chunks WHERE document_id = $1',
        [documentId]
      );

      const { total, embedded } = result.rows[0];
      if (total === embedded) {
        await updateDocumentStatus(documentId, 'ready');
        console.log(`✓ Document ${documentId} is ready for querying`);
      }

      return { success: true, embeddedCount: chunkIds.length };
    } catch (error) {
      console.error(`❌ Embedding error for ${documentId}:`, error.message);
      throw error;
    }
  });
}
