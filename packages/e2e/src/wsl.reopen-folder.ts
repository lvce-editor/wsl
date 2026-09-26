import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'wsl.reopen-folder'

export const test: Test = async ({ Command, FileSystem, QuickPick, Workspace, Wsl }) => {
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

  const workspaceUri = await Command.execute('Workspace.getUri')
  if (typeof workspaceUri !== 'string' || !workspaceUri.startsWith('wsl://')) {
    throw new Error(`Expected the folder to reopen in WSL, received ${String(workspaceUri)}`)
  }
  await FileSystem.shouldHaveFile(`${workspaceUri}/fixture%20%23%20%E2%9C%93.txt`, 'WSL folder fixture')
}
