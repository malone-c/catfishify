import { expect, test } from '@playwright/test'

const liveUrl = process.env.CATFISHIFY_LIVE_URL

test('production serves the Arcade and plays Reverse Catfishing', async ({ page }) => {
  test.skip(!liveUrl, 'Set CATFISHIFY_LIVE_URL to run the production Arcade smoke test')

  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))

  const response = await page.goto(new URL('/arcade', liveUrl!).toString())
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: 'Eight ways to get catfished.' })).toBeVisible()

  await page.getByRole('link', { name: /Reverse Catfishing/ }).click()
  await expect(page).toHaveURL(/\/arcade\/reverse-catfishing$/)
  await expect(page.getByText('Callisto (moon)')).toBeVisible()
  await page.getByRole('button', { name: /Galilean moons/ }).click()
  await expect(page.getByText('Category caught.')).toBeVisible()
  expect(pageErrors).toEqual([])
})
