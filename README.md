# AI Teaching Agent MVP

A lightweight MVP for an AI teaching assistant that lets a user upload a PDF, extract its content, and ask questions grounded in the uploaded material.

## Features
- User signup/login
- PDF upload
- PDF text extraction and chunking
- Question answering grounded in uploaded PDF text
- Minimal web UI
- Docker support for local development

## Tech stack
- Backend: Node.js + Express
- PDF worker: Python + pypdf
- Frontend: plain HTML + vanilla JS
- Storage: local JSON store for MVP
- AI: OpenAI API for embeddings and chat

## Project structure

```text
ai-teaching-agent-mvp/
├── backend/
│   ├── config/
│   ├── data/
│   ├── routes/
│   ├── services/
│   ├── uploads/
│   ├── utils/
│   ├── package.json
│   ├── server.js
│   └── app.js
├── processor/
│   ├── pdf_handler.py
│   ├── requirements.txt
│   └── tasks.py
├── frontend/
│   ├── index.html
│   └── app.js
├── docker-compose.yml
├── .env.example
├── README.md
└── .gitignore
```

## Setup

1. Copy environment file:

```bash
cp .env.example .env
```

2. Fill in API keys:

```dotenv
OPENAI_API_KEY=your_key_here
JWT_SECRET=change_me
PORT=3000
```

3. Install backend dependencies:

```bash
cd backend
npm install
```

4. Install Python worker dependencies:

```bash
cd processor
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

5. Start the app:

```bash
cd backend
npm run dev
```

The app serves the frontend at http://localhost:3000.

## API

### Register user
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
```

### Login user
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
```

### Upload PDF
```bash
curl -X POST http://localhost:3000/upload \
  -H "Authorization: Bearer <token>" \
  -F "pdf=@/path/to/file.pdf"
```

### Ask a question
```bash
curl -X POST http://localhost:3000/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"document_id":"<doc_id>","question":"What is this PDF about?"}'
```

## Notes for MVP
- This version uses local JSON storage instead of a database for simplicity.
- For production, replace the JSON store with PostgreSQL or MongoDB.
- The worker uses OpenAI embeddings if configured; otherwise it still extracts text and saves chunks.

## License
MIT
