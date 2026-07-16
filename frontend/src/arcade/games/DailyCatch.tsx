import { useMemo, useState } from 'react'
import { arcadeArticles, seededShuffle, stringSeed } from '../data'
import { GameComplete, GameFrame, GameProgress, RoundFeedback } from '../GameFrame'

const storageKey = 'catfishify-daily-catch'

type DailyRecord = {
  lastDate: string
  streak: number
}

function loadRecord(): DailyRecord {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || '') as DailyRecord
    if (typeof parsed.lastDate === 'string' && typeof parsed.streak === 'number') return parsed
  } catch {
    // A damaged local record should never stop a daily game.
  }
  return { lastDate: '', streak: 0 }
}

function previousDate(date: string) {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() - 1)
  return value.toISOString().slice(0, 10)
}

export default function DailyCatch() {
  const today = new Date().toISOString().slice(0, 10)
  const daySeed = stringSeed(today)
  const dailyArticles = useMemo(() => seededShuffle(arcadeArticles, daySeed).slice(0, 5), [daySeed])
  const [roundIndex, setRoundIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const [finished, setFinished] = useState(false)
  const [record, setRecord] = useState(loadRecord)
  const [shared, setShared] = useState(false)
  const article = dailyArticles[roundIndex]
  const choices = useMemo(() => {
    const decoys = seededShuffle(arcadeArticles.filter(item => item.id !== article.id), daySeed + roundIndex * 41).slice(0, 3)
    return seededShuffle([article, ...decoys], daySeed + roundIndex * 83)
  }, [article, daySeed, roundIndex])

  const choose = (id: string) => {
    if (selected) return
    setSelected(id)
    setResults(value => [...value, id === article.id])
  }

  const finishDay = () => {
    const nextStreak = record.lastDate === today
      ? record.streak
      : record.lastDate === previousDate(today) ? record.streak + 1 : 1
    const nextRecord = { lastDate: today, streak: nextStreak }
    setRecord(nextRecord)
    window.localStorage.setItem(storageKey, JSON.stringify(nextRecord))
    setFinished(true)
  }

  const next = () => {
    if (roundIndex === dailyArticles.length - 1) {
      finishDay()
      return
    }
    setRoundIndex(value => value + 1)
    setSelected(null)
  }

  const replay = () => {
    setRoundIndex(0)
    setSelected(null)
    setResults([])
    setFinished(false)
    setShared(false)
  }

  const share = () => {
    const grid = results.map(result => result ? '🟩' : '🟥').join('')
    const text = `Catfishify Daily Catch ${today}\n${grid}\n${results.filter(Boolean).length}/5 · ${record.streak} day streak`
    if (navigator.clipboard) void navigator.clipboard.writeText(text)
    setShared(true)
  }

  return (
    <GameFrame
      mode="Experiment 07 · Daily ritual"
      title="Daily Catch"
      description="Five seeded dossiers shared by everyone for the date. Come back tomorrow to extend the streak stored on this device."
      tone="daily"
      meta={`${today} · day ${Math.max(record.streak, 1)}`}
    >
      {finished ? (
        <GameComplete
          eyebrow="Today’s catch"
          title={results.every(Boolean) ? 'A flawless daily haul.' : results.filter(Boolean).length >= 3 ? 'More caught than escaped.' : 'Tomorrow brings a new shoal.'}
          score={<><strong>{results.filter(Boolean).length}</strong><span>/ 5 correct</span></>}
          detail={`${record.streak} day streak on this device. Practice replays do not add another day.`}
          onReplay={replay}
          replayLabel="Practice today again"
        >
          <div className="daily-result-grid" aria-label={`${results.filter(Boolean).length} correct answers out of 5`}>
            {results.map((result, index) => <span className={result ? 'is-correct' : 'is-wrong'} key={index}>{result ? '✓' : '×'}</span>)}
          </div>
          <button className="button button--secondary daily-share" type="button" onClick={share}>{shared ? 'Result copied' : 'Copy spoiler-free result'}</button>
        </GameComplete>
      ) : (
        <section className="arcade-board arcade-board--daily">
          <GameProgress current={roundIndex} total={dailyArticles.length} label="Catch" />
          <div className="daily-date"><span>Today</span><strong>{today}</strong><span>{record.streak} day streak</span></div>
          <div className="daily-dossier">
            <span className="arcade-board-label">Three clues, one identity</span>
            <ul>{article.categories.slice(1, 4).map(category => <li key={category}>{category}</li>)}</ul>
          </div>
          <div className="daily-options" aria-label="Choose today’s matching article">
            {choices.map(choice => {
              const className = selected
                ? choice.id === article.id ? 'is-correct' : selected === choice.id ? 'is-wrong' : 'is-muted'
                : ''
              return (
                <button className={className} disabled={selected !== null} key={choice.id} type="button" onClick={() => choose(choice.id)}>
                  <span aria-hidden="true">{choice.emoji}</span>
                  <strong>{choice.title}</strong>
                  <small>{choice.aliases[0]}</small>
                </button>
              )
            })}
          </div>
          {selected && (
            <div className="arcade-result-row">
              <RoundFeedback correct={selected === article.id} title={selected === article.id ? 'In the net.' : `${article.title} got away.`}>{article.summary}</RoundFeedback>
              <button className="button button--primary" type="button" onClick={next}>{roundIndex === dailyArticles.length - 1 ? 'Finish today’s catch' : 'Next catch'}</button>
            </div>
          )}
        </section>
      )}
    </GameFrame>
  )
}
