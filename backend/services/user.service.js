import { query } from '../config/database.js';
import crypto from 'crypto';

export async function getUserById(userId) {
  const result = await query('SELECT id, email, created_at FROM users WHERE id = $1', [userId]);
  return result.rows[0] || null;
}

export async function getUserByEmail(email) {
  const result = await query('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function createUser(email, passwordHash) {
  const result = await query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
    [email, passwordHash]
  );
  return result.rows[0];
}

export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}
