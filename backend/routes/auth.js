import express from 'express';
import crypto from 'crypto';

import { readStore, saveUser } from '../data/store.js';
import { signToken } from '../utils/jwt.js';

const router = express.Router();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const store = readStore();
  const exists = store.users.find((user) => user.email === email);

  if (exists) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const user = {
    id: crypto.randomUUID(),
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  saveUser(user);

  const token = signToken({ id: user.id, email: user.email });

  return res.status(201).json({ token, user: { id: user.id, email: user.email } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const store = readStore();
  const user = store.users.find(
    (u) => u.email === email && u.passwordHash === hashPassword(password)
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken({ id: user.id, email: user.email });
  return res.json({ token, user: { id: user.id, email: user.email } });
});

export default router;
