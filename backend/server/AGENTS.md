# AGENTS.md — Main Server (Express.js + Node.js + TypeScript)

> This is the core transactional backend for the hackathon.

---

## Architecture Overview

```
    Frontend (Next.js :3000)
           │
           ▼
┌──────────────────────────────────────────────┐
│       Main Server (Express.js :4000)         │
│                                              │
│  src/                                        │
│    ├── routes/      ← Express API routes     │
│    ├── controllers/ ← Request handlers       │
│    ├── services/    ← Business logic         │
│    └── prisma/      ← SQLite database access │
└──────────┬─────────────────────────┬─────────┘
           │                         │
           ▼                         ▼
      SQLite DB                  AI Server
      (dev.db)               (Express.js :5000)
```

## Rules

*   **Stack:** Express.js, TypeScript, Node.js.
*   **Database:** Prisma ORM connected to SQLite (`dev.db`). Models include `Document`, `Alert`, `LawUpdate`.
*   **Responsibilities:**
    *   Serve as the main entry point for the frontend.
    *   Handle file uploads via `multer` (store in local `uploads/` dir).
    *   Perform CRUD operations on documents, alerts, and law updates.
    *   Serve statistics for the dashboard.
*   **AI Integration:** The Main Server does *not* run Gemini SDK directly. It makes HTTP calls to the AI Server for OCR and RAG compliance checks.
    *   `POST /api/documents/upload` -> Save file, proxy call to AI Server `POST /api/ai/extract`.
    *   `POST /api/documents/:id/verify` -> Proxy call to AI Server `POST /api/ai/verify`.

## Environment Variables

```env
PORT=4000
DATABASE_URL="file:./prisma/dev.db"
AI_SERVER_URL=http://localhost:5000
```
