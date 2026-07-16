import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test } from 'vitest'
import ArcadeRoutes from './ArcadeRoutes'
import { arcadeModes } from './modes'

function renderArcade(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/arcade/*" element={<ArcadeRoutes />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => window.localStorage.clear())

describe('Arcade', () => {
  test('lists every playable experiment on the hub', async () => {
    renderArcade('/arcade')

    expect(await screen.findByRole('heading', { name: 'Eight ways to get catfished.' })).toBeInTheDocument()
    for (const mode of arcadeModes) {
      expect(screen.getByRole('link', { name: new RegExp(mode.title) })).toHaveAttribute('href', mode.path)
    }
  })

  test.each([
    ['/arcade/clue-ladder', 'Clue Ladder'],
    ['/arcade/red-herring', 'Red Herring'],
    ['/arcade/which-wiki', 'Which Wiki?'],
    ['/arcade/school-of-fish', 'School of Fish'],
    ['/arcade/wiki-pairs', 'Wiki Pairs'],
    ['/arcade/nine-lives', 'Nine Lives'],
    ['/arcade/daily-catch', 'Daily Catch'],
    ['/arcade/reverse-catfishing', 'Reverse Catfishing'],
  ])('renders %s as a standalone game page', async (path, heading) => {
    renderArcade(path)
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'All experiments' })).toHaveAttribute('href', '/arcade')
  })

  test('solves a Clue Ladder round early for the maximum value', async () => {
    const user = userEvent.setup()
    renderArcade('/arcade/clue-ladder')

    await screen.findByRole('heading', { name: 'Clue Ladder' })
    await user.click(screen.getByRole('button', { name: /Albert Einstein/ }))

    expect(screen.getByText('Albert Einstein, caught.')).toBeInTheDocument()
    expect(screen.getByText(/Solved for 5 cats/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next ladder' })).toBeEnabled()
  })

  test('reveals the source of a Red Herring', async () => {
    const user = userEvent.setup()
    renderArcade('/arcade/red-herring')

    await screen.findByRole('heading', { name: 'Red Herring' })
    await user.click(screen.getByRole('button', { name: /Wireless pioneers/ }))

    expect(screen.getByText('Herring hooked.')).toBeInTheDocument()
    expect(screen.getByText(/belongs with Hedy Lamarr/)).toBeInTheDocument()
  })

  test('checks a verified small category in Reverse Catfishing', async () => {
    const user = userEvent.setup()
    renderArcade('/arcade/reverse-catfishing')

    await screen.findByRole('heading', { name: 'Reverse Catfishing' })
    expect(screen.getByText('Callisto (moon)')).toBeInTheDocument()
    expect(screen.getByText('Io (moon)')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Galilean moons/ }))

    expect(screen.getByText('Category caught.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Verify on Wikipedia ↗' })).toHaveAttribute(
      'href',
      'https://en.wikipedia.org/wiki/Category:Galilean_moons',
    )
  })
})
