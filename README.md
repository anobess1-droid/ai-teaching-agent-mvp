# AI Teaching Agent MVP

A lightweight MVP that lets a user register, upload a PDF, and ask questions grounded in the uploaded document.

## Features
- User signup and login
- PDF upload
- Text extraction and chunking
- Embeddings for each chunk
- Similarity search over document content
- Grounded answer generation using the uploaded PDF
- Simple web UI

## Stack
- Backend: Node.js + Express
- PDF processor: Python + pypdf
- AI: OpenAI API for embeddings and Q&A
- Storage: local JSON files for MVP

## Structure

```text
ai-teaching-agent-mvp/
├── backend/
│   ├── data/
│   ├── routes/
│   ├── services/
│   ├── uploads/
│   ├── utils/
│   ├── package.json
│   ├── server.js
│   └── ...
├── processor/
│   ├── requirements.txt
│   ├── tasks.py
│   └── ...
├── frontend/
│   └── index.html
├── .env.example
├── docker-compose.yml
├── README.md
├── .gitignore
└── .
```

## Setup

1. Install backend dependencies:

```bash
cd backend
npm install
```

2. Install processor dependencies:

```bash
cd processor
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3. Create local env file:

```bash
cp .env.example .env
```

4. Run backend:

```bash
cd backend
npm run dev
```

5. Open the app in the browser:

```text
http://localhost:3000
```

## Example flow

1. Register a user
2. Log in
3. Upload a PDF
4. Copy the returned `document_id`
5. Ask a question using that document ID

## Sample API

Register:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"secret123"}'
```

Login:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"secret123"}'
```

Upload PDF:

```bash
curl -X POST http://localhost:3000/upload \
  -H 'Authorization: Bearer <token>' \
  -F 'pdf=@/path/to/file.pdf'
```

Ask a question:

```bash
curl -X POST http://localhost:3000/chat \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"document_id":"<doc_id>","question":"What is the main idea of this document?"}'
```

## Notes
- This is an MVP using local JSON storage for simplicity.
- For production, replace this with PostgreSQL and a dedicated vector database.
- If no OpenAI key is set, the app still works in fallback mode with a lightweight mock answer.
