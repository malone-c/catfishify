import { expect, test, type Page, type Route } from '@playwright/test'

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

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
}

async function mockReverseApi(page: Page) {
  await page.route('**/api/wikipedia/category-search**', route => json(route, [{
    title: 'Extraterrestrial volcanic calderas',
    snippet: 'Volcanic calderas on worlds beyond Earth.',
  }]))
  await page.route('**/api/arcade/reverse/**', route => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname
    if (pathname.endsWith('/round')) return json(route, liveRound)
    if (pathname.endsWith('/check')) {
      const guess = (request.postDataJSON() as { guess: string }).guess
      return json(route, guess === 'Extraterrestrial volcanic calderas'
        ? { correct: true, answer: 'Extraterrestrial volcanic calderas' }
        : { correct: false, answer: null })
    }
    if (pathname.endsWith('/reveal')) return json(route, { answer: 'Extraterrestrial volcanic calderas' })
    return json(route, { detail: 'Unhandled reverse route' }, 500)
  })
}

test.beforeEach(async ({ page }) => mockReverseApi(page))

test('keeps only the difficult live-data experiment on the Arcade index', async ({ page }) => {
  await page.goto('/arcade')
  await expect(page.getByRole('heading', { name: 'The arcade is being rebuilt around actual difficulty.' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Reverse Catfishing/ }).first()).toBeVisible()
  await expect(page.getByText('Which Wiki?')).toHaveCount(0)
})

test('plays Reverse Catfishing through repeated free-text guesses', async ({ page }) => {
  await page.goto('/arcade/reverse-catfishing')

  await expect(page.getByRole('heading', { name: '7 Wikipedia pages' })).toBeVisible()
  await expect(page.getByText('Compton–Belkovich Thorium Anomaly')).toBeVisible()
  await expect(page.getByText('Theia Mons')).toBeVisible()

  const input = page.getByRole('combobox', { name: 'Category name' })
  await expect(input).toBeFocused()
  await input.fill('Volcanoes on Venus')
  await page.getByRole('button', { name: 'Submit guess' }).click()
  await expect(page.getByText('Incorrect')).toBeVisible()

  await input.fill('extraterrestrial volca')
  const suggestion = page.getByRole('option', { name: /Extraterrestrial volcanic calderas/ })
  await expect(suggestion).toBeVisible()
  await suggestion.click()
  await expect(input).toHaveValue('Extraterrestrial volcanic calderas')
  await page.getByRole('button', { name: 'Submit guess' }).click()
  await expect(page.getByRole('heading', { name: 'Extraterrestrial volcanic calderas' })).toBeVisible()
  await expect(page.getByText('Correct in 2 attempts.')).toBeVisible()

  const width = await page.locator('body').evaluate(element => ({ client: element.clientWidth, scroll: element.scrollWidth }))
  expect(width.scroll).toBeLessThanOrEqual(width.client)
})
