import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, api } from '../api'
import { PageError, PageLoading } from '../components/PageState'
import {
  clearProgress,
  createProgress,
  emojiForAnswer,
  formatDuration,
  getNicknameCookie,
  loadProgress,
  saveProgress,
  scoreAnswers,
  setNicknameCookie,
  type StoredProgress,
} from '../lib/game'
import type { AnswerDetail, PuzzleDetail } from '../types'
import './PlayPuzzle.css'

type GuessState = 'waiting' | 'checking' | 'correct' | 'wrong' | 'error'

interface RevealedAnswer {
  title: string
  outcome: 'half' | 'skipped'
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="15" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="5" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="15" cy="15" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m7 9 5.9-3M7 11l5.9 3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export default function PlayPuzzle() {
  const { shortId } = useParams<{ shortId: string }>()
  const [puzzle, setPuzzle] = useState<PuzzleDetail | null>(null)
  const [progress, setProgress] = useState<StoredProgress | null>(null)
  const [loadError, setLoadError] = useState<'missing' | 'network' | null>(null)
  const [guess, setGuess] = useState('')
  const [guessState, setGuessState] = useState<GuessState>('waiting')
  const [revealedAnswer, setRevealedAnswer] = useState<RevealedAnswer | null>(null)
  const [revealingAnswer, setRevealingAnswer] = useState(false)
  const [revealError, setRevealError] = useState<string | null>(null)
  const [nickname, setNickname] = useState(getNicknameCookie)
  const [submittingResult, setSubmittingResult] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'error'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const finishHeadingRef = useRef<HTMLHeadingElement>(null)
  const shareTimeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!shortId) return
    const controller = new AbortController()
    api.getPuzzle(shortId, controller.signal)
      .then(loadedPuzzle => {
        const stored = loadProgress(shortId, loadedPuzzle.articles.length)
        const nextProgress = stored ?? createProgress(loadedPuzzle.articles.length)
        if (nextProgress.currentIndex === loadedPuzzle.articles.length && !nextProgress.finishedAt) {
          nextProgress.finishedAt = Date.now()
        }
        setPuzzle(loadedPuzzle)
        setProgress(nextProgress)
        saveProgress(shortId, nextProgress)
      })
      .catch(errorValue => {
        if (errorValue instanceof DOMException && errorValue.name === 'AbortError') return
        setLoadError(errorValue instanceof ApiError && errorValue.status === 404 ? 'missing' : 'network')
      })
    return () => controller.abort()
  }, [shortId])

  useEffect(() => {
    if (!shortId || !progress) return
    saveProgress(shortId, progress)
  }, [progress, shortId])

  const isFinished = Boolean(puzzle && progress && progress.currentIndex >= puzzle.articles.length)

  useEffect(() => {
    if (isFinished) finishHeadingRef.current?.focus()
  }, [isFinished])

  useEffect(() => {
    if (!isFinished && guessState !== 'correct') inputRef.current?.focus()
  }, [guessState, isFinished, progress?.currentIndex])

  useEffect(() => () => window.clearTimeout(shareTimeoutRef.current), [])

  const advance = useCallback((outcome: AnswerDetail) => {
    if (!puzzle) return
    const completedAt = Date.now()
    setProgress(previous => {
      if (!previous) return previous
      const answers = [...previous.answers]
      answers[previous.currentIndex] = outcome
      const currentIndex = Math.min(previous.currentIndex + 1, puzzle.articles.length)
      return {
        ...previous,
        answers,
        currentIndex,
        finishedAt: currentIndex === puzzle.articles.length ? completedAt : undefined,
      }
    })
    setGuess('')
    setGuessState('waiting')
    setRevealedAnswer(null)
    setRevealError(null)
    setRevealingAnswer(false)
  }, [puzzle])

  const handleCheck = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!shortId || !progress || !guess.trim() || guessState === 'checking' || revealedAnswer) return
    setGuessState('checking')
    try {
      const { correct } = await api.checkAnswer(shortId, progress.currentIndex, guess.trim())
      setGuessState(correct ? 'correct' : 'wrong')
    } catch {
      setGuessState('error')
    }
  }

  const handleReveal = async (outcome: RevealedAnswer['outcome']) => {
    if (!shortId || !progress || revealingAnswer) return
    setRevealingAnswer(true)
    setRevealError(null)
    try {
      const result = await api.revealAnswer(shortId, progress.currentIndex)
      setRevealedAnswer({ title: result.wikipedia_title, outcome })
    } catch {
      setRevealError('We could not reveal the page. Your progress is safe—try again.')
    } finally {
      setRevealingAnswer(false)
    }
  }

  const finalAnswers = useMemo(
    () => progress?.answers.map(answer => answer ?? 'skipped') as AnswerDetail[] | undefined,
    [progress?.answers],
  )
  const score = finalAnswers ? scoreAnswers(finalAnswers) : 0

  const handleSubmitResult = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!shortId || !progress || !finalAnswers || !nickname.trim() || submittingResult) return
    setSubmittingResult(true)
    setSubmitError(null)
    const cleanNickname = nickname.trim()
    setNicknameCookie(cleanNickname)

    try {
      await api.submitResult(shortId, {
        nickname: cleanNickname,
        score,
        time_taken_secs: Math.floor(((progress.finishedAt ?? progress.startedAt) - progress.startedAt) / 1000),
        answer_details: finalAnswers,
      })
      clearProgress(shortId)
      setSubmitted(true)
    } catch {
      setSubmitError('Your score is safe here, but we could not reach the leaderboard. Try again.')
      setSubmittingResult(false)
    }
  }

  const handleShare = async () => {
    if (!puzzle || !shortId || !finalAnswers) return
    const emojiString = finalAnswers.map(emojiForAnswer).join('')
    const text = [
      'Catfishify 🐈',
      `“${puzzle.title}”`,
      `${score} / ${puzzle.articles.length}`,
      '',
      emojiString,
      '',
      `${window.location.origin}/p/${shortId}`,
    ].join('\n')

    try {
      if (navigator.share) {
        await navigator.share({ title: `Catfishify: ${puzzle.title}`, text })
      } else {
        await navigator.clipboard.writeText(text)
      }
      setShareStatus('shared')
    } catch (errorValue) {
      if (errorValue instanceof DOMException && errorValue.name === 'AbortError') return
      setShareStatus('error')
    }
    window.clearTimeout(shareTimeoutRef.current)
    shareTimeoutRef.current = window.setTimeout(() => setShareStatus('idle'), 2500)
  }

  const handleRestart = () => {
    if (!puzzle || !shortId) return
    const fresh = createProgress(puzzle.articles.length)
    setProgress(fresh)
    saveProgress(shortId, fresh)
    setGuess('')
    setGuessState('waiting')
    setRevealedAnswer(null)
    setRevealingAnswer(false)
    setRevealError(null)
    setSubmitted(false)
    setSubmittingResult(false)
    setSubmitError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loadError) {
    return (
      <PageError
        title={loadError === 'missing' ? 'That puzzle slipped away' : 'We lost the trail'}
        message={loadError === 'missing'
          ? 'The link may be incomplete, or this puzzle no longer exists.'
          : 'Catfishify could not load this puzzle. Check your connection and try again.'}
        action={loadError === 'network'
          ? <button className="button button--primary" type="button" onClick={() => window.location.reload()}>Try again</button>
          : undefined}
      />
    )
  }

  if (!puzzle || !progress) return <PageLoading label="Fetching the clues" />

  if (isFinished && finalAnswers) {
    const emojiString = finalAnswers.map(emojiForAnswer).join('')
    const timeTakenSeconds = Math.floor(((progress.finishedAt ?? progress.startedAt) - progress.startedAt) / 1000)
    const correctCount = finalAnswers.filter(answer => answer === 'correct').length
    const halfCount = finalAnswers.filter(answer => answer === 'half').length

    return (
      <main className="finish-page">
        <section className="finish-hero">
          <span className="eyebrow">Puzzle complete</span>
          <h1 ref={finishHeadingRef} tabIndex={-1}>{score === puzzle.articles.length ? 'Clean catch.' : score >= puzzle.articles.length / 2 ? 'Nicely fished.' : 'A slippery one.'}</h1>
          <p>{puzzle.title}</p>
        </section>

        <section className="score-card" aria-label={`Final score ${score} out of ${puzzle.articles.length}`}>
          <div className="score-card__number">
            <span>Your score</span>
            <strong>{score}<small> / {puzzle.articles.length}</small></strong>
          </div>
          <div className="score-card__details">
            <div><strong>{correctCount}</strong><span>clean catches</span></div>
            <div><strong>{halfCount}</strong><span>close calls</span></div>
            <div><strong>{formatDuration(timeTakenSeconds)}</strong><span>on the clock</span></div>
          </div>
          <div className="score-card__emoji" aria-label="Answer results">{emojiString}</div>
        </section>

        <div className="finish-grid">
          <section className="finish-panel finish-panel--leaderboard">
            {!submitted ? (
              <>
                <span className="finish-panel__number">01</span>
                <h2>Claim your place</h2>
                <p>Add a nickname to join this puzzle&apos;s leaderboard.</p>
                <form onSubmit={handleSubmitResult}>
                  <label htmlFor="nickname">Nickname</label>
                  <div className="finish-input-row">
                    <input
                      id="nickname"
                      value={nickname}
                      onChange={event => setNickname(event.target.value)}
                      placeholder="Your nickname"
                      maxLength={50}
                      autoComplete="nickname"
                    />
                    <button className="button button--primary" type="submit" disabled={!nickname.trim() || submittingResult}>
                      {submittingResult ? 'Submitting…' : 'Submit score'}
                    </button>
                  </div>
                  {submitError && <p className="finish-error" role="alert">{submitError}</p>}
                </form>
              </>
            ) : (
              <div className="finish-success" role="status">
                <span aria-hidden="true">✓</span>
                <div>
                  <h2>You&apos;re on the board</h2>
                  <p>Your score was submitted as <strong>{nickname.trim()}</strong>.</p>
                </div>
                <Link className="button button--primary" to={`/p/${shortId}/leaderboard`}>View leaderboard</Link>
              </div>
            )}
          </section>

          <section className="finish-panel finish-panel--share">
            <span className="finish-panel__number">02</span>
            <h2>Pass it on</h2>
            <p>Share the result without spoiling any answers.</p>
            <button className="button button--secondary finish-share" type="button" onClick={() => void handleShare()}>
              <span className={`finish-share__icon${shareStatus === 'shared' ? ' is-hidden' : ''}`}><ShareIcon /></span>
              <span className={`finish-share__check${shareStatus === 'shared' ? ' is-visible' : ''}`} aria-hidden="true">✓</span>
              {shareStatus === 'shared' ? 'Shared' : shareStatus === 'error' ? 'Could not share' : 'Share result'}
            </button>
          </section>
        </div>

        <div className="finish-actions">
          <button className="button button--quiet" type="button" onClick={handleRestart}>Play this puzzle again</button>
          <Link className="button button--secondary" to="/">Find another puzzle <ArrowIcon /></Link>
        </div>
      </main>
    )
  }

  const article = puzzle.articles[progress.currentIndex]

  return (
    <main className="play-page">
      <header className="play-heading">
        <div>
          <span className="eyebrow">Now playing</span>
          <h1>{puzzle.title}</h1>
          {puzzle.description && <p>{puzzle.description}</p>}
        </div>
        <Link className="button button--quiet" to={`/p/${shortId}/leaderboard`}>Leaderboard</Link>
      </header>

      <section className="game-board">
        <div className="game-progress">
          <div className="game-progress__label">
            <span>Task {progress.currentIndex + 1}</span>
            <span>{progress.currentIndex + 1} of {puzzle.articles.length}</span>
          </div>
          <ol className="game-progress__track" aria-label="Puzzle progress">
            {progress.answers.map((answer, index) => (
              <li
                className={`${index === progress.currentIndex ? 'is-current' : ''}${index < progress.currentIndex ? ' is-complete' : ''}`}
                key={index}
                aria-current={index === progress.currentIndex ? 'step' : undefined}
                aria-label={index < progress.currentIndex
                  ? `Task ${index + 1}: ${answer === 'correct' ? 'correct' : answer === 'half' ? 'half point' : 'skipped'}`
                  : index === progress.currentIndex ? `Task ${index + 1}: current` : `Task ${index + 1}: not started`}
              >
                {index < progress.currentIndex ? emojiForAnswer(answer) : index + 1}
              </li>
            ))}
          </ol>
        </div>

        <div className="clue-panel">
          <div className="clue-panel__heading">
            <div>
              <span>Wikipedia categories</span>
              <h2>What page do these belong to?</h2>
            </div>
            <span className="clue-panel__count">{article.categories.length} clues</span>
          </div>
          {article.categories.length > 0 ? (
            <ul className="category-grid">
              {article.categories.map((category, index) => (
                <li key={category}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {category}
                </li>
              ))}
            </ul>
          ) : (
            <div className="category-empty">
              <span aria-hidden="true">?</span>
              <p>This page has no usable categories. Take a wild guess or skip it.</p>
            </div>
          )}
        </div>

        <form className={`guess-panel guess-panel--${guessState}`} onSubmit={handleCheck}>
          <label htmlFor="article-guess">Your answer</label>
          <div className="guess-input-row">
            <input
              id="article-guess"
              ref={inputRef}
              value={guess}
              onChange={event => {
                setGuess(event.target.value)
                if (guessState === 'wrong' || guessState === 'error') setGuessState('waiting')
              }}
              placeholder="Type the Wikipedia page title…"
              disabled={guessState === 'checking' || guessState === 'correct' || Boolean(revealedAnswer) || revealingAnswer}
              autoComplete="off"
              spellCheck="false"
            />
            <button className="button button--primary" type="submit" disabled={!guess.trim() || guessState === 'checking' || guessState === 'correct'}>
              {guessState === 'checking' ? 'Checking…' : 'Check answer'}
            </button>
          </div>

          <div className="guess-feedback" aria-live="polite">
            {revealedAnswer ? (
              <div className="guess-message guess-message--reveal">
                <span aria-hidden="true">↗</span>
                <div>
                  <strong>The page was {revealedAnswer.title}</strong>
                  <p>{revealedAnswer.outcome === 'half' ? 'Close call recorded for half a point.' : 'No points this time—one for the memory bank.'}</p>
                </div>
                <button className="button button--primary" type="button" onClick={() => advance(revealedAnswer.outcome)}>
                  {progress.currentIndex === puzzle.articles.length - 1 ? 'See my score' : 'Next task'}
                  <ArrowIcon />
                </button>
              </div>
            ) : guessState === 'wrong' ? (
              <div className="guess-message guess-message--wrong">
                <span aria-hidden="true">×</span>
                <div><strong>Not that one.</strong><p>Try another answer, take a close call, or move on.</p></div>
              </div>
            ) : guessState === 'error' ? (
              <div className="guess-message guess-message--error" role="alert">
                <span aria-hidden="true">!</span>
                <div><strong>We could not check that answer.</strong><p>Your progress is safe. Check your connection and try again.</p></div>
              </div>
            ) : guessState === 'correct' ? (
              <div className="guess-message guess-message--correct">
                <span aria-hidden="true">✓</span>
                <div><strong>Clean catch!</strong><p>That is the page.</p></div>
                <button className="button button--primary" type="button" onClick={() => advance('correct')}>
                  {progress.currentIndex === puzzle.articles.length - 1 ? 'See my score' : 'Next task'}
                  <ArrowIcon />
                </button>
              </div>
            ) : null}
            {revealError && <p className="reveal-error" role="alert">{revealError}</p>}
          </div>

          {guessState !== 'correct' && !revealedAnswer && (
            <div className="guess-options">
              {guessState === 'wrong' && (
                <button className="button button--secondary" type="button" onClick={() => void handleReveal('half')} disabled={revealingAnswer}>
                  {revealingAnswer ? 'Revealing…' : '🐡 I was close — ½ point'}
                </button>
              )}
              <button className="button button--quiet" type="button" onClick={() => void handleReveal('skipped')} disabled={revealingAnswer}>
                {revealingAnswer ? 'Revealing…' : 'Skip this task'}
              </button>
            </div>
          )}
        </form>
      </section>

      <p className="save-note"><span aria-hidden="true">✓</span> Progress saves automatically on this device.</p>
    </main>
  )
}
