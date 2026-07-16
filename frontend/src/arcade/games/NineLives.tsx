import { useMemo, useState } from 'react'
import { arcadeArticles, seededShuffle } from '../data'
import { GameComplete, GameFrame, RoundFeedback } from '../GameFrame'

const bestScoreKey = 'catfishify-nine-lives-best'

function storedBest() {
  const value = Number(window.localStorage.getItem(bestScoreKey))
  return Number.isFinite(value) ? value : 0
}

export default function NineLives() {
  const [runSeed, setRunSeed] = useState(4_209)
  const order = useMemo(() => seededShuffle(arcadeArticles, runSeed), [runSeed])
  const [roundIndex, setRoundIndex] = useState(0)
  const [lives, setLives] = useState(9)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(storedBest)
  const [selected, setSelected] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const article = order[roundIndex % order.length]
  const choices = useMemo(() => {
    const decoys = seededShuffle(arcadeArticles.filter(item => item.id !== article.id), runSeed + roundIndex * 37).slice(0, 3)
    return seededShuffle([article, ...decoys], runSeed + roundIndex * 73)
  }, [article, roundIndex, runSeed])
  const correct = selected === article.id

  const choose = (id: string) => {
    if (selected) return
    setSelected(id)
    if (id === article.id) {
      const nextScore = score + 10 + streak * 2
      setScore(nextScore)
      setStreak(value => value + 1)
      if (nextScore > best) {
        setBest(nextScore)
        window.localStorage.setItem(bestScoreKey, String(nextScore))
      }
    } else {
      setLives(value => Math.max(0, value - 1))
      setStreak(0)
    }
  }

  const next = () => {
    if (lives === 0) {
      setFinished(true)
      return
    }
    setRoundIndex(value => value + 1)
    setSelected(null)
  }

  const reset = () => {
    setRunSeed(value => value + 101)
    setRoundIndex(0)
    setLives(9)
    setScore(0)
    setStreak(0)
    setSelected(null)
    setFinished(false)
  }

  return (
    <GameFrame
      mode="Experiment 06 · Survival"
      title="Nine Lives"
      description="An endless stream of category dossiers. Correct answers build a multiplier; mistakes cost one of your nine lives."
      tone="lives"
      meta="Endless · local high score"
    >
      {finished ? (
        <GameComplete
          eyebrow="Run banked"
          title={score >= best && score > 0 ? 'A new personal best.' : 'The current finally caught you.'}
          score={<><strong>{score}</strong><span>points</span></>}
          detail={`You survived ${roundIndex + 1} dossiers. Your best score on this device is ${best}.`}
          onReplay={reset}
          replayLabel="Start with nine lives"
        />
      ) : (
        <section className="arcade-board arcade-board--lives">
          <div className="lives-scoreboard">
            <div><span>Score</span><strong>{score}</strong></div>
            <div><span>Streak</span><strong>×{streak}</strong></div>
            <div><span>Best</span><strong>{best}</strong></div>
          </div>

          <div className="lives-counter" aria-label={`${lives} of 9 lives remaining`}>
            {Array.from({ length: 9 }, (_, index) => <span className={index < lives ? 'is-live' : ''} key={index} aria-hidden="true">●</span>)}
          </div>

          <div className="lives-dossier">
            <span className="arcade-board-label">Dossier {String(roundIndex + 1).padStart(2, '0')}</span>
            <ul>
              {article.categories.slice(2, 5).map(category => <li key={category}>{category}</li>)}
            </ul>
          </div>

          <div className="lives-options" aria-label="Choose the matching article">
            {choices.map(choice => {
              const className = selected
                ? choice.id === article.id ? 'is-correct' : selected === choice.id ? 'is-wrong' : 'is-muted'
                : ''
              return (
                <button className={className} disabled={selected !== null} key={choice.id} type="button" onClick={() => choose(choice.id)}>
                  <span aria-hidden="true">{choice.emoji}</span>
                  <strong>{choice.title}</strong>
                </button>
              )
            })}
          </div>

          {selected && (
            <div className="arcade-result-row">
              <RoundFeedback correct={correct} title={correct ? `Combo ×${streak}.` : lives === 0 ? 'That was your ninth life.' : 'One life slipped away.'}>
                The article was {article.title}. {correct ? `This catch earned ${10 + (streak - 1) * 2} points.` : `${lives} lives remain.`}
              </RoundFeedback>
              <button className="button button--primary" type="button" onClick={next}>{lives === 0 ? 'See final score' : 'Next dossier'}</button>
            </div>
          )}
          {!selected && roundIndex > 0 && (
            <button className="lives-bank" type="button" onClick={() => setFinished(true)}>Bank this run and finish</button>
          )}
        </section>
      )}
    </GameFrame>
  )
}
