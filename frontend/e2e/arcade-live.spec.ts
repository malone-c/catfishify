import { expect, test } from '@playwright/test'

const liveUrl = process.env.CATFISHIFY_LIVE_URL

test('production serves the Arcade and plays Reverse Catfishing', async ({ page }) => {
  test.skip(!liveUrl, 'Set CATFISHIFY_LIVE_URL to run the production Arcade smoke test')

  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))

  const response = await page.goto(new URL('/arcade', liveUrl!).toString())
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: 'The arcade is being rebuilt around actual difficulty.' })).toBeVisible()

  await page.getByRole('link', { name: 'Play Reverse Catfishing' }).click()
  await expect(page).toHaveURL(/\/arcade\/reverse-catfishing$/)
  await expect(page.getByRole('heading', { name: 'Name the category.' })).toBeVisible()

  const pageRows = page.locator('.reverse-live-pages li')
  await expect(pageRows.first()).toBeVisible({ timeout: 20_000 })
  expect(await pageRows.count()).toBeGreaterThanOrEqual(5)
  expect(await pageRows.count()).toBeLessThanOrEqual(20)

  await page.getByRole('textbox', { name: 'Category name' }).fill('not a wikipedia category 99118')
  await page.getByRole('button', { name: 'Submit guess' }).click()
  await expect(page.getByText('Incorrect', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Reveal category and end round' }).click()
  await expect(page.getByText('Round ended', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /Open category on Wikipedia/ })).toBeVisible()
  expect(pageErrors).toEqual([])
})
