import os
import sys
import json
from pathlib import Path

from pypdf import PdfReader
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))


def extract_text_chunks(pdf_path: str, chunk_size: int = 700):
    reader = PdfReader(pdf_path)
    chunks = []

    for page_num, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ''
        if not text:
            continue

        sentences = text.split('. ')
        current = ''

        for sentence in sentences:
            candidate = current + sentence + '. '
            if len(candidate) <= chunk_size:
                current = candidate
            else:
                if current.strip():
                    chunks.append({
                        'page': page_num,
                        'text': current.strip()
                    })
                current = sentence + '. '

        if current.strip():
            chunks.append({
                'page': page_num,
                'text': current.strip()
            })

    return chunks


def embed_text(text: str):
    if not os.getenv('OPENAI_API_KEY'):
        return [0.01] * 1536

    response = client.embeddings.create(
        input=text,
        model='text-embedding-3-small'
    )
    return response.data[0].embedding


def main():
    document_id = sys.argv[sys.argv.index('--document-id') + 1]
    file_path = sys.argv[sys.argv.index('--file') + 1]

    chunks = extract_text_chunks(file_path)
    embedded_chunks = []

    for chunk in chunks:
        embedding = embed_text(chunk['text'])
        embedded_chunks.append({
            **chunk,
            'embedding': embedding
        })

    backend_root = os.getenv('BACKEND_ROOT', '.')
    target_dir = Path(backend_root) / 'data' / 'chunks'
    target_dir.mkdir(parents=True, exist_ok=True)
    output_file = target_dir / f'{document_id}.json'
    output_file.write_text(json.dumps(embedded_chunks, indent=2), encoding='utf-8')

    print(json.dumps({
        'status': 'ready',
        'document_id': document_id,
        'chunks': len(embedded_chunks)
    }))


if __name__ == '__main__':
    main()
