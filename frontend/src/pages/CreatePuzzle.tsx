import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import WikipediaAutocomplete from '../components/WikipediaAutocomplete'
import type { ArticleInput, WikiArticleData } from '../types'
import './CreatePuzzle.css'

const MAX_TASKS = 10

interface PreviewArticle extends WikiArticleData {
  wikipedia_title: string
}

export default function CreatePuzzle() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [articles, setArticles] = useState<ArticleInput[]>([])
  const [isAddingTask, setIsAddingTask] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [preview, setPreview] = useState<PreviewArticle | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [taskError, setTaskError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const createButtonRef = useRef<HTMLButtonElement>(null)
  const previewRequestRef = useRef(0)
  const previewControllerRef = useRef<AbortController | null>(null)

  const atTaskLimit = articles.length === MAX_TASKS
  const canSubmit = Boolean(title.trim() && articles.length > 0 && !isAddingTask && !submitting)
  const excludedTitles = useMemo(
    () => articles.map(article => article.wikipedia_title),
    [articles],
  )

  useEffect(() => () => previewControllerRef.current?.abort(), [])

  useEffect(() => {
    if (isAddingTask && !preview && searchQuery === '') inputRef.current?.focus()
  }, [articles.length, isAddingTask, preview, searchQuery])

  const resetTaskSearch = () => {
    previewRequestRef.current += 1
    previewControllerRef.current?.abort()
    setSearchQuery('')
    setPreview(null)
    setLoadingPreview(false)
    setTaskError(null)
  }

  const handleSearchChange = (query: string) => {
    previewRequestRef.current += 1
    previewControllerRef.current?.abort()
    setSearchQuery(query)
    setPreview(null)
    setLoadingPreview(false)
    setTaskError(null)
  }

  const handleSelectResult = async (wikiTitle: string) => {
    if (articles.some(article => article.wikipedia_title === wikiTitle)) return

    const requestId = ++previewRequestRef.current
    previewControllerRef.current?.abort()
    const controller = new AbortController()
    previewControllerRef.current = controller
    setSearchQuery(wikiTitle)
    setLoadingPreview(true)
    setTaskError(null)
    try {
      const data = await api.getWikipediaArticle(wikiTitle, controller.signal)
      if (requestId === previewRequestRef.current) {
        setPreview({ wikipedia_title: wikiTitle, ...data })
      }
    } catch (errorValue) {
      if (errorValue instanceof DOMException && errorValue.name === 'AbortError') return
      if (requestId === previewRequestRef.current) {
        setTaskError('We could not preview that Wikipedia page. Please choose another.')
      }
    } finally {
      if (requestId === previewRequestRef.current) setLoadingPreview(false)
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
    if (!canSubmit) return
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
                onChange={event => {
                  setTitle(event.target.value)
                  setFormError(null)
                }}
                placeholder="e.g. Famous scientists"
                autoComplete="off"
                maxLength={100}
                required
              />
            </label>

            <label className="create-field">
              <span>Description <span className="create-optional">Optional</span></span>
              <textarea
                value={description}
                onChange={event => {
                  setDescription(event.target.value)
                  setFormError(null)
                }}
                placeholder="A short introduction to your puzzle"
                maxLength={500}
                rows={3}
              />
            </label>
          </div>
        </section>

        <section className="create-section create-tasks" aria-labelledby="puzzle-tasks-heading">
          <div className="create-section-heading create-task-heading">
            <span className="create-step-number">2</span>
            <div>
              <h2 id="puzzle-tasks-heading">Choose the pages</h2>
              <p>Add up to ten Wikipedia pages, then select done.</p>
            </div>
            <span className="create-task-count" aria-label={`${articles.length} of ${MAX_TASKS} pages added`}>
              {articles.length}<span> / {MAX_TASKS}</span>
            </span>
          </div>

          {articles.length > 0 && (
            <ol className="create-task-list" aria-label="Selected pages">
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
                <label htmlFor="task-search">Page {articles.length + 1}</label>
                <span>Search Wikipedia</span>
              </div>
              <WikipediaAutocomplete
                id="task-search"
                ref={inputRef}
                value={searchQuery}
                onValueChange={handleSearchChange}
                onSelect={result => void handleSelectResult(result.title)}
                placeholder="Start typing a page title…"
                excludedTitles={excludedTitles}
                autoFocus={articles.length === 0}
              />

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
                      Confirm page
                    </button>
                    <button className="create-button create-button-quiet" type="button" onClick={resetTaskSearch}>
                      Choose another
                    </button>
                    <a
                      className="create-preview-link"
                      href={`https://en.wikipedia.org/wiki/${encodeURIComponent(preview.wikipedia_title.replaceAll(' ', '_'))}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on Wikipedia ↗
                    </a>
                  </div>
                </article>
              )}

              <div className="create-task-actions">
                <p>{articles.length === 0 ? 'Add at least one page to continue.' : 'You can add another page after confirming this one.'}</p>
                <button
                  className="create-button create-button-secondary"
                  type="button"
                  onClick={handleDoneAdding}
                  disabled={articles.length === 0}
                >
                  Done adding pages
                </button>
              </div>
            </div>
          ) : (
            <div className="create-tasks-complete" role="status">
              <div>
                <strong>{atTaskLimit ? 'Page limit reached' : 'Page list complete'}</strong>
                <span>{articles.length} {articles.length === 1 ? 'page' : 'pages'} ready for your puzzle.</span>
              </div>
              {!atTaskLimit && (
                <button className="create-button create-button-secondary" type="button" onClick={handleAddAnother}>
                  Add another page
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
                : isAddingTask
                  ? 'Select “Done adding pages” when your list is ready.'
                  : `${articles.length} ${articles.length === 1 ? 'page' : 'pages'} will be included.`}
          </p>
          <button
            ref={createButtonRef}
            className="create-button create-button-primary create-submit"
            type="submit"
            disabled={!canSubmit}
          >
            {submitting ? 'Creating puzzle…' : 'Create puzzle'}
          </button>
        </div>
      </form>
    </main>
  )
}
