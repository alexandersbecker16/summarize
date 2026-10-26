# StudyForge — Class Note Summarizer

Import PDFs or paste notes, then get a **conceptual** summary built **only from what you added**. Class tabs use skills that group your text (rhetoric, systems, models, etc.) — they do not inject pre-written explanations.

Tabs: AP Lang · Multivariable Calculus · AP Bio · Chinese IV · AP Econ · AP US History

## Run it (from `C:\Cursor\summarize`)

### Easiest (Windows)

```bat
start.bat
```

Then open **http://localhost:5173**

### Manual

```bat
npm install
npm run dev
```

Portable Node (if needed):

```bat
.\.tools\node\npm.cmd install
.\.tools\node\npm.cmd run dev
```

## How to use

1. Pick a class tab (loads that subject’s **skill** for conceptual grouping).
2. Drop PDFs and/or paste notes in the text box.
3. Click **Summarize my … notes**.
4. Read sections built only from your text. Empty skill lenses are omitted.

**Tip:** Text-based PDFs work best. Scanned image-only PDFs usually extract little text.

## Stack

- Vite + React + TypeScript  
- `pdfjs-dist` for PDF text extraction  
- Subject skills in `src/skills/` (grouping only — no canned content)
