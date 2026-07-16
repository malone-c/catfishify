import { expect, test } from '@playwright/test'

const liveUrl = process.env.CATFISHIFY_LIVE_URL

test('production serves the app and live Wikipedia search', async ({ page }) => {
  test.skip(!liveUrl, 'Set CATFISHIFY_LIVE_URL to run the production smoke test')

  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))

  const response = await page.goto(liveUrl!)
  expect(response?.status()).toBe(200)
  expect(response?.headers()['content-security-policy']).toContain("default-src 'self'")
  await expect(page.getByRole('heading', { name: 'Create your own catfishing games' })).toBeVisible()

  const faviconHref = await page.locator('link[rel="icon"]').getAttribute('href')
  expect(faviconHref).not.toBeNull()
  const faviconResponse = await page.request.get(new URL(faviconHref!, liveUrl!).toString())
  expect(faviconResponse.status()).toBe(200)
  expect(faviconResponse.headers()['content-type']).toContain('image/svg+xml')
  expect((await faviconResponse.body()).byteLength).toBeGreaterThan(0)

  await page.getByRole('link', { name: /Create a puzzle/ }).first().click()
  const pageInput = page.getByRole('combobox', { name: 'Page 1' })
  await pageInput.fill('einstein')
  await expect(page.getByRole('option').filter({ hasText: /^Albert Einstein/ })).toBeVisible()
  await expect(page.getByText('Search is unavailable right now. Try again.')).toHaveCount(0)
  expect(pageErrors).toEqual([])
})
