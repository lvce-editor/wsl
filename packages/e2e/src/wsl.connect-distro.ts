import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'wsl.connect-distro'

export const test: Test = async ({ Command, expect, Explorer, FileSystem, Locator, QuickPick, SideBar, Wsl }) => {
  await Wsl.enableExtension()
  await QuickPick.open()
  // Keep the command prefix: unprefixed input searches workspace files.
  await QuickPick.setValue('>WSL: Connect to WSL using Distro...')
  await QuickPick.selectItem('WSL: Connect to WSL using Distro...', { waitUntil: 'quickPick' })

  const distroItems = Locator('.QuickPickItem')
  await expect(distroItems.first()).toBeVisible()
  await expect(distroItems).not.toContainText('Install New')
  await QuickPick.selectIndex(0)

  // Extension commands finish asynchronously; wait for the connected Explorer.
  await SideBar.open('Explorer')
  const bootEntry = Locator('.Explorer .TreeItem[aria-label="boot"]')
  for (let i = 0; i < 8; i++) {
    await Explorer.refresh()
    try {
      await expect(bootEntry).toBeVisible()
      break
    } catch {
      // Refresh until the extension's workspace update has rendered.
    }
  }
  await expect(bootEntry).toBeVisible()
  const workspaceUri = await Command.execute('Workspace.getUri')
  if (typeof workspaceUri !== 'string' || !workspaceUri.startsWith('wsl://')) {
    throw new Error(`Expected a WSL workspace URI, received ${String(workspaceUri)}`)
  }
  const entries = await FileSystem.readDir(workspaceUri)
  if (entries.every((entry: { readonly name: string }) => entry.name !== 'boot')) {
    throw new Error(`WSL workspace ${workspaceUri} root did not contain /boot`)
  }
}
