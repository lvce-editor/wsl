import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'wsl.connect'

export const test: Test = async ({ ActivityBar, Command, expect, Explorer, Extension, Locator, QuickPick, SideBar }) => {
  await Extension.enableWorkspace('lvce.wsl')
  await ActivityBar.handleExtensionsChanged()
  const extensions = await Command.execute('ExtensionManagement.getExtensions')
  const extension = extensions.find((candidate: { id?: string }) => candidate.id === 'lvce.wsl')
  if (!extension) {
    throw new Error(JSON.stringify(extensions))
  }
  if (!Array.isArray(extension.activation) || !extension.activation.includes('onCommand:wsl.connect')) {
    throw new Error(JSON.stringify(extension))
  }
  await QuickPick.open()
  await QuickPick.setValue('>WSL: Connect to WSL')

  const connectCommand = Locator('.QuickPickItem', { hasText: 'WSL: Connect to WSL' })
  await expect(connectCommand).toBeVisible()
  await QuickPick.selectItem('WSL: Connect to WSL')

  await SideBar.open('Explorer')
  const bootEntry = Locator('.Explorer .TreeItem[aria-label="boot"]')
  for (let i = 0; i < 8; i++) {
    await Explorer.refresh()
    try {
      await expect(bootEntry).toBeVisible()
      return
    } catch {
      // The WSL command runs in a separate process; refresh until its workspace update is rendered.
    }
  }
  await Explorer.expandAll()
  await expect(bootEntry).toBeVisible()
}
