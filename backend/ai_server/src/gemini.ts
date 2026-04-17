import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'

dotenv.config()

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in .env')
}

const genAI = new GoogleGenerativeAI(apiKey)

// We use standard gemini-2.5-flash which is multimodal and handles base64 PDFs/Images perfectly.
export const geminiPro = genAI.getGenerativeModel({
  model: 'gemini-3-flash-preview',
})

// Used for embeddings
export const embeddingModel = genAI.getGenerativeModel({
  model: 'gemini-embedding-001',
})

/**
 * Helper to embed a text block into the required 768 dimension vector
 */
export async function embedText(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text)
  return result.embedding.values
}
