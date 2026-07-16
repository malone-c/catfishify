import { expect, test, type Page, type Route } from '@playwright/test'

const puzzle = {
  short_id: 'ocean123',
  title: 'Creatures of the deep',
  description: 'Strange lives below the sunlight zone',
  size: 1,
  articles: [{ categories: ['Marine biology', 'Bioluminescent organisms'] }],
}

const leaderboard = [
  { nickname: 'Orca', score: 1, time_taken_secs: 31, completed_at: '2026-07-16T02:00:00Z' },
  { nickname: 'Lanternfish', score: 0.5, time_taken_secs: 48, completed_at: '2026-07-16T02:05:00Z' },
  { nickname: 'Manta', score: 0, time_taken_secs: 66, completed_at: '2026-07-16T02:10:00Z' },
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
      return json(route, [{ title: 'Anglerfish', snippet: 'A deep-sea ray-finned fish.' }])
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

  await expect(page.getByRole('heading', { name: 'Know the page from the clues?' })).toBeVisible()
  await expect(page.getByRole('heading', { name: puzzle.title })).toBeVisible()
  await expect(page.getByRole('link', { name: /Build a puzzle/ }).first()).toBeVisible()

  const skipLink = page.getByRole('link', { name: 'Skip to content' })
  const hiddenBox = await skipLink.boundingBox()
  expect(hiddenBox).not.toBeNull()
  expect(hiddenBox!.y + hiddenBox!.height).toBeLessThanOrEqual(0)
  await page.keyboard.press('Tab')
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeVisible()
})

test('builds a dynamic one-task puzzle from Wikipedia search', async ({ page }) => {
  await page.goto('/create')
  const firstTask = page.getByRole('combobox', { name: 'Task 1' })
  await expect(firstTask).toBeFocused()
  await firstTask.fill('angler')
  await page.getByRole('option', { name: /Anglerfish/ }).click()

  await expect(page.getByRole('heading', { name: 'Anglerfish' })).toBeVisible()
  await expect(page.getByText('Bioluminescent organisms')).toBeVisible()
  await page.getByRole('button', { name: 'Confirm task' }).click()
  await expect(page.getByRole('combobox', { name: 'Task 2' })).toBeFocused()

  await page.getByRole('button', { name: 'Done adding tasks' }).click()
  await page.getByLabel(/Title/).fill('Deep sea challenge')
  await page.getByRole('button', { name: 'Create puzzle' }).click()

  await expect(page).toHaveURL(`/p/${puzzle.short_id}`)
  await expect(page.getByRole('heading', { name: puzzle.title })).toBeVisible()
})

test('finishes a puzzle, submits a score, and renders the standings', async ({ page }, testInfo) => {
  await page.goto(`/p/${puzzle.short_id}`)
  await page.getByLabel('Your answer').fill('Anglerfish')
  await page.getByRole('button', { name: 'Check answer' }).click()
  await expect(page.getByText('Clean catch!')).toBeVisible()
  await page.getByRole('button', { name: /See my score/ }).click()

  await expect(page.getByText('Puzzle complete')).toBeVisible()
  await expect(page.getByLabel('Final score 1 out of 1')).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('finish-screen.png'), fullPage: true })
  await page.getByLabel('Nickname').fill('deepsea')
  await page.getByRole('button', { name: 'Submit score' }).click()
  await expect(page.getByText("You're on the board")).toBeVisible()

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
