import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'wsl.expand-folder'

export const test: Test = async ({ expect, Explorer, Locator, SideBar, Wsl }) => {
  await Wsl.enableExtension()
  await Wsl.connect()
  await SideBar.open('Explorer')
  await Explorer.collapseAll()

  const varFolder = Locator('.Explorer .TreeItem[aria-label="var"]')
  const logFolder = Locator('.Explorer .TreeItem[aria-label="log"]')
  for (let i = 0; i < 8; i++) {
    await Explorer.refresh()
    try {
      await expect(varFolder).toBeVisible()
      break
    } catch {
      // The WSL command runs in a separate process; refresh until its workspace update is rendered.
    }
  }

  await expect(varFolder).toBeVisible()
  await expect(varFolder).toHaveAttribute('aria-expanded', 'false')
  await expect(varFolder).toHaveAttribute('aria-level', '0')
  await expect(logFolder).toBeHidden()

  await varFolder.click()

  await expect(varFolder).toHaveAttribute('aria-expanded', 'true')
  await expect(logFolder).toBeVisible()
  await expect(logFolder).toHaveAttribute('aria-level', '1')
}
