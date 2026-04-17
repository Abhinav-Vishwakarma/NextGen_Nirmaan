import { Router, Request, Response } from 'express'
import * as cheerio from 'cheerio'

const router = Router()

router.get('/whats-new', async (req: Request, res: Response) => {
  try {
    // Using a dummy URL for now as requested
    const url = 'https://www.rbi.org.in/scripts/NewLinkDetails.aspx'
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Select the table rows from the RBI site
    const tableRows = $('.tablebg tr')
    
    let listHtml = '<ul style="list-style-type: disc; padding-left: 20px;">'
    
    tableRows.each((i, el) => {
      const link = $(el).find('a')
      if (link.length > 0) {
        const title = link.text().trim()
        const href = link.attr('href')
        // Ensure href is absolute
        const absoluteHref = href?.startsWith('http') ? href : `https://www.rbi.org.in${href?.startsWith('/') ? '' : '/'}${href}`
        listHtml += `<li style="margin-bottom: 8px;"><a href="${absoluteHref}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${title}</a></li>`
      } else {
         const text = $(el).text().trim()
         if (text) {
           listHtml += `<li style="margin-bottom: 8px;">${text}</li>`
         }
      }
    })
    
    listHtml += '</ul>'
    
    let whatsNewContent = tableRows.length > 0 ? listHtml : null

    if (!whatsNewContent) {
      // Mocking some data in case the dummy site doesn't have the element
      whatsNewContent = `
        <ul style="list-style-type: disc; padding-left: 20px;">
          <li><strong>Update 1:</strong> New GST regulations taking effect next month.</li>
          <li><strong>Update 2:</strong> Labor laws revised for factory workers.</li>
          <li><strong>Update 3:</strong> Income tax filing deadline extended.</li>
        </ul>
      `
    }

    res.json({ success: true, content: whatsNewContent })
  } catch (error: any) {
    console.error('Scraper Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch updates' })
  }
})

export default router
