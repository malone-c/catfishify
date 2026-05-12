import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import type { LeaderboardEntry, PuzzleDetail } from '../types'

export default function Leaderboard() {
  const { shortId } = useParams<{ shortId: string }>()

  const [puzzle, setPuzzle] = useState<PuzzleDetail | null>(null)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Read nickname from cookie for row highlight
  const match = document.cookie.match(/(?:^|;\s*)catfishify-nickname=([^;]*)/)
  const currentNickname = match ? decodeURIComponent(match[1]) : ''

  useEffect(() => {
    if (!shortId) return
    Promise.all([api.getPuzzle(shortId), api.getLeaderboard(shortId)])
      .then(([p, lb]) => {
        setPuzzle(p)
        setEntries(lb)
      })
      .catch((e: Error) => {
        if (e.message.startsWith('404')) setError('Puzzle not found.')
        else setError('Failed to load leaderboard.')
      })
      .finally(() => setLoading(false))
  }, [shortId])

  if (loading) return <main style={{ padding: '32px' }}><p>Loading…</p></main>

  if (error) {
    return (
      <main style={{ padding: '32px' }}>
        <p role="alert">{error}</p>
        <Link to="/">← Home</Link>
      </main>
    )
  }

  return (
    <main style={{ padding: '0 32px', maxWidth: 640, margin: '0 auto' }}>
      <p style={{ marginTop: 24 }}><Link to="/">← Home</Link></p>
      <h1>{puzzle?.title} — Leaderboard</h1>

      {entries.length === 0 ? (
        <p>No results yet. <Link to={`/p/${shortId}`}>Be the first to play!</Link></p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', width: 40 }}>#</th>
              <th style={{ padding: '8px 12px' }}>Nickname</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Score</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const isCurrentPlayer = currentNickname && entry.nickname === currentNickname
              const mins = Math.floor(entry.time_taken_secs / 60)
              const secs = entry.time_taken_secs % 60
              return (
                <tr
                  key={i}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: isCurrentPlayer ? 'var(--accent-bg)' : undefined,
                    fontWeight: isCurrentPlayer ? 600 : undefined,
                  }}
                >
                  <td style={{ padding: '8px 12px', color: 'var(--text)' }}>{i + 1}</td>
                  <td style={{ padding: '8px 12px' }}>{entry.nickname}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    {entry.score} / {puzzle?.size}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text)' }}>
                    {mins}m {secs.toString().padStart(2, '0')}s
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <p style={{ marginTop: 24 }}>
        <Link to={`/p/${shortId}`}>← Play again</Link>
      </p>
    </main>
  )
}
