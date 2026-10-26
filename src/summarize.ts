import type { Subject } from './subjects'
import { getSkill } from './skills'
import type { NoteDoc } from './notes'

const STOP = new Set(
  `a an the and or but if in on at to for of as is are was were be been being
   this that these those it its they them their we our you your he she his her
   with from by into about over after before between through during without
   within along across under above below than then so such also just only very
   can could would should may might will shall do does did done having have has
   had not no nor none each every any all some more most other into which who
   whom whose what when where why how while both few many much own same too`.split(
    /\s+/,
  ),
)

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff'\s-]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?。！？;；:])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => {
      const words = s.split(/\s+/).filter(Boolean)
      // Keep shorter fragments for vocab lists / formulas in notes
      return s.length >= 20 && words.length >= 3
    })
}

function scoreSentence(
  sentence: string,
  freq: Map<string, number>,
  boost: Set<string>,
): number {
  const words = tokenize(sentence)
  if (words.length === 0) return 0
  let score = 0
  for (const w of words) {
    score += freq.get(w) ?? 0
    if (boost.has(w)) score += 2.5
  }
  const len = words.length
  if (len < 5) score *= 0.7
  if (len > 45) score *= 0.75
  return score / Math.sqrt(Math.max(words.length, 1))
}

function topKeywords(text: string, n = 12): string[] {
  const freq = new Map<string, number>()
  for (const w of tokenize(text)) freq.set(w, (freq.get(w) ?? 0) + 1)
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w)
}

function pickDiverse(sentences: { text: string; score: number }[], k: number) {
  const picked: string[] = []
  const used = new Set<string>()
  for (const s of sentences) {
    if (picked.length >= k) break
    const key = tokenize(s.text).slice(0, 6).join(' ')
    if (!key || used.has(key)) continue
    used.add(key)
    picked.push(s.text.replace(/\s+/g, ' ').trim())
  }
  return picked
}

function tidy(s: string): string {
  let out = s.replace(/\s+/g, ' ').trim()
  if (!/[.!?。！？]$/.test(out)) out += '.'
  return out
}

function lensHitCount(sentence: string, cues: string[]): number {
  const ws = new Set(tokenize(sentence))
  let hits = 0
  for (const cue of cues) {
    const parts = tokenize(cue)
    if (parts.every((p) => ws.has(p))) hits++
  }
  return hits
}

export interface SummaryResult {
  title: string
  sourceNote: string
  /** Only sentences taken from the user's notes */
  bigIdeas: string[]
  /** Only lenses that matched note text — never pre-filled */
  focusBreakdown: { area: string; notes: string[] }[]
  mustKnow: string[]
  keywords: string[]
}

/**
 * Summarize ONLY the notes the user provided.
 * Subject skills steer conceptual grouping; they never inject explanations.
 */
export function summarizeNotes(docs: NoteDoc[], subject: Subject): SummaryResult {
  const skill = getSkill(subject.id)
  const sourceNote = docs.map((d) => d.name).join(', ')
  const combined = docs.map((d) => d.text).join('\n\n')
  const clean = combined.replace(/\u0000/g, '').trim()

  if (clean.length < 40) {
    return {
      title: `${subject.short} — no usable note text yet`,
      sourceNote,
      bigIdeas: [],
      focusBreakdown: [],
      mustKnow: [],
      keywords: [],
    }
  }

  const boost = new Set<string>()
  for (const w of skill.boostTerms) boost.add(w.toLowerCase())
  for (const lens of skill.lenses) {
    for (const cue of lens.cues) {
      for (const w of tokenize(cue)) boost.add(w)
    }
  }

  const freq = new Map<string, number>()
  for (const w of tokenize(clean)) freq.set(w, (freq.get(w) ?? 0) + 1)

  const scored = splitSentences(clean)
    .map((text) => ({ text, score: scoreSentence(text, freq, boost) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  const bigIdeas = pickDiverse(scored, 5).map(tidy)

  // Only include lenses that actually match the user's notes
  const focusBreakdown = skill.lenses
    .map((lens) => {
      const related = scored
        .filter((s) => lensHitCount(s.text, lens.cues) > 0)
        .sort((a, b) => {
          const hb =
            lensHitCount(b.text, lens.cues) - lensHitCount(a.text, lens.cues)
          return hb !== 0 ? hb : b.score - a.score
        })
      const notes = pickDiverse(related, 3).map(tidy)
      return { area: lens.name, notes }
    })
    .filter((sec) => sec.notes.length > 0)

  const usedInFocus = new Set(
    focusBreakdown.flatMap((s) => s.notes.map((n) => n.toLowerCase())),
  )
  const mustKnow = pickDiverse(
    scored.filter((s) => !usedInFocus.has(tidy(s.text).toLowerCase())),
    6,
  ).map((s) => {
    const short = s.length > 200 ? `${s.slice(0, 197)}…` : s
    return tidy(short)
  })

  return {
    title: `${subject.short} — from your notes`,
    sourceNote,
    bigIdeas,
    focusBreakdown,
    mustKnow,
    keywords: topKeywords(clean, 14),
  }
}
