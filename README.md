# NextGen Nirmaan: AI Compliance Platform

A microservices-based AI platform for Indian GST compliance, OCR extraction, and RAG-driven legal verification.

## 🏗️ Architecture Overview

- **Frontend**: Next.js (App Router) - UI Layer
- **Main Server**: Express.js + Prisma (SQLite) - Business logic & Data management
- **AI Server**: Express.js + Gemini SDK - OCR & RAG Compliance Agent
- **Vector DB**: Qdrant (Docker) - Legal memory matrix

---

## 🚀 Getting Started (Setup Guide)

### 1. Prerequisites
- Node.js (v18+)
- Docker Desktop (for Qdrant)
- Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

### 2. Infrastructure Setup
Start the Vector Database using Docker:
```bash
cd backend
docker-compose up -d
```

### 3. Main Server Setup (Port 4000)
1. Navigate to the server directory:
   ```bash
   cd backend/server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (copy `.env.example` if available):
   ```env
   PORT=4000
   DATABASE_URL="file:./dev.db"
   AI_SERVER_URL="http://localhost:5000"
   ```
4. Initialize the database:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
5. Start the server:
   ```bash
   npm run dev
   ```

### 4. AI Agent Server Setup (Port 5000)
1. Navigate to the AI server directory:
   ```bash
   cd backend/ai_server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```env
   PORT=5000
   GEMINI_API_KEY="your_actual_key_here"
   QDRANT_URL="http://localhost:6333"
   ```
4. **Seed the Legal Knowledge (RAG)**:
   This step embeds the Indian GST laws into the vector database.
   ```bash
   npm run build
   node dist/scripts/seed-laws.js
   ```
5. Start the AI server:
   ```bash
   npm run dev
   ```

### 5. Frontend Setup (Port 3000)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_MAIN_API_URL="http://localhost:4000"
   ```
4. Start the frontend:
   ```bash
   npm run dev
   ```

---

## 🛠️ Usage Flow
1. Open `http://localhost:3000`
2. Go to the **Upload** page.
3. Drop an invoice (Image or PDF).
4. View the **OCR Extraction** results.
5. Click **"Run AI Compliance Check"** to trigger the RAG agent.
6. Review the **Scorecard** with specific legal pass/fail reasoning.

## 📂 Project Structure
```text
NextGen_Nirmaan/
├── frontend/             # Next.js App
├── backend/
│   ├── server/           # Express Main API
│   ├── ai_server/        # Express AI Agent
│   └── docker-compose.yml # Qdrant Config
└── data/                 # Shared datasets (laws.json)
```