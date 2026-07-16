import { expect, test } from '@playwright/test'

const liveUrl = process.env.CATFISHIFY_LIVE_URL

test('production serves the app and live Wikipedia search', async ({ page }) => {
  test.skip(!liveUrl, 'Set CATFISHIFY_LIVE_URL to run the production smoke test')

  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))

  const response = await page.goto(liveUrl!)
  expect(response?.status()).toBe(200)
  expect(response?.headers()['content-security-policy']).toContain("default-src 'self'")
  await expect(page.getByRole('heading', { name: 'Know the page from the clues?' })).toBeVisible()

  await page.getByRole('link', { name: /Build a puzzle/ }).first().click()
  const taskInput = page.getByRole('combobox', { name: 'Task 1' })
  await taskInput.fill('einstein')
  await expect(page.getByRole('option').filter({ hasText: /^Albert Einstein/ })).toBeVisible()
  await expect(page.getByText('Search is unavailable right now. Try again.')).toHaveCount(0)
  expect(pageErrors).toEqual([])
})
