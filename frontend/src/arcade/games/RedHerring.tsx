import { useMemo, useState } from 'react'
import { articleById, redHerringRounds, seededShuffle } from '../data'
import { GameComplete, GameFrame, GameProgress, RoundFeedback } from '../GameFrame'

export default function RedHerring() {
  const [roundIndex, setRoundIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const round = redHerringRounds[roundIndex]
  const article = articleById[round.articleId]
  const choices = useMemo(
    () => seededShuffle([...round.clues, round.herring], roundIndex + 208),
    [round, roundIndex],
  )
  const correct = selected === round.herring

  const choose = (category: string) => {
    if (selected) return
    setSelected(category)
    if (category === round.herring) setScore(value => value + 1)
  }

  const next = () => {
    if (roundIndex === redHerringRounds.length - 1) {
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
      mode="Experiment 02 · Deception"
      title="Red Herring"
      description="Three categories belong to the named page. One was lifted from somewhere else. Find the category that is catfishing you."
      tone="herring"
      meta="5 rounds · one tap each"
    >
      {finished ? (
        <GameComplete
          title={score === 5 ? 'No herring gets past you.' : score >= 3 ? 'You know when something smells fishy.' : 'The decoys had teeth.'}
          score={<><strong>{score}</strong><span>/ 5 spotted</span></>}
          detail="The best fake category is plausible at a glance and impossible once the article’s identity clicks."
          onReplay={reset}
        />
      ) : (
        <section className="arcade-board arcade-board--herring">
          <GameProgress current={roundIndex} total={redHerringRounds.length} />
          <div className="herring-dossier">
            <span className="herring-dossier__symbol" aria-hidden="true">{article.emoji}</span>
            <div>
              <span className="arcade-board-label">The real article</span>
              <h2>{article.title}</h2>
              <p>{article.summary}</p>
            </div>
          </div>

          <div className="herring-grid" aria-label="Choose the category that does not belong">
            {choices.map((category, index) => {
              const isHerring = category === round.herring
              const className = selected
                ? isHerring ? 'is-correct' : selected === category ? 'is-wrong' : 'is-muted'
                : ''
              return (
                <button className={`herring-card ${className}`} disabled={selected !== null} key={category} type="button" onClick={() => choose(category)}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{category}</strong>
                  <span className="herring-card__mark" aria-hidden="true">{selected && isHerring ? '×' : '?'}</span>
                </button>
              )
            })}
          </div>

          {selected && (
            <div className="arcade-result-row">
              <RoundFeedback correct={correct} title={correct ? 'Herring hooked.' : 'That category is genuine.'}>
                “{round.herring}” belongs with {round.source}, not {article.title}.
              </RoundFeedback>
              <button className="button button--primary" type="button" onClick={next}>
                {roundIndex === redHerringRounds.length - 1 ? 'See results' : 'Next deception'}
              </button>
            </div>
          )}
        </section>
      )}
    </GameFrame>
  )
}
