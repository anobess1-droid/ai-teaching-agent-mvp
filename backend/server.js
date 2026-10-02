import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import documentsRoutes from './routes/documents.js';
import chatRoutes from './routes/chat.js';
import { verifyToken } from './middleware/auth.js';
import { setupPdfWorker } from './workers/pdf-processor.worker.js';
import { setupEmbeddingWorker } from './workers/embedding.worker.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/auth', authRoutes);

// Protected routes
app.use('/documents', verifyToken, documentsRoutes);
app.use('/chat', verifyToken, chatRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'AI Teaching Agent is running' });
});

// Static frontend
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Setup workers
async function startServer() {
  try {
    console.log('🚀 Starting AI Teaching Agent...');
    
    // Setup background workers
    await setupPdfWorker();
    await setupEmbeddingWorker();
    console.log('✓ Workers initialized');
    
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
