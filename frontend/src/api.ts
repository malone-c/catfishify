import type {
  PuzzleSummary,
  PuzzleDetail,
  ArticleInput,
  ResultCreate,
  WikiSearchResult,
  WikiArticleData,
} from './types'

const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const api = {
  listPuzzles: (): Promise<PuzzleSummary[]> =>
    request('/puzzles'),

  createPuzzle: (body: {
    title: string
    description?: string
    articles: ArticleInput[]
  }): Promise<{ short_id: string }> =>
    request('/puzzles', { method: 'POST', body: JSON.stringify(body) }),

  getPuzzle: (shortId: string): Promise<PuzzleDetail> =>
    request(`/puzzles/${shortId}`),

  checkAnswer: (
    shortId: string,
    articleIndex: number,
    guess: string,
  ): Promise<{ correct: boolean }> =>
    request(`/puzzles/${shortId}/check-answer`, {
      method: 'POST',
      body: JSON.stringify({ article_index: articleIndex, guess }),
    }),

  submitResult: (
    shortId: string,
    body: ResultCreate,
  ): Promise<{ id: string }> =>
    request(`/puzzles/${shortId}/results`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  searchWikipedia: (q: string): Promise<WikiSearchResult[]> =>
    request(`/wikipedia/search?q=${encodeURIComponent(q)}`),

  getWikipediaArticle: (title: string): Promise<WikiArticleData> =>
    request(`/wikipedia/article?title=${encodeURIComponent(title)}`),
}
