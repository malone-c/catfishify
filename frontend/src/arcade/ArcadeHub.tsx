import { useState } from 'react'
import { Link } from 'react-router-dom'
import { arcadeModes } from './modes'

export default function ArcadeHub() {
  const [surprise] = useState(() => arcadeModes[Math.floor(Math.random() * arcadeModes.length)])

  return (
    <main className="arcade-hub">
      <section className="arcade-hero">
        <div className="arcade-hero__copy">
          <span className="arcade-kicker">Catfishify design lab</span>
          <h1>Eight ways to get catfished.</h1>
          <p>
            Small games about identity, categories, memory, and misdirection. Each experiment
            keeps the Wikipedia weirdness and changes what your brain has to do with it.
          </p>
          <div className="arcade-hero__actions">
            <Link className="button button--primary" to={surprise.path}>Surprise me</Link>
            <a className="button button--secondary" href="#experiments">See every experiment</a>
          </div>
        </div>

        <div className="arcade-hero__specimen" aria-hidden="true">
          <div className="specimen-orbit specimen-orbit--outer"><span>?</span></div>
          <div className="specimen-orbit specimen-orbit--inner"><span>≋</span></div>
          <div className="specimen-core">
            <span>08</span>
            <strong>playable<br />experiments</strong>
          </div>
        </div>
      </section>

      <section className="arcade-index" id="experiments" aria-labelledby="arcade-index-title">
        <div className="arcade-section-heading">
          <div>
            <span className="arcade-kicker">The collection</span>
            <h2 id="arcade-index-title">Pick a mechanic</h2>
          </div>
          <p>No account, no setup, no effect on the main game.</p>
        </div>

        <div className="arcade-grid">
          {arcadeModes.map(mode => (
            <Link className={`arcade-card arcade-card--${mode.tone}`} key={mode.path} to={mode.path}>
              <div className="arcade-card__topline">
                <span>{mode.number}</span>
                <span>{mode.time}</span>
              </div>
              <span className="arcade-card__symbol" aria-hidden="true">{mode.symbol}</span>
              <h3>{mode.title}</h3>
              <p>{mode.description}</p>
              <div className="arcade-card__footer">
                <span>{mode.mechanic}</span>
                <span aria-hidden="true">↗</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <aside className="arcade-note">
        <span className="arcade-note__mark" aria-hidden="true">✦</span>
        <div>
          <strong>Experimental on purpose</strong>
          <p>These modes use a handcrafted starter deck so each loop is immediately playable. The original community puzzle game remains exactly where it was.</p>
        </div>
      </aside>
    </main>
  )
}
