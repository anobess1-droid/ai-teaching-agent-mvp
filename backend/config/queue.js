import Bull from 'bull';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined
};

// Create job queues
export const pdfProcessQueue = new Bull('pdf-process', redisConfig);
export const embeddingQueue = new Bull('embeddings', redisConfig);
export const answerQueue = new Bull('answer-generation', redisConfig);

// Queue event handlers
pdfProcessQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

embeddingQueue.on('failed', (job, err) => {
  console.error(`Embedding job ${job.id} failed:`, err.message);
});

answerQueue.on('failed', (job, err) => {
  console.error(`Answer job ${job.id} failed:`, err.message);
});

export default {
  pdfProcessQueue,
  embeddingQueue,
  answerQueue
};
