import { pdfProcessQueue, embeddingQueue } from '../config/queue.js';
import { PdfReader } from 'pdfreader';
import fs from 'fs';
import { PdfDocument } from 'pdfjs-dist';
import { updateDocumentStatus, saveChunks } from '../services/document.service.js';

const CHUNK_SIZE = 700;

export async function setupPdfWorker() {
  pdfProcessQueue.process('process-pdf', 5, async (job) => {
    const { documentId, filePath } = job.data;

    try {
      console.log(`📄 Processing PDF: ${documentId}`);
      job.progress(10);

      // Extract text chunks
      const chunks = await extractPdfChunks(filePath);
      if (!chunks.length) {
        throw new Error('No text extracted from PDF');
      }

      job.progress(30);

      // Save chunks to database
      const chunkIds = await saveChunks(documentId, chunks);
      console.log(`✓ Saved ${chunkIds.length} chunks for document ${documentId}`);

      job.progress(50);

      // Queue embedding jobs
      for (let i = 0; i < chunks.length; i += 10) {
        const batchChunks = chunks.slice(i, i + 10);
        const batchChunkIds = chunkIds.slice(i, i + 10);
        
        await embeddingQueue.add(
          'embed-chunks',
          {
            documentId,
            chunks: batchChunks,
            chunkIds: batchChunkIds
          },
          { attempts: 3, backoff: 'exponential' }
        );
      }

      job.progress(80);
      await updateDocumentStatus(documentId, 'indexing');

      return { success: true, chunkCount: chunks.length };
    } catch (error) {
      console.error(`❌ Error processing PDF ${documentId}:`, error.message);
      await updateDocumentStatus(documentId, 'failed');
      throw error;
    }
  });
}

async function extractPdfChunks(filePath) {
  const chunks = [];
  const text = await extractPdfText(filePath);
  const pages = text.split('\n\n');

  for (let pageNum = 0; pageNum < pages.length; pageNum++) {
    const pageText = pages[pageNum];
    const sentences = pageText.split('. ');
    let current = '';

    for (const sentence of sentences) {
      const candidate = current + sentence + '. ';
      if (candidate.length <= CHUNK_SIZE) {
        current = candidate;
      } else {
        if (current.trim()) {
          chunks.push({
            text: current.trim(),
            page: pageNum + 1
          });
        }
        current = sentence + '. ';
      }
    }

    if (current.trim()) {
      chunks.push({
        text: current.trim(),
        page: pageNum + 1
      });
    }
  }

  return chunks;
}

async function extractPdfText(filePath) {
  // Simplified: in production, use a proper PDF library like pdfjs-dist
  // This is a placeholder that assumes you have pypdf installed
  const { spawn } = require('child_process');
  
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [
      '-c',
      `from pypdf import PdfReader; reader = PdfReader('${filePath}'); print(''.join(p.extract_text() or '' for p in reader.pages))`
    ]);

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error('PDF extraction failed'));
      }
    });
  });
}
