export interface ArticleForPlayer {
  categories: string[]
}

export interface PuzzleSummary {
  short_id: string
  title: string
  description: string | null
  size: number
  completions: number
}

export interface PuzzleDetail {
  short_id: string
  title: string
  description: string | null
  size: number
  articles: ArticleForPlayer[]
}

export interface ArticleInput {
  wikipedia_title: string
  categories: string[]
  alt_titles: string[]
}

export type AnswerDetail = 'correct' | 'half' | 'wrong' | 'skipped'

export interface ResultCreate {
  nickname: string
  score: number
  time_taken_secs: number
  answer_details: AnswerDetail[]
}

export interface WikiSearchResult {
  title: string
  snippet: string
}

export interface WikiArticleData {
  categories: string[]
  alt_titles: string[]
}

export interface ReverseCategoryRound {
  round_id: string
  pages: string[]
  member_count: number
}

export interface ReverseCategoryGuessResult {
  correct: boolean
  answer: string | null
}

export interface LeaderboardEntry {
  nickname: string
  score: number
  time_taken_secs: number
  completed_at: string
}
