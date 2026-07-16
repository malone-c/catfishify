import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import './NotFound.css'

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-art" aria-hidden="true">
        <span>4</span>
        <BrandMark />
        <span>4</span>
      </div>
      <span className="eyebrow">Wrong turn</span>
      <h1>This page got away.</h1>
      <p>The link may be mistyped, or the page has wandered somewhere else.</p>
      <div className="not-found-actions">
        <Link className="button button--primary" to="/">Explore puzzles</Link>
        <Link className="button button--secondary" to="/create">Build a puzzle</Link>
      </div>
    </main>
  )
}
