import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main style={{ padding: '48px 32px', textAlign: 'center' }}>
      <h1>404</h1>
      <p>Page not found.</p>
      <Link to="/">← Home</Link>
    </main>
  )
}
