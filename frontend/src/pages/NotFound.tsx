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
      <span className="eyebrow">404</span>
      <h1>Page not found</h1>
      <p>The link may be mistyped, or the page may no longer exist.</p>
      <div className="not-found-actions">
        <Link className="button button--primary" to="/">Browse puzzles</Link>
        <Link className="button button--secondary" to="/create">Create a puzzle</Link>
      </div>
    </main>
  )
}
