import { Route, Routes } from 'react-router-dom'
import ArcadeHub from './ArcadeHub'
import ClueLadder from './games/ClueLadder'
import DailyCatch from './games/DailyCatch'
import NineLives from './games/NineLives'
import RedHerring from './games/RedHerring'
import ReverseCatfishing from './games/ReverseCatfishing'
import SchoolOfFish from './games/SchoolOfFish'
import WhichWiki from './games/WhichWiki'
import WikiPairs from './games/WikiPairs'
import './Arcade.css'

export default function ArcadeRoutes() {
  return (
    <Routes>
      <Route index element={<ArcadeHub />} />
      <Route path="clue-ladder" element={<ClueLadder />} />
      <Route path="red-herring" element={<RedHerring />} />
      <Route path="which-wiki" element={<WhichWiki />} />
      <Route path="school-of-fish" element={<SchoolOfFish />} />
      <Route path="wiki-pairs" element={<WikiPairs />} />
      <Route path="nine-lives" element={<NineLives />} />
      <Route path="daily-catch" element={<DailyCatch />} />
      <Route path="reverse-catfishing" element={<ReverseCatfishing />} />
    </Routes>
  )
}
