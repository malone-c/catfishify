import { Navigate, Route, Routes } from 'react-router-dom'
import ArcadeHub from './ArcadeHub'
import ReverseCatfishing from './games/ReverseCatfishing'
import './Arcade.css'

export default function ArcadeRoutes() {
  return (
    <Routes>
      <Route index element={<ArcadeHub />} />
      <Route path="reverse-catfishing" element={<ReverseCatfishing />} />
      <Route path="*" element={<Navigate replace to="/arcade" />} />
    </Routes>
  )
}
