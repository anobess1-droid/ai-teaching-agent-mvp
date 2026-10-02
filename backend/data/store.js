import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
const storePath = path.join(dataDir, 'store.json');
const chunksDir = path.join(dataDir, 'chunks');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(chunksDir)) {
  fs.mkdirSync(chunksDir, { recursive: true });
}

if (!fs.existsSync(storePath)) {
  fs.writeFileSync(
    storePath,
    JSON.stringify({ users: [], documents: [], messages: [] }, null, 2),
    'utf8'
  );
}

export function readStore() {
  const raw = fs.readFileSync(storePath, 'utf8');
  return JSON.parse(raw);
}

export function writeStore(data) {
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
}

export function saveUser(user) {
  const store = readStore();
  store.users.push(user);
  writeStore(store);
}

export function saveDocument(document) {
  const store = readStore();
  store.documents.push(document);
  writeStore(store);
}

export function findDocument(documentId) {
  const store = readStore();
  return store.documents.find((doc) => doc.id === documentId) || null;
}

export function updateDocument(documentId, updates) {
  const store = readStore();
  const index = store.documents.findIndex((doc) => doc.id === documentId);
  if (index === -1) return null;

  store.documents[index] = { ...store.documents[index], ...updates };
  writeStore(store);
  return store.documents[index];
}

export function saveMessage(message) {
  const store = readStore();
  store.messages.push(message);
  writeStore(store);
}

export function readDocumentChunks(documentId) {
  const filePath = path.join(chunksDir, `${documentId}.json`);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

export function writeDocumentChunks(documentId, chunks) {
  const filePath = path.join(chunksDir, `${documentId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(chunks, null, 2), 'utf8');
}
