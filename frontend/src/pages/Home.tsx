import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { PuzzleSummary } from '../types'
import './Home.css'

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PuzzleSkeleton() {
  return (
    <div className="puzzle-card puzzle-card--skeleton" aria-hidden="true">
      <div className="skeleton-line skeleton-line--short" />
      <div className="skeleton-line skeleton-line--title" />
      <div className="skeleton-line" />
      <div className="skeleton-line skeleton-line--medium" />
    </div>
  )
}

export default function Home() {
  const [puzzles, setPuzzles] = useState<PuzzleSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    api.listPuzzles(controller.signal)
      .then(setPuzzles)
      .catch(errorValue => {
        if (errorValue instanceof DOMException && errorValue.name === 'AbortError') return
        setError('We could not load the puzzles. Check your connection and try again.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [requestVersion])

  const stats = useMemo(() => ({
    puzzles: puzzles.length,
    pages: puzzles.reduce((sum, puzzle) => sum + puzzle.size, 0),
    plays: puzzles.reduce((sum, puzzle) => sum + puzzle.completions, 0),
  }), [puzzles])

  const retry = () => {
    setLoading(true)
    setError(null)
    setRequestVersion(version => version + 1)
  }

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__copy">
          <span className="eyebrow">Wikipedia category puzzles</span>
          <h1>Create your own catfishing games</h1>
          <p>
            Guess the Wikipedia article from its categories. Don’t worry about
            capitalisation, accents, or anything in brackets.
          </p>
          <div className="home-hero__actions">
            <a className="button button--primary" href="#puzzles">
              Browse puzzles
              <ArrowIcon />
            </a>
            <Link className="button button--secondary" to="/create">Create a puzzle</Link>
          </div>
          <p className="home-attribution">
            Catfishify is inspired by <a href="https://catfishing.net/">catfishing.net</a>,
            the excellent daily Wikipedia category guessing game. This unofficial project is
            only for making custom puzzles; please play and support the daily game there.
          </p>
          <div className="home-proof" aria-label="How Catfishify works">
            <span><strong>01</strong> Read the categories</span>
            <span><strong>02</strong> Guess the article</span>
            <span><strong>03</strong> Share the result</span>
          </div>
        </div>

        <div className="clue-stack" aria-label="Example Wikipedia category clues">
          <div className="clue-card clue-card--back">
            <span>Category 03</span>
            <strong>Unsolved problems in physics</strong>
          </div>
          <div className="clue-card clue-card--middle">
            <span>Category 02</span>
            <strong>Time Person of the Century</strong>
          </div>
          <div className="clue-card clue-card--front">
            <div className="clue-card__topline">
              <span>Category 01</span>
              <span className="clue-card__seal" aria-hidden="true">?</span>
            </div>
            <strong>Nobel laureates in Physics</strong>
            <p>Which Wikipedia article is in these categories?</p>
            <div className="clue-card__answer">
              <span>Type your answer</span>
              <span aria-hidden="true">↵</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-stats" aria-label="Catfishify activity">
        <div>
          <strong>{loading ? '—' : stats.puzzles}</strong>
          <span>community puzzles</span>
        </div>
        <div>
          <strong>{loading ? '—' : stats.pages}</strong>
          <span>Wikipedia pages</span>
        </div>
        <div>
          <strong>{loading ? '—' : stats.plays}</strong>
          <span>games completed</span>
        </div>
      </section>

      <section className="puzzle-shelf" id="puzzles" aria-labelledby="puzzle-shelf-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Community puzzles</span>
            <h2 id="puzzle-shelf-title">Choose a puzzle</h2>
          </div>
          {!loading && !error && puzzles.length > 0 && (
            <p>Ordered by most played</p>
          )}
        </div>

        {loading && (
          <div className="puzzle-grid" aria-label="Loading puzzles" aria-busy="true">
            <PuzzleSkeleton />
            <PuzzleSkeleton />
            <PuzzleSkeleton />
          </div>
        )}

        {!loading && error && (
          <div className="shelf-state" role="alert">
            <span className="shelf-state__icon" aria-hidden="true">!</span>
            <div>
              <h3>Could not load puzzles</h3>
              <p>{error}</p>
            </div>
            <button className="button button--secondary" type="button" onClick={retry}>Try again</button>
          </div>
        )}

        {!loading && !error && puzzles.length === 0 && (
          <div className="shelf-state shelf-state--empty">
            <span className="shelf-state__icon" aria-hidden="true">＋</span>
            <div>
              <h3>No puzzles yet</h3>
              <p>Choose some Wikipedia pages and create the first puzzle.</p>
            </div>
            <Link className="button button--primary" to="/create">Create the first puzzle</Link>
          </div>
        )}

        {!loading && !error && puzzles.length > 0 && (
          <div className="puzzle-grid">
            {puzzles.map((puzzle, index) => (
              <Link className="puzzle-card" key={puzzle.short_id} to={`/p/${puzzle.short_id}`}>
                <div className="puzzle-card__topline">
                  <span>Puzzle {String(index + 1).padStart(2, '0')}</span>
                  <span className="puzzle-card__arrow"><ArrowIcon /></span>
                </div>
                <h3>{puzzle.title}</h3>
                <p>{puzzle.description || 'A custom Wikipedia category puzzle.'}</p>
                <div className="puzzle-card__meta">
                  <span>{puzzle.size} {puzzle.size === 1 ? 'page' : 'pages'}</span>
                  <span>{puzzle.completions} {puzzle.completions === 1 ? 'play' : 'plays'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="home-cta">
        <div>
          <span className="eyebrow">Create a puzzle</span>
          <h2>Choose the Wikipedia pages</h2>
          <p>Add up to ten pages, then share the finished puzzle with anyone.</p>
        </div>
        <Link className="button button--primary" to="/create">
          Create a puzzle
          <ArrowIcon />
        </Link>
      </section>
    </main>
  )
}
