import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'wsl.connect-distro'

const runStep = async <T>(name: string, callback: () => Promise<T>): Promise<T> => {
  try {
    return await callback()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`WSL distro e2e step "${name}" failed: ${message}`, { cause: error })
  }
}

export const test: Test = async ({ Command, expect, FileSystem, Locator, QuickPick, Wsl }) => {
  await runStep('enable extension', () => Wsl.enableExtension())
  await runStep('run distro command', () => QuickPick.executeCommand('WSL: Connect to WSL using Distro...'))

  const distroItems = Locator('.QuickPickItem')
  await runStep('show installed distributions', () => expect(distroItems.first()).toBeVisible())
  await runStep('omit install option', () => expect(distroItems).not.toContainText('Install New'))
  await runStep('select distribution', () => QuickPick.selectIndex(0))

  const workspaceUri = await runStep('read workspace uri', () => Command.execute('Workspace.getUri'))
  if (typeof workspaceUri !== 'string' || !workspaceUri.startsWith('wsl://')) {
    throw new Error(`Expected a WSL workspace URI, received ${String(workspaceUri)}`)
  }
  const entries = await runStep('read WSL root', () => FileSystem.readDir(workspaceUri))
  if (entries.every((entry: { readonly name: string }) => entry.name !== 'boot')) {
    throw new Error(`WSL workspace ${workspaceUri} root did not contain /boot`)
  }
}
