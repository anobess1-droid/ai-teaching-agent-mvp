import redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  }
});

client.on('error', (err) => {
  console.error('Redis Client Error', err);
});

client.on('connect', () => {
  console.log('✓ Connected to Redis');
});

await client.connect();

export default client;
