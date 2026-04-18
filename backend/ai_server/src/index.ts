import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { geminiPro, embedText } from './gemini'
import { searchSimilar, ensureCollection, listPoints } from './qdrant'
import fs from 'fs'
import * as XLSX from 'xlsx'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Make sure Qdrant is setup
ensureCollection()

const PENALTY_CONSTANTS = {
    GST: {
        LATE_FEE_PER_DAY: 50,
        INTEREST_RATE_PA: 0.18,
        MIN_PENALTY: 10000,
        TAX_PENALTY_RATE: 0.10,
    },
    RERA: {
        DELAY_FEE_QUARTER: 25000,
        PROJECT_COST_PENALTY_RATE: 0.05,
    }
}

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
    
    let contextData = ""
    let isSpreadsheet = false

    // Check if it's a spreadsheet to parse it structurally
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) {
        isSpreadsheet = true
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
        const sheetsData: Record<string, any[]> = {}
        
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName]
            sheetsData[sheetName] = XLSX.utils.sheet_to_json(worksheet)
        })
        
        contextData = JSON.stringify(sheetsData, null, 2)
    }

    const base64Data = fileBuffer.toString('base64')

    const EXTRACTION_PROMPT = isSpreadsheet 
      ? `You are an expert Indian Compliance Data Auditor. 
Analyze the provided JSON representation of a spreadsheet (Invoice or Payroll/Labor data).
Extract the key entities into a standardized JSON format.
If it's an Invoice, extract vendor, GSTIN, items, tax breakdown.
If it's Payroll/Employee data, extract employee details, salary, TDS, PF, etc.

Return ONLY valid JSON (no markdown fences).

SPREADSHEET JSON:
${contextData}`
      : `You are an expert Indian GST Invoice data extractor.
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

    const result = isSpreadsheet
      ? await geminiPro.generateContent(EXTRACTION_PROMPT)
      : await geminiPro.generateContent([
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
    },
    {
      "step": "FILING_TIMELINE",
      "result": "PASS" | "FAIL",
      "detail": "<Check if document date vs due date indicates a delay>",
      "delayDays": <number or null>,
      "dueDate": "YYYY-MM-DD or null"
    }
  ],
  "summary": "<short description>",
  "violationType": "LATE_FILING" | "MISMATCH" | "INVALID_DATA" | "NONE",
  "taxAmountAtRisk": <number taxable amount involved in violation>
}`

app.post('/api/ai/verify', async (req: Request, res: Response) => {
    try {
        const { extractedData, selectedLaws } = req.body
        if (!extractedData) {
            return res.status(400).json({ error: 'Extracted data required' })
        }

        const invoiceSummary = buildInvoiceSummary(extractedData)
        
        let lawContext = ""
        let consultedMeta = []

        if (selectedLaws && Array.isArray(selectedLaws) && selectedLaws.length > 0) {
            // Priority 1: Use specific laws selected for the project
            lawContext = selectedLaws
                .map((law: any, i: number) => {
                    const payload = law.payload || law
                    return `${i + 1}. ${payload.title} (${payload.section}):\n${payload.text}`
                })
                .join('\n\n')
            
            consultedMeta = selectedLaws.map((law: any) => ({
                id: law.id || (law.payload?.law_id),
                title: law.title || law.payload?.title,
                section: law.section || law.payload?.section,
                version: law.version || law.payload?.version || "1.0",
                relevanceScore: 100 // Manually selected, so 100% relevance
            }))
        } else {
            // Priority 2: Standard RAG search for general audit
            const invoiceVector = await embedText(invoiceSummary)
            const similarLaws = await searchSimilar(invoiceVector, 5, {
                must: [{ key: "is_latest", match: { value: true } }]
            })

            lawContext = similarLaws
                .map((hit, i) => `${i + 1}. ${hit.payload.title} (${hit.payload.section}):\n${hit.payload.text}`)
                .join('\n\n')
            
            consultedMeta = similarLaws.map(h => ({
                id: h.payload.law_id,
                title: h.payload.title,
                section: h.payload.section,
                version: h.payload.version,
                relevanceScore: Math.round(h.score * 100)
            }))
        }

        const prompt = REASONING_PROMPT
            .replace('{invoice_summary}', invoiceSummary)
            .replace('{law_context}', lawContext)
        
        // 4. Fire LLM evaluation reasoning request
        const result = await geminiPro.generateContent(prompt)
        const responseText = result.response.text()

        const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        
        let complianceReport;
        try {
            complianceReport = JSON.parse(jsonStr)
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", jsonStr);
            // Fallback object to avoid crash
            complianceReport = {
                complianceScore: 0,
                status: 'FLAGGED',
                checks: [],
                summary: 'AI output format error during verification.',
                violationType: 'INVALID_DATA',
                taxAmountAtRisk: 0
            }
        }

        // 5. Calculate Financial Impact
        let financialExposure = {
            lateFee: 0,
            interest: 0,
            statutoryPenalty: 0,
            total: 0,
            currency: 'INR'
        }

        if (complianceReport.status === 'FLAGGED') {
            const timelineCheck = complianceReport.checks.find((c: any) => c.step === 'FILING_TIMELINE')
            const delayDays = timelineCheck?.delayDays || 0
            const taxAtRisk = complianceReport.taxAmountAtRisk || 0

            if (delayDays > 0) {
                financialExposure.lateFee = delayDays * PENALTY_CONSTANTS.GST.LATE_FEE_PER_DAY
                financialExposure.interest = Math.round((taxAtRisk * PENALTY_CONSTANTS.GST.INTEREST_RATE_PA * delayDays) / 365)
            }

            if (complianceReport.violationType !== 'NONE') {
                financialExposure.statutoryPenalty = Math.max(PENALTY_CONSTANTS.GST.MIN_PENALTY, Math.round(taxAtRisk * PENALTY_CONSTANTS.GST.TAX_PENALTY_RATE))
            }

            financialExposure.total = financialExposure.lateFee + financialExposure.interest + financialExposure.statutoryPenalty
        }

        res.json({
            complianceScore: complianceReport.complianceScore,
            status: complianceReport.status,
            complianceReport,
            financialExposure,
            lawsConsulted: consultedMeta
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

// === LAW PARSING & VERSIONING ===
const LAW_PARSING_PROMPT = `
You are an expert Legal Data Architect. Analyze the provided legal document and extract all distinct regulatory clauses, provisions, or articles.
Return ONLY valid JSON (no markdown fences) in this format:
[
  {
    "title": "string",
    "section": "string",
    "text": "string",
    "summary": "string",
    "tags": ["string"]
  }
]
`;

app.post('/api/ai/laws/parse', async (req: Request, res: Response) => {
    try {
        const { filePath, mimeType } = req.body
        if (!filePath || !mimeType) {
            return res.status(400).json({ error: 'filePath and mimeType are required' })
        }

        const fileBuffer = fs.readFileSync(filePath)
        const base64Data = fileBuffer.toString('base64')

        const result = await geminiPro.generateContent([
            LAW_PARSING_PROMPT,
            {
                inlineData: {
                    mimeType,
                    data: base64Data,
                },
            },
        ])

        const responseText = result.response.text()
        const jsonStr = responseText.replace(/```json\n?|```/g, '').trim()
        const clauses = JSON.parse(jsonStr)

        res.json({ clauses })
    } catch (error) {
        console.error('Law Parse error:', error)
        res.status(500).json({ error: 'Failed to parse legal document' })
    }
})

app.post('/api/ai/laws/embed', async (req: Request, res: Response) => {
    try {
        const { text } = req.body
        if (!text) return res.status(400).json({ error: 'text required' })
        const vector = await embedText(text)
        res.json({ vector })
    } catch (error) {
        res.status(500).json({ error: 'Failed to embed text' })
    }
})


const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🤖 AI Agent Server running on http://localhost:${PORT}`)
})
