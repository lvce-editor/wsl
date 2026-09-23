import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'wsl.connect'

export const test: Test = async ({ expect, Locator, QuickPick }) => {
  await QuickPick.open()
  await QuickPick.setValue('>WSL: Connect to WSL')

  const connectCommand = Locator('.QuickPickItem', { hasText: 'WSL: Connect to WSL' })
  await expect(connectCommand).toBeVisible()
  await QuickPick.selectItem('WSL: Connect to WSL', { waitUntil: 'none' })
}
