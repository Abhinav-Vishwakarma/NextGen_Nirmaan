# AGENTS.md — Frontend (Next.js App Router)

> This is the UI layer only. The backend logic runs in separate Express.js microservices.

---

## Architecture Overview

```
┌──────────────────────────────────────────────┐
│           Next.js 16 (App Router)            │
│  app/                                        │
│    └── (protected)/ ← UI pages               │
│                                              │
│  components/                                 │
│    ├── ui/          ← Basic primitives       │
│    └── features/    ← Domain-specific UI     │
└──────────┬───────────────────────────────────┘
           │ (HTTP Requests)
           ▼
    Main API Server (Express.js :4000)
```

## Rules

*   **No Database Logic:** The frontend does not connect to Prisma, SQLite, or Qdrant directly.
*   **No AI Logic:** The frontend does not initialize or call the Gemini SDK directly.
*   **API Calling:** All data fetching and mutations happen via HTTP requests (`fetch` or Axios/RTK Query if configured) to the Main API Server (e.g., `http://localhost:4000/api/...`).
*   **No API Routes:** Do not use `app/api/` routes in Next.js for backend logic, as we have a dedicated Express backend. Next.js is strictly for rendering the React interface.
*   **Styling:** Use Tailwind CSS with dark theme as default. Use glassmorphism and subtle animations.

## Environment Variables

```env
NEXT_PUBLIC_MAIN_API_URL=http://localhost:4000
```