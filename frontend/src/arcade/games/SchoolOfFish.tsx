import { useMemo, useState } from 'react'
import { articleById, seededShuffle } from '../data'
import { GameComplete, GameFrame } from '../GameFrame'

const targetIds = ['einstein', 'axolotl', 'pizza']
const clues = targetIds.flatMap(articleId => (
  articleById[articleId].categories.slice(1, 4).map((category, index) => ({
    id: `${articleId}-${index}`,
    articleId,
    category,
  }))
))

export default function SchoolOfFish() {
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const [seed, setSeed] = useState(823)
  const shuffled = useMemo(() => seededShuffle(clues, seed), [seed])
  const assignedCount = Object.keys(assignments).length
  const score = clues.filter(clue => assignments[clue.id] === clue.articleId).length

  const assign = (articleId: string) => {
    if (!selected) return
    setAssignments(value => ({ ...value, [selected]: articleId }))
    setSelected(null)
  }

  const reset = () => {
    setAssignments({})
    setSelected(null)
    setFinished(false)
    setSeed(value => value + 17)
  }

  return (
    <GameFrame
      mode="Experiment 04 · Sorting"
      title="School of Fish"
      description="Nine categories have drifted away from their pages. Select a category, then place it beneath the article it belongs to."
      tone="school"
      meta="3 pages · 9 categories"
    >
      {finished ? (
        <GameComplete
          title={score === 9 ? 'Every category found its school.' : score >= 6 ? 'Most of the shoal is home.' : 'A few fish changed schools.'}
          score={<><strong>{score}</strong><span>/ 9 sorted</span></>}
          detail="This mode rewards comparing several identities at once instead of solving a single page in isolation."
          onReplay={reset}
        >
          <div className="school-review">
            {targetIds.map(id => (
              <div key={id}>
                <strong>{articleById[id].title}</strong>
                <span>{clues.filter(clue => clue.articleId === id).map(clue => clue.category).join(' · ')}</span>
              </div>
            ))}
          </div>
        </GameComplete>
      ) : (
        <section className="arcade-board arcade-board--school">
          <div className="school-status">
            <div>
              <span className="arcade-board-label">Drifting categories</span>
              <strong>{assignedCount} of {clues.length} placed</strong>
            </div>
            <div className="school-status__track"><span style={{ width: `${(assignedCount / clues.length) * 100}%` }} /></div>
          </div>

          <div className="school-clues" aria-label="Categories to sort">
            {shuffled.map(clue => {
              const assignedTo = assignments[clue.id]
              return (
                <button
                  className={`school-clue ${selected === clue.id ? 'is-selected' : ''} ${assignedTo ? 'is-assigned' : ''}`}
                  key={clue.id}
                  type="button"
                  onClick={() => setSelected(selected === clue.id ? null : clue.id)}
                >
                  <span aria-hidden="true">#</span>
                  <strong>{clue.category}</strong>
                  <small>{assignedTo ? articleById[assignedTo].title : 'Unsorted'}</small>
                </button>
              )
            })}
          </div>

          <div className="school-buckets" aria-label="Article destinations">
            {targetIds.map(id => {
              const article = articleById[id]
              const count = Object.values(assignments).filter(value => value === id).length
              return (
                <button className={selected ? 'is-ready' : ''} disabled={!selected} key={id} type="button" onClick={() => assign(id)}>
                  <span className="school-bucket__symbol" aria-hidden="true">{article.emoji}</span>
                  <strong>{article.title}</strong>
                  <small>{count} placed</small>
                  <span className="school-bucket__action">{selected ? 'Place here' : 'Select a category'}</span>
                </button>
              )
            })}
          </div>

          <div className="school-actions">
            <button className="button button--quiet" disabled={assignedCount === 0} type="button" onClick={() => { setAssignments({}); setSelected(null) }}>Clear board</button>
            <button className="button button--primary" disabled={assignedCount !== clues.length} type="button" onClick={() => setFinished(true)}>Check the schools</button>
          </div>
        </section>
      )}
    </GameFrame>
  )
}
