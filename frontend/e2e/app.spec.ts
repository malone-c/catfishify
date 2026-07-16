import { expect, test, type Page, type Route } from '@playwright/test'

const puzzle = {
  short_id: 'ocean123',
  title: 'Creatures of the deep',
  description: 'Strange lives below the sunlight zone',
  size: 1,
  articles: [{ categories: [
    '1931 sculptures',
    'Art Deco sculptures and memorials',
    'Buildings and structures completed in 1931',
    'Colossal statues in Brazil',
    'Colossal statues of Jesus',
    'Concrete sculptures in Brazil',
    'Monuments and memorials completed in the 1930s',
    'Monuments and memorials in Rio de Janeiro (city)',
    'National heritage sites of Rio de Janeiro (state)',
    'Outdoor sculptures in Brazil',
    'Stone sculptures in Brazil',
    'Vandalized works of art in Brazil',
    'World record holders',
  ] }],
}

const leaderboard = [
  { nickname: 'Orca', score: 1, time_taken_secs: 31, completed_at: '2026-07-16T02:00:00Z' },
  { nickname: 'Lanternfish', score: 0.5, time_taken_secs: 48, completed_at: '2026-07-16T02:05:00Z' },
  { nickname: 'Manta', score: 0, time_taken_secs: 66, completed_at: '2026-07-16T02:10:00Z' },
]

const wikipediaResults = [
  { title: 'Anglerfish', snippet: 'A deep-sea ray-finned fish.' },
  { title: 'Deep sea fish', snippet: 'Fish that live below the photic zone.' },
  { title: 'Marine biology', snippet: 'The scientific study of marine life.' },
  { title: 'Bioluminescence', snippet: 'Light produced by a living organism.' },
  { title: 'Abyssal zone', snippet: 'A deep layer of the ocean.' },
  { title: 'Demersal fish', snippet: 'Fish that live near the seabed.' },
  { title: 'Ocean', snippet: 'A major body of salt water.' },
  { title: 'Ichthyology', snippet: 'The study of fish.' },
]

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
}

async function mockApi(page: Page) {
  await page.route('**/api/**', route => {
    const request = route.request()
    const url = new URL(request.url())

    if (url.pathname === '/api/puzzles' && request.method() === 'GET') {
      return json(route, [{ ...puzzle, completions: leaderboard.length }])
    }
    if (url.pathname === '/api/puzzles' && request.method() === 'POST') {
      return json(route, { short_id: puzzle.short_id }, 201)
    }
    if (url.pathname === `/api/puzzles/${puzzle.short_id}`) return json(route, puzzle)
    if (url.pathname.endsWith('/check-answer')) return json(route, { correct: true })
    if (url.pathname.endsWith('/reveal-answer')) return json(route, { wikipedia_title: 'Anglerfish' })
    if (url.pathname.endsWith('/results')) return json(route, { id: 'result-1' }, 201)
    if (url.pathname.endsWith('/leaderboard')) return json(route, leaderboard)
    if (url.pathname === '/api/wikipedia/search') {
      return json(route, wikipediaResults)
    }
    if (url.pathname === '/api/wikipedia/article') {
      return json(route, {
        categories: ['Deep sea fish', 'Bioluminescent organisms'],
        alt_titles: ['Sea devil'],
      })
    }

    return json(route, { detail: `Unhandled test route: ${url.pathname}` }, 500)
  })
}

test.beforeEach(async ({ page }) => mockApi(page))

test('explores puzzles through the shared shell', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Create your own catfishing games' })).toBeVisible()
  await expect(page.getByRole('heading', { name: puzzle.title })).toBeVisible()
  await expect(page.getByRole('link', { name: /Create a puzzle/ }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'catfishing.net' }).first()).toHaveAttribute('href', 'https://catfishing.net/')

  const skipLink = page.getByRole('link', { name: 'Skip to content' })
  const hiddenBox = await skipLink.boundingBox()
  expect(hiddenBox).not.toBeNull()
  expect(hiddenBox!.y + hiddenBox!.height).toBeLessThanOrEqual(0)
  await page.keyboard.press('Tab')
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeVisible()
})

test('builds a dynamic one-page puzzle from Wikipedia search', async ({ page }) => {
  await page.goto('/create')
  const firstPage = page.getByRole('combobox', { name: 'Page 1' })
  await expect(firstPage).toBeFocused()
  await firstPage.fill('angler')
  await page.getByRole('option', { name: /Anglerfish/ }).click()

  await expect(page.getByRole('heading', { name: 'Anglerfish' })).toBeVisible()
  await expect(page.getByText('Bioluminescent organisms')).toBeVisible()
  await page.getByRole('button', { name: 'Confirm page' }).click()
  await expect(page.getByRole('combobox', { name: 'Page 2' })).toBeFocused()

  await page.getByRole('button', { name: 'Done adding pages' }).click()
  await page.getByLabel(/Title/).fill('Deep sea challenge')
  await page.getByRole('button', { name: 'Create puzzle' }).click()

  await expect(page).toHaveURL(`/p/${puzzle.short_id}`)
  await expect(page.getByRole('heading', { name: puzzle.title })).toBeVisible()
})

test('finishes a puzzle, submits a score, and renders the standings', async ({ page }, testInfo) => {
  await page.goto(`/p/${puzzle.short_id}`)
  const categoryList = page.getByRole('list', { name: 'Wikipedia categories' })
  await expect(categoryList.getByRole('listitem')).toHaveCount(13)
  const categoryListHeight = await categoryList.evaluate(element => element.getBoundingClientRect().height)
  expect(categoryListHeight).toBeLessThanOrEqual(testInfo.project.name === 'mobile' ? 420 : 240)
  await page.screenshot({ path: testInfo.outputPath('play-screen.png'), fullPage: true })

  const answerInput = page.getByRole('combobox', { name: 'Your answer' })
  await answerInput.fill('angler')
  const searchResults = page.locator('.wikipedia-autocomplete__results')
  await expect(searchResults).toBeVisible()
  await expect(searchResults.getByRole('option')).toHaveCount(wikipediaResults.length)
  const clippingAncestor = await searchResults.evaluate(element => {
    let ancestor = element.parentElement
    while (ancestor && ancestor !== document.body) {
      const style = window.getComputedStyle(ancestor)
      if ([style.overflow, style.overflowX, style.overflowY].some(value => value === 'hidden' || value === 'clip')) {
        return ancestor.className
      }
      ancestor = ancestor.parentElement
    }
    return null
  })
  expect(clippingAncestor).toBeNull()
  await page.getByRole('option', { name: /Anglerfish/ }).click()
  await expect(answerInput).toHaveValue('Anglerfish')
  await page.getByRole('button', { name: 'Check answer' }).click()
  await expect(page.getByText('Correct.')).toBeVisible()
  await page.getByRole('button', { name: /See my score/ }).click()

  await expect(page.getByText('Puzzle complete')).toBeVisible()
  await expect(page.getByLabel('Final score 1 out of 1')).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('finish-screen.png'), fullPage: true })
  await page.getByLabel('Nickname').fill('deepsea')
  await page.getByRole('button', { name: 'Submit score' }).click()
  await expect(page.getByText('Score submitted')).toBeVisible()

  await page.goto(`/p/${puzzle.short_id}/leaderboard`)
  await expect(page.getByRole('heading', { name: puzzle.title })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Orca' })).toBeVisible()
  await expect(page.getByRole('table')).toContainText('Lanternfish')

  if (testInfo.project.name === 'mobile') {
    const dimensions = await page.locator('.standings__table-wrap').evaluate(element => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }))
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  }
})
