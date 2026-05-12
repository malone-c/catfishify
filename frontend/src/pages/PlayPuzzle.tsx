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

  const [answers, setAnswers] = useState<(AnswerDetail | null)[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [startTime, setStartTime] = useState(0)

  const [guess, setGuess] = useState('')
  const [guessState, setGuessState] = useState<GuessState>('waiting')

  const [nickname, setNickname] = useState(getNicknameCookie)
  const [submittingResult, setSubmittingResult] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  const isFinished = puzzle !== null && currentIndex >= puzzle.articles.length

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

  useEffect(() => {
    if (!shortId || !puzzle || answers.length === 0) return
    saveProgress(shortId, { answers, currentIndex, startTime })
  }, [answers, currentIndex, startTime, shortId, puzzle])

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

  // End screen
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
          {mins}m {secs.toString().padStart(2, '0')}s
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

  // Active article
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

      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {answers.map((a, i) => (
          <span key={i} style={{ fontSize: 20 }}>
            {i < currentIndex ? emojiForAnswer(a) : i === currentIndex ? '⬜' : '⬛'}
          </span>
        ))}
      </div>

      <section style={{ marginBottom: 24 }}>
        <h2>Categories</h2>
        <ul style={{ listStyle: 'disc', paddingLeft: 24 }}>
          {article.categories.map(c => (
            <li key={c} style={{ marginBottom: 4 }}>{c}</li>
          ))}
        </ul>
      </section>

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

      {/* Navigate away without finishing - will resume from localStorage */}
      <p style={{ marginTop: 32, fontSize: 14, color: 'var(--text)' }}>
        Progress is saved automatically.
      </p>
    </main>
  )
}
