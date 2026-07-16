import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import ArcadeRoutes from './ArcadeRoutes'

const liveRound = {
  round_id: 'opaque-round',
  pages: [
    'Compton–Belkovich Thorium Anomaly',
    'Dazhbog Patera',
    'Jaszai Patera',
    'Pillan Patera',
    'Sacajawea Patera',
    'Sachs Patera',
    'Theia Mons',
  ],
  member_count: 7,
}

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }))
}

function renderArcade(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/arcade/*" element={<ArcadeRoutes />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.endsWith('/arcade/reverse/round')) return json(liveRound)
    if (url.endsWith('/arcade/reverse/check')) {
      const body = JSON.parse(String(init?.body)) as { guess: string }
      return json(body.guess === 'Extraterrestrial volcanic calderas'
        ? { correct: true, answer: 'Extraterrestrial volcanic calderas' }
        : { correct: false, answer: null })
    }
    if (url.endsWith('/arcade/reverse/reveal')) {
      return json({ answer: 'Extraterrestrial volcanic calderas' })
    }
    return json({ detail: 'Unhandled test request' }, 500)
  }))
})

afterEach(() => vi.unstubAllGlobals())

describe('Arcade', () => {
  test('retires the recognition-heavy prototypes from the hub', () => {
    renderArcade('/arcade')

    expect(screen.getByRole('heading', { name: 'The arcade is being rebuilt around actual difficulty.' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Reverse Catfishing/ })).toHaveLength(2)
    expect(screen.queryByText('Which Wiki?')).not.toBeInTheDocument()
    expect(screen.queryByText('Nine Lives')).not.toBeInTheDocument()
  })

  test('redirects retired game routes to the Arcade index', async () => {
    renderArcade('/arcade/clue-ladder')
    expect(await screen.findByRole('heading', { name: 'The arcade is being rebuilt around actual difficulty.' })).toBeInTheDocument()
  })

  test('renders the complete live page list with one free-text input', async () => {
    renderArcade('/arcade/reverse-catfishing')

    expect(await screen.findByRole('heading', { name: '7 Wikipedia pages' })).toBeInTheDocument()
    expect(screen.getByText('Compton–Belkovich Thorium Anomaly')).toBeInTheDocument()
    expect(screen.getByText('Theia Mons')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Category name' })).toHaveFocus()
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  test('keeps incorrect free-text attempts and accepts the canonical category', async () => {
    const user = userEvent.setup()
    renderArcade('/arcade/reverse-catfishing')
    const input = await screen.findByRole('textbox', { name: 'Category name' })

    await user.type(input, 'Volcanoes on Venus')
    await user.click(screen.getByRole('button', { name: 'Submit guess' }))
    expect(await screen.findByText('Incorrect')).toBeInTheDocument()
    expect(screen.getByText('Volcanoes on Venus')).toBeInTheDocument()
    await waitFor(() => expect(input).toHaveFocus())

    await user.type(input, 'Extraterrestrial volcanic calderas')
    await user.click(screen.getByRole('button', { name: 'Submit guess' }))
    expect(await screen.findByRole('heading', { name: 'Extraterrestrial volcanic calderas' })).toBeInTheDocument()
    expect(screen.getByText('Correct in 2 attempts.')).toBeInTheDocument()
  })

  test('reveals only when the player explicitly ends the round', async () => {
    const user = userEvent.setup()
    renderArcade('/arcade/reverse-catfishing')
    await screen.findByRole('textbox', { name: 'Category name' })

    await user.click(screen.getByRole('button', { name: 'Reveal category and end round' }))

    expect(await screen.findByRole('heading', { name: 'Extraterrestrial volcanic calderas' })).toBeInTheDocument()
    expect(screen.getByText('Revealed after 0 attempts.')).toBeInTheDocument()
  })
})
