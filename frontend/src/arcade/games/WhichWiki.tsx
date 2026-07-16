import { useMemo, useState } from 'react'
import { articleById, multipleChoiceRounds, seededShuffle } from '../data'
import { GameComplete, GameFrame, GameProgress, RoundFeedback } from '../GameFrame'

export default function WhichWiki() {
  const [roundIndex, setRoundIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const round = multipleChoiceRounds[roundIndex]
  const article = articleById[round.articleId]
  const choices = useMemo(
    () => seededShuffle(round.choiceIds.map(id => articleById[id]), roundIndex + 501),
    [round, roundIndex],
  )

  const choose = (id: string) => {
    if (selected) return
    setSelected(id)
    if (id === article.id) setScore(value => value + 1)
  }

  const next = () => {
    if (roundIndex === multipleChoiceRounds.length - 1) {
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
      mode="Experiment 03 · Recognition"
      title="Which Wiki?"
      description="No typing and no generous guesses. Read a compact category dossier and identify its owner from four nearby identities."
      tone="lineup"
      meta="5 dossiers · fast play"
    >
      {finished ? (
        <GameComplete
          title={score === 5 ? 'Perfect identification.' : score >= 3 ? 'A convincing lineup.' : 'Plausible names are powerful decoys.'}
          score={<><strong>{score}</strong><span>/ 5 identified</span></>}
          detail="Recognition is quicker than recall, but a well-chosen decoy can make familiar clues feel newly uncertain."
          onReplay={reset}
        />
      ) : (
        <section className="arcade-board arcade-board--lineup">
          <GameProgress current={roundIndex} total={multipleChoiceRounds.length} />
          <div className="lineup-dossier">
            <div className="lineup-dossier__stamp" aria-hidden="true">?</div>
            <div>
              <span className="arcade-board-label">Identity dossier</span>
              <ul>
                {article.categories.slice(1, 5).map(category => <li key={category}>{category}</li>)}
              </ul>
              <p>Known as: <strong>{article.aliases.join(' · ')}</strong></p>
            </div>
          </div>

          <div className="lineup-grid" aria-label="Choose the matching Wikipedia article">
            {choices.map((choice, index) => {
              const isCorrect = choice.id === article.id
              const className = selected
                ? isCorrect ? 'is-correct' : selected === choice.id ? 'is-wrong' : 'is-muted'
                : ''
              return (
                <button className={`lineup-card ${className}`} disabled={selected !== null} key={choice.id} type="button" onClick={() => choose(choice.id)}>
                  <span className="lineup-card__index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="lineup-card__symbol" aria-hidden="true">{choice.emoji}</span>
                  <strong>{choice.title}</strong>
                  <small>{choice.summary}</small>
                </button>
              )
            })}
          </div>

          {selected && (
            <div className="arcade-result-row">
              <RoundFeedback correct={selected === article.id} title={selected === article.id ? 'Identity confirmed.' : `It was ${article.title}.`}>
                {article.summary}
              </RoundFeedback>
              <button className="button button--primary" type="button" onClick={next}>
                {roundIndex === multipleChoiceRounds.length - 1 ? 'See results' : 'Next dossier'}
              </button>
            </div>
          )}
        </section>
      )}
    </GameFrame>
  )
}
