# AGENTS.md — AI Service (FastAPI + LangChain)

> ⚠️ **NOT USED IN HACKATHON BUILD**
>
> This file documents the **production-grade** FastAPI AI server architecture
> planned for future development. For the hackathon, all AI logic runs
> inside **Next.js API Routes** using the Gemini API directly
> (see `frontend/AGENTS.md`).
>
> This file is preserved for post-hackathon reference when the project
> needs a dedicated Python AI service.

---

## When to Activate This Server

Migrate AI logic from Next.js API Routes to this FastAPI server when:

1. **PaddleOCR** — Need local GPU-accelerated OCR instead of Gemini Vision
2. **LangGraph agents** — Complex multi-step agentic workflows
3. **Heavy Python libs** — Pandas, scipy for analytics/anomaly detection
4. **Model hosting** — Self-hosted LLMs or fine-tuned models
5. **Concurrent processing** — RabbitMQ workers for batch extraction

---

## Hackathon vs Production Comparison

| Concern | Hackathon (Current) | Production (Future) |
|---|---|---|
| OCR | Gemini Vision API (cloud) | PaddleOCR (GPU, local) |
| Embeddings | Gemini text-embedding-004 | OpenAI text-embedding-3-small |
| LLM reasoning | Gemini 2.5 Flash | Claude 3.5 / GPT-4o via LangGraph |
| Vector DB | Qdrant (same) | Qdrant (same) |
| Framework | Next.js API Route | FastAPI + LangChain |
| Auth | None | Keycloak JWT verification |
| Queue | None (synchronous) | RabbitMQ + Dead Letter Exchange |

---

## Production Architecture (For Later)

```
NestJS Server
    │ HTTP (internal network)
    ▼
FastAPI AI Service (:8000)     ← This server
    ├── /v1/embeddings         — Embed text + store in Qdrant
    ├── /v1/chat               — Conversational compliance chat
    ├── /v1/documents/extract   — PaddleOCR extraction
    └── /v1/ai/verify          — RAG compliance verification
         │
    ┌────┴─────┐
    │  Qdrant  │  (Vector search for law retrieval)
    └──────────┘
```

## Key Production Modules

| Module | Responsibility |
|---|---|
| M3: Extraction | PaddleOCR + LLM correction → structured JSON |
| M5: AI Agent | LangGraph Plan-Execute-Verify loop |
| M7: Intel-Engine | Playwright scraper + law embedding pipeline |

---

## Current Status

- [ ] No code implemented — only this specification file exists
- [ ] Directory: `backend/ai_server/`
- [ ] Will be bootstrapped with `pip install fastapi uvicorn` when needed
- [ ] AI logic currently lives in `frontend/lib/gemini.ts` and `frontend/app/api/documents/[id]/verify/route.ts`
