import { test, expect } from '@playwright/test'

test('opens the WSL workspace fixture', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('wsl-fixture')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'WSL workspace fixture' })).toBeVisible()
})
