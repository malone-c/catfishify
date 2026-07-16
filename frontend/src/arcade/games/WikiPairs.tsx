import { useMemo, useState } from 'react'
import { articleById, seededShuffle } from '../data'
import { GameComplete, GameFrame } from '../GameFrame'

const pairDefinitions = [
  ['einstein', 'Nobel laureates in Physics'],
  ['axolotl', 'Paedomorphism'],
  ['everest', 'Seven Summits'],
  ['kahlo', 'Self-portraitists'],
  ['voyager', 'Spacecraft escaping the Solar System'],
  ['pizza', 'Neapolitan cuisine'],
] as const

type PairCard = {
  id: string
  pairId: string
  kind: 'article' | 'category'
  label: string
  symbol: string
}

function makeCards(seed: number): PairCard[] {
  const cards = pairDefinitions.flatMap(([articleId, category]) => {
    const article = articleById[articleId]
    return [
      { id: `${articleId}-article`, pairId: articleId, kind: 'article' as const, label: article.title, symbol: article.emoji },
      { id: `${articleId}-category`, pairId: articleId, kind: 'category' as const, label: category, symbol: '#' },
    ]
  })
  return seededShuffle(cards, seed)
}

export default function WikiPairs() {
  const [seed, setSeed] = useState(1_118)
  const cards = useMemo(() => makeCards(seed), [seed])
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<string[]>([])
  const [moves, setMoves] = useState(0)
  const [locked, setLocked] = useState(false)
  const [finished, setFinished] = useState(false)

  const flip = (index: number) => {
    const card = cards[index]
    if (locked || flipped.includes(index) || matched.includes(card.pairId)) return
    if (flipped.length === 0) {
      setFlipped([index])
      return
    }

    const firstIndex = flipped[0]
    const firstCard = cards[firstIndex]
    setFlipped([firstIndex, index])
    setMoves(value => value + 1)
    setLocked(true)
    const isMatch = firstCard.pairId === card.pairId && firstCard.kind !== card.kind

    window.setTimeout(() => {
      if (isMatch) {
        const nextMatched = [...matched, card.pairId]
        setMatched(nextMatched)
        if (nextMatched.length === pairDefinitions.length) setFinished(true)
      }
      setFlipped([])
      setLocked(false)
    }, 540)
  }

  const reset = () => {
    setSeed(value => value + 29)
    setFlipped([])
    setMatched([])
    setMoves(0)
    setLocked(false)
    setFinished(false)
  }

  return (
    <GameFrame
      mode="Experiment 05 · Memory"
      title="Wiki Pairs"
      description="Every article title has one signature category hiding in the grid. Turn two cards at a time and reunite all six pairs."
      tone="pairs"
      meta="6 pairs · move counter"
    >
      {finished ? (
        <GameComplete
          title={moves <= 9 ? 'An almost photographic catch.' : moves <= 14 ? 'A tidy memory map.' : 'Every pair eventually surfaced.'}
          score={<><strong>{moves}</strong><span>moves</span></>}
          detail="The shuffle changes every run, but each article always has the same telltale category."
          onReplay={reset}
          replayLabel="Shuffle and replay"
        />
      ) : (
        <section className="arcade-board arcade-board--pairs">
          <div className="pairs-status">
            <div><span>Pairs found</span><strong>{matched.length} / {pairDefinitions.length}</strong></div>
            <div><span>Moves</span><strong>{moves}</strong></div>
          </div>
          <div className="pairs-grid" aria-label="Wikipedia memory cards">
            {cards.map((card, index) => {
              const visible = flipped.includes(index) || matched.includes(card.pairId)
              return (
                <button
                  aria-label={visible ? card.label : `Hidden card ${index + 1}`}
                  className={`pair-card ${visible ? 'is-visible' : ''} ${matched.includes(card.pairId) ? 'is-matched' : ''}`}
                  disabled={matched.includes(card.pairId)}
                  key={card.id}
                  type="button"
                  onClick={() => flip(index)}
                >
                  <span className="pair-card__back" aria-hidden={visible}>?</span>
                  <span className="pair-card__face" aria-hidden={!visible}>
                    <span aria-hidden="true">{card.symbol}</span>
                    <strong>{card.label}</strong>
                    <small>{card.kind}</small>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}
    </GameFrame>
  )
}
