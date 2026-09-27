import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'wsl.expand-folder'

export const test: Test = async ({ Command, ComponentState, expect, Explorer, Locator, Panel, SideBar, Wsl }) => {
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

  try {
    await expect(varFolder).toBeVisible()
  } catch (error) {
    const component = await ComponentState.getComponent('Explorer')
    const state = await ComponentState.getState<Record<string, unknown>>(component.uid)
    const details = {
      root: state.root,
      height: state.height,
      itemHeight: state.itemHeight,
      deltaY: state.deltaY,
      minLineY: state.minLineY,
      maxLineY: state.maxLineY,
      items: state.items,
    }
    throw new Error(`${String(error)}; Explorer state: ${JSON.stringify(details)}`)
  }
  await expect(varFolder).toHaveAttribute('aria-expanded', 'false')
  await expect(varFolder).toHaveAttribute('aria-level', '1')
  await expect(logFolder).toBeHidden()

  await varFolder.click()

  await expect(varFolder).toHaveAttribute('aria-expanded', 'true')
  const workspaceUri = await Command.execute('Workspace.getUri')
  await Explorer.reveal(`${workspaceUri.replace(/\/$/, '')}/var/log`)
  await expect(logFolder).toBeVisible()
  await expect(logFolder).toHaveAttribute('aria-level', '2')
}
