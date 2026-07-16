import { beforeEach, describe, expect, test } from 'vitest'
import {
  createProgress,
  formatDuration,
  loadProgress,
  saveProgress,
  scoreAnswers,
} from './game'

describe('game progress', () => {
  beforeEach(() => localStorage.clear())

  test('restores a valid in-progress game', () => {
    saveProgress('ocean', {
      answers: ['correct', 'half', null],
      currentIndex: 2,
      startedAt: 1_000,
    })

    expect(loadProgress('ocean', 3)).toEqual({
      answers: ['correct', 'half', null],
      currentIndex: 2,
      startedAt: 1_000,
    })
  })

  test('discards saved progress that does not match the puzzle', () => {
    localStorage.setItem('catfishify-progress-ocean', JSON.stringify({
      answers: ['correct'],
      currentIndex: 8,
      startedAt: 1_000,
    }))

    expect(loadProgress('ocean', 3)).toBeNull()
  })

  test('creates an empty game with the supplied start time', () => {
    expect(createProgress(3, 12_345)).toEqual({
      answers: [null, null, null],
      currentIndex: 0,
      startedAt: 12_345,
    })
  })
})

describe('game results', () => {
  test('scores correct answers and close calls', () => {
    expect(scoreAnswers(['correct', 'half', 'skipped', 'wrong'])).toBe(1.5)
  })

  test('formats elapsed time with stable two-digit seconds', () => {
    expect(formatDuration(125)).toBe('2:05')
  })
})
