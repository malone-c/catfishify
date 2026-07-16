import { expect, test } from '@playwright/test'

const modes = [
  ['clue-ladder', 'Clue Ladder'],
  ['red-herring', 'Red Herring'],
  ['which-wiki', 'Which Wiki?'],
  ['school-of-fish', 'School of Fish'],
  ['wiki-pairs', 'Wiki Pairs'],
  ['nine-lives', 'Nine Lives'],
  ['daily-catch', 'Daily Catch'],
  ['reverse-catfishing', 'Reverse Catfishing'],
] as const

test('browses all eight Arcade experiments', async ({ page }, testInfo) => {
  await page.goto('/arcade')
  await expect(page.getByRole('heading', { name: 'Eight ways to get catfished.' })).toBeVisible()

  for (const [, title] of modes) {
    await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible()
  }

  await page.screenshot({ path: testInfo.outputPath('arcade-hub.png'), fullPage: true })

  for (const [slug, title] of modes) {
    await page.goto(`/arcade/${slug}`)
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    const width = await page.locator('body').evaluate(element => ({
      client: element.clientWidth,
      scroll: element.scrollWidth,
    }))
    expect(width.scroll).toBeLessThanOrEqual(width.client)
  }
})

test('plays the new deduction and deception loops', async ({ page }) => {
  await page.goto('/arcade/clue-ladder')
  await page.getByRole('button', { name: /Albert Einstein/ }).click()
  await expect(page.getByText('Albert Einstein, caught.')).toBeVisible()

  await page.goto('/arcade/red-herring')
  await page.getByRole('button', { name: /Wireless pioneers/ }).click()
  await expect(page.getByText('Herring hooked.')).toBeVisible()

  await page.goto('/arcade/reverse-catfishing')
  await expect(page.getByText('Callisto (moon)')).toBeVisible()
  await page.getByRole('button', { name: /Galilean moons/ }).click()
  await expect(page.getByText('Category caught.')).toBeVisible()
})

test('finishes every Arcade mode', async ({ page }) => {
  await page.goto('/arcade/clue-ladder')
  for (const [index, answer] of ['Albert Einstein', 'Axolotl', 'Mount Everest', 'Frida Kahlo', 'Pizza'].entries()) {
    await page.getByRole('button', { name: new RegExp(answer) }).click()
    await page.getByRole('button', { name: index === 4 ? 'See my haul' : 'Next ladder' }).click()
  }
  await expect(page.getByRole('link', { name: 'Try another mode' })).toBeVisible()

  await page.goto('/arcade/red-herring')
  for (const [index, answer] of ['Wireless pioneers', 'Camouflaging animals', 'Pacific Ocean', 'English women computer scientists', 'Traditional board games'].entries()) {
    await page.getByRole('button', { name: new RegExp(answer) }).click()
    await page.getByRole('button', { name: index === 4 ? 'See results' : 'Next deception' }).click()
  }
  await expect(page.getByRole('link', { name: 'Try another mode' })).toBeVisible()

  await page.goto('/arcade/which-wiki')
  for (const [index, answer] of ['Ada Lovelace', 'Voyager 1', 'Octopus', 'Chess', 'Hedy Lamarr'].entries()) {
    await page.getByRole('button', { name: new RegExp(answer) }).click()
    await page.getByRole('button', { name: index === 4 ? 'See results' : 'Next dossier' }).click()
  }
  await expect(page.getByRole('link', { name: 'Try another mode' })).toBeVisible()

  await page.goto('/arcade/school-of-fish')
  const schools = {
    'Albert Einstein': ['German theoretical physicists', 'Nobel laureates in Physics', 'Institute for Advanced Study faculty'],
    Axolotl: ['Endemic fauna of Mexico', 'Critically endangered biota of Mexico', 'Amphibians of Mexico'],
    Pizza: ['National dishes', 'Italian cuisine', 'Foods with tomato'],
  }
  for (const [article, categories] of Object.entries(schools)) {
    for (const category of categories) {
      await page.getByRole('button', { name: new RegExp(category) }).click()
      await page.locator('.school-buckets button').filter({ hasText: article }).click()
    }
  }
  await page.getByRole('button', { name: 'Check the schools' }).click()
  await expect(page.getByText('/ 9 sorted')).toBeVisible()

  await page.goto('/arcade/wiki-pairs')
  const pairs = [
    ['Albert Einstein', 'Nobel laureates in Physics'],
    ['Axolotl', 'Paedomorphism'],
    ['Mount Everest', 'Seven Summits'],
    ['Frida Kahlo', 'Self-portraitists'],
    ['Voyager 1', 'Spacecraft escaping the Solar System'],
    ['Pizza', 'Neapolitan cuisine'],
  ]
  for (const [index, [article, category]] of pairs.entries()) {
    const articleCard = page.locator('.pair-card').filter({ hasText: article })
    const categoryCard = page.locator('.pair-card').filter({ hasText: category })
    await articleCard.click()
    await categoryCard.click()
    if (index < pairs.length - 1) {
      await expect(articleCard).toBeDisabled()
      await expect(categoryCard).toBeDisabled()
    }
  }
  await expect(page.getByRole('button', { name: 'Shuffle and replay' })).toBeVisible()

  await page.goto('/arcade/nine-lives')
  await page.locator('.lives-options button').first().click()
  await page.getByRole('button', { name: 'Next dossier' }).click()
  await page.getByRole('button', { name: 'Bank this run and finish' }).click()
  await expect(page.getByRole('button', { name: 'Start with nine lives' })).toBeVisible()

  await page.goto('/arcade/daily-catch')
  for (let index = 0; index < 5; index += 1) {
    await page.locator('.daily-options button').first().click()
    await page.getByRole('button', { name: index === 4 ? 'Finish today’s catch' : 'Next catch' }).click()
  }
  await expect(page.getByRole('button', { name: 'Copy spoiler-free result' })).toBeVisible()

  await page.goto('/arcade/reverse-catfishing')
  for (const [index, answer] of ['Galilean moons', 'Spice Girls members', 'Traveling Wilburys members', 'Monty Python members', 'Wives of Henry VIII'].entries()) {
    await page.getByRole('button', { name: new RegExp(answer) }).click()
    await page.getByRole('button', { name: index === 4 ? 'See results' : 'Next shoal' }).click()
  }
  await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible()
})
