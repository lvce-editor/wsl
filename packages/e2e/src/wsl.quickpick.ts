import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'wsl.quickpick'

export const test: Test = async ({ ActivityBar, expect, Extension, Locator, QuickPick }) => {
  await Extension.enableWorkspace('lvce.wsl')
  await ActivityBar.handleExtensionsChanged()
  await QuickPick.open()
  await QuickPick.setValue('>WSL: Connect to WSL')

  const connectCommand = Locator('.QuickPickItem', { hasText: 'WSL: Connect to WSL' })
  await expect(connectCommand).toBeVisible()
}
