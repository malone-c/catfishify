import { useMemo, useState } from 'react'
import { articleById, seededShuffle } from '../data'
import { GameComplete, GameFrame, GameProgress, RoundFeedback } from '../GameFrame'

const rounds = [
  { articleId: 'einstein', choices: ['einstein', 'curie', 'lovelace', 'lamarr'] },
  { articleId: 'axolotl', choices: ['axolotl', 'octopus', 'reef', 'everest'] },
  { articleId: 'everest', choices: ['everest', 'reef', 'voyager', 'chess'] },
  { articleId: 'kahlo', choices: ['kahlo', 'curie', 'lovelace', 'lamarr'] },
  { articleId: 'pizza', choices: ['pizza', 'chess', 'octopus', 'reef'] },
]

export default function ClueLadder() {
  const [roundIndex, setRoundIndex] = useState(0)
  const [revealed, setRevealed] = useState(1)
  const [tried, setTried] = useState<string[]>([])
  const [solved, setSolved] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const round = rounds[roundIndex]
  const article = articleById[round.articleId]
  const choices = useMemo(
    () => seededShuffle(round.choices.map(id => articleById[id]), roundIndex + 31),
    [round, roundIndex],
  )
  const pointsAvailable = Math.max(1, 6 - revealed)

  const choose = (id: string) => {
    if (solved || tried.includes(id)) return
    if (id === article.id) {
      setSolved(true)
      setScore(value => value + pointsAvailable)
      return
    }
    setTried(items => [...items, id])
    setRevealed(value => Math.min(article.categories.length, value + 1))
  }

  const next = () => {
    if (roundIndex === rounds.length - 1) {
      setFinished(true)
      return
    }
    setRoundIndex(value => value + 1)
    setRevealed(1)
    setTried([])
    setSolved(false)
  }

  const reset = () => {
    setRoundIndex(0)
    setRevealed(1)
    setTried([])
    setSolved(false)
    setScore(0)
    setFinished(false)
  }

  return (
    <GameFrame
      mode="Experiment 01 · Progressive deduction"
      title="Clue Ladder"
      description="The fewer categories you reveal, the more each answer is worth. A wrong pick automatically opens the next rung."
      tone="ladder"
      meta="5 rounds · 25 cats available"
    >
      {finished ? (
        <GameComplete
          title={score >= 20 ? 'Sharp eyes in the shallows.' : score >= 12 ? 'A respectable haul.' : 'You found your footing.'}
          score={<><strong>{score}</strong><span>/ 25 cats</span></>}
          detail="Early answers are valuable; patient answers are safer. Your score records where you found the balance."
          onReplay={reset}
        />
      ) : (
        <section className="arcade-board arcade-board--ladder">
          <GameProgress current={roundIndex} total={rounds.length} />
          <div className="ladder-scoreline">
            <span>Current haul <strong>{score}</strong></span>
            <span>On this rung <strong>{pointsAvailable} cats</strong></span>
          </div>

          <div className="ladder-layout">
            <div className="ladder-clues">
              <span className="arcade-board-label">Category ladder</span>
              <ol>
                {article.categories.map((category, index) => (
                  <li className={index < revealed ? 'is-revealed' : ''} key={category}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{index < revealed ? category : 'Clue held below the surface'}</strong>
                  </li>
                ))}
              </ol>
              {!solved && revealed < article.categories.length && (
                <button
                  className="button button--secondary ladder-reveal"
                  type="button"
                  onClick={() => setRevealed(value => Math.min(article.categories.length, value + 1))}
                >
                  Reveal another clue <span aria-hidden="true">−1</span>
                </button>
              )}
            </div>

            <div className="ladder-answers">
              <span className="arcade-board-label">Which article is it?</span>
              <div className="arcade-choice-list">
                {choices.map(choice => (
                  <button
                    className={`arcade-choice ${tried.includes(choice.id) ? 'is-eliminated' : ''} ${solved && choice.id === article.id ? 'is-correct' : ''}`}
                    disabled={solved || tried.includes(choice.id)}
                    key={choice.id}
                    type="button"
                    onClick={() => choose(choice.id)}
                  >
                    <span className="arcade-choice__symbol" aria-hidden="true">{choice.emoji}</span>
                    <span>{choice.title}</span>
                    <span className="arcade-choice__tail" aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
              {tried.length > 0 && !solved && (
                <RoundFeedback correct={false} title="Not that identity.">
                  The next category has surfaced. Your remaining options stay in play.
                </RoundFeedback>
              )}
              {solved && (
                <>
                  <RoundFeedback correct title={`${article.title}, caught.`}>
                    Solved for {pointsAvailable} {pointsAvailable === 1 ? 'cat' : 'cats'}. {article.summary}
                  </RoundFeedback>
                  <button className="button button--primary arcade-next" type="button" onClick={next}>
                    {roundIndex === rounds.length - 1 ? 'See my haul' : 'Next ladder'}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}
    </GameFrame>
  )
}
