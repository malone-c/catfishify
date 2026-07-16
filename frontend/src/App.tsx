import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import CreatePuzzle from './pages/CreatePuzzle'
import Home from './pages/Home'
import Leaderboard from './pages/Leaderboard'
import NotFound from './pages/NotFound'
import PlayPuzzle from './pages/PlayPuzzle'

const ArcadeRoutes = lazy(() => import('./arcade/ArcadeRoutes'))

function ArcadeEntry() {
  return (
    <Suspense fallback={(
      <main className="page-state page-state--loading" aria-busy="true">
        <span className="page-state__eyebrow">Catfishify Arcade</span>
        <p>Opening the experiments…</p>
        <div className="page-state__pulse" aria-hidden="true" />
      </main>
    )}>
      <ArcadeRoutes />
    </Suspense>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreatePuzzle />} />
          <Route path="/p/:shortId" element={<PlayPuzzle />} />
          <Route path="/p/:shortId/leaderboard" element={<Leaderboard />} />
          <Route path="/arcade/*" element={<ArcadeEntry />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
