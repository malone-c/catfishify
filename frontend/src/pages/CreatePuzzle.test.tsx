import { afterEach, expect, test, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreatePuzzle from './CreatePuzzle'

afterEach(() => vi.unstubAllGlobals())

test('creator can progressively add a searched page and finish the puzzle', async () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.includes('/wikipedia/search')) {
      return new Response(JSON.stringify([{
        title: 'Albert Einstein',
        snippet: 'German-born <span class="searchmatch">physicist</span>',
      }]), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    if (url.includes('/wikipedia/article')) {
      return new Response(JSON.stringify({
        categories: ['1879 births', 'Nobel laureates in Physics'],
        alt_titles: ['Einstein'],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    if (url === '/api/puzzles' && init?.method === 'POST') {
      return new Response(JSON.stringify({ short_id: 'science1' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    throw new Error(`Unexpected request: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  const user = userEvent.setup()

  render(
    <MemoryRouter initialEntries={['/create']}>
      <Routes>
        <Route path="/create" element={<CreatePuzzle />} />
        <Route path="/p/:shortId" element={<p>Puzzle created</p>} />
      </Routes>
    </MemoryRouter>,
  )

  const firstPage = screen.getByRole('combobox', { name: 'Page 1' })
  expect(firstPage).toHaveFocus()
  await user.type(firstPage, 'Einstein')

  expect(await screen.findByText('German-born physicist')).toBeVisible()
  await user.click(screen.getByRole('option', { name: /Albert Einstein/ }))

  expect(await screen.findByRole('heading', { name: 'Albert Einstein' })).toBeVisible()
  expect(screen.getByText('Nobel laureates in Physics')).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Confirm page' }))

  const secondPage = screen.getByRole('combobox', { name: 'Page 2' })
  expect(secondPage).toHaveFocus()
  expect(screen.getByLabelText('1 of 10 pages added')).toBeVisible()

  await user.type(screen.getByLabelText(/Title/), 'Great scientists')
  expect(screen.getByRole('button', { name: 'Create puzzle' })).toBeDisabled()
  await user.click(screen.getByRole('button', { name: 'Done adding pages' }))
  await user.click(screen.getByRole('button', { name: 'Create puzzle' }))

  expect(await screen.findByText('Puzzle created')).toBeVisible()
  await waitFor(() => {
    const createCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(createCall).toBeDefined()
    expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
      title: 'Great scientists',
      articles: [{ wikipedia_title: 'Albert Einstein' }],
    })
  })
})
