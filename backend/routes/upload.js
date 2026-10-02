import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';

import { saveDocument, updateDocument } from '../data/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const router = express.Router();
const upload = multer({ dest: uploadsDir });

router.post('/', upload.single('pdf'), async (req, res) => {
  const file = req.file;
  const userId = req.user?.id;

  if (!file) {
    return res.status(400).json({ error: 'PDF file is required' });
  }

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const docId = uuidv4();
  const targetPath = path.join(uploadsDir, `${docId}.pdf`);
  fs.renameSync(file.path, targetPath);

  const document = {
    id: docId,
    userId,
    filename: file.originalname,
    filePath: targetPath,
    status: 'processing',
    createdAt: new Date().toISOString()
  };

  saveDocument(document);

  const pythonScript = path.join(__dirname, '../../processor/tasks.py');
  const child = spawn('python3', [pythonScript, '--document-id', docId, '--file', targetPath], {
    env: {
      ...process.env,
      BACKEND_ROOT: path.join(__dirname, '..')
    }
  });

  child.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  child.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  child.on('exit', (code) => {
    if (code === 0) {
      updateDocument(docId, { status: 'ready' });
    } else {
      updateDocument(docId, { status: 'failed' });
    }
  });

  return res.status(201).json({
    document_id: docId,
    filename: file.originalname,
    status: 'processing'
  });
});

export default router;
