import type { SubjectId } from '../subjects'

/** How to read THIS class's notes conceptually — never content to invent. */
export interface SubjectSkill {
  id: SubjectId
  /** One-line framing for the UI (not injected into the summary body). */
  label: string
  /**
   * Conceptual buckets. Used only to group sentences that already appear
   * in the user's notes. Empty buckets are dropped — never filled with filler.
   */
  lenses: { name: string; cues: string[] }[]
  /** Extra terms that boost ranking of the user's own sentences. */
  boostTerms: string[]
}
