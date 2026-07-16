import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { api, ApiError } from '../../api'
import WikipediaAutocomplete from '../../components/WikipediaAutocomplete'
import type { ReverseCategoryRound } from '../../types'
import { GameFrame } from '../GameFrame'

type Resolution = {
  answer: string
  kind: 'solved' | 'revealed'
} | null

function wikipediaPageUrl(title: string) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`
}

function wikipediaCategoryUrl(category: string) {
  return `https://en.wikipedia.org/wiki/Category:${encodeURIComponent(category.replaceAll(' ', '_'))}`
}

export default function ReverseCatfishing() {
  const [round, setRound] = useState<ReverseCategoryRound | null>(null)
  const [guess, setGuess] = useState('')
  const [attempts, setAttempts] = useState<string[]>([])
  const [resolution, setResolution] = useState<Resolution>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const controller = new AbortController()

    api.getReverseCategoryRound(controller.signal)
      .then(setRound)
      .catch(errorValue => {
        if (errorValue instanceof DOMException && errorValue.name === 'AbortError') return
        setError(errorValue instanceof ApiError && errorValue.detail
          ? errorValue.detail
          : 'Wikipedia did not return a playable category.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [requestVersion])

  useEffect(() => {
    if (round && !resolution && !loading) inputRef.current?.focus()
  }, [loading, resolution, round])

  const newRound = () => {
    setLoading(true)
    setError(null)
    setRound(null)
    setGuess('')
    setAttempts([])
    setResolution(null)
    setRequestVersion(version => version + 1)
  }

  const submitGuess = async (event: FormEvent) => {
    event.preventDefault()
    const candidate = guess.trim()
    if (!round || !candidate || checking || resolution) return
    setChecking(true)
    setError(null)
    try {
      const result = await api.checkReverseCategory(round.round_id, candidate)
      if (result.correct && result.answer) {
        setResolution({ answer: result.answer, kind: 'solved' })
      } else {
        setAttempts(previous => [...previous, candidate])
        setGuess('')
        window.requestAnimationFrame(() => inputRef.current?.focus())
      }
    } catch (errorValue) {
      setError(errorValue instanceof ApiError && errorValue.detail
        ? errorValue.detail
        : 'The guess could not be checked.')
    } finally {
      setChecking(false)
    }
  }

  const reveal = async () => {
    if (!round || checking || resolution) return
    setChecking(true)
    setError(null)
    try {
      const result = await api.revealReverseCategory(round.round_id)
      setResolution({ answer: result.answer, kind: 'revealed' })
    } catch (errorValue) {
      setError(errorValue instanceof ApiError && errorValue.detail
        ? errorValue.detail
        : 'The category could not be revealed.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <GameFrame
      mode="Reverse Catfishing · Live Wikipedia"
      title="Name the category."
      description="Every page below is a direct member of one Wikipedia category. You get the complete list, can open every source page, and must supply the answer yourself."
      tone="reverse"
      meta={round ? `${round.member_count} complete members · free text` : 'Live category · free text'}
    >
      <section className="arcade-board arcade-board--reverse-live" aria-busy={loading}>
        {loading && (
          <div className="reverse-live-state">
            <span className="arcade-board-label">Sampling Wikipedia</span>
            <h2>Finding a category with a complete, readable membership.</h2>
            <div className="reverse-live-loader" aria-hidden="true"><span /></div>
            <p>Maintenance, oversized, and lexically self-revealing sets are discarded server-side.</p>
          </div>
        )}

        {!loading && error && !round && (
          <div className="reverse-live-state" role="alert">
            <span className="arcade-board-label">Round unavailable</span>
            <h2>{error}</h2>
            <button className="button button--primary" type="button" onClick={newRound}>Sample again</button>
          </div>
        )}

        {!loading && round && (
          <>
            <div className="reverse-live-head">
              <div>
                <span className="arcade-board-label">Complete direct membership</span>
                <h2>{round.member_count} Wikipedia pages</h2>
              </div>
              <p>Alphabetical · namespace 0 · complete direct membership</p>
            </div>

            <ol className="reverse-live-pages">
              {round.pages.map((page, index) => (
                <li key={page}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <a href={wikipediaPageUrl(page)} target="_blank" rel="noreferrer">{page}</a>
                  <span aria-hidden="true">↗</span>
                </li>
              ))}
            </ol>

            <div className="reverse-live-console">
              {!resolution ? (
                <>
                  <form onSubmit={submitGuess}>
                    <label htmlFor="reverse-category-guess">Category name</label>
                    <div className="reverse-live-input-row">
                      <WikipediaAutocomplete
                        id="reverse-category-guess"
                        ref={inputRef}
                        value={guess}
                        disabled={checking}
                        maxLength={300}
                        placeholder="Type the Wikipedia category"
                        search={api.searchWikipediaCategories}
                        onValueChange={setGuess}
                      />
                      <button className="button button--primary" disabled={!guess.trim() || checking} type="submit">
                        {checking ? 'Checking…' : 'Submit guess'}
                      </button>
                    </div>
                    <p>Suggestions are live Wikipedia categories. “Category:” is optional and free text remains accepted.</p>
                  </form>

                  <div className="reverse-live-attempts" aria-live="polite">
                    <div>
                      <span>Attempts</span>
                      <strong>{attempts.length}</strong>
                    </div>
                    {attempts.length > 0 && (
                      <ol>
                        {attempts.map((attempt, index) => (
                          <li key={`${attempt}-${index}`}><span>Incorrect</span><strong>{attempt}</strong></li>
                        ))}
                      </ol>
                    )}
                  </div>

                  {error && <p className="reverse-live-error" role="alert">{error}</p>}
                  <button className="reverse-live-reveal" disabled={checking} type="button" onClick={reveal}>Reveal category and end round</button>
                </>
              ) : (
                <div className={`reverse-live-resolution reverse-live-resolution--${resolution.kind}`} role="status">
                  <span className="arcade-board-label">{resolution.kind === 'solved' ? 'Solved' : 'Round ended'}</span>
                  <h2>{resolution.answer}</h2>
                  <p>
                    {resolution.kind === 'solved'
                      ? `Correct in ${attempts.length + 1} ${attempts.length === 0 ? 'attempt' : 'attempts'}.`
                      : `Revealed after ${attempts.length} ${attempts.length === 1 ? 'attempt' : 'attempts'}.`}
                  </p>
                  <div>
                    <a className="button button--secondary" href={wikipediaCategoryUrl(resolution.answer)} target="_blank" rel="noreferrer">Open category on Wikipedia ↗</a>
                    <button className="button button--primary" type="button" onClick={newRound}>New live category</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </GameFrame>
  )
}
