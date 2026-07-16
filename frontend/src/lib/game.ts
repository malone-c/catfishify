import type { AnswerDetail } from '../types'

export interface StoredProgress {
  answers: (AnswerDetail | null)[]
  currentIndex: number
  startedAt: number
  finishedAt?: number
}

const ANSWER_DETAILS = new Set<AnswerDetail>(['correct', 'half', 'wrong', 'skipped'])

function storageKey(shortId: string) {
  return `catfishify-progress-${shortId}`
}

export function createProgress(size: number, startedAt = Date.now()): StoredProgress {
  return {
    answers: Array<AnswerDetail | null>(size).fill(null),
    currentIndex: 0,
    startedAt,
  }
}

export function loadProgress(shortId: string, size: number): StoredProgress | null {
  try {
    const raw = localStorage.getItem(storageKey(shortId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredProgress>
    if (
      !Array.isArray(parsed.answers)
      || parsed.answers.length !== size
      || !parsed.answers.every(answer => answer === null || ANSWER_DETAILS.has(answer))
      || !Number.isInteger(parsed.currentIndex)
      || parsed.currentIndex === undefined
      || parsed.currentIndex < 0
      || parsed.currentIndex > size
      || typeof parsed.startedAt !== 'number'
      || !Number.isFinite(parsed.startedAt)
      || parsed.startedAt <= 0
      || (parsed.finishedAt !== undefined && (
        typeof parsed.finishedAt !== 'number'
        || !Number.isFinite(parsed.finishedAt)
        || parsed.finishedAt < parsed.startedAt
      ))
    ) return null

    return parsed as StoredProgress
  } catch {
    return null
  }
}

export function saveProgress(shortId: string, progress: StoredProgress) {
  try {
    localStorage.setItem(storageKey(shortId), JSON.stringify(progress))
  } catch {
    // Progress saving is a convenience; gameplay should survive restricted storage.
  }
}

export function clearProgress(shortId: string) {
  try {
    localStorage.removeItem(storageKey(shortId))
  } catch {
    // Ignore restricted storage and keep the current session playable.
  }
}

export function getNicknameCookie(): string {
  const match = document.cookie.match(/(?:^|;\s*)catfishify-nickname=([^;]*)/)
  if (!match) return ''
  try {
    return decodeURIComponent(match[1])
  } catch {
    return ''
  }
}

export function setNicknameCookie(nickname: string) {
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)
  document.cookie = `catfishify-nickname=${encodeURIComponent(nickname)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

export function emojiForAnswer(answer: AnswerDetail | null): string {
  if (answer === 'correct') return '🐈'
  if (answer === 'half') return '🐡'
  return '🐟'
}

export function scoreAnswers(answers: (AnswerDetail | null)[]): number {
  return answers.reduce<number>((sum, answer) => {
    if (answer === 'correct') return sum + 1
    if (answer === 'half') return sum + 0.5
    return sum
  }, 0)
}

export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
