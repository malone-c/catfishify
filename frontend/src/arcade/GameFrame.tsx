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
