import { afterEach, describe, expect, test, vi } from 'vitest'
import { api } from './api'

describe('API client', () => {
  afterEach(() => vi.unstubAllGlobals())

  test('returns the server detail on an API error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ detail: 'Puzzle not found' }),
      { status: 404, statusText: 'Not Found', headers: { 'Content-Type': 'application/json' } },
    )))

    await expect(api.getPuzzle('missing')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      detail: 'Puzzle not found',
    })
  })

  test('does not add a content-type header to a read request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('[]', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)

    await api.listPuzzles()

    expect(fetchMock).toHaveBeenCalledWith('/api/puzzles', expect.objectContaining({
      headers: expect.not.objectContaining({ 'Content-Type': 'application/json' }),
    }))
  })
})
