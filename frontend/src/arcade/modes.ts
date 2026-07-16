export type ArcadeMode = {
  path: string
  number: string
  symbol: string
  title: string
  description: string
  mechanic: string
  time: string
  tone: string
}

export const arcadeModes: ArcadeMode[] = [
  {
    path: '/arcade/clue-ladder',
    number: '01',
    symbol: '≋',
    title: 'Clue Ladder',
    description: 'Reveal one category at a time. Solve early to keep the biggest catch.',
    mechanic: 'Progressive deduction',
    time: '3 min',
    tone: 'sea',
  },
  {
    path: '/arcade/red-herring',
    number: '02',
    symbol: '◇',
    title: 'Red Herring',
    description: 'Four categories swim together. One belongs to an entirely different page.',
    mechanic: 'Spot the deception',
    time: '2 min',
    tone: 'coral',
  },
  {
    path: '/arcade/which-wiki',
    number: '03',
    symbol: '⌕',
    title: 'Which Wiki?',
    description: 'Read the dossier, then pick the real article from a convincing lineup.',
    mechanic: 'Rapid multiple choice',
    time: '2 min',
    tone: 'gold',
  },
  {
    path: '/arcade/school-of-fish',
    number: '04',
    symbol: '∴',
    title: 'School of Fish',
    description: 'Sort nine drifting categories back into their three Wikipedia pages.',
    mechanic: 'Category sorting',
    time: '4 min',
    tone: 'ink',
  },
  {
    path: '/arcade/wiki-pairs',
    number: '05',
    symbol: '▦',
    title: 'Wiki Pairs',
    description: 'Match article titles with signature categories in a compact memory game.',
    mechanic: 'Memory matching',
    time: '3 min',
    tone: 'grove',
  },
  {
    path: '/arcade/nine-lives',
    number: '06',
    symbol: '9',
    title: 'Nine Lives',
    description: 'Build a streak through an endless shoal. Every miss costs a life.',
    mechanic: 'Endless survival',
    time: '∞',
    tone: 'night',
  },
  {
    path: '/arcade/daily-catch',
    number: '07',
    symbol: '☼',
    title: 'Daily Catch',
    description: 'Five shared dossiers each day, a local streak, and a spoiler-safe result grid.',
    mechanic: 'Daily ritual',
    time: '3 min',
    tone: 'sun',
  },
  {
    path: '/arcade/reverse-catfishing',
    number: '08',
    symbol: '⇄',
    title: 'Reverse Catfishing',
    description: 'See every page in a tiny Wikipedia category, then name the connection.',
    mechanic: 'Reverse deduction',
    time: '3 min',
    tone: 'reverse',
  },
]
