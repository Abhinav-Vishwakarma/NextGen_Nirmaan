import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { geminiPro, embedText } from './gemini'
import { searchSimilar, ensureCollection, listPoints } from './qdrant'
import fs from 'fs'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Make sure Qdrant is setup
ensureCollection()

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'AI Agent Server' })
})

app.get('/api/ai/laws', async (req: Request, res: Response) => {
  try {
    const results = await listPoints(20)
    res.json({ results })
  } catch (error) {
    res.status(500).json({ error: "Failed to list laws" })
  }
})

// === OCR EXTRACTION ===
app.post('/api/ai/extract', async (req: Request, res: Response) => {
  try {
    const { filePath, mimeType } = req.body
    if (!filePath || !mimeType) {
      return res.status(400).json({ error: 'filePath and mimeType are required' })
    }

    // Path must be absolute or correct relative to execution (assumes Main server passes full absolute path)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on backend system' })
    }

    const fileBuffer = fs.readFileSync(filePath)
    const base64Data = fileBuffer.toString('base64')

    const EXTRACTION_PROMPT = `You are an expert Indian GST Invoice data extractor.
Analyze this invoice image/document and extract ALL data into this exact JSON format.
Return ONLY valid JSON (no markdown fences). Use null when fields are not applicable or missing.

{
  "vendor_name": "string",
  "vendor_gstin": "string or null",
  "buyer_name": "string or null",
  "buyer_gstin": "string or null",
  "invoice_number": "string",
  "invoice_date": "string (DD/MM/YYYY)",
  "place_of_supply": "string or null",
  "items": [
    {
      "description": "string",
      "hsn_code": "string or null",
      "quantity": "number or null",
      "unit_price": "number",
      "tax_rate": "number",
      "taxable_amount": "number",
      "cgst": "number or null",
      "sgst": "number or null",
      "igst": "number or null",
      "total": "number"
    }
  ],
  "total_taxable_value": "number",
  "total_tax": "number",
  "grand_total": "number"
}`

    const result = await geminiPro.generateContent([
      EXTRACTION_PROMPT,
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ])

    const responseText = result.response.text()
    const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    // Safety parse checking
    const extractedData = JSON.parse(jsonStr)

    res.json({ extractedData })
  } catch (error) {
    console.error('OCR Extraction error:', error)
    if (error instanceof Error) {
      res.status(500).json({ error: error.message })
    } else {
        res.status(500).json({ error: 'OCR Extraction failed' })
    }
  }
})


app.post("/api/ai/search-laws", async (req: Request, res: Response) => {
  try {
    const { query } = req.body
    if (!query) return res.status(400).json({ error: "query required" })
    const vector = await embedText(query)
    const results = await searchSimilar(vector, 10)
    res.json({ results })
  } catch (error) {
    res.status(500).json({ error: "Failed to search laws" })
  }
})


// === RAG COMPLIANCE VERIFIER ===
function buildInvoiceSummary(extracted: any): string {
    const items = (extracted.items || [])
      .map((item: any) =>
        `${item.description} (HSN: ${item.hsn_code || 'N/A'}, Rate: ${item.tax_rate}%, Amount: ₹${item.taxable_amount})`
      )
      .join('; ')
  
    return `
  Invoice from ${extracted.vendor_name}, GSTIN: ${extracted.vendor_gstin || 'N/A'}.
  Buyer: ${extracted.buyer_name || 'N/A'}, GSTIN: ${extracted.buyer_gstin || 'N/A'}.
  Invoice No: ${extracted.invoice_number}, Date: ${extracted.invoice_date}.
  Place of Supply: ${extracted.place_of_supply || 'N/A'}.
  Items: ${items}.
  Total Taxable: ₹${extracted.total_taxable_value}, Tax: ₹${extracted.total_tax}, Grand Total: ₹${extracted.grand_total}.
  `.trim()
  }

const REASONING_PROMPT = `You are an expert Indian Compliance AI Agent. Assess this INVOICE against the RETRIEVED LEGAL PROVISIONS.

INVOICE DATA:
{invoice_summary}

RELEVANT LEGAL PROVISIONS:
{law_context}

Perform these checks and return ONLY valid JSON (no markdown):
{
  "complianceScore": <number 0-100>,
  "status": "APPROVED" | "FLAGGED",
  "checks": [
    {
      "step": "GSTIN_VALIDATION",
      "result": "PASS" | "FAIL" | "WARN",
      "detail": "<explain reasoning>",
      "lawRef": "<section ref>"
    },
    {
      "step": "MATH_VERIFICATION",
      "result": "PASS" | "FAIL",
      "detail": "<verify math computations>"
    }
  ],
  "summary": "<short description>"
}`

app.post('/api/ai/verify', async (req: Request, res: Response) => {
    try {
        const { extractedData } = req.body
        if (!extractedData) {
            return res.status(400).json({ error: 'Extracted data required' })
        }

        const invoiceSummary = buildInvoiceSummary(extractedData)
        
        // 1. Vectorize text context
        const invoiceVector = await embedText(invoiceSummary)

        // 2. Search Qdrant memory 
        const similarLaws = await searchSimilar(invoiceVector, 5)

        // 3. Prepare injection context
        const lawContext = similarLaws
            .map((hit, i) => `${i + 1}. ${hit.payload.title} (${hit.payload.section}):\n${hit.payload.text}`)
            .join('\n\n')

        const prompt = REASONING_PROMPT
            .replace('{invoice_summary}', invoiceSummary)
            .replace('{law_context}', lawContext)
        
        // 4. Fire LLM evaluation reasoning request
        const result = await geminiPro.generateContent(prompt)
        const responseText = result.response.text()

        const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const complianceReport = JSON.parse(jsonStr)

        res.json({
            complianceScore: complianceReport.complianceScore,
            status: complianceReport.status,
            complianceReport,
            lawsConsulted: similarLaws.map(h => ({
                title: h.payload.title,
                section: h.payload.section,
                relevanceScore: Math.round(h.score * 100)
            }))
        })

    } catch (error) {
        console.error('AI Verify Error:', error)
        res.status(500).json({ error: 'AI Verification generated an exception during evaluation' })
    }
})

const POLICY_EVALUATION_PROMPT = `
You are an expert Compliance AI. Compare the following COMPANY POLICY against the provided COMPLIANCE LAWS.
Evaluate how well the policy aligns with each law and what changes are required.

Return ONLY valid JSON (no markdown fences). Use this exact format:
{
  "complianceScore": <number 0-100>,
  "evaluations": [
    {
      "lawTitle": "string",
      "status": "COMPLIANT" | "PARTIAL" | "NON_COMPLIANT",
      "gapAnalysis": "string",
      "recommendations": "string"
    }
  ],
  "overallSummary": "string"
}

COMPANY POLICY TEXT:
{policy_text}

COMPLIANCE LAWS:
{laws_context}
`

app.post('/api/ai/evaluate-policy', async (req: Request, res: Response) => {
    try {
        const { filePath, mimeType, selectedLaws } = req.body
        if (!filePath || !mimeType || !selectedLaws) {
            return res.status(400).json({ error: 'filePath, mimeType, and selectedLaws are required' })
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Policy file not found' })
        }

        const fileBuffer = fs.readFileSync(filePath)
        const base64Data = fileBuffer.toString('base64')

        // 1. First, extract the text from the policy using Gemini
        const extractionResult = await geminiPro.generateContent([
            "Extract all readable text from this document for compliance analysis. Return ONLY the text.",
            {
                inlineData: {
                    mimeType,
                    data: base64Data,
                },
            },
        ])
        const policyText = extractionResult.response.text()

        // 2. Prepare laws context
        const lawContext = selectedLaws
            .map((law: any, i: number) => `${i + 1}. ${law.title || law.payload?.title} (${law.section || law.payload?.section}):\n${law.text || law.payload?.text}`)
            .join('\n\n')

        // 3. Run evaluation
        const prompt = POLICY_EVALUATION_PROMPT
            .replace('{policy_text}', policyText)
            .replace('{laws_context}', lawContext)

        const evalResult = await geminiPro.generateContent(prompt)
        const responseText = evalResult.response.text()

        const jsonStr = responseText.replace(/```json\n?|```/g, '').trim()
        const evaluation = JSON.parse(jsonStr)

        res.json(evaluation)
    } catch (error) {
        console.error('Policy Evaluation error:', error)
        res.status(500).json({ error: 'Failed to evaluate policy' })
    }
})


const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🤖 AI Agent Server running on http://localhost:${PORT}`)
})
