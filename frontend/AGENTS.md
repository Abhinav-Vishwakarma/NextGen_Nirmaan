# AGENTS.md — Frontend + Full-Stack (Next.js App Router + API Routes)

> This is the **primary codebase**. The entire application — UI, API, database, AI — lives here.
> No separate NestJS or FastAPI server. Next.js API Routes serve as the backend.

---

## Architecture Overview

```
┌──────────────────────────────────────────────┐
│           Next.js 16 (App Router)            │
│                                              │
│  app/                                        │
│    ├── (protected)/ ← UI pages               │
│    └── api/         ← REST API backend       │
│                                              │
│  lib/                                        │
│    ├── prisma.ts    ← SQLite database        │
│    ├── gemini.ts    ← Gemini AI client       │
│    └── qdrant.ts    ← Vector DB client       │
└──────────┬───────────────────┬───────────────┘
           │                   │
     ┌─────▼─────┐     ┌──────▼──────┐
     │  SQLite    │     │   Qdrant    │
     │  (Prisma)  │     │ (Docker)    │
     │  dev.db    │     │ :6333       │
     └───────────┘     └─────────────┘
           │
    ┌──────▼──────┐
    │  Gemini API │
    │  (Cloud)    │
    │  Vision+LLM │
    └─────────────┘
```

---

## Folder Structure

```
frontend/
├── app/
│   ├── layout.tsx                    # Root layout — dark theme, font setup
│   ├── page.tsx                      # Landing redirect → /dashboard
│   ├── globals.css                   # Dark theme, glassmorphism, animations
│   │
│   ├── api/                          # ── REST API (backend logic) ──
│   │   ├── documents/
│   │   │   ├── route.ts              # GET   — list all documents
│   │   │   ├── upload/
│   │   │   │   └── route.ts          # POST  — upload file to local fs
│   │   │   └── [id]/
│   │   │       ├── route.ts          # GET   — single document detail
│   │   │       ├── extract/
│   │   │       │   └── route.ts      # POST  — trigger Gemini Vision OCR
│   │   │       └── verify/
│   │   │           └── route.ts      # POST  — trigger RAG compliance check
│   │   ├── dashboard/
│   │   │   └── route.ts              # GET   — dashboard stats + trends
│   │   ├── alerts/
│   │   │   ├── route.ts              # GET   — list alerts
│   │   │   └── [id]/
│   │   │       └── route.ts          # PATCH — mark alert as read
│   │   ├── law-intel/
│   │   │   ├── route.ts              # GET   — list law updates
│   │   │   └── [id]/
│   │   │       └── analyze/
│   │   │           └── route.ts      # POST  — AI impact analysis
│   │   └── files/
│   │       └── [filename]/
│   │           └── route.ts          # GET   — serve uploaded files
│   │
│   └── (protected)/                  # ── UI Pages ──
│       ├── layout.tsx                # App shell: sidebar + header
│       ├── dashboard/
│       │   └── page.tsx              # Command center
│       ├── upload/
│       │   └── page.tsx              # File upload + OCR extraction
│       ├── documents/
│       │   ├── page.tsx              # Document list with status badges
│       │   └── [id]/
│       │       └── page.tsx          # Document detail + compliance scorecard
│       ├── alerts/
│       │   └── page.tsx              # Alert list with filters
│       └── law-intel/
│           └── page.tsx              # Law intelligence feed
│
├── components/
│   ├── ui/                           # Dumb, stateless, reusable primitives
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Table/
│   │   └── index.ts                  # Barrel export
│   │
│   └── features/                     # Smart, domain-specific components
│       ├── layout/
│       │   ├── Sidebar.tsx           # Dark sidebar with nav items
│       │   └── Header.tsx            # Top bar with breadcrumbs
│       ├── dashboard/
│       │   ├── StatCard.tsx          # Animated stat card
│       │   ├── ComplianceTrend.tsx   # Recharts trend chart
│       │   ├── AlertPanel.tsx        # Recent alerts sidebar
│       │   └── RecentDocsTable.tsx   # Last 5 documents
│       ├── documents/
│       │   ├── UploadZone.tsx        # Drag-and-drop dropzone
│       │   ├── DocumentTable.tsx     # Full document list table
│       │   ├── ExtractionResult.tsx  # OCR result display card
│       │   ├── ComplianceScorecard.tsx # Score gauge + check steps
│       │   └── ComplianceGauge.tsx   # Circular SVG score gauge
│       └── law-intel/
│           └── LawUpdateCard.tsx     # Law card with impact button
│
├── hooks/
│   ├── useCountUp.ts                 # Animated count-up for stats
│   └── index.ts
│
├── lib/
│   ├── prisma.ts                     # Prisma client singleton
│   ├── gemini.ts                     # Gemini AI client + embedText()
│   ├── qdrant.ts                     # Qdrant REST client (search, upsert)
│   └── utils.ts                      # cn() helper, formatDate, etc.
│
├── prisma/
│   ├── schema.prisma                 # Document, Alert, LawUpdate models
│   └── dev.db                        # SQLite database file (gitignored)
│
├── scripts/
│   ├── seed-laws.ts                  # Embed law texts → Qdrant + SQLite
│   ├── seed-alerts.ts                # Create dummy compliance alerts
│   └── seed-law-updates.ts           # Populate LawUpdate table
│
├── data/
│   └── laws.json                     # 15-20 Indian tax/labor law snippets
│
├── uploads/                          # Uploaded invoice files (gitignored)
│
├── types/
│   └── index.ts                      # Shared TypeScript types
│
├── .env.local                        # GEMINI_API_KEY, QDRANT_URL
├── .gitignore
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Rules

### General Architecture

- **This is a monolith.** UI and API live in the same Next.js project.
- **No separate backend servers.** No NestJS. No FastAPI. API routes handle everything.
- **No auth for hackathon.** No Logto, no Keycloak, no session management.
- **SQLite only.** No PostgreSQL, no MongoDB, no Redis. One `.db` file.
- **Local file storage.** Files saved to `./uploads/`. No S3, no MinIO.
- **Gemini API for everything.** OCR (vision), embeddings, compliance reasoning.

### API Routes (Backend)

- All API routes live under `app/api/`.
- Every route handler is an `async` function.
- Use `NextRequest` / `NextResponse` from `next/server`.
- Always wrap in try/catch. Return proper HTTP status codes.
- JSON responses follow this shape:
  ```typescript
  // Success
  { data: { ... } }
  // or just the data object directly

  // Error
  { error: "Human-readable error message" }
  ```

### Database (Prisma + SQLite)

- **Three models:** `Document`, `Alert`, `LawUpdate`. Schema is in `prisma/schema.prisma`.
- Import Prisma client from `@/lib/prisma` (singleton pattern for Next.js).
- Store complex nested data as **JSON strings** (`JSON.stringify` / `JSON.parse`).
- SQLite has no native JSON type — use `String` for JSON fields.
- Always use `@default(uuid())` for IDs.
- Run `npx prisma migrate dev` after any schema change.

### AI (Gemini API)

- All Gemini interactions go through `@/lib/gemini.ts`.
- **Vision OCR:** `geminiPro.generateContent([prompt, { inlineData: { mimeType, data } }])`
- **Text Embeddings:** `embedText(text)` → returns `number[]` (768 dimensions)
- **Compliance Reasoning:** `geminiPro.generateContent(structuredPrompt)` → JSON response
- Always strip markdown fences from Gemini JSON responses:
  ```typescript
  const json = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  ```
- Handle rate limits: catch errors and return 429 to client.

### Vector Search (Qdrant)

- Use raw `fetch()` calls to Qdrant REST API — no SDK needed.
- Client in `@/lib/qdrant.ts` with `ensureCollection()`, `upsertPoints()`, `searchSimilar()`.
- Collection: `regulatory_library`, 768 dimensions (Gemini embedding size), Cosine distance.
- Every vector point payload must include: `title`, `section`, `category`, `text`.
- Search always returns top 5.

### Components

```
components/ui/        ← Zero API calls. Props only. Fully typed. Reusable.
components/features/  ← May call APIs. Domain-specific. Page-scoped.
```

- One component per file. File name matches component name.
- Use `"use client"` only when needed (hooks, event handlers, browser APIs).
- Pages under `app/(protected)/` are client components by default (they need interactivity).

### Styling

- **Tailwind CSS** only. No inline styles except for truly dynamic values.
- Use `cn()` from `lib/utils.ts` (clsx + tailwind-merge) for conditional classes.
- **Dark theme by default.** Use CSS custom properties defined in `globals.css`.
- Use glassmorphism (`glass-card` class) for cards.
- Use `stagger-children` for animated list entries.
- Status badges: `badge-green`, `badge-red`, `badge-amber`, `badge-blue`, `badge-gray`.

### TypeScript

- `"strict": true` enforced.
- Use `type` for object shapes. `interface` only when extending.
- Path aliases: `@/` maps to project root.

---

## Data Flow — Key Workflows

### 1. Invoice Upload + OCR

```
Client: POST /api/documents/upload (FormData with file)
Server: Save file to ./uploads/ → Create Document (status: UPLOADED) → Return { id }
Client: POST /api/documents/{id}/extract
Server: Read file → base64 → Gemini Vision → Parse JSON → Save extractedData → status: EXTRACTED
Client: Display extracted data side-by-side with original file
```

### 2. RAG Compliance Check

```
Client: POST /api/documents/{id}/verify
Server:
  1. Fetch extractedData from DB
  2. Build text summary of invoice
  3. embedText(summary) → 768-dim vector
  4. searchSimilar(vector, 5) → top 5 law sections from Qdrant
  5. Build prompt: invoice + retrieved laws
  6. geminiPro.generateContent(prompt) → compliance report JSON
  7. Save complianceScore + complianceReport to DB
  8. If score < 85 → Create Alert (type: FLAGGED_DOC)
  9. Return compliance report
Client: Display ComplianceScorecard with gauge + step-by-step checks
```

### 3. Dashboard Load

```
Client: GET /api/dashboard
Server:
  - Count documents by status (Prisma aggregate)
  - Calculate average compliance score
  - Fetch 5 recent alerts
  - Fetch 5 recent documents
  - Merge real data with dummy trend history
Client: Render stat cards, trend chart, alert panel, recent docs table
```

---

## Environment Variables

```env
# .env.local (gitignored)
GEMINI_API_KEY=your_gemini_api_key_here
QDRANT_URL=http://localhost:6333
```

---

## Scripts

```bash
# Initial setup
npm install
npx prisma migrate dev --name init

# Start Qdrant
docker compose -f ../backend/docker-compose.yml up -d

# Seed data (run once)
npx tsx scripts/seed-laws.ts           # Embed laws → Qdrant
npx tsx scripts/seed-law-updates.ts    # Laws → SQLite
npx tsx scripts/seed-alerts.ts         # Dummy alerts → SQLite

# Dev server
npm run dev
```

---

## What Agents Must NEVER Do

- ❌ Create a separate backend server (NestJS, FastAPI, Express)
- ❌ Add authentication (Logto, Keycloak, NextAuth) during hackathon
- ❌ Use PostgreSQL, MongoDB, or Redis — SQLite only
- ❌ Use S3 or external file storage — local `./uploads/` only
- ❌ Install `@reduxjs/toolkit` or `react-redux` — not needed
- ❌ Use `useEffect + fetch` patterns without loading/error states
- ❌ Call Qdrant or Gemini directly from client components — only via API routes
- ❌ Hardcode API keys in source files — use `.env.local`
- ❌ Store raw binary data in SQLite — store file path, read file from disk
- ❌ Skip error handling on Gemini API calls