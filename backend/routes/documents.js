import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pdfProcessQueue } from '../config/queue.js';
import { createDocument, getUserDocuments } from '../services/document.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const router = express.Router();
const upload = multer({ dest: uploadsDir });

router.get('/', async (req, res) => {
  try {
    const documents = await getUserDocuments(req.user.id);
    return res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.post('/upload', upload.single('pdf'), async (req, res) => {
  const file = req.file;
  const userId = req.user.id;

  if (!file) {
    return res.status(400).json({ error: 'PDF file is required' });
  }

  try {
    const document = await createDocument(userId, file.originalname);
    
    // Queue PDF processing job
    const job = await pdfProcessQueue.add(
      'process-pdf',
      {
        documentId: document.id,
        filePath: file.path
      },
      { attempts: 3, backoff: 'exponential' }
    );

    console.log(`📤 Queued PDF processing job ${job.id} for document ${document.id}`);

    return res.status(201).json({
      document_id: document.id,
      filename: file.originalname,
      status: 'processing',
      job_id: job.id
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
