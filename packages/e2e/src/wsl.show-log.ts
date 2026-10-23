import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'wsl.show-log'

export const test: Test = async ({ Command, expect, Locator, QuickPick, Workspace, Wsl }) => {
  await Wsl.enableExtension()

  await QuickPick.open()
  await QuickPick.setValue('>WSL')
  const connectCommand = Locator('.QuickPickItem', { hasText: 'WSL: Connect to WSL' })
  const showLogCommand = Locator('.QuickPickItem', { hasText: 'WSL: Show Log' })
  await expect(connectCommand).toBeVisible()
  await expect(showLogCommand).toHaveCount(1)
  await QuickPick.selectItem('WSL: Show Log', { waitUntil: 'done' })

  const outputChannel = Locator('[name="output"]')
  const outputContent = Locator('.OutputContent')
  await expect(outputContent).toBeVisible()
  await expect(outputChannel).toHaveValue('wsl')
  await expect(outputContent).toContainText('WSL')

  // Reopening Output must keep its worker connections alive across workspace changes.
  const directory = await Command.execute('PlatformPaths.getTmpDir')
  // Workspace.setPath converts the native temporary path to a file URI.
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  await Workspace.setPath(directory)
  await QuickPick.open()
  await QuickPick.setValue('>WSL: Show Log')
  await QuickPick.selectItem('WSL: Show Log', { waitUntil: 'done' })

  await expect(outputContent).toBeVisible()
  await expect(outputChannel).toHaveValue('wsl')
  await expect(outputContent).toContainText('WSL')
}
