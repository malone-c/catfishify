import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { api } from '../api'
import type { WikiSearchResult } from '../types'
import './WikipediaAutocomplete.css'

const SEARCH_DELAY_MS = 300
const NO_EXCLUDED_TITLES: readonly string[] = []

interface WikipediaAutocompleteProps {
  id: string
  value: string
  onValueChange: (value: string) => void
  onSelect?: (result: WikiSearchResult) => void
  placeholder: string
  disabled?: boolean
  autoFocus?: boolean
  excludedTitles?: readonly string[]
}

type SearchStatus = 'idle' | 'loading' | 'success' | 'error'

function plainTextSnippet(snippet: string) {
  const parsed = new DOMParser().parseFromString(snippet, 'text/html')
  return parsed.body.textContent ?? ''
}

const WikipediaAutocomplete = forwardRef<HTMLInputElement, WikipediaAutocompleteProps>(
  function WikipediaAutocomplete({
    id,
    value,
    onValueChange,
    onSelect,
    placeholder,
    disabled = false,
    autoFocus = false,
    excludedTitles = NO_EXCLUDED_TITLES,
  }, ref) {
    const [results, setResults] = useState<WikiSearchResult[]>([])
    const [activeResultIndex, setActiveResultIndex] = useState(-1)
    const [status, setStatus] = useState<SearchStatus>('idle')
    const [dismissedQuery, setDismissedQuery] = useState<string | null>(null)
    const selectedValueRef = useRef<string | null>(null)
    const requestRef = useRef(0)
    const excludedTitleSet = useMemo(() => new Set(excludedTitles), [excludedTitles])

    const query = value.trim()
    const resultsId = `${id}-results`
    const showResults = !disabled
      && query.length > 1
      && selectedValueRef.current !== value
      && dismissedQuery !== value

    useEffect(() => {
      const requestId = ++requestRef.current

      if (disabled || query.length < 2 || selectedValueRef.current === value || dismissedQuery === value) {
        setResults([])
        setActiveResultIndex(-1)
        setStatus('idle')
        return
      }

      const controller = new AbortController()
      setResults([])
      setActiveResultIndex(-1)
      setStatus('loading')

      const timeout = window.setTimeout(async () => {
        try {
          const nextResults = await api.searchWikipedia(query, controller.signal)
          if (requestId === requestRef.current) {
            setResults(nextResults)
            setStatus('success')
          }
        } catch (errorValue) {
          if (errorValue instanceof DOMException && errorValue.name === 'AbortError') return
          if (requestId === requestRef.current) {
            setResults([])
            setStatus('error')
          }
        }
      }, SEARCH_DELAY_MS)

      return () => {
        window.clearTimeout(timeout)
        controller.abort()
      }
    }, [disabled, dismissedQuery, query, value])

    useEffect(() => {
      setActiveResultIndex(currentIndex => {
        const currentResult = results[currentIndex]
        if (currentResult && !excludedTitleSet.has(currentResult.title)) return currentIndex
        return results.findIndex(result => !excludedTitleSet.has(result.title))
      })
    }, [excludedTitleSet, results])

    const selectResult = (result: WikiSearchResult) => {
      if (excludedTitleSet.has(result.title)) return
      selectedValueRef.current = result.title
      setResults([])
      setActiveResultIndex(-1)
      setStatus('idle')
      onValueChange(result.title)
      onSelect?.(result)
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape' && showResults) {
        event.preventDefault()
        setDismissedQuery(value)
        return
      }

      if (!showResults || results.length === 0) return

      const availableIndices = results.flatMap((result, index) => (
        excludedTitleSet.has(result.title) ? [] : [index]
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
        selectResult(results[activeResultIndex])
      }
    }

    return (
      <div className="wikipedia-autocomplete">
        <div className="wikipedia-autocomplete__control">
          <span className="wikipedia-autocomplete__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <input
            className="wikipedia-autocomplete__input"
            id={id}
            ref={ref}
            value={value}
            onChange={event => {
              selectedValueRef.current = null
              setDismissedQuery(null)
              onValueChange(event.target.value)
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck="false"
            role="combobox"
            aria-autocomplete="list"
            aria-controls={resultsId}
            aria-expanded={showResults}
            aria-activedescendant={activeResultIndex >= 0 ? `${id}-result-${activeResultIndex}` : undefined}
            aria-busy={status === 'loading'}
            autoFocus={autoFocus}
          />
          {status === 'loading' && (
            <span className="wikipedia-autocomplete__spinner" role="status" aria-label="Searching Wikipedia" />
          )}
        </div>

        {showResults && (
          <div className="wikipedia-autocomplete__results" id={resultsId} role="listbox">
            {status === 'loading' && (
              <p className="wikipedia-autocomplete__message">Searching Wikipedia…</p>
            )}
            {status === 'error' && (
              <p className="wikipedia-autocomplete__message wikipedia-autocomplete__message--error" role="alert">
                Search is unavailable right now. Try again.
              </p>
            )}
            {status === 'success' && results.length === 0 && (
              <p className="wikipedia-autocomplete__message">No matching Wikipedia pages found.</p>
            )}
            {results.map((result, index) => {
              const isExcluded = excludedTitleSet.has(result.title)
              return (
                <button
                  className={`wikipedia-autocomplete__result${index === activeResultIndex ? ' is-active' : ''}`}
                  id={`${id}-result-${index}`}
                  role="option"
                  aria-selected={index === activeResultIndex}
                  type="button"
                  key={result.title}
                  disabled={isExcluded}
                  onMouseEnter={() => {
                    if (!isExcluded) setActiveResultIndex(index)
                  }}
                  onClick={() => selectResult(result)}
                >
                  <span className="wikipedia-autocomplete__title">
                    {result.title}
                    {isExcluded && <span>Already added</span>}
                  </span>
                  <span className="wikipedia-autocomplete__snippet">{plainTextSnippet(result.snippet)}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  },
)

export default WikipediaAutocomplete
