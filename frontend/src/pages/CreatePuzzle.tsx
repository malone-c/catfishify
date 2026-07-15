import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import type { ArticleInput, WikiArticleData, WikiSearchResult } from '../types'
import './CreatePuzzle.css'

const MAX_TASKS = 10
const SEARCH_DELAY_MS = 300

interface PreviewArticle extends WikiArticleData {
  wikipedia_title: string
}

function plainTextSnippet(snippet: string) {
  const parsed = new DOMParser().parseFromString(snippet, 'text/html')
  return parsed.body.textContent ?? ''
}

export default function CreatePuzzle() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [articles, setArticles] = useState<ArticleInput[]>([])
  const [isAddingTask, setIsAddingTask] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WikiSearchResult[]>([])
  const [activeResultIndex, setActiveResultIndex] = useState(-1)
  const [preview, setPreview] = useState<PreviewArticle | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchFailed, setSearchFailed] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [taskError, setTaskError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const createButtonRef = useRef<HTMLButtonElement>(null)
  const searchRequestRef = useRef(0)
  const previewRequestRef = useRef(0)

  const atTaskLimit = articles.length === MAX_TASKS
  const showResults = isAddingTask && searchQuery.trim().length > 1 && !preview && !loadingPreview

  useEffect(() => {
    if (!isAddingTask || preview || loadingPreview || searchQuery.trim().length < 2) return

    const requestId = ++searchRequestRef.current
    const timeout = window.setTimeout(async () => {
      setSearching(true)
      setSearchFailed(false)
      try {
        const results = await api.searchWikipedia(searchQuery.trim())
        if (requestId === searchRequestRef.current) {
          setSearchResults(results)
          setActiveResultIndex(results.findIndex(
            result => !articles.some(article => article.wikipedia_title === result.title),
          ))
        }
      } catch {
        if (requestId === searchRequestRef.current) {
          setSearchResults([])
          setActiveResultIndex(-1)
          setSearchFailed(true)
        }
      } finally {
        if (requestId === searchRequestRef.current) setSearching(false)
      }
    }, SEARCH_DELAY_MS)

    return () => window.clearTimeout(timeout)
  }, [articles, isAddingTask, loadingPreview, preview, searchQuery])

  const resetTaskSearch = () => {
    searchRequestRef.current += 1
    previewRequestRef.current += 1
    setSearchQuery('')
    setSearchResults([])
    setActiveResultIndex(-1)
    setPreview(null)
    setSearching(false)
    setSearchFailed(false)
    setLoadingPreview(false)
    setTaskError(null)
  }

  const handleSearchChange = (query: string) => {
    searchRequestRef.current += 1
    previewRequestRef.current += 1
    setSearchQuery(query)
    setSearchResults([])
    setActiveResultIndex(-1)
    setPreview(null)
    setSearching(false)
    setSearchFailed(false)
    setLoadingPreview(false)
    setTaskError(null)
  }

  const handleSelectResult = async (wikiTitle: string) => {
    if (articles.some(article => article.wikipedia_title === wikiTitle)) return

    const requestId = ++previewRequestRef.current
    setSearchQuery(wikiTitle)
    setSearchResults([])
    setActiveResultIndex(-1)
    setSearching(false)
    setLoadingPreview(true)
    setTaskError(null)
    try {
      const data = await api.getWikipediaArticle(wikiTitle)
      if (requestId === previewRequestRef.current) {
        setPreview({ wikipedia_title: wikiTitle, ...data })
      }
    } catch {
      if (requestId === previewRequestRef.current) {
        setTaskError('We could not preview that Wikipedia page. Please choose another.')
      }
    } finally {
      if (requestId === previewRequestRef.current) setLoadingPreview(false)
    }
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || searchResults.length === 0) return

    const availableIndices = searchResults.flatMap((result, index) => (
      articles.some(article => article.wikipedia_title === result.title) ? [] : [index]
    ))
    if (availableIndices.length === 0) return
    const currentPosition = availableIndices.indexOf(activeResultIndex)

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveResultIndex(availableIndices[(currentPosition + 1) % availableIndices.length])
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      const previousPosition = currentPosition <= 0 ? availableIndices.length - 1 : currentPosition - 1
      setActiveResultIndex(availableIndices[previousPosition])
    } else if (event.key === 'Enter' && activeResultIndex >= 0) {
      event.preventDefault()
      void handleSelectResult(searchResults[activeResultIndex].title)
    } else if (event.key === 'Escape') {
      setSearchResults([])
      setActiveResultIndex(-1)
    }
  }

  const handleConfirmTask = () => {
    if (!preview || atTaskLimit) return

    const nextArticles = [
      ...articles,
      {
        wikipedia_title: preview.wikipedia_title,
        categories: preview.categories,
        alt_titles: preview.alt_titles,
      },
    ]
    setArticles(nextArticles)
    resetTaskSearch()

    if (nextArticles.length === MAX_TASKS) {
      setIsAddingTask(false)
      window.requestAnimationFrame(() => {
        if (!title.trim()) titleRef.current?.focus()
        else createButtonRef.current?.focus()
      })
    } else {
      window.requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  const handleRemoveTask = (index: number) => {
    const nextArticles = articles.filter((_, articleIndex) => articleIndex !== index)
    setArticles(nextArticles)
    if (nextArticles.length === 0) {
      setIsAddingTask(true)
      window.requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  const handleDoneAdding = () => {
    if (articles.length === 0) return
    resetTaskSearch()
    setIsAddingTask(false)
    window.requestAnimationFrame(() => {
      if (!title.trim()) titleRef.current?.focus()
      else createButtonRef.current?.focus()
    })
  }

  const handleAddAnother = () => {
    if (atTaskLimit) return
    resetTaskSearch()
    setIsAddingTask(true)
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || articles.length === 0 || submitting) return
    setSubmitting(true)
    setFormError(null)
    try {
      const result = await api.createPuzzle({
        title: title.trim(),
        description: description.trim() || undefined,
        articles,
      })
      navigate(`/p/${result.short_id}`)
    } catch {
      setFormError('Failed to create puzzle. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <main className="create-page">
      <Link className="create-back-link" to="/">← Home</Link>

      <header className="create-header">
        <p className="create-eyebrow">Puzzle builder</p>
        <h1>Create a puzzle</h1>
        <p>Choose up to ten Wikipedia pages. Players will guess each page from its categories.</p>
      </header>

      <form onSubmit={handleSubmit}>
        <section className="create-section create-details" aria-labelledby="puzzle-details-heading">
          <div className="create-section-heading">
            <span className="create-step-number">1</span>
            <div>
              <h2 id="puzzle-details-heading">Puzzle details</h2>
              <p>Give people a hint about the theme.</p>
            </div>
          </div>

          <div className="create-field-grid">
            <label className="create-field">
              <span>Title <span aria-hidden="true">*</span></span>
              <input
                ref={titleRef}
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="e.g. Famous scientists"
                autoComplete="off"
                required
              />
            </label>

            <label className="create-field">
              <span>Description <span className="create-optional">Optional</span></span>
              <textarea
                value={description}
                onChange={event => setDescription(event.target.value)}
                placeholder="A short introduction to your puzzle"
                rows={3}
              />
            </label>
          </div>
        </section>

        <section className="create-section create-tasks" aria-labelledby="puzzle-tasks-heading">
          <div className="create-section-heading create-task-heading">
            <span className="create-step-number">2</span>
            <div>
              <h2 id="puzzle-tasks-heading">Choose the tasks</h2>
              <p>Add as many as you need, then select done.</p>
            </div>
            <span className="create-task-count" aria-label={`${articles.length} of ${MAX_TASKS} tasks added`}>
              {articles.length}<span> / {MAX_TASKS}</span>
            </span>
          </div>

          {articles.length > 0 && (
            <ol className="create-task-list" aria-label="Selected tasks">
              {articles.map((article, index) => (
                <li className="create-task-card" key={article.wikipedia_title}>
                  <span className="create-task-index" aria-hidden="true">{index + 1}</span>
                  <span className="create-task-details">
                    <strong>{article.wikipedia_title}</strong>
                    <span>{article.categories.length} Wikipedia categories</span>
                  </span>
                  <button
                    className="create-icon-button"
                    type="button"
                    onClick={() => handleRemoveTask(index)}
                    aria-label={`Remove ${article.wikipedia_title}`}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ol>
          )}

          {isAddingTask && !atTaskLimit ? (
            <div className="create-task-search">
              <div className="create-search-label-row">
                <label htmlFor="task-search">Task {articles.length + 1}</label>
                <span>Search Wikipedia</span>
              </div>
              <div className="create-combobox">
                <span className="create-search-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                    <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="task-search"
                  ref={inputRef}
                  value={searchQuery}
                  onChange={event => handleSearchChange(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Start typing a page title…"
                  autoComplete="off"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-controls="task-search-results"
                  aria-expanded={showResults}
                  aria-activedescendant={activeResultIndex >= 0 ? `task-result-${activeResultIndex}` : undefined}
                  autoFocus={articles.length === 0}
                />
                {searching && <span className="create-search-spinner" role="status" aria-label="Searching Wikipedia" />}
              </div>

              {showResults && (
                <div className="create-search-results" id="task-search-results" role="listbox">
                  {searching && searchResults.length === 0 && (
                    <p className="create-search-message">Searching Wikipedia…</p>
                  )}
                  {!searching && searchFailed && (
                    <p className="create-search-message create-search-error" role="alert">
                      Search is unavailable right now. Try again.
                    </p>
                  )}
                  {!searching && !searchFailed && searchResults.length === 0 && (
                    <p className="create-search-message">No matching Wikipedia pages found.</p>
                  )}
                  {searchResults.map((result, index) => {
                    const alreadyAdded = articles.some(article => article.wikipedia_title === result.title)
                    return (
                      <button
                        className={`create-search-result${index === activeResultIndex ? ' is-active' : ''}`}
                        id={`task-result-${index}`}
                        role="option"
                        aria-selected={index === activeResultIndex}
                        type="button"
                        key={result.title}
                        disabled={alreadyAdded}
                        onMouseEnter={() => setActiveResultIndex(index)}
                        onClick={() => void handleSelectResult(result.title)}
                      >
                        <span className="create-result-title">
                          {result.title}
                          {alreadyAdded && <span>Already added</span>}
                        </span>
                        <span className="create-result-snippet">{plainTextSnippet(result.snippet)}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {loadingPreview && (
                <div className="create-preview-loading" role="status">
                  <span className="create-search-spinner" aria-hidden="true" />
                  Loading page preview…
                </div>
              )}

              {taskError && <p className="create-inline-error" role="alert">{taskError}</p>}

              {preview && (
                <article className="create-preview">
                  <div className="create-preview-heading">
                    <span className="create-preview-check" aria-hidden="true">✓</span>
                    <div>
                      <p>Wikipedia page</p>
                      <h3>{preview.wikipedia_title}</h3>
                    </div>
                  </div>
                  <div className="create-preview-meta">
                    <span>{preview.categories.length} categories</span>
                    <span>{preview.alt_titles.length} alternative {preview.alt_titles.length === 1 ? 'title' : 'titles'}</span>
                  </div>
                  <div className="create-category-preview">
                    {preview.categories.length > 0 ? (
                      <>
                        {preview.categories.slice(0, 6).map(category => (
                          <span key={category}>{category}</span>
                        ))}
                        {preview.categories.length > 6 && (
                          <span>+{preview.categories.length - 6} more</span>
                        )}
                      </>
                    ) : (
                      <p>This page has no usable categories. You can still add it.</p>
                    )}
                  </div>
                  <div className="create-preview-actions">
                    <button className="create-button create-button-primary" type="button" onClick={handleConfirmTask}>
                      Confirm task
                    </button>
                    <button className="create-button create-button-quiet" type="button" onClick={resetTaskSearch}>
                      Choose another
                    </button>
                  </div>
                </article>
              )}

              <div className="create-task-actions">
                <p>{articles.length === 0 ? 'Add at least one task to continue.' : 'You can add another task after confirming this one.'}</p>
                <button
                  className="create-button create-button-secondary"
                  type="button"
                  onClick={handleDoneAdding}
                  disabled={articles.length === 0}
                >
                  Done adding tasks
                </button>
              </div>
            </div>
          ) : (
            <div className="create-tasks-complete" role="status">
              <div>
                <strong>{atTaskLimit ? 'Task limit reached' : 'Task list complete'}</strong>
                <span>{articles.length} {articles.length === 1 ? 'task' : 'tasks'} ready for your puzzle.</span>
              </div>
              {!atTaskLimit && (
                <button className="create-button create-button-secondary" type="button" onClick={handleAddAnother}>
                  Add another task
                </button>
              )}
            </div>
          )}
        </section>

        {formError && <p className="create-form-error" role="alert">{formError}</p>}

        <div className="create-submit-row">
          <p>
            {!title.trim()
              ? 'Add a title before creating your puzzle.'
              : articles.length === 0
                ? 'Choose at least one Wikipedia page.'
                : `${articles.length} ${articles.length === 1 ? 'task' : 'tasks'} will be included.`}
          </p>
          <button
            ref={createButtonRef}
            className="create-button create-button-primary create-submit"
            type="submit"
            disabled={!title.trim() || articles.length === 0 || submitting}
          >
            {submitting ? 'Creating puzzle…' : 'Create puzzle'}
          </button>
        </div>
      </form>
    </main>
  )
}
