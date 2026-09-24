import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'wsl.show-log'

export const test: Test = async ({ expect, Locator, Panel, QuickPick, Wsl }) => {
  await Wsl.enableExtension()

  await QuickPick.open()
  await QuickPick.setValue('>WSL')
  const connectCommand = Locator('.QuickPickItem', { hasText: 'WSL: Connect to WSL' })
  const showLogCommand = Locator('.QuickPickItem', { hasText: 'WSL: Show Log' })
  await expect(connectCommand).toBeVisible()
  await expect(showLogCommand).toHaveCount(1)
  await QuickPick.selectItem('WSL: Show Log')

  await Panel.open('Output')
  const outputChannel = Locator('[name="output"]')
  const outputContent = Locator('.OutputContent')
  await expect(outputChannel).toHaveValue('wsl')
  await expect(outputContent).toHaveText('WSL extension activated')

  await QuickPick.open()
  await QuickPick.setValue('>WSL: Show Log')
  await QuickPick.selectItem('WSL: Show Log')

  await expect(outputChannel).toHaveValue('wsl')
  await expect(outputContent).toHaveText('WSL extension activated')
}
