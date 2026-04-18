import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import scraperRoutes from './routes/scraper'
import lawIngestionRoutes from './routes/law-ingestion'

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
    const allowedTypes = [
      'application/pdf', 
      'image/png', 
      'image/jpeg', 
      'image/jpg', 
      'image/webp',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF, Images, and Spreadsheets (Excel/CSV) are allowed'))
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

app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params
    const doc = await prisma.document.findUnique({ where: { id } })
    if (!doc) return res.status(404).json({ error: 'Document not found' })

    // 1. Delete physical file
    const filePath = path.join(uploadsDir, doc.filePath)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // 2. Delete database record
    await prisma.document.delete({ where: { id } })

    // Log the event
    await prisma.systemLog.create({
      data: {
        eventType: 'DOCUMENT_DELETED',
        username: 'System',
        details: JSON.stringify({ documentId: id, fileName: doc.fileName })
      }
    })

    res.json({ success: true, message: 'Document deleted successfully' })
  } catch (error) {
    console.error('Delete Document Error:', error)
    res.status(500).json({ error: 'Failed to delete document' })
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
  } catch (error: any) {
    console.error('OCR Extraction error:', error)
    const message = error?.message || 'OCR Extraction failed'
    res.status(500).json({ error: message })
  }
})

// Run Ingestion (OCR) on an existing document
app.post('/api/documents/:id/ingest', async (req, res) => {
  const { id } = req.params
  try {
    const doc = await prisma.document.findUnique({ where: { id: id as string }})
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' })
    }

    // 1. Update status
    await prisma.document.update({
      where: { id: id as string },
      data: { status: 'EXTRACTING' }
    })

    // 2. Call AI Server for OCR
    const aiServerUrl = process.env.AI_SERVER_URL || 'http://localhost:5000'
    const fullPath = path.join(uploadsDir, doc.filePath)
    
    const ocrResponse = await fetch(`${aiServerUrl}/api/ai/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filePath: fullPath,
        mimeType: doc.fileType
      })
    })

    if (!ocrResponse.ok) {
        const errorData = await ocrResponse.json().catch(() => ({ error: 'AI Extraction failed' }))
        throw new Error(errorData.error || `AI Extraction failed: ${await ocrResponse.text()}`)
    }

    const ocrData = await ocrResponse.json()
    
    // 3. Update document with extracted data
    const updatedDoc = await prisma.document.update({
        where: { id: id as string },
        data: {
            status: 'EXTRACTED',
            extractedData: JSON.stringify(ocrData.extractedData)
        }
    })

    res.json(updatedDoc)
  } catch (error: any) {
    console.error('Ingestion Error:', error)
    res.status(500).json({ error: error?.message || 'Ingestion failed' })
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
     
     // Fetch project compliances if linked
     let projectCompliances = []
     if (doc.projectId) {
         const project = await prisma.project.findUnique({ where: { id: doc.projectId } })
         if (project && project.compliances) {
             projectCompliances = JSON.parse(project.compliances)
         }
     }

     const verifyResponse = await fetch(`${aiServerUrl}/api/ai/verify`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
             extractedData: JSON.parse(doc.extractedData),
             selectedLaws: projectCompliances
         })
     })

     if (!verifyResponse.ok) {
         let errorMessage = 'AI Check failed';
         try {
             const errorData = await verifyResponse.json();
             errorMessage = errorData.error || errorMessage;
         } catch {
             // If not JSON, try text
             try {
                 errorMessage = await verifyResponse.text();
             } catch {}
         }
         throw new Error(errorMessage)
     }

     const verifyData = await verifyResponse.json()

     // Save to DB
     const updated = await prisma.document.update({
         where: { id },
         data: {
             status: verifyData.status === 'APPROVED' ? 'VERIFIED' : 'FLAGGED',
             complianceScore: verifyData.complianceScore,
             complianceReport: JSON.stringify({
                 ...verifyData.complianceReport,
                 financialExposure: verifyData.financialExposure
             })
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

      // Store consulted versions for history
      if (verifyData.lawsConsulted) {
          await prisma.document.update({
              where: { id },
              data: {
                  complianceCheckMeta: JSON.stringify(verifyData.lawsConsulted)
              }
          })
      }

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
  } catch (error: any) {
      console.error('AI Verify Error:', error)
      res.status(500).json({ error: error?.message || 'AI Proxy Verify Failed' })
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
    const { name, client, compliances, createdBy, timelineType, startDate, endDate, duration } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' })
    }

    const project = await prisma.project.create({
      data: {
        name,
        client,
        compliances: compliances ? JSON.stringify(compliances) : null,
        createdBy: createdBy || 'Anonymous',
        timelineType,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        duration,
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

app.get('/api/projects/:id', async (req, res) => {
  try {
    const id = req.params.id as string
    const project = await prisma.project.findUnique({
      where: { id }
    })
    
    if (!project) return res.status(404).json({ error: 'Project not found' })
    
    // Also fetch documents linked to this project
    const documents = await prisma.document.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ ...project, documents })
  } catch (error) {
    console.error('Fetch Project Error:', error)
    res.status(500).json({ error: 'Failed to fetch project' })
  }
})

app.post('/api/projects/:id/upload', upload.array('files'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const files = req.files as Express.Multer.File[]
    const { uploadedBy } = req.body

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' })
    }

    const createdDocs = []

    for (const file of files) {
      const fileId = path.parse(file.filename).name
      const doc = await prisma.document.create({
        data: {
          id: fileId,
          fileName: file.originalname,
          fileType: file.mimetype,
          filePath: file.filename,
          projectId: id as string,
          uploadedBy: uploadedBy || 'Anonymous',
          status: 'UPLOADED'
        }
      })
      createdDocs.push(doc)

      // Log each upload
      await prisma.systemLog.create({
        data: {
          eventType: 'DOCUMENT_UPLOADED',
          username: uploadedBy || 'Anonymous',
          details: JSON.stringify({ documentId: fileId, fileName: file.originalname, projectId: id })
        }
      })
    }

    res.status(201).json({ documents: createdDocs })
  } catch (error) {
    console.error('Multi-upload error:', error)
    res.status(500).json({ error: 'Failed to upload files' })
  }
})

app.patch('/api/projects/:id', async (req, res) => {
  try {
    const id = req.params.id as string
    const { name, client, compliances, status, timelineType, startDate, endDate, duration } = req.body

    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        client,
        compliances: compliances ? JSON.stringify(compliances) : undefined,
        status,
        timelineType,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        duration
      }
    })

    res.json(project)
  } catch (error) {
    console.error('Project Update Error:', error)
    res.status(500).json({ error: 'Failed to update project' })
  }
})

// === FILING API ===
app.post('/api/projects/:id/file', async (req, res) => {
    try {
        const { id } = req.params
        const { force = false, filedBy = 'System' } = req.body

        const project = await prisma.project.findUnique({
            where: { id },
            include: { documents: true }
        })

        if (!project) return res.status(404).json({ error: 'Project not found' })
        
        // 1. Check compliance if not forced
        if (!force) {
            const nonCompliant = project.documents.filter(d => (d.complianceScore || 0) < 100)
            if (nonCompliant.length > 0) {
                return res.status(400).json({ 
                    error: 'COMPLIANCE_LOCK', 
                    message: `${nonCompliant.length} documents are not 100% compliant. Use "Force File" to bypass.`,
                    details: nonCompliant.map(d => ({ id: d.id, name: d.fileName, score: d.complianceScore }))
                })
            }
        }

        // 2. Mock Government Handshake
        // In a real app, this would be an async job calling a government API
        const filingId = `GOV-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        
        // 3. Generate Signed JSON
        const compliancesUsed = project.compliances ? JSON.parse(project.compliances) : []
        const signedJson = {
            metadata: {
                filingId,
                projectId: project.id,
                projectName: project.name,
                timestamp: new Date().toISOString(),
                filedBy
            },
            auditTrail: {
                logicVersions: compliancesUsed.map((c: any) => ({
                    lawId: c.payload?.law_id || c.id,
                    title: c.payload?.title || c.title,
                    version: c.payload?.version || "1.0",
                    checkDate: new Date().toISOString()
                })),
                documentHashes: project.documents.map(d => ({
                    id: d.id,
                    name: d.fileName,
                    score: d.complianceScore
                }))
            },
            signature: `sha256:mock_sig_${Buffer.from(project.id).toString('hex').substring(0, 16)}`
        }

        // 4. Generate Mock Challan
        const totalTax = project.documents.reduce((sum, d) => {
            try {
                const data = JSON.parse(d.extractedData || '{}')
                return sum + (data.total_tax || 0)
            } catch { return sum }
        }, 0)

        const challan = {
            challanNumber: `CHL-${Date.now().toString().slice(-8)}`,
            amount: totalTax || 50000, // Mock amount if no tax found
            beneficiary: "GST Council of India",
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: "GENERATED",
            signedManifest: signedJson
        }

        // 5. Update Project
        const updated = await prisma.project.update({
            where: { id },
            data: {
                filedAt: new Date(),
                status: 'COMPLETED',
                challanData: JSON.stringify(challan)
            }
        })

        // Log the event
        await prisma.systemLog.create({
            data: {
                eventType: 'PROJECT_FILED',
                username: filedBy,
                details: JSON.stringify({ projectId: id, filingId, force })
            }
        })

        res.json({
            success: true,
            filingId,
            challan,
            signedJson
        })

    } catch (error) {
        console.error('Filing Error:', error)
        res.status(500).json({ error: 'Filing process failed' })
    }
})

app.post('/api/projects/:id/reset', async (req, res) => {
    try {
        const { id } = req.params
        const project = await prisma.project.update({
            where: { id },
            data: {
                filedAt: null,
                status: 'ACTIVE',
                challanData: null
            }
        })

        // Log the reset
        await prisma.systemLog.create({
            data: {
                eventType: 'PROJECT_RESET',
                username: 'System',
                details: JSON.stringify({ projectId: id })
            }
        })

        res.json({ success: true, project })
    } catch (error) {
        console.error('Reset Error:', error)
        res.status(500).json({ error: 'Failed to reset project' })
    }
})

// === POLICY EVALUATION API ===
app.get('/api/policy-evaluations', async (req, res) => {
  try {
    const evaluations = await prisma.policyEvaluation.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json({ evaluations })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch policy evaluations' })
  }
})

app.get('/api/policy-evaluations/:id', async (req, res) => {
  try {
    const evaluation = await prisma.policyEvaluation.findUnique({
      where: { id: req.params.id }
    })
    if (!evaluation) return res.status(404).json({ error: 'Evaluation not found' })
    res.json(evaluation)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch evaluation' })
  }
})

app.post('/api/policy-evaluations/evaluate', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No file provided' })

    const { selectedLaws, uploadedBy } = req.body
    if (!selectedLaws) return res.status(400).json({ error: 'Selected laws are required' })

    const laws = JSON.parse(selectedLaws)
    
    // 1. Create initial entry
    const evaluation = await prisma.policyEvaluation.create({
      data: {
        policyName: file.originalname,
        policyFilePath: file.filename,
        selectedLaws: selectedLaws,
        evaluatedBy: uploadedBy || 'Anonymous',
        status: 'PENDING'
      }
    })

    // 2. Call AI Server
    const aiServerUrl = process.env.AI_SERVER_URL || 'http://localhost:5000'
    const fullPath = path.join(uploadsDir, file.filename)

    const aiResponse = await fetch(`${aiServerUrl}/api/ai/evaluate-policy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filePath: fullPath,
        mimeType: file.mimetype,
        selectedLaws: laws
      })
    })

    if (!aiResponse.ok) {
      throw new Error(`AI Evaluation failed: ${await aiResponse.text()}`)
    }

    const result = await aiResponse.json()

    // 3. Update DB with results
    const updated = await prisma.policyEvaluation.update({
      where: { id: evaluation.id },
      data: {
        complianceScore: result.complianceScore,
        overallSummary: result.overallSummary,
        detailedResults: JSON.stringify(result.evaluations),
        status: 'COMPLETED'
      }
    })

    // Log the event
    await prisma.systemLog.create({
      data: {
        eventType: 'POLICY_EVALUATED',
        username: uploadedBy || 'Anonymous',
        details: JSON.stringify({ evaluationId: updated.id, policyName: updated.policyName, score: updated.complianceScore })
      }
    })

    res.json(updated)
  } catch (error) {
    console.error('Policy Evaluation Error:', error)
    res.status(500).json({ error: 'Policy evaluation failed' })
  }
})

// === SCRAPER API ===
app.use('/api/scraper', scraperRoutes)

// === LAW INGESTION API ===
app.use('/api/ai/laws', lawIngestionRoutes)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`🚀 Main Server running on http://localhost:${PORT}`)
})
