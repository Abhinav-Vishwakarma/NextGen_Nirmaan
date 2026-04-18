import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const router = Router()
const prisma = new PrismaClient()

// Configuration
const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:5000'
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333'
const COLLECTION = 'regulatory_library'

/**
 * Ingest a legal document and extract/version law items
 */
router.post('/ingest/:documentId', async (req: Request, res: Response) => {
    const { documentId } = req.params as { documentId: string }
    const { department, category } = req.body

    try {
        const doc = await prisma.document.findUnique({ where: { id: documentId } })
        if (!doc) return res.status(404).json({ error: 'Document not found' })

        const uploadsDir = path.join(process.cwd(), 'uploads')
        const fullPath = path.join(uploadsDir, doc.filePath)

        // 1. Ask AI Server to parse the document into clauses
        const parseRes = await fetch(`${AI_SERVER_URL}/api/ai/laws/parse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: fullPath, mimeType: doc.fileType })
        })

        if (!parseRes.ok) throw new Error(await parseRes.text())
        const { clauses } = await parseRes.json()

        const ingestionResults = []

        for (const clause of clauses) {
            // 2. Identification Logic: Match by Title and Section
            const existingLaw = await prisma.lawUpdate.findFirst({
                where: {
                    title: clause.title,
                    section: clause.section,
                    isLatest: true
                }
            })

            let newVersion = "1.0"
            let parentId = null

            if (existingLaw) {
                // Increment version
                const currentVer = parseFloat(existingLaw.version)
                newVersion = (currentVer + 0.1).toFixed(1)
                parentId = existingLaw.id

                // Mark old version as not latest
                await prisma.lawUpdate.update({
                    where: { id: existingLaw.id },
                    data: { isLatest: false }
                })
                
                // Also update Qdrant for the old version
                await updateQdrantLatestFlag(existingLaw.vectorId || '', false)
            }

            // 3. Embed the new clause text
            const embedRes = await fetch(`${AI_SERVER_URL}/api/ai/laws/embed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: `${clause.title}\n${clause.text}` })
            })
            const { vector } = await embedRes.json()

            // 4. Create new LawUpdate entry
            const newLaw = await prisma.lawUpdate.create({
                data: {
                    title: clause.title,
                    section: clause.section,
                    text: clause.text,
                    summary: clause.summary,
                    category: category || existingLaw?.category || 'GENERAL',
                    department: department || existingLaw?.department,
                    tags: JSON.stringify(clause.tags),
                    version: newVersion,
                    isLatest: true,
                    parentId: parentId
                }
            })

            // 5. Upsert to Qdrant
            // Qdrant needs numeric ID or UUID. We'll use a hash or just the prisma UUID if formatted
            const qdrantPointId = newLaw.id
            await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    points: [{
                        id: qdrantPointId,
                        vector,
                        payload: {
                            law_id: newLaw.id,
                            title: newLaw.title,
                            section: newLaw.section,
                            text: newLaw.text,
                            version: newLaw.version,
                            is_latest: true,
                            category: newLaw.category,
                            department: newLaw.department
                        }
                    }]
                })
            })

            // Updateprisma with vectorId
            await prisma.lawUpdate.update({
                where: { id: newLaw.id },
                data: { vectorId: qdrantPointId }
            })

            ingestionResults.push(newLaw)
        }

        res.json({ success: true, count: ingestionResults.length, items: ingestionResults })

    } catch (error: any) {
        console.error('Ingestion error:', error)
        res.status(500).json({ error: error.message })
    }
})

/**
 * Restore an older version for testing purposes
 */
router.post('/restore/:id', async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    try {
        const targetLaw = await prisma.lawUpdate.findUnique({ where: { id } })
        if (!targetLaw) return res.status(404).json({ error: 'Law version not found' })

        // 1. Find the current latest for this same law (Title + Section)
        const currentLatest = await prisma.lawUpdate.findFirst({
            where: {
                title: targetLaw.title,
                section: targetLaw.section,
                isLatest: true
            }
        })

        if (currentLatest) {
            await prisma.lawUpdate.update({
                where: { id: currentLatest.id },
                data: { isLatest: false }
            })
            await updateQdrantLatestFlag(currentLatest.vectorId || '', false)
        }

        // 2. Set target as latest
        await prisma.lawUpdate.update({
            where: { id: targetLaw.id },
            data: { isLatest: true }
        })
        await updateQdrantLatestFlag(targetLaw.vectorId || '', true)

        res.json({ success: true, message: `Restored version ${targetLaw.version} as active.` })
    } catch (error: any) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/history', async (req: Request, res: Response) => {
    const { title, section } = req.query
    const history = await prisma.lawUpdate.findMany({
        where: {
            title: title as string,
            section: section as string
        },
        orderBy: { createdAt: 'desc' }
    })
    res.json({ history })
})

async function updateQdrantLatestFlag(pointId: string, isLatest: boolean) {
    if (!pointId) return
    await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points/payload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            points: [pointId],
            payload: { is_latest: isLatest }
        })
    })
}

export default router
