export interface NoteDoc {
  id: string
  name: string
  pageCount: number
  charCount: number
  text: string
  kind: 'pdf' | 'paste'
}

export function makePastedNote(text: string): NoteDoc | null {
  const clean = text.replace(/\u0000/g, '').trim()
  if (!clean) return null
  return {
    id: `paste-${Date.now()}`,
    name: 'Pasted notes',
    pageCount: 1,
    charCount: clean.length,
    text: clean,
    kind: 'paste',
  }
}
