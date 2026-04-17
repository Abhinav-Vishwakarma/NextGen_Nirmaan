import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import scraperRoutes from './routes/scraper'

dotenv.config()

const prisma = new PrismaClient()
const app = express()

app.use(cors())
app.use(express.json())

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const fileId = uuidv4()
    cb(null, `${fileId}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF and image files are allowed'))
    }
  },
})

// === ALERTS API ===
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
    })
    res.json({ alerts })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' })
  }
})

// === DASHBOARD API ===
app.get('/api/dashboard', async (req, res) => {
  try {
    const totalDocs = await prisma.document.count()
    const verifiedDocs = await prisma.document.count({ where: { status: 'VERIFIED' } })
    const flaggedDocs = await prisma.document.count({ where: { status: 'FLAGGED' } })

    const docsWithScores = await prisma.document.findMany({
      where: { complianceScore: { not: null } },
      select: { complianceScore: true },
    })

    const avgScore = docsWithScores.length > 0
      ? Math.round(
          docsWithScores.reduce((sum: number, d: any) => sum + (d.complianceScore || 0), 0) /
          docsWithScores.length
        )
      : 0

    const recentDocs = await prisma.document.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        status: true,
        complianceScore: true,
        createdAt: true,
      },
    })

    const unreadAlerts = await prisma.alert.count({ where: { isRead: false } })
    const criticalAlerts = await prisma.alert.count({
      where: { isRead: false, severity: 'critical' },
    })

    const recentAlerts = await prisma.alert.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: { isRead: false },
    })

    const trendData = [
      { month: 'Nov 2025', processed: 42, avgScore: 88, flagged: 3 },
      { month: 'Dec 2025', processed: 56, avgScore: 91, flagged: 2 },
      { month: 'Jan 2026', processed: 38, avgScore: 85, flagged: 5 },
      { month: 'Feb 2026', processed: 63, avgScore: 93, flagged: 1 },
      { month: 'Mar 2026', processed: 71, avgScore: 90, flagged: 4 },
      { month: 'Apr 2026', processed: totalDocs, avgScore: avgScore || 92, flagged: flaggedDocs },
    ]

    res.json({
      stats: {
        totalDocuments: totalDocs,
        averageScore: avgScore,
        flaggedCount: flaggedDocs,
        verifiedCount: verifiedDocs,
        unreadAlerts,
        criticalAlerts,
      },
      recentDocuments: recentDocs,
      recentAlerts,
      trendData,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
})

// === DOCUMENTS API ===
app.get('/api/documents', async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        category: true,
        status: true,
        complianceScore: true,
        createdAt: true,
        uploadedBy: true,
      },
    })
    res.json({ documents })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' })
  }
})

app.get('/api/documents/:id', async (req, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id }
    })
    if (!document) {
      return res.status(404).json({ error: 'Document not found' })
    }
    res.json(document)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch document' })
  }
})

// Handle document upload
app.post('/api/documents/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file
    if (!file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    const { category = 'INVOICE', uploadedBy } = req.body
    
    // The UUID is the filename without extension, configured in multer
    const fileId = path.parse(file.filename).name

    // 1. Save document to SQLite DB
    const document = await prisma.document.create({
      data: {
        id: fileId,
        fileName: file.originalname,
        fileType: file.mimetype,
        filePath: file.filename, 
        category,
        uploadedBy,
        status: 'EXTRACTING',
      },
    })

    // Log the event
    await prisma.systemLog.create({
      data: {
        eventType: 'DOCUMENT_UPLOADED',
        username: uploadedBy || 'System',
        details: JSON.stringify({ documentId: fileId, fileName: file.originalname })
      }
    })

    // 2. Call AI Server for OCR
    const aiServerUrl = process.env.AI_SERVER_URL || 'http://localhost:5000'
    const fullPath = path.join(uploadsDir, file.filename)
    
    // We do NOT block on OCR here, it happens async. However, since this is a hackathon, 
    // let's do it synchronously to keep frontend simple.
    const ocrResponse = await fetch(`${aiServerUrl}/api/ai/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filePath: fullPath,
        mimeType: file.mimetype
      })
    })

    if (!ocrResponse.ok) {
        throw new Error(`AI Extraction failed: ${await ocrResponse.text()}`)
    }

    const ocrData = await ocrResponse.json()
    
    // Update document with extracted data
    const updatedDoc = await prisma.document.update({
        where: { id: fileId },
        data: {
            status: 'EXTRACTED',
            extractedData: JSON.stringify(ocrData.extractedData)
        }
    })

    res.status(201).json({
      id: updatedDoc.id,
      fileName: updatedDoc.fileName,
      status: updatedDoc.status,
      extractedData: ocrData.extractedData
    })
  } catch (error) {
    console.error('Upload Error:', error)
    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
    } else {
      res.status(500).json({ error: 'Upload failed' })
    }
  }
})

// Proxy pass verification to AI Server
app.post('/api/documents/:id/verify', async (req, res) => {
  const { id } = req.params
  
  try {
     const doc = await prisma.document.findUnique({ where: { id }})
     if (!doc || !doc.extractedData) {
         return res.status(400).json({ error: 'Extracted data required before verification' })
     }

     const aiServerUrl = process.env.AI_SERVER_URL || 'http://localhost:5000'
     const verifyResponse = await fetch(`${aiServerUrl}/api/ai/verify`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
             extractedData: JSON.parse(doc.extractedData)
         })
     })

     if (!verifyResponse.ok) {
         throw new Error(`AI Check failed: ${await verifyResponse.text()}`)
     }

     const verifyData = await verifyResponse.json()

     // Save to DB
     const updated = await prisma.document.update({
         where: { id },
         data: {
             status: verifyData.status === 'APPROVED' ? 'VERIFIED' : 'FLAGGED',
             complianceScore: verifyData.complianceScore,
             complianceReport: JSON.stringify(verifyData.complianceReport)
         }
     })

     // Log the event
     await prisma.systemLog.create({
       data: {
         eventType: 'AI_CHECK_RUN',
         username: doc.uploadedBy || 'System',
         details: JSON.stringify({ documentId: id, fileName: doc.fileName, score: verifyData.complianceScore })
       }
     })

     if (updated.status === 'FLAGGED') {
         await prisma.alert.create({
             data: {
                 type: 'FLAGGED_DOC',
                 severity: 'warning',
                 title: `Compliance Issue found in ${doc.fileName}`,
                 message: `Automatic RAG validation flagged this document with a score of ${updated.complianceScore}.`,
                 relatedDocId: id
             }
         })
     }

     res.json(updated)
  } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'AI Proxy Verify Failed' })
  }
})


app.get("/api/ai/laws", async (req: Request, res: Response) => {
  try {
    const aiServerUrl = process.env.AI_SERVER_URL || "http://localhost:5000"
    const aiRes = await fetch(`${aiServerUrl}/api/ai/laws`)
    if (!aiRes.ok) throw new Error(await aiRes.text())
    const data = await aiRes.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch laws" })
  }
})

app.post("/api/ai/search-laws", async (req: Request, res: Response) => {
  try {
    const { query } = req.body
    const aiServerUrl = process.env.AI_SERVER_URL || "http://localhost:5000"
    const aiRes = await fetch(`${aiServerUrl}/api/ai/search-laws`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    })
    if (!aiRes.ok) throw new Error(await aiRes.text())
    const data = await aiRes.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: "Search failed" })
  }
})


// Serve uploaded files statically
app.use('/api/files', express.static(uploadsDir))


// === LOGS API ===
app.get('/api/logs', async (req: Request, res: Response) => {
  const logs = await prisma.systemLog.findMany({
    orderBy: { createdAt: 'desc' },
  })
  res.json({ logs })
})

// === PROJECTS API ===
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json({ projects })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

app.post('/api/projects', async (req, res) => {
  try {
    const { name, client, compliances, createdBy } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' })
    }

    const project = await prisma.project.create({
      data: {
        name,
        client,
        compliances: compliances ? JSON.stringify(compliances) : null,
        createdBy: createdBy || 'Anonymous',
        status: 'PLANNING'
      }
    })

    // Log the event
    await prisma.systemLog.create({
      data: {
        eventType: 'PROJECT_CREATED',
        username: createdBy || 'Anonymous',
        details: JSON.stringify({ projectId: project.id, name: project.name })
      }
    })

    res.status(201).json(project)
  } catch (error) {
    console.error('Project Creation Error:', error)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

// === SCRAPER API ===
app.use('/api/scraper', scraperRoutes)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`🚀 Main Server running on http://localhost:${PORT}`)
})
