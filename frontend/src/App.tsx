import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CreatePuzzle from './pages/CreatePuzzle'
import PlayPuzzle from './pages/PlayPuzzle'
import Leaderboard from './pages/Leaderboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/create" element={<CreatePuzzle />} />
        <Route path="/p/:shortId" element={<PlayPuzzle />} />
        <Route path="/p/:shortId/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
