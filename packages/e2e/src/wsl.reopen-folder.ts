import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'wsl.reopen-folder'

const delay = (milliseconds: number): Promise<void> => {
  const schedule = (globalThis as unknown as { setTimeout: (callback: () => void, delay: number) => unknown }).setTimeout
  return new Promise((resolve) => schedule(resolve, milliseconds))
}

export const test: Test = async ({ Command, expect, Explorer, FileSystem, Locator, Output, QuickPick, SideBar, Workspace, Wsl }) => {
  await Wsl.enableExtension()
  const temporaryUriValue = await FileSystem.getTmpDir({ scheme: 'file' })
  const temporaryUri = temporaryUriValue.replace(/\/$/, '')
  const folderUri = `${temporaryUri}/wsl%20reopen%20%23%20%E2%9C%93`
  const fixtureUri = `${folderUri}/fixture%20%23%20%E2%9C%93.txt`
  await FileSystem.mkdir(folderUri)
  await FileSystem.mkdir(`${folderUri}/nested%20folder`)
  await FileSystem.writeFile(fixtureUri, 'WSL folder fixture')
  await Workspace.setUri(folderUri)

  const originalUri = await Command.execute('Workspace.getUri')
  if (typeof originalUri !== 'string' || !originalUri.startsWith('file:')) {
    throw new Error(`Expected a local folder URI, received ${String(originalUri)}`)
  }
  await QuickPick.open()
  await QuickPick.setValue('>WSL: Reopen Folder in WSL')
  await QuickPick.selectItem('WSL: Reopen Folder in WSL', { waitUntil: 'done' })

  const deadline = Date.now() + 20_000
  let workspaceUri: unknown
  while (Date.now() < deadline) {
    workspaceUri = await Command.execute('Workspace.getUri')
    if (typeof workspaceUri === 'string' && workspaceUri.startsWith('wsl://')) {
      break
    }
    await delay(100)
  }
  if (typeof workspaceUri !== 'string' || !workspaceUri.startsWith('wsl://')) {
    await Output.show()
    const outputContent = Locator('.OutputContent')
    await expect(outputContent).toContainText('Failed to reopen folder in WSL:')
    throw new Error(`Expected the folder to reopen in WSL, received ${String(workspaceUri)}`)
  }

  // Workspace.setUri completes before Explorer has rendered the new filesystem.
  // Refresh until the fixture appears, following the existing distro-connect test.
  await SideBar.open('Explorer')
  const fixtureEntry = Locator('.Explorer .TreeItem[aria-label="fixture # ✓.txt"]')
  const explorerDeadline = Date.now() + 20_000
  while (Date.now() < explorerDeadline) {
    await Explorer.refresh()
    try {
      await expect(fixtureEntry).toBeVisible()
      break
    } catch {
      await delay(100)
    }
  }
  await expect(fixtureEntry).toBeVisible()
  await FileSystem.shouldHaveFile(`${workspaceUri}/fixture%20%23%20%E2%9C%93.txt`, 'WSL folder fixture')
}
