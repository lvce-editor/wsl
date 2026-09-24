import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'wsl.connect-distro'

export const test: Test = async ({ Command, expect, Explorer, Locator, QuickPick, SideBar, Wsl }) => {
  await Wsl.enableExtension()
  await Command.execute('wsl.connectUsingDistro')

  const distroItems = Locator('.QuickPickItem')
  await expect(distroItems.first()).toBeVisible()
  await expect(distroItems).not.toContainText('Install New')
  await QuickPick.selectIndex(0)

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
