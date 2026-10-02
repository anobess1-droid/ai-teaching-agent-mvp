import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function buildDocumentIndex(documentId, chunks) {
  const storagePath = path.join(__dirname, '../data/chunks', `${documentId}.json`);
  fs.mkdirSync(path.dirname(storagePath), { recursive: true });
  fs.writeFileSync(storagePath, JSON.stringify(chunks, null, 2));
}
