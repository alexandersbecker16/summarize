import { useMemo, useState, useCallback, type DragEvent } from 'react'
import { SUBJECTS, getSubject, type SubjectId } from './subjects'
import { getSkill } from './skills'
import { extractPdfText } from './pdfExtract'
import { makePastedNote, type NoteDoc } from './notes'
import { summarizeNotes, type SummaryResult } from './summarize'

type Status = 'idle' | 'extracting' | 'summarizing'

export default function App() {
  const [subjectId, setSubjectId] = useState<SubjectId>('ap-lang')
  const [docsBySubject, setDocsBySubject] = useState<
    Record<SubjectId, NoteDoc[]>
  >(() => {
    const init = {} as Record<SubjectId, NoteDoc[]>
    for (const s of SUBJECTS) init[s.id] = []
    return init
  })
  const [draftBySubject, setDraftBySubject] = useState<
    Record<SubjectId, string>
  >(() => {
    const init = {} as Record<SubjectId, string>
    for (const s of SUBJECTS) init[s.id] = ''
    return init
  })
  const [summaries, setSummaries] = useState<
    Partial<Record<SubjectId, SummaryResult>>
  >({})
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)

  const subject = useMemo(() => getSubject(subjectId), [subjectId])
  const skill = useMemo(() => getSkill(subjectId), [subjectId])
  const docs = docsBySubject[subjectId]
  const draft = draftBySubject[subjectId]
  const summary = summaries[subjectId]
  const canSummarize = docs.length > 0 || draft.trim().length > 0

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const pdfs = [...files].filter(
        (f) =>
          f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
      )
      if (!pdfs.length) {
        setError('Please drop PDF files only.')
        return
      }

      setError(null)
      setStatus('extracting')
      try {
        const extracted: NoteDoc[] = []
        for (const file of pdfs) {
          extracted.push(await extractPdfText(file))
        }
        setDocsBySubject((prev) => {
          const existing = prev[subjectId]
          const merged = [...existing]
          for (const doc of extracted) {
            if (!merged.some((d) => d.id === doc.id)) merged.push(doc)
          }
          return { ...prev, [subjectId]: merged }
        })
        setSummaries((prev) => {
          const next = { ...prev }
          delete next[subjectId]
          return next
        })
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : 'Could not read one of the PDFs. Try another file.',
        )
      } finally {
        setStatus('idle')
      }
    },
    [subjectId],
  )

  const removeDoc = (id: string) => {
    setDocsBySubject((prev) => ({
      ...prev,
      [subjectId]: prev[subjectId].filter((d) => d.id !== id),
    }))
    setSummaries((prev) => {
      const next = { ...prev }
      delete next[subjectId]
      return next
    })
  }

  const clearDocs = () => {
    setDocsBySubject((prev) => ({ ...prev, [subjectId]: [] }))
    setDraftBySubject((prev) => ({ ...prev, [subjectId]: '' }))
    setSummaries((prev) => {
      const next = { ...prev }
      delete next[subjectId]
      return next
    })
  }

  const collectNotes = (): NoteDoc[] => {
    const list = [...docs]
    const pasted = makePastedNote(draft)
    if (pasted) list.push(pasted)
    return list
  }

  const runSummary = async () => {
    const notes = collectNotes()
    if (!notes.length) return
    setError(null)
    setStatus('summarizing')
    await new Promise((r) => setTimeout(r, 40))
    try {
      const result = summarizeNotes(notes, subject)
      if (
        !result.bigIdeas.length &&
        !result.focusBreakdown.length &&
        !result.mustKnow.length
      ) {
        setError(
          'Couldn’t pull enough text from what you added. Paste notes below or use a text-based PDF.',
        )
        setSummaries((prev) => {
          const next = { ...prev }
          delete next[subjectId]
          return next
        })
      } else {
        setSummaries((prev) => ({ ...prev, [subjectId]: result }))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Summarization failed.')
    } finally {
      setStatus('idle')
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDrag(false)
    if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files)
  }

  const busy = status !== 'idle'
  const accentStyle = {
    ['--glow' as string]: `${subject.accent}40`,
    ['--chip-bg' as string]: subject.accentSoft,
    ['--chip-fg' as string]: subject.accent,
    ['--marker' as string]: subject.accent,
  }

  return (
    <div className="app" style={accentStyle}>
      <header className="hero">
        <h1 className="brand">
          Study<span>Forge</span>
        </h1>
        <p className="tagline">
          Add your own notes or PDFs. Each class skill only shapes how those
          notes are grouped — nothing is pre-written into the summary.
        </p>
      </header>

      <nav className="tabs" aria-label="Classes">
        {SUBJECTS.map((s) => {
          const active = s.id === subjectId
          return (
            <button
              key={s.id}
              type="button"
              className={`tab${active ? ' active' : ''}`}
              style={
                active
                  ? {
                      background: s.accent,
                      boxShadow: `0 8px 24px ${s.accent}40`,
                    }
                  : undefined
              }
              onClick={() => setSubjectId(s.id)}
            >
              {s.short}
            </button>
          )
        })}
      </nav>

      <section className="panel">
        <div className="subject-banner">
          <div>
            <h2 style={{ color: subject.accent }}>{subject.name}</h2>
            <p className="skill-label">Skill: {skill.label}</p>
          </div>
        </div>

        <div
          className={`dropzone${drag ? ' drag' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
        >
          <h3>Import PDFs</h3>
          <p>
            Drag & drop multiple PDFs here, or click to browse. Files stay in
            this browser tab only.
          </p>
          <input
            type="file"
            accept="application/pdf,.pdf"
            multiple
            disabled={busy}
            onChange={(e) => {
              if (e.target.files?.length) void addFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        <label className="paste-block">
          <span className="paste-title">Or paste / type notes</span>
          <textarea
            value={draft}
            disabled={busy}
            placeholder="Paste class notes here. The summary will use only this text (plus any PDFs you added)."
            onChange={(e) => {
              const value = e.target.value
              setDraftBySubject((prev) => ({ ...prev, [subjectId]: value }))
              setSummaries((prev) => {
                const next = { ...prev }
                delete next[subjectId]
                return next
              })
            }}
          />
        </label>

        {docs.length > 0 && (
          <ul className="file-list">
            {docs.map((d) => (
              <li key={d.id} className="file-row">
                <div className="file-meta">
                  <strong title={d.name}>{d.name}</strong>
                  <span>
                    {d.kind === 'pdf'
                      ? `${d.pageCount} page${d.pageCount === 1 ? '' : 's'} · `
                      : ''}
                    {d.charCount.toLocaleString()} characters
                  </span>
                </div>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => removeDoc(d.id)}
                  disabled={busy}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="actions">
          <button
            type="button"
            className="btn btn-primary"
            style={{ background: subject.accent }}
            disabled={!canSummarize || busy}
            onClick={() => void runSummary()}
          >
            {status === 'extracting' ? (
              <span className="loading">
                <span className="spinner" /> Reading PDFs…
              </span>
            ) : status === 'summarizing' ? (
              <span className="loading">
                <span className="spinner" /> Summarizing your notes…
              </span>
            ) : (
              `Summarize my ${subject.short} notes`
            )}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={(!docs.length && !draft.trim()) || busy}
            onClick={clearDocs}
          >
            Clear
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {summary && (
          <div className="summary">
            <article className="summary-card">
              <h3>{summary.title}</h3>
              <p className="sources">From: {summary.sourceNote}</p>
              {summary.keywords.length > 0 && (
                <div className="keywords">
                  {summary.keywords.map((k) => (
                    <span key={k} className="chip">
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </article>

            {summary.bigIdeas.length > 0 && (
              <article className="summary-card">
                <h3>Big ideas (from your notes)</h3>
                <ul>
                  {summary.bigIdeas.map((idea, i) => (
                    <li key={`idea-${i}`}>{idea}</li>
                  ))}
                </ul>
              </article>
            )}

            {summary.focusBreakdown.length > 0 && (
              <div className="section-grid">
                {summary.focusBreakdown.map((sec) => (
                  <article key={sec.area} className="summary-card">
                    <h3>{sec.area}</h3>
                    <ul>
                      {sec.notes.map((note, i) => (
                        <li key={`${sec.area}-${i}`}>{note}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}

            {summary.mustKnow.length > 0 && (
              <article className="summary-card">
                <h3>Also in your notes</h3>
                <ul>
                  {summary.mustKnow.map((item, i) => (
                    <li key={`must-${i}`}>{item}</li>
                  ))}
                </ul>
              </article>
            )}
          </div>
        )}
      </section>

      <p className="foot">
        Summaries use only text you add. Class skills group that text
        conceptually — they don’t invent explanations.
      </p>
    </div>
  )
}
