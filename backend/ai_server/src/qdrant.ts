import dotenv from 'dotenv'
import { QdrantClient } from '@qdrant/js-client-rest'

dotenv.config()

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333'
const QDRANT_API_KEY = process.env.QDRANT_API_KEY

export const COLLECTION_NAME = 'regulatory_library'

// Initialize official client
const client = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
  checkCompatibility: false,
})

export type QdrantPoint = {
  id: string | number
  vector: number[]
  payload: Record<string, unknown>
}

export type SearchResult = {
  payload: Record<string, unknown>
  score: number
}

export async function ensureCollection(): Promise<void> {
  try {
    const collections = await client.getCollections()
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME)
    
    if (exists) return
    
    // Using Cosine and 3072 vector sizes for Gemini Text Embedding 004
    await client.createCollection(COLLECTION_NAME, {
      vectors: { size: 3072, distance: 'Cosine' },
    })
    
    console.log(`✅ Qdrant collection '${COLLECTION_NAME}' created/ensured`)
  } catch (err) {
    console.error('Qdrant ensureCollection error:', err)
  }
}

export async function upsertPoints(points: QdrantPoint[]): Promise<void> {
  try {
     await client.upsert(COLLECTION_NAME, {
       wait: true,
       points: points.map(p => ({
         id: p.id,
         vector: p.vector,
         payload: p.payload
       }))
     })
  } catch (err) {
    console.error('Qdrant upsert failed:', err)
    throw err
  }
}

export async function searchSimilar(vector: number[], limit = 5, filter?: any): Promise<SearchResult[]> {
  try {
    const results = await client.search(COLLECTION_NAME, {
      vector,
      limit,
      filter: filter || undefined,
      with_payload: true,
    })

    return results.map(hit => ({
      payload: hit.payload as Record<string, unknown>,
      score: hit.score,
    }))
  } catch (err) {
    console.error('Qdrant search failed:', err)
    throw err
  }
}

export async function listPoints(limit = 20): Promise<SearchResult[]> {
  try {
    console.log(`🔍 Listing up to ${limit} points from collection: ${COLLECTION_NAME}`)
    const data = await client.scroll(COLLECTION_NAME, {
      limit,
      with_payload: true,
    })

    const points = data.points || []
    console.log(`✅ Retrieved ${points.length} points from Qdrant.`)
    
    return points.map((p: any) => ({
      payload: p.payload,
      score: 1.0 // Default score for listing
    }))
  } catch (err) {
    console.error('❌ Qdrant scroll failed:', err)
    throw err
  }
}
