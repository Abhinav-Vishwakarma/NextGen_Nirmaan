# AGENTS.md — NestJS Main Server

> ⚠️ **NOT USED IN HACKATHON BUILD**
>
> This file documents the **production-grade** NestJS server architecture
> planned for future development. For the hackathon, all backend logic
> runs inside **Next.js API Routes** (see `frontend/AGENTS.md`).
>
> This file is preserved for post-hackathon reference when the project
> scales to a dedicated backend.

---

## When to Activate This Server

Migrate from Next.js API Routes to this NestJS server when:

1. **Auth is needed** — Logto/Keycloak RBAC with 5 roles
2. **Scale** — Processing 1000+ invoices/month requires dedicated workers
3. **Queue system** — RabbitMQ for async OCR/extraction jobs
4. **Multi-DB** — PostgreSQL for relational data, MongoDB for documents
5. **Microservices** — Separate OCR, Filing, and Notification services

---

## Production Architecture (For Later)

```
Frontend (Next.js)
    │
    ▼
NestJS Server (:3001)          ← This server
    ├── Auth (Logto JWT Guard)
    ├── CRUD APIs
    ├── AI Client (→ FastAPI)
    ├── PostgreSQL (TypeORM)
    ├── MongoDB (Mongoose)
    └── Redis (Cache + Pub/Sub)
```

## Key Production Modules

| Module | Responsibility |
|---|---|
| M1: Identity | RBAC, SSO, Org management (Logto) |
| M2: Vault | S3 file storage, metadata in Mongo |
| M4: Analytics | Aggregation pipelines, Redis cache |
| M6: Reconciler | Books vs Government portal diff |
| M7: Notifier | Socket.io real-time push |

---

## Current Status

- [ ] No code implemented — only this specification file exists
- [ ] Directory: `backend/server/`
- [ ] Will be bootstrapped with `npx @nestjs/cli new` when needed
