import { useMemo, useState } from 'react'
import { seededShuffle } from '../data'
import { GameComplete, GameFrame, GameProgress, RoundFeedback } from '../GameFrame'

type ReverseRound = {
  category: string
  pages: string[]
  choices: string[]
  source: string
  note: string
}

const rounds: ReverseRound[] = [
  {
    category: 'Galilean moons',
    pages: ['Callisto (moon)', 'Europa (moon)', 'Ganymede (moon)', 'Io (moon)'],
    choices: ['Galilean moons', 'Moons of Mars', 'Moons of Pluto', 'Inner moons of Jupiter'],
    source: 'https://en.wikipedia.org/wiki/Category:Galilean_moons',
    note: 'Four large moons of Jupiter first recorded telescopically by Galileo Galilei.',
  },
  {
    category: 'Spice Girls members',
    pages: ['Victoria Beckham', 'Emma Bunton', 'Geri Halliwell', 'Mel B', 'Melanie C'],
    choices: ['Spice Girls members', 'All Saints members', 'Sugababes members', 'Atomic Kitten members'],
    source: 'https://en.wikipedia.org/wiki/Category:Spice_Girls_members',
    note: 'The category contains exactly the five performers in the English pop group.',
  },
  {
    category: 'Traveling Wilburys members',
    pages: ['Bob Dylan', 'George Harrison', 'Jeff Lynne', 'Roy Orbison', 'Tom Petty'],
    choices: ['Traveling Wilburys members', 'The Highwaymen members', 'Electric Light Orchestra members', 'Crosby, Stills, Nash & Young members'],
    source: 'https://en.wikipedia.org/wiki/Category:Traveling_Wilburys_members',
    note: 'Five musicians recorded together behind playful Wilbury pseudonyms.',
  },
  {
    category: 'Monty Python members',
    pages: ['Graham Chapman', 'John Cleese', 'Terry Gilliam', 'Eric Idle', 'Terry Jones', 'Michael Palin'],
    choices: ['Monty Python members', 'The Goodies members', 'Beyond the Fringe members', 'The Goon Show cast members'],
    source: 'https://en.wikipedia.org/wiki/Category:Monty_Python_members',
    note: 'The six members of the British surreal comedy troupe.',
  },
  {
    category: 'Wives of Henry VIII',
    pages: ['Anne of Cleves', 'Anne Boleyn', 'Catherine of Aragon', 'Catherine Howard', 'Catherine Parr', 'Jane Seymour'],
    choices: ['Wives of Henry VIII', 'Queens consort of England', 'Tudor princesses', 'Daughters of Henry VIII'],
    source: 'https://en.wikipedia.org/wiki/Category:Wives_of_Henry_VIII',
    note: 'A category with six people—and a mnemonic that rather gives away the count.',
  },
]

export default function ReverseCatfishing() {
  const [roundIndex, setRoundIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const round = rounds[roundIndex]
  const choices = useMemo(
    () => seededShuffle(round.choices, roundIndex + 1_942),
    [round, roundIndex],
  )

  const choose = (category: string) => {
    if (selected) return
    setSelected(category)
    if (category === round.category) setScore(value => value + 1)
  }

  const next = () => {
    if (roundIndex === rounds.length - 1) {
      setFinished(true)
      return
    }
    setRoundIndex(value => value + 1)
    setSelected(null)
  }

  const reset = () => {
    setRoundIndex(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
  }

  return (
    <GameFrame
      mode="Experiment 08 · Reverse deduction"
      title="Reverse Catfishing"
      description="You get the pages. Name the small Wikipedia category that holds the whole shoal together."
      tone="reverse"
      meta="5 small categories · 4–6 pages"
    >
      {finished ? (
        <GameComplete
          title={score === 5 ? 'You read the shoal perfectly.' : score >= 3 ? 'The pattern surfaced.' : 'Reverse currents take practice.'}
          score={<><strong>{score}</strong><span>/ 5 categories</span></>}
          detail="Every starter category was checked against Wikipedia and kept to six defining pages or fewer, so the clue list stays readable on a phone."
          onReplay={reset}
        />
      ) : (
        <section className="arcade-board arcade-board--reverse">
          <GameProgress current={roundIndex} total={rounds.length} />
          <div className="reverse-layout">
            <div className="reverse-shoal">
              <div className="reverse-shoal__heading">
                <div>
                  <span className="arcade-board-label">Wikipedia pages</span>
                  <h2>What category connects them?</h2>
                </div>
                <span>{round.pages.length} pages</span>
              </div>
              <ol>
                {round.pages.map((page, index) => (
                  <li key={page}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{page}</strong>
                    <span aria-hidden="true">↗</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="reverse-answers">
              <span className="arcade-board-label">Choose the category</span>
              <div className="arcade-choice-list">
                {choices.map(choice => {
                  const className = selected
                    ? choice === round.category ? 'is-correct' : choice === selected ? 'is-wrong' : 'is-muted'
                    : ''
                  return (
                    <button className={`arcade-choice ${className}`} disabled={selected !== null} key={choice} type="button" onClick={() => choose(choice)}>
                      <span className="arcade-choice__symbol" aria-hidden="true">#</span>
                      <span>{choice}</span>
                      <span className="arcade-choice__tail" aria-hidden="true">→</span>
                    </button>
                  )
                })}
              </div>

              {selected && (
                <>
                  <RoundFeedback correct={selected === round.category} title={selected === round.category ? 'Category caught.' : `The link was “${round.category}”.`}>
                    {round.note}
                  </RoundFeedback>
                  <div className="reverse-actions">
                    <a href={round.source} target="_blank" rel="noreferrer">Verify on Wikipedia ↗</a>
                    <button className="button button--primary" type="button" onClick={next}>
                      {roundIndex === rounds.length - 1 ? 'See results' : 'Next shoal'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <aside className="reverse-rule">
            <strong>Small-shoal rule</strong>
            <p>The starter deck admits only answer-defining categories with four to six member pages. Index pages, templates, and maintenance pages do not count as clues.</p>
          </aside>
        </section>
      )}
    </GameFrame>
  )
}
