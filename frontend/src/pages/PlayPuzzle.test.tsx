import { afterEach, expect, test, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlayPuzzle from './PlayPuzzle'

afterEach(() => vi.unstubAllGlobals())

test('player can solve a page and submit a leaderboard result', async () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url === '/api/puzzles/ocean123') {
      return new Response(JSON.stringify({
        short_id: 'ocean123',
        title: 'Ocean quiz',
        description: 'Things found below the surface',
        size: 1,
        articles: [{ categories: ['Marine biology', 'Bioluminescent organisms'] }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    if (url.endsWith('/check-answer')) {
      return new Response(JSON.stringify({ correct: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (url.endsWith('/results') && init?.method === 'POST') {
      return new Response(JSON.stringify({ id: 'result-1' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    throw new Error(`Unexpected request: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  const user = userEvent.setup()

  render(
    <MemoryRouter initialEntries={['/p/ocean123']}>
      <Routes>
        <Route path="/p/:shortId" element={<PlayPuzzle />} />
      </Routes>
    </MemoryRouter>,
  )

  expect(await screen.findByRole('heading', { name: 'Ocean quiz' })).toBeVisible()
  expect(screen.getByText('Bioluminescent organisms')).toBeVisible()

  await user.type(screen.getByLabelText('Your answer'), 'Anglerfish')
  await user.click(screen.getByRole('button', { name: 'Check answer' }))
  expect(await screen.findByText('Correct.')).toBeVisible()
  await user.click(screen.getByRole('button', { name: /See my score/ }))

  expect(await screen.findByText('Puzzle complete')).toBeVisible()
  expect(screen.getByRole('heading', { name: 'Puzzle complete' })).toHaveFocus()
  expect(screen.getByLabelText('Final score 1 out of 1')).toBeVisible()
  await user.type(screen.getByLabelText('Nickname'), 'deepsea')
  await user.click(screen.getByRole('button', { name: 'Submit score' }))

  expect(await screen.findByText('Score submitted')).toBeVisible()
  await waitFor(() => {
    const resultCall = fetchMock.mock.calls.find(([input]) => String(input).endsWith('/results'))
    expect(resultCall).toBeDefined()
    expect(JSON.parse(String(resultCall?.[1]?.body))).toMatchObject({
      nickname: 'deepsea',
      score: 1,
      answer_details: ['correct'],
    })
  })
})

test('skipping reveals the page before the player advances', async () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url === '/api/puzzles/ocean123') {
      return new Response(JSON.stringify({
        short_id: 'ocean123',
        title: 'Ocean quiz',
        description: null,
        size: 1,
        articles: [{ categories: ['Bioluminescent organisms'] }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    if (url.endsWith('/reveal-answer')) {
      return new Response(JSON.stringify({ wikipedia_title: 'Anglerfish' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    throw new Error(`Unexpected request: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  const user = userEvent.setup()

  render(
    <MemoryRouter initialEntries={['/p/ocean123']}>
      <Routes>
        <Route path="/p/:shortId" element={<PlayPuzzle />} />
      </Routes>
    </MemoryRouter>,
  )

  await screen.findByRole('heading', { name: 'Ocean quiz' })
  await user.click(screen.getByRole('button', { name: 'Skip this page' }))

  expect(await screen.findByText('The page was Anglerfish')).toBeVisible()
  expect(screen.queryByText('Puzzle complete')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'See my score' }))
  expect(await screen.findByLabelText('Final score 0 out of 1')).toBeVisible()
})
