import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: '7d'
  });
}
