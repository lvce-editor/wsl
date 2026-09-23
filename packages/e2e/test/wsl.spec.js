import { test, expect } from '@playwright/test'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

test('opens the WSL workspace fixture', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('wsl-fixture')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'WSL workspace fixture' })).toBeVisible()
})

test('lists the root of the first WSL distribution', async () => {
  test.skip(process.platform !== 'win32', 'WSL is only available on Windows runners')
  const { stdout: distributions } = await execFileAsync('wsl.exe', ['--list', '--quiet'], { encoding: 'buffer' })
  const distribution = distributions
    .toString(distributions[1] === 0 ? 'utf16le' : 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)
  expect(distribution).toBeTruthy()
  if (!distribution) {
    return
  }
  const { stdout } = await execFileAsync(
    'wsl.exe',
    ['--distribution', distribution, '--exec', 'find', '/', '-mindepth', '1', '-maxdepth', '1', '-printf', '%f\\n'],
    { encoding: 'utf8' },
  )
  expect(stdout.split(/\r?\n/).filter(Boolean).length).toBeGreaterThan(0)
})
