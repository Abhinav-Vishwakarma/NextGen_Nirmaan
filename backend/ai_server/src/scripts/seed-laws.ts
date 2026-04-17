import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333'
const COLLECTION = 'regulatory_library'

import { embedText } from '../gemini'

type LawEntry = {
  id: string
  title: string
  section: string
  category: string
  tags: string[]
  text: string
}


async function main() {
  console.log('Creating Qdrant collection...')
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vectors: { size: 3072, distance: 'Cosine' },
    }),
  })

  // We are storing mock laws data relative to frontend since both have access
  const lawsPath = path.join(__dirname, '..', '..', '..', '..', 'frontend', 'data', 'laws.json')
  
  if (!fs.existsSync(lawsPath)) {
      console.warn('⚠️ No laws.json found to seed vector DB.')
      return
  }
  const laws: LawEntry[] = JSON.parse(fs.readFileSync(lawsPath, 'utf-8'))
  console.log(`Loaded ${laws.length} law entries`)

  const points = []
  for (const law of laws) {
    console.log(`Embedding: ${law.title}`)
    const searchText = `${law.title}\n${law.text}`
    const vector = await embedText(searchText)

    points.push({
      id: law.id.replace(/[^a-zA-Z0-9_-]/g, '_'),
      vector,
      payload: {
        title: law.title,
        section: law.section,
        category: law.category,
        tags: law.tags,
        text: law.text,
      },
    })

    // Gemini Rate limits pause
    await new Promise((r) => setTimeout(r, 500))
  }

  console.log('Upserting to Qdrant...')
  const qdrantPoints = points.map((p, i) => ({
    id: i + 1, // Qdrant strictly needs ids as ints or UUID strings
    vector: p.vector,
    payload: { ...p.payload, law_id: p.id },
  }))

  const pushReq = await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: qdrantPoints }),
  })

  if(pushReq.ok) {
     console.log(`✅ Seeded ${points.length} law vectors into Qdrant`)
  } else {
     console.error("Failed to seed Qdrant", await pushReq.text())
  }
}

main().catch(console.error)
