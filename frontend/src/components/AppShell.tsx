import { Link, NavLink, Outlet } from 'react-router-dom'
import BrandMark from './BrandMark'

export default function AppShell() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="site-header__inner">
          <Link className="wordmark" to="/" aria-label="Catfishify home">
            <BrandMark className="wordmark__mark" />
            <span>Catfishify</span>
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            <NavLink to="/" end>Explore</NavLink>
            <NavLink className="site-nav__create" to="/create">
              <span>Build a puzzle</span>
              <span aria-hidden="true">↗</span>
            </NavLink>
          </nav>
        </div>
      </header>

      <div id="main-content" className="app-content" tabIndex={-1}>
        <Outlet />
      </div>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <BrandMark className="site-footer__mark" />
            <div>
              <strong>Catfishify</strong>
              <span>Wikipedia categories, turned into a game.</span>
            </div>
          </div>
          <p>
            Made for curious people. Not affiliated with the Wikimedia Foundation.
          </p>
        </div>
      </footer>
    </div>
  )
}
