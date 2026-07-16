import type {
  PuzzleSummary,
  PuzzleDetail,
  ArticleInput,
  ResultCreate,
  LeaderboardEntry,
  WikiSearchResult,
  WikiArticleData,
  ReverseCategoryRound,
  ReverseCategoryGuessResult,
} from './types'

const BASE = '/api'

export class ApiError extends Error {
  status: number
  detail?: string

  constructor(status: number, statusText: string, detail?: string) {
    super(detail || `${status} ${statusText}`)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const payload = await res.json().catch(() => null) as { detail?: string } | null
    throw new ApiError(res.status, res.statusText, payload?.detail)
  }
  return res.json() as Promise<T>
}

export const api = {
  listPuzzles: (signal?: AbortSignal): Promise<PuzzleSummary[]> =>
    request('/puzzles', { signal }),

  createPuzzle: (body: {
    title: string
    description?: string
    articles: ArticleInput[]
  }): Promise<{ short_id: string }> =>
    request('/puzzles', { method: 'POST', body: JSON.stringify(body) }),

  getPuzzle: (shortId: string, signal?: AbortSignal): Promise<PuzzleDetail> =>
    request(`/puzzles/${shortId}`, { signal }),

  checkAnswer: (
    shortId: string,
    articleIndex: number,
    guess: string,
  ): Promise<{ correct: boolean }> =>
    request(`/puzzles/${shortId}/check-answer`, {
      method: 'POST',
      body: JSON.stringify({ article_index: articleIndex, guess }),
    }),

  revealAnswer: (
    shortId: string,
    articleIndex: number,
  ): Promise<{ wikipedia_title: string }> =>
    request(`/puzzles/${shortId}/reveal-answer`, {
      method: 'POST',
      body: JSON.stringify({ article_index: articleIndex }),
    }),

  submitResult: (
    shortId: string,
    body: ResultCreate,
  ): Promise<{ id: string }> =>
    request(`/puzzles/${shortId}/results`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getLeaderboard: (shortId: string, signal?: AbortSignal): Promise<LeaderboardEntry[]> =>
    request(`/puzzles/${shortId}/leaderboard`, { signal }),

  searchWikipedia: (q: string, signal?: AbortSignal): Promise<WikiSearchResult[]> =>
    request(`/wikipedia/search?q=${encodeURIComponent(q)}`, { signal }),

  searchWikipediaCategories: (q: string, signal?: AbortSignal): Promise<WikiSearchResult[]> =>
    request(`/wikipedia/category-search?q=${encodeURIComponent(q)}`, { signal }),

  getWikipediaArticle: (title: string, signal?: AbortSignal): Promise<WikiArticleData> =>
    request(`/wikipedia/article?title=${encodeURIComponent(title)}`, { signal }),

  getReverseCategoryRound: (signal?: AbortSignal): Promise<ReverseCategoryRound> =>
    request('/arcade/reverse/round', { signal }),

  checkReverseCategory: (roundId: string, guess: string): Promise<ReverseCategoryGuessResult> =>
    request('/arcade/reverse/check', {
      method: 'POST',
      body: JSON.stringify({ round_id: roundId, guess }),
    }),

  revealReverseCategory: (roundId: string): Promise<{ answer: string }> =>
    request('/arcade/reverse/reveal', {
      method: 'POST',
      body: JSON.stringify({ round_id: roundId }),
    }),
}
