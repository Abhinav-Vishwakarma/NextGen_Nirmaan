import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

import { embedText } from '../gemini'
import { ensureCollection, upsertPoints } from '../qdrant'

type LawEntry = {
  id: string
  title: string
  section: string
  category: string
  tags: string[]
  text: string
}

async function main() {
  console.log('Ensuring Qdrant collection exists...')
  await ensureCollection()

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

  try {
    await upsertPoints(qdrantPoints)
    console.log(`✅ Seeded ${points.length} law vectors into Qdrant`)
  } catch (err) {
    console.error("Failed to seed Qdrant:", err)
  }
}

main().catch(console.error)
