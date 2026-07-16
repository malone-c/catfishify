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
    path: '/arcade/reverse-catfishing',
    number: '01',
    symbol: '⇄',
    title: 'Reverse Catfishing',
    description: 'A complete live category membership from Wikipedia. Infer the category and type it from memory.',
    mechanic: 'Live data · full evidence · free text',
    time: 'Unbounded',
    tone: 'reverse',
  },
]
