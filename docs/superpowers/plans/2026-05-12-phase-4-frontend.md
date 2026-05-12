# Phase 4 — Frontend: Create & Play Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full frontend for Catfishify — Home, Create Puzzle, and Play Puzzle pages — plus a backend answer-check endpoint needed to validate guesses during gameplay.

**Architecture:** The frontend uses React + TypeScript + Vite with react-router-dom. A typed API client (`api.ts`) wraps all `fetch` calls against the `/api` proxy. The Play Puzzle page stores progress in localStorage (keyed by `short_id`) so games can be resumed; nicknames are persisted in a cookie. Because the puzzle's article titles are intentionally stripped from `GET /api/puzzles/{short_id}` (to prevent cheating), a new `POST /api/puzzles/{short_id}/check-answer` backend endpoint is added to validate guesses server-side.

**Tech Stack:** React 19, TypeScript 6, Vite, react-router-dom 7, FastAPI (backend), pytest + httpx TestClient (backend tests)

---

## File Map

**Create:**
- `frontend/src/types.ts` — shared TypeScript interfaces matching backend Pydantic schemas
- `frontend/src/api.ts` — typed API client (all `fetch` calls live here)
- `frontend/src/pages/Home.tsx` — lists all puzzles with play counts

**Modify:**
- `frontend/src/App.tsx` — swap placeholder `<div>Home</div>` for `<Home />`
- `frontend/src/pages/CreatePuzzle.tsx` — full implementation
- `frontend/src/pages/PlayPuzzle.tsx` — full implementation
- `backend/app/schemas.py` — add `AnswerCheckRequest` + `AnswerCheckResult`
- `backend/app/routers/puzzles.py` — add `POST /api/puzzles/{short_id}/check-answer`
- `backend/tests/test_puzzles_router.py` — add tests for the new endpoint

---

## Task 1: Shared TypeScript types

**Files:**
- Create: `frontend/src/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// frontend/src/types.ts

export interface ArticleForPlayer {
  categories: string[]
}

export interface PuzzleSummary {
  short_id: string
  title: string
  description: string | null
  size: number
  completions: number
}

export interface PuzzleDetail {
  short_id: string
  title: string
  description: string | null
  size: number
  articles: ArticleForPlayer[]
}

export interface ArticleInput {
  wikipedia_title: string
  categories: string[]
  alt_titles: string[]
}

export type AnswerDetail = 'correct' | 'half' | 'wrong' | 'skipped'

export interface ResultCreate {
  nickname: string
  score: number
  time_taken_secs: number
  answer_details: AnswerDetail[]
}

export interface WikiSearchResult {
  title: string
  snippet: string
}

export interface WikiArticleData {
  categories: string[]
  alt_titles: string[]
}
```

- [ ] **Step 2: Verify TypeScript compilation (no output means success)**

Run from `frontend/`:
```
npx tsc --noEmit
```
Expected: exits with code 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 2: Typed API client

**Files:**
- Create: `frontend/src/api.ts`

- [ ] **Step 1: Create the API client**

```typescript
// frontend/src/api.ts

import type {
  PuzzleSummary,
  PuzzleDetail,
  ArticleInput,
  ResultCreate,
  WikiSearchResult,
  WikiArticleData,
} from './types'

const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const api = {
  listPuzzles: (): Promise<PuzzleSummary[]> =>
    request('/puzzles'),

  createPuzzle: (body: {
    title: string
    description?: string
    articles: ArticleInput[]
  }): Promise<{ short_id: string }> =>
    request('/puzzles', { method: 'POST', body: JSON.stringify(body) }),

  getPuzzle: (shortId: string): Promise<PuzzleDetail> =>
    request(`/puzzles/${shortId}`),

  checkAnswer: (
    shortId: string,
    articleIndex: number,
    guess: string,
  ): Promise<{ correct: boolean }> =>
    request(`/puzzles/${shortId}/check-answer`, {
      method: 'POST',
      body: JSON.stringify({ article_index: articleIndex, guess }),
    }),

  submitResult: (
    shortId: string,
    body: ResultCreate,
  ): Promise<{ id: string }> =>
    request(`/puzzles/${shortId}/results`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  searchWikipedia: (q: string): Promise<WikiSearchResult[]> =>
    request(`/wikipedia/search?q=${encodeURIComponent(q)}`),

  getWikipediaArticle: (title: string): Promise<WikiArticleData> =>
    request(`/wikipedia/article?title=${encodeURIComponent(title)}`),
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run from `frontend/`:
```
npx tsc --noEmit
```
Expected: exits with code 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api.ts
git commit -m "feat: add typed API client"
```

---

## Task 3: Backend — check-answer endpoint

Because article titles are stripped from `GET /api/puzzles/{short_id}`, the frontend cannot check guesses locally. This endpoint validates a guess server-side using the same `answer_check` service already used in tests.

**Files:**
- Modify: `backend/app/schemas.py`
- Modify: `backend/app/routers/puzzles.py`
- Modify: `backend/tests/test_puzzles_router.py`

- [ ] **Step 1: Write the failing tests**

Append to `backend/tests/test_puzzles_router.py`:

```python
def test_check_answer_correct(client):
    r = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    short_id = r.json()["short_id"]
    response = client.post(
        f"/api/puzzles/{short_id}/check-answer",
        json={"article_index": 0, "guess": "Albert Einstein"},
    )
    assert response.status_code == 200
    assert response.json() == {"correct": True}


def test_check_answer_wrong(client):
    r = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    short_id = r.json()["short_id"]
    response = client.post(
        f"/api/puzzles/{short_id}/check-answer",
        json={"article_index": 0, "guess": "Isaac Newton"},
    )
    assert response.status_code == 200
    assert response.json() == {"correct": False}


def test_check_answer_accepts_alt_title(client):
    r = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    short_id = r.json()["short_id"]
    response = client.post(
        f"/api/puzzles/{short_id}/check-answer",
        json={"article_index": 0, "guess": "Einstein"},
    )
    assert response.status_code == 200
    assert response.json() == {"correct": True}


def test_check_answer_accepts_typo_within_edit_distance_1(client):
    r = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    short_id = r.json()["short_id"]
    response = client.post(
        f"/api/puzzles/{short_id}/check-answer",
        json={"article_index": 0, "guess": "albert einstien"},
    )
    assert response.status_code == 200
    assert response.json() == {"correct": True}


def test_check_answer_404_for_unknown_puzzle(client):
    response = client.post(
        "/api/puzzles/notexist/check-answer",
        json={"article_index": 0, "guess": "anything"},
    )
    assert response.status_code == 404


def test_check_answer_400_for_invalid_article_index(client):
    r = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    short_id = r.json()["short_id"]
    response = client.post(
        f"/api/puzzles/{short_id}/check-answer",
        json={"article_index": 99, "guess": "anything"},
    )
    assert response.status_code == 400
```

- [ ] **Step 2: Run tests to confirm they fail**

Run from `backend/`:
```
uv run pytest tests/test_puzzles_router.py::test_check_answer_correct -v
```
Expected: FAIL — `404 Not Found` (endpoint does not exist yet).

- [ ] **Step 3: Add schemas to `backend/app/schemas.py`**

Append after the `LeaderboardEntry` class:

```python
class AnswerCheckRequest(BaseModel):
    article_index: int
    guess: str


class AnswerCheckResult(BaseModel):
    correct: bool
```

- [ ] **Step 4: Add the endpoint to `backend/app/routers/puzzles.py`**

Add the import at the top of the file (after existing imports):

```python
from app.services import answer_check
from app.schemas import (
    AnswerCheckRequest,
    AnswerCheckResult,
    # ...existing imports stay...
)
```

Replace the existing imports block in `puzzles.py` with:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Puzzle, Result
from app.schemas import (
    AnswerCheckRequest,
    AnswerCheckResult,
    ArticleForPlayer,
    LeaderboardEntry,
    PuzzleCreate,
    PuzzleCreated,
    PuzzleDetail,
    PuzzleSummary,
    ResultCreate,
    ResultCreated,
)
from app.services import answer_check
from app.utils import generate_short_id
```

Then append the new route at the end of `backend/app/routers/puzzles.py`:

```python
@router.post("/puzzles/{short_id}/check-answer")
def check_answer_endpoint(
    short_id: str, body: AnswerCheckRequest, db: Session = Depends(get_db)
) -> AnswerCheckResult:
    puzzle = db.query(Puzzle).filter_by(short_id=short_id).first()
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    if body.article_index < 0 or body.article_index >= len(puzzle.articles):
        raise HTTPException(status_code=400, detail="Invalid article index")
    article = puzzle.articles[body.article_index]
    correct = answer_check.check_answer(
        body.guess, article["wikipedia_title"], article["alt_titles"]
    )
    return AnswerCheckResult(correct=correct)
```

- [ ] **Step 5: Run all new tests to confirm they pass**

Run from `backend/`:
```
uv run pytest tests/test_puzzles_router.py -v -k "check_answer"
```
Expected: all 6 `test_check_answer_*` tests PASS.

- [ ] **Step 6: Run the full test suite to confirm no regressions**

Run from `backend/`:
```
uv run pytest -v
```
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/app/schemas.py backend/app/routers/puzzles.py backend/tests/test_puzzles_router.py
git commit -m "feat: add check-answer endpoint"
```

---

## Task 4: Home page

**Files:**
- Create: `frontend/src/pages/Home.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create `frontend/src/pages/Home.tsx`**

```tsx
// frontend/src/pages/Home.tsx

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { PuzzleSummary } from '../types'

export default function Home() {
  const [puzzles, setPuzzles] = useState<PuzzleSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.listPuzzles()
      .then(setPuzzles)
      .catch(() => setError('Failed to load puzzles.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main style={{ padding: '0 32px' }}>
      <h1>Catfishify 🐈</h1>
      <p>Guess the Wikipedia article from its categories.</p>
      <p style={{ margin: '16px 0' }}>
        <Link to="/create">Create a puzzle →</Link>
      </p>

      {loading && <p>Loading puzzles…</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && puzzles.length === 0 && (
        <p>No puzzles yet. <Link to="/create">Be the first to create one!</Link></p>
      )}

      {puzzles.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', maxWidth: 640, margin: '0 auto' }}>
          {puzzles.map(p => (
            <li key={p.short_id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <Link to={`/p/${p.short_id}`} style={{ fontWeight: 500, color: 'var(--text-h)' }}>
                {p.title}
              </Link>
              {p.description && (
                <span style={{ color: 'var(--text)', marginLeft: 8 }}>— {p.description}</span>
              )}
              <span style={{ display: 'block', fontSize: 14, marginTop: 4, color: 'var(--text)' }}>
                {p.size} articles · {p.completions} {p.completions === 1 ? 'play' : 'plays'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Update `frontend/src/App.tsx` to import Home**

Replace the contents of `frontend/src/App.tsx` with:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CreatePuzzle from './pages/CreatePuzzle'
import PlayPuzzle from './pages/PlayPuzzle'
import Leaderboard from './pages/Leaderboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreatePuzzle />} />
        <Route path="/p/:shortId" element={<PlayPuzzle />} />
        <Route path="/p/:shortId/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 3: Verify TypeScript compilation**

Run from `frontend/`:
```
npx tsc --noEmit
```
Expected: exits with code 0.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Home.tsx frontend/src/App.tsx
git commit -m "feat: add home page"
```

---

## Task 5: Create Puzzle page

**Files:**
- Modify: `frontend/src/pages/CreatePuzzle.tsx`

The page has three sections: puzzle metadata (title, description, size), article slots showing what's been added, and a Wikipedia search area for finding and previewing articles before adding them to the next empty slot.

- [ ] **Step 1: Implement `frontend/src/pages/CreatePuzzle.tsx`**

```tsx
// frontend/src/pages/CreatePuzzle.tsx

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import type { ArticleInput, WikiSearchResult, WikiArticleData } from '../types'

interface PreviewArticle extends WikiArticleData {
  wikipedia_title: string
}

export default function CreatePuzzle() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [size, setSize] = useState<5 | 10>(5)
  const [articles, setArticles] = useState<(ArticleInput | null)[]>(Array(5).fill(null))
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WikiSearchResult[]>([])
  const [preview, setPreview] = useState<PreviewArticle | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Resize slot array when size picker changes, preserving already-added articles
  useEffect(() => {
    setArticles(prev => {
      const next: (ArticleInput | null)[] = Array(size).fill(null)
      for (let i = 0; i < Math.min(prev.length, size); i++) next[i] = prev[i]
      return next
    })
  }, [size])

  const handleSearchChange = (q: string) => {
    setSearchQuery(q)
    setPreview(null)
    clearTimeout(debounceRef.current)
    if (!q.trim()) { setSearchResults([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        setSearchResults(await api.searchWikipedia(q))
      } catch {
        setSearchResults([])
      }
    }, 300)
  }

  const handleSelectResult = async (wikiTitle: string) => {
    setSearchQuery(wikiTitle)
    setSearchResults([])
    setLoadingPreview(true)
    try {
      const data = await api.getWikipediaArticle(wikiTitle)
      setPreview({ wikipedia_title: wikiTitle, ...data })
    } catch {
      setError('Could not load article. Try another.')
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleAddArticle = () => {
    if (!preview) return
    const slotIndex = articles.findIndex(a => a === null)
    if (slotIndex === -1) return
    setArticles(prev => {
      const next = [...prev]
      next[slotIndex] = {
        wikipedia_title: preview.wikipedia_title,
        categories: preview.categories,
        alt_titles: preview.alt_titles,
      }
      return next
    })
    setPreview(null)
    setSearchQuery('')
  }

  const handleRemoveArticle = (index: number) => {
    setArticles(prev => { const next = [...prev]; next[index] = null; return next })
  }

  const allFilled = articles.every(a => a !== null)
  const hasEmptySlot = articles.some(a => a === null)

  const handleSubmit = async () => {
    if (!title.trim() || !allFilled || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await api.createPuzzle({
        title: title.trim(),
        description: description.trim() || undefined,
        articles: articles as ArticleInput[],
      })
      navigate(`/p/${result.short_id}`)
    } catch {
      setError('Failed to create puzzle. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <main style={{ padding: '0 32px', maxWidth: 640, margin: '0 auto', textAlign: 'left' }}>
      <p style={{ marginTop: 24 }}><Link to="/">← Home</Link></p>
      <h1>Create a Puzzle</h1>

      {/* Metadata */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 500 }}>Title *</span>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Famous Scientists"
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, font: 'inherit' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 500 }}>Description</span>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional short description"
            rows={2}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, font: 'inherit', resize: 'vertical' }}
          />
        </label>

        <fieldset style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '12px 16px' }}>
          <legend style={{ fontWeight: 500 }}>Number of articles</legend>
          <div style={{ display: 'flex', gap: 24 }}>
            {([5, 10] as const).map(n => (
              <label key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="size"
                  value={n}
                  checked={size === n}
                  onChange={() => setSize(n)}
                />
                {n} articles
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Article slots */}
      <h2>Articles ({articles.filter(Boolean).length}/{size})</h2>
      <ol style={{ padding: '0 0 0 20px', margin: '0 0 32px' }}>
        {articles.map((article, i) => (
          <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            {article ? (
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  <strong>{article.wikipedia_title}</strong>
                  <span style={{ color: 'var(--text)', marginLeft: 8, fontSize: 14 }}>
                    {article.categories.length} categories
                  </span>
                </span>
                <button
                  onClick={() => handleRemoveArticle(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: 18 }}
                  aria-label={`Remove ${article.wikipedia_title}`}
                >
                  ×
                </button>
              </span>
            ) : (
              <em style={{ color: 'var(--text)' }}>Empty</em>
            )}
          </li>
        ))}
      </ol>

      {/* Wikipedia search (only shown while slots remain) */}
      {hasEmptySlot && (
        <section style={{ marginBottom: 32 }}>
          <h2>Search Wikipedia</h2>
          <div style={{ position: 'relative' }}>
            <input
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search for a Wikipedia article…"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, font: 'inherit', boxSizing: 'border-box' }}
            />
            {searchResults.length > 0 && (
              <ul style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
                listStyle: 'none', padding: 0, margin: 0, zIndex: 10,
              }}>
                {searchResults.map(r => (
                  <li key={r.title}>
                    <button
                      onClick={() => handleSelectResult(r.title)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 12px',
                        background: 'none', border: 'none', cursor: 'pointer', font: 'inherit',
                      }}
                    >
                      {r.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {loadingPreview && <p style={{ marginTop: 12 }}>Loading article…</p>}

          {preview && (
            <div style={{ marginTop: 16, padding: 16, border: '1px solid var(--accent-border)', borderRadius: 8, background: 'var(--accent-bg)' }}>
              <h3 style={{ margin: '0 0 8px' }}>{preview.wikipedia_title}</h3>
              <p style={{ fontSize: 14, marginBottom: 8 }}>
                {preview.categories.length} categories · {preview.alt_titles.length} alternative title(s)
              </p>
              <ul style={{ listStyle: 'disc', paddingLeft: 20, margin: '0 0 16px', fontSize: 14 }}>
                {preview.categories.map(c => <li key={c}>{c}</li>)}
              </ul>
              <button
                onClick={handleAddArticle}
                style={{
                  padding: '8px 16px', background: 'var(--accent)', color: '#fff',
                  border: 'none', borderRadius: 6, cursor: 'pointer', font: 'inherit',
                }}
              >
                Add to puzzle
              </button>
            </div>
          )}
        </section>
      )}

      {error && <p role="alert" style={{ color: 'red', marginBottom: 16 }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!title.trim() || !allFilled || submitting}
        style={{
          padding: '10px 24px', background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: 6, cursor: allFilled && title.trim() ? 'pointer' : 'not-allowed',
          opacity: allFilled && title.trim() ? 1 : 0.5, font: 'inherit', fontSize: 16, marginBottom: 48,
        }}
      >
        {submitting ? 'Creating…' : 'Create Puzzle'}
      </button>
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run from `frontend/`:
```
npx tsc --noEmit
```
Expected: exits with code 0.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/CreatePuzzle.tsx
git commit -m "feat: implement create puzzle page"
```

---

## Task 6: Play Puzzle page — gameplay loop

**Files:**
- Modify: `frontend/src/pages/PlayPuzzle.tsx`

**Game state shape stored in localStorage:**
```typescript
// key: `catfishify-progress-${shortId}`
{
  answers: Array<'correct' | 'half' | 'wrong' | 'skipped' | null>,
  currentIndex: number,   // index of next article to answer
  startTime: number,      // epoch ms when the game began
}
```

**Nickname cookie:** name `catfishify-nickname`, read/written via `document.cookie`.

**Emoji map:** `correct → 🐈`, `half → 🐡`, `wrong/skipped → 🐟`

**Per-article flow:**
1. **waiting** — user sees categories, input, and three buttons: [Check] [Half Point] [Skip]
2. After submitting a guess:
   - **correct** — show ✓, [Next] button (marks `correct`, advances)
   - **wrong** — show ✗, offer [Try Again] [Half Point] [Skip]
3. **[Half Point]** — marks `half`, advances (from either `waiting` or `wrong` state)
4. **[Skip]** — marks `skipped`, advances (from either state)

- [ ] **Step 1: Implement `frontend/src/pages/PlayPuzzle.tsx`**

```tsx
// frontend/src/pages/PlayPuzzle.tsx

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import type { AnswerDetail, PuzzleDetail } from '../types'

type GuessState = 'waiting' | 'checking' | 'correct' | 'wrong'

interface StoredProgress {
  answers: (AnswerDetail | null)[]
  currentIndex: number
  startTime: number
}

function loadProgress(shortId: string): StoredProgress | null {
  try {
    const raw = localStorage.getItem(`catfishify-progress-${shortId}`)
    return raw ? (JSON.parse(raw) as StoredProgress) : null
  } catch {
    return null
  }
}

function saveProgress(shortId: string, progress: StoredProgress) {
  localStorage.setItem(`catfishify-progress-${shortId}`, JSON.stringify(progress))
}

function clearProgress(shortId: string) {
  localStorage.removeItem(`catfishify-progress-${shortId}`)
}

function getNicknameCookie(): string {
  const match = document.cookie.match(/(?:^|;\s*)catfishify-nickname=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

function setNicknameCookie(nickname: string) {
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)
  document.cookie = `catfishify-nickname=${encodeURIComponent(nickname)}; expires=${expires.toUTCString()}; path=/`
}

function emojiForAnswer(a: AnswerDetail | null): string {
  if (a === 'correct') return '🐈'
  if (a === 'half') return '🐡'
  return '🐟'
}

export default function PlayPuzzle() {
  const { shortId } = useParams<{ shortId: string }>()
  const navigate = useNavigate()

  const [puzzle, setPuzzle] = useState<PuzzleDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Progress state
  const [answers, setAnswers] = useState<(AnswerDetail | null)[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [startTime, setStartTime] = useState(0)

  // Per-article UI state
  const [guess, setGuess] = useState('')
  const [guessState, setGuessState] = useState<GuessState>('waiting')

  // End screen state
  const [nickname, setNickname] = useState(getNicknameCookie)
  const [submittingResult, setSubmittingResult] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  const isFinished = puzzle !== null && currentIndex >= puzzle.articles.length

  // Load puzzle and restore progress
  useEffect(() => {
    if (!shortId) return
    api.getPuzzle(shortId)
      .then(p => {
        setPuzzle(p)
        const stored = loadProgress(shortId)
        if (stored && stored.answers.length === p.articles.length) {
          setAnswers(stored.answers)
          setCurrentIndex(stored.currentIndex)
          setStartTime(stored.startTime)
        } else {
          // Fresh game
          const now = Date.now()
          const fresh: StoredProgress = {
            answers: Array(p.articles.length).fill(null),
            currentIndex: 0,
            startTime: now,
          }
          setAnswers(fresh.answers)
          setCurrentIndex(0)
          setStartTime(now)
          saveProgress(shortId, fresh)
        }
      })
      .catch(() => setLoadError('Puzzle not found.'))
  }, [shortId])

  // Persist progress whenever answers or currentIndex change
  useEffect(() => {
    if (!shortId || !puzzle || answers.length === 0) return
    saveProgress(shortId, { answers, currentIndex, startTime })
  }, [answers, currentIndex, startTime, shortId, puzzle])

  // Focus the guess input when article changes
  useEffect(() => {
    if (!isFinished) inputRef.current?.focus()
  }, [currentIndex, isFinished])

  const advance = useCallback((outcome: AnswerDetail) => {
    setAnswers(prev => {
      const next = [...prev]
      next[currentIndex] = outcome
      return next
    })
    setCurrentIndex(i => i + 1)
    setGuess('')
    setGuessState('waiting')
  }, [currentIndex])

  const handleCheck = async () => {
    if (!shortId || !guess.trim() || guessState === 'checking') return
    setGuessState('checking')
    try {
      const { correct } = await api.checkAnswer(shortId, currentIndex, guess.trim())
      setGuessState(correct ? 'correct' : 'wrong')
    } catch {
      setGuessState('wrong')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCheck()
  }

  const handleSubmitResult = async () => {
    if (!shortId || !nickname.trim() || submittingResult) return
    setSubmittingResult(true)
    setSubmitError(null)
    setNicknameCookie(nickname.trim())

    const finalAnswers = answers.map(a => a ?? 'skipped') as AnswerDetail[]
    const score = finalAnswers.reduce((sum, a) => {
      if (a === 'correct') return sum + 1
      if (a === 'half') return sum + 0.5
      return sum
    }, 0)
    const timeTakenSecs = Math.floor((Date.now() - startTime) / 1000)

    try {
      await api.submitResult(shortId, {
        nickname: nickname.trim(),
        score,
        time_taken_secs: timeTakenSecs,
        answer_details: finalAnswers,
      })
      clearProgress(shortId)
      setSubmitted(true)
    } catch {
      setSubmitError('Failed to submit. Please try again.')
      setSubmittingResult(false)
    }
  }

  if (loadError) {
    return (
      <main style={{ padding: '32px' }}>
        <p role="alert">{loadError}</p>
        <Link to="/">← Home</Link>
      </main>
    )
  }

  if (!puzzle) return <main style={{ padding: '32px' }}><p>Loading…</p></main>

  // --- End screen ---
  if (isFinished) {
    const finalAnswers = answers.map(a => a ?? 'skipped') as AnswerDetail[]
    const score = finalAnswers.reduce((sum, a) => {
      if (a === 'correct') return sum + 1
      if (a === 'half') return sum + 0.5
      return sum
    }, 0)
    const emojiString = finalAnswers.map(emojiForAnswer).join('')
    const timeTakenSecs = Math.floor((Date.now() - startTime) / 1000)
    const mins = Math.floor(timeTakenSecs / 60)
    const secs = timeTakenSecs % 60

    return (
      <main style={{ padding: '0 32px', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ marginTop: 48 }}>🐈 Finished!</h1>
        <p style={{ fontSize: 24, margin: '8px 0' }}>
          <strong>{score}</strong> / {puzzle.articles.length}
        </p>
        <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 24 }}>
          {mins}m {secs}s
        </p>
        <p style={{ fontSize: 28, letterSpacing: 4, marginBottom: 32 }}>{emojiString}</p>

        {!submitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', maxWidth: 300, textAlign: 'left' }}>
              <span style={{ fontWeight: 500 }}>Nickname</span>
              <input
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="Enter a nickname"
                maxLength={50}
                style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, font: 'inherit' }}
              />
            </label>
            {submitError && <p role="alert" style={{ color: 'red' }}>{submitError}</p>}
            <button
              onClick={handleSubmitResult}
              disabled={!nickname.trim() || submittingResult}
              style={{
                padding: '10px 24px', background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: 6, cursor: nickname.trim() ? 'pointer' : 'not-allowed',
                opacity: nickname.trim() ? 1 : 0.5, font: 'inherit', fontSize: 16,
              }}
            >
              {submittingResult ? 'Submitting…' : 'Submit to leaderboard'}
            </button>
          </div>
        ) : (
          <p>✓ Score submitted!</p>
        )}

        <p style={{ marginTop: 24 }}>
          <Link to={`/p/${shortId}/leaderboard`}>View leaderboard →</Link>
        </p>
        <p style={{ marginTop: 8 }}>
          <Link to="/">← Home</Link>
        </p>
      </main>
    )
  }

  // --- Active article ---
  const article = puzzle.articles[currentIndex]

  return (
    <main style={{ padding: '0 32px', maxWidth: 640, margin: '0 auto', textAlign: 'left' }}>
      <p style={{ marginTop: 24, color: 'var(--text)', fontSize: 14 }}>
        <Link to="/">← Home</Link>
      </p>
      <h1>{puzzle.title}</h1>
      {puzzle.description && <p style={{ marginBottom: 24 }}>{puzzle.description}</p>}

      <p style={{ color: 'var(--text)', fontSize: 14, marginBottom: 16 }}>
        Article {currentIndex + 1} of {puzzle.articles.length}
      </p>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {answers.map((a, i) => (
          <span key={i} style={{ fontSize: 20 }}>
            {i < currentIndex ? emojiForAnswer(a) : i === currentIndex ? '⬜' : '⬛'}
          </span>
        ))}
      </div>

      {/* Categories */}
      <section style={{ marginBottom: 24 }}>
        <h2>Categories</h2>
        <ul style={{ listStyle: 'disc', paddingLeft: 24 }}>
          {article.categories.map(c => (
            <li key={c} style={{ marginBottom: 4 }}>{c}</li>
          ))}
        </ul>
      </section>

      {/* Guess area */}
      {guessState !== 'correct' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            ref={inputRef}
            value={guess}
            onChange={e => setGuess(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Guess the Wikipedia article…"
            disabled={guessState === 'checking'}
            style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 6, font: 'inherit', fontSize: 16 }}
          />

          {guessState === 'wrong' && (
            <p role="alert" style={{ color: 'var(--text)', margin: 0 }}>
              ✗ Not quite. Try again, claim a half point, or skip.
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={handleCheck}
              disabled={!guess.trim() || guessState === 'checking'}
              style={{
                padding: '8px 20px', background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: 6, cursor: guess.trim() ? 'pointer' : 'not-allowed',
                opacity: guess.trim() ? 1 : 0.5, font: 'inherit',
              }}
            >
              {guessState === 'checking' ? 'Checking…' : 'Check'}
            </button>

            <button
              onClick={() => advance('half')}
              style={{ padding: '8px 20px', background: 'none', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', font: 'inherit' }}
            >
              🐡 Half point
            </button>

            <button
              onClick={() => advance('skipped')}
              style={{ padding: '8px 20px', background: 'none', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', font: 'inherit' }}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {guessState === 'correct' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ color: 'green', fontWeight: 500, margin: 0 }}>🐈 Correct!</p>
          <button
            onClick={() => advance('correct')}
            style={{
              padding: '8px 20px', background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer', font: 'inherit', alignSelf: 'flex-start',
            }}
          >
            Next →
          </button>
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run from `frontend/`:
```
npx tsc --noEmit
```
Expected: exits with code 0.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/PlayPuzzle.tsx
git commit -m "feat: implement play puzzle page"
```

---

## Task 7: Smoke test the full flow

- [ ] **Step 1: Start the backend**

Run from `backend/`:
```
uv run uvicorn app.main:app --reload
```
Expected: `Application startup complete.` on port 8000.

- [ ] **Step 2: Start the frontend dev server**

Run from `frontend/` in a second terminal:
```
npm run dev
```
Expected: `Local: http://localhost:5173`

- [ ] **Step 3: Verify home page loads**

Open `http://localhost:5173`. Expected: "Catfishify 🐈" heading, "Create a puzzle →" link, empty puzzle list with prompt.

- [ ] **Step 4: Verify create puzzle flow**

1. Click "Create a puzzle →"
2. Enter title `Test Quiz`, leave description blank, leave size at 5
3. Search for "Albert Einstein", click the result, confirm categories appear
4. Click "Add to puzzle" — slot 1 fills
5. Repeat for 4 more articles (e.g. Marie Curie, Isaac Newton, Charles Darwin, Nikola Tesla)
6. Click "Create Puzzle"
7. Expected: redirects to `/p/{short_id}` showing the play page

- [ ] **Step 5: Verify play puzzle flow**

1. Page should show article 1's categories
2. Type the correct article title and click Check → "🐈 Correct!", then Next
3. Click "Half Point" on article 2 → advances with 🐡
4. Click "Skip" on article 3 → advances with 🐟
5. Enter wrong guess on article 4 → "✗ Not quite." message appears
6. Click "Check" again with correct answer → "🐈 Correct!"
7. Complete remaining article
8. Expected: end screen with score, emoji string, nickname input

- [ ] **Step 6: Verify localStorage resume**

1. Start a puzzle but only answer 1–2 articles
2. Refresh the page
3. Expected: resumes at the article where you left off (previous answers shown as emoji dots)

- [ ] **Step 7: Verify result submission**

1. Complete all articles
2. Enter a nickname and click "Submit to leaderboard"
3. Expected: "✓ Score submitted!" and link to leaderboard

- [ ] **Step 8: Verify home page shows the new puzzle**

Navigate to `/` — expected: the puzzle appears in the list with correct play count.
