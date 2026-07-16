import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, api } from '../api'
import { PageError, PageLoading } from '../components/PageState'
import { formatDuration, getNicknameCookie } from '../lib/game'
import type { LeaderboardEntry, PuzzleDetail } from '../types'
import './Leaderboard.css'

function Medal({ rank }: { rank: number }) {
  if (rank > 3) return <span className="rank-number">{rank}</span>
  return <span className={`rank-medal rank-medal--${rank}`} aria-label={`Rank ${rank}`}>{['🥇', '🥈', '🥉'][rank - 1]}</span>
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
}

export default function Leaderboard() {
  const { shortId } = useParams<{ shortId: string }>()
  const [puzzle, setPuzzle] = useState<PuzzleDetail | null>(null)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<'missing' | 'network' | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)
  const currentNickname = getNicknameCookie()

  useEffect(() => {
    if (!shortId) return
    const controller = new AbortController()
    Promise.all([
      api.getPuzzle(shortId, controller.signal),
      api.getLeaderboard(shortId, controller.signal),
    ])
      .then(([loadedPuzzle, leaderboard]) => {
        setPuzzle(loadedPuzzle)
        setEntries(leaderboard)
      })
      .catch(errorValue => {
        if (errorValue instanceof DOMException && errorValue.name === 'AbortError') return
        setError(errorValue instanceof ApiError && errorValue.status === 404 ? 'missing' : 'network')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [requestVersion, shortId])

  const retry = () => {
    setLoading(true)
    setError(null)
    setRequestVersion(version => version + 1)
  }

  if (loading) return <PageLoading label="Tallying the scores" />

  if (error || !puzzle) {
    return (
      <PageError
        title={error === 'missing' ? 'No leaderboard here' : 'The scores are out of reach'}
        message={error === 'missing'
          ? 'This puzzle link may be incomplete or no longer available.'
          : 'We could not load the leaderboard. Check your connection and try again.'}
        action={error === 'network'
          ? <button className="button button--primary" type="button" onClick={retry}>Try again</button>
          : undefined}
      />
    )
  }

  return (
    <main className="leaderboard-page">
      <header className="leaderboard-header">
        <div>
          <span className="eyebrow">Leaderboard</span>
          <h1>{puzzle.title}</h1>
          <p>{entries.length === 0 ? 'The board is wide open.' : `${entries.length} ${entries.length === 1 ? 'player has' : 'players have'} finished this puzzle.`}</p>
        </div>
        <Link className="button button--primary" to={`/p/${shortId}`}>Play the puzzle <span aria-hidden="true">→</span></Link>
      </header>

      {entries.length === 0 ? (
        <section className="leaderboard-empty">
          <span className="leaderboard-empty__mark" aria-hidden="true">#1</span>
          <h2>First place is waiting</h2>
          <p>Complete the puzzle, submit your nickname, and put the first score on the board.</p>
          <Link className="button button--primary" to={`/p/${shortId}`}>Take the first run</Link>
        </section>
      ) : (
        <>
          <section className={`podium podium--${Math.min(entries.length, 3)}`} aria-label="Top players">
            {entries.slice(0, 3).map((entry, index) => {
              const rank = index + 1
              const isCurrentPlayer = Boolean(currentNickname && entry.nickname === currentNickname)
              return (
                <article className={`podium-card podium-card--${rank}${isCurrentPlayer ? ' is-current' : ''}`} key={`${entry.nickname}-${entry.completed_at}-${rank}`}>
                  <Medal rank={rank} />
                  <span className="podium-card__place">{rank === 1 ? 'First place' : rank === 2 ? 'Second place' : 'Third place'}</span>
                  <h2>{entry.nickname}</h2>
                  {isCurrentPlayer && <span className="podium-card__you">You</span>}
                  <strong>{entry.score}<small> / {puzzle.size}</small></strong>
                  <span className="podium-card__time">{formatDuration(entry.time_taken_secs)}</span>
                </article>
              )
            })}
          </section>

          <section className="standings" aria-labelledby="standings-title">
            <div className="standings__heading">
              <div>
                <span className="eyebrow">All results</span>
                <h2 id="standings-title">Full standings</h2>
              </div>
              <span>Score first, then fastest time</span>
            </div>
            <div className="standings__table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Rank</th>
                    <th scope="col">Player</th>
                    <th scope="col">Completed</th>
                    <th scope="col">Score</th>
                    <th scope="col">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => {
                    const isCurrentPlayer = Boolean(currentNickname && entry.nickname === currentNickname)
                    return (
                      <tr className={isCurrentPlayer ? 'is-current' : undefined} key={`${entry.nickname}-${entry.completed_at}-${index}`}>
                        <td><Medal rank={index + 1} /></td>
                        <th scope="row">
                          {entry.nickname}
                          {isCurrentPlayer && <span className="standings__you">You</span>}
                        </th>
                        <td>{formatDate(entry.completed_at)}</td>
                        <td><strong>{entry.score}</strong> / {puzzle.size}</td>
                        <td>{formatDuration(entry.time_taken_secs)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <div className="leaderboard-actions">
        <Link className="button button--quiet" to="/">Browse more puzzles</Link>
        <Link className="button button--secondary" to="/create">Build your own</Link>
      </div>
    </main>
  )
}
