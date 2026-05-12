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
