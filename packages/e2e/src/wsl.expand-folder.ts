import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'wsl.expand-folder'

export const test: Test = async ({ Command, expect, Explorer, Locator, Panel, SideBar, Wsl }) => {
  await Wsl.enableExtension()
  await Wsl.connect()
  // The preceding connection test opens Output; restore the full Explorer viewport.
  await Panel.hide()
  await SideBar.open('Explorer')
  await Explorer.collapseAll()

  const varFolder = Locator('.Explorer .TreeItem[aria-label="var"]')
  const logFolder = Locator('.Explorer .TreeItem[aria-label="log"]')
  for (let i = 0; i < 8; i++) {
    await Explorer.refresh()
    const workspaceUri = await Command.execute('Workspace.getUri')
    // Root listings vary by distro; reveal the target even when it is virtualized.
    await Explorer.reveal(`${workspaceUri.replace(/\/$/, '')}/var`)
    try {
      await expect(varFolder).toBeVisible()
      break
    } catch {
      // The WSL command runs in a separate process; refresh until its workspace update is rendered.
    }
  }

  await expect(varFolder).toBeVisible()
  await expect(varFolder).toHaveAttribute('aria-expanded', 'false')
  await expect(varFolder).toHaveAttribute('aria-level', '1')
  await expect(logFolder).toBeHidden()

  // The folder index differs between WSL distributions, so use its semantic locator.
  // eslint-disable-next-line e2e/no-direct-click, @typescript-eslint/no-deprecated
  await varFolder.click()

  await expect(varFolder).toHaveAttribute('aria-expanded', 'true')
  const workspaceUri = await Command.execute('Workspace.getUri')
  await Explorer.reveal(`${workspaceUri.replace(/\/$/, '')}/var/log`)
  await expect(logFolder).toBeVisible()
  await expect(logFolder).toHaveAttribute('aria-level', '2')
}
