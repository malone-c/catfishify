import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type GameFrameProps = {
  mode: string
  title: string
  description: string
  tone: string
  meta: string
  children: ReactNode
}

export function GameFrame({ mode, title, description, tone, meta, children }: GameFrameProps) {
  return (
    <main className={`arcade-page arcade-page--${tone}`}>
      <div className="arcade-game-wrap">
        <Link className="arcade-back" to="/arcade">
          <span aria-hidden="true">←</span>
          All experiments
        </Link>

        <header className="arcade-game-header">
          <div>
            <span className="arcade-kicker">{mode}</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <span className="arcade-meta">{meta}</span>
        </header>

        {children}
      </div>
    </main>
  )
}

type ProgressProps = {
  current: number
  total: number
  label?: string
}

export function GameProgress({ current, total, label = 'Round' }: ProgressProps) {
  return (
    <div className="arcade-progress" aria-label={`${label} ${Math.min(current + 1, total)} of ${total}`}>
      <div className="arcade-progress__copy">
        <span>{label}</span>
        <strong>{Math.min(current + 1, total)} / {total}</strong>
      </div>
      <div className="arcade-progress__track" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span
            className={index < current ? 'is-complete' : index === current ? 'is-current' : ''}
            key={index}
          />
        ))}
      </div>
    </div>
  )
}

type FeedbackProps = {
  correct: boolean
  title: string
  children: ReactNode
}

export function RoundFeedback({ correct, title, children }: FeedbackProps) {
  return (
    <div className={`arcade-feedback ${correct ? 'is-correct' : 'is-wrong'}`} role="status">
      <span className="arcade-feedback__mark" aria-hidden="true">{correct ? '✓' : '×'}</span>
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </div>
  )
}

type CompleteProps = {
  eyebrow?: string
  title: string
  score: ReactNode
  detail: string
  onReplay: () => void
  replayLabel?: string
  children?: ReactNode
}

export function GameComplete({
  eyebrow = 'Run complete',
  title,
  score,
  detail,
  onReplay,
  replayLabel = 'Play again',
  children,
}: CompleteProps) {
  return (
    <section className="arcade-complete" aria-labelledby="arcade-complete-title">
      <span className="arcade-kicker">{eyebrow}</span>
      <h2 id="arcade-complete-title">{title}</h2>
      <div className="arcade-complete__score">{score}</div>
      <p>{detail}</p>
      {children}
      <div className="arcade-complete__actions">
        <button className="button button--primary" type="button" onClick={onReplay}>{replayLabel}</button>
        <Link className="button button--secondary" to="/arcade">Try another mode</Link>
      </div>
    </section>
  )
}

export function CatScore({ value, label }: { value: number; label: string }) {
  return (
    <span className="arcade-score-chip">
      <span aria-hidden="true">●</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </span>
  )
}
