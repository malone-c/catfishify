import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import CreatePuzzle from './pages/CreatePuzzle'
import Home from './pages/Home'
import Leaderboard from './pages/Leaderboard'
import NotFound from './pages/NotFound'
import PlayPuzzle from './pages/PlayPuzzle'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreatePuzzle />} />
          <Route path="/p/:shortId" element={<PlayPuzzle />} />
          <Route path="/p/:shortId/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
