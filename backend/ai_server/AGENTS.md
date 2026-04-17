# AGENTS.md — AI Server (Express.js + Node.js + TypeScript)

> This server handles all AI logic, OCR, and interactions with the vector database.

---

## Architecture Overview

```
    Main Server (Express.js :4000)
           │
           ▼
┌──────────────────────────────────────────────┐
│         AI Server (Express.js :5000)         │
│                                              │
│  src/                                        │
│    ├── routes/      ← /ai/extract, /ai/verify│
│    ├── controllers/ ← Request handlers       │
│    ├── services/    ← Gemini interactions    │
│    └── qdrant/      ← Vector DB interactions │
└──────────┬─────────────────────────┬─────────┘
           │                         │
           ▼                         ▼
      Gemini API                  Qdrant
      (Cloud API)                (:6333)
```

## Rules

*   **Stack:** Express.js, Node.js, TypeScript.
*   **Responsibilities:**
    *   Initialize and manage the Gemini SDK (`@google/generative-ai`).
    *   Interact with Qdrant vector database via native `fetch`.
    *   Perform OCR via Gemini Vision (`POST /api/ai/extract`).
    *   Execute the Plan-Execute-Verify RAG loop for compliance checks (`POST /api/ai/verify`).
*   **No SQLite Database:** This server does not connect directly to Prisma or SQLite. It receives necessary structured data from the Main Server, performs the AI computation, and returns the result back to the Main Server.
*   **No File Storage:** Depending on implementation, it either receives base64 encoded files from the Main Server or has a shared volume/access to the local `uploads` directory. For simplicity in hackathon, accept base64 or file paths if running locally.

## Environment Variables

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
QDRANT_URL=http://localhost:6333
```
