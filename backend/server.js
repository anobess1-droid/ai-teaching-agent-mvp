import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import chatRoutes from './routes/chat.js';
import { verifyToken } from './utils/jwt.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/auth', authRoutes);

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token is required' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.use('/upload', authenticate, uploadRoutes);
app.use('/chat', authenticate, chatRoutes);

const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'AI Teaching Agent MVP is running' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
