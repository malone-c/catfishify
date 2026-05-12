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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Resize slot array when size changes, preserving already-added articles
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
          border: 'none', borderRadius: 6,
          cursor: allFilled && title.trim() ? 'pointer' : 'not-allowed',
          opacity: allFilled && title.trim() ? 1 : 0.5, font: 'inherit', fontSize: 16, marginBottom: 48,
        }}
      >
        {submitting ? 'Creating…' : 'Create Puzzle'}
      </button>
    </main>
  )
}
