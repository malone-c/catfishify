import { Link } from 'react-router-dom'
import { arcadeModes } from './modes'

export default function ArcadeHub() {
  const reverse = arcadeModes[0]

  return (
    <main className="arcade-hub arcade-hub--reconsidered">
      <section className="arcade-hero arcade-hero--reconsidered">
        <div className="arcade-hero__copy">
          <span className="arcade-kicker">Catfishify experimental games</span>
          <h1>The arcade is being rebuilt around actual difficulty.</h1>
          <p>
            The first batch reduced deduction to recognition. Those games have been retired from
            this index. The surviving experiment uses live Wikipedia data, exposes the complete
            evidence set, and asks for a typed answer.
          </p>
          <Link className="button button--primary" to={reverse.path}>Play Reverse Catfishing</Link>
        </div>

        <aside className="arcade-standard" aria-label="Arcade design standard">
          <span>New standard</span>
          <ul>
            <li>No multiple choice</li>
            <li>No handcrafted answer bank</li>
            <li>No withheld evidence</li>
            <li>No difficulty-by-countdown</li>
          </ul>
        </aside>
      </section>

      <section className="arcade-index" aria-labelledby="arcade-index-title">
        <div className="arcade-section-heading">
          <div>
            <span className="arcade-kicker">Playable now</span>
            <h2 id="arcade-index-title">One mode survived.</h2>
          </div>
          <p>Each round is generated from Wikipedia at request time.</p>
        </div>

        <Link className="arcade-feature" to={reverse.path}>
          <div className="arcade-feature__topline">
            <span>{reverse.number}</span>
            <span>{reverse.time}</span>
          </div>
          <div className="arcade-feature__body">
            <span className="arcade-feature__symbol" aria-hidden="true">{reverse.symbol}</span>
            <div>
              <h3>{reverse.title}</h3>
              <p>{reverse.description}</p>
            </div>
          </div>
          <div className="arcade-feature__footer">
            <span>{reverse.mechanic}</span>
            <span aria-hidden="true">Begin ↗</span>
          </div>
        </Link>
      </section>
    </main>
  )
}
