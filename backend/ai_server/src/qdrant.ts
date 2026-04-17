import dotenv from 'dotenv'
dotenv.config()

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333'
export const COLLECTION_NAME = 'regulatory_library'

export type QdrantPoint = {
  id: number
  vector: number[]
  payload: Record<string, unknown>
}

export type SearchResult = {
  payload: Record<string, unknown>
  score: number
}

export async function ensureCollection(): Promise<void> {
  try {
    const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`)
    if (res.ok) return 
    
    // Using Cosine and 768 vector sizes since we are using Gemini Embeddings
    await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vectors: { size: 3072, distance: 'Cosine' },
      }),
    })
    console.log(`✅ Qdrant collection '${COLLECTION_NAME}' created/ensured`)
  } catch (err) {
    console.error('Qdrant ensureCollection error:', err)
  }
}

export async function upsertPoints(points: QdrantPoint[]): Promise<void> {
  const res = await fetch(
    `${QDRANT_URL}/collections/${COLLECTION_NAME}/points?wait=true`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points }),
    }
  )
  if (!res.ok) {
    throw new Error(`Qdrant upsert failed: ${await res.text()}`)
  }
}

export async function searchSimilar(vector: number[], limit = 5): Promise<SearchResult[]> {
  const res = await fetch(
    `${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector,
        limit,
        with_payload: true,
      }),
    }
  )

  if (!res.ok) throw new Error(`Qdrant search failed: ${await res.text()}`)
  const data = await res.json()
  return (data.result || []) as SearchResult[]
}
