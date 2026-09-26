import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'wsl.quickpick'

export const test: Test = async ({ Command, expect, Locator, QuickPick, Wsl }) => {
  await Wsl.enableExtension()
  await Wsl.shouldHaveConnectCommand()
  const extensions = await Command.execute('ExtensionManagement.getExtensions')
  const extension = extensions.find((candidate: { id?: string }) => candidate.id === 'lvce.wsl')
  if (!extension) {
    throw new Error(JSON.stringify(extensions))
  }
  if (!Array.isArray(extension.activation) || !extension.activation.includes('onCommand:wsl.connectUsingDistro')) {
    throw new Error(JSON.stringify(extension))
  }
  await QuickPick.open()
  await QuickPick.setValue('>WSL: Reopen Folder in WSL')
  const reopenFolderCommand = Locator('.QuickPickItem', { hasText: 'WSL: Reopen Folder in WSL' })
  await expect(reopenFolderCommand).toBeVisible()
}
