import * as pdfjs from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { NoteDoc } from './notes'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

export async function extractPdfText(file: File): Promise<NoteDoc> {
  const buffer = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buffer }).promise
  const parts: string[] = []

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const content = await page.getTextContent()
    const line = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (line) parts.push(line)
  }

  const text = parts.join('\n\n')
  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    pageCount: doc.numPages,
    charCount: text.length,
    text,
    kind: 'pdf',
  }
}
