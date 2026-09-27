import { executeCommand, showQuickPick } from '@lvce-editor/api'
import { output } from '../Output/Output.ts'
import * as Rpc from '../Rpc/Rpc.ts'

const showError = async (message: string): Promise<void> => {
  await executeCommand('ConfirmPrompt.showErrorMessage', {
    message,
    title: 'WSL',
  })
}

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error)
}

const toWorkspaceUri = (distribution: string): string => {
  return `wsl://${encodeURIComponent(distribution)}/`
}

const toWslWorkspaceUri = (distribution: string, path: string): string => {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  return `wsl://${encodeURIComponent(distribution)}${encodedPath}`
}

interface ConnectDependencies {
  readonly execute: typeof executeCommand
  readonly invoke: typeof Rpc.invoke
  readonly logError: typeof output.appendLine
  readonly showError: typeof showError
  readonly showPick: typeof showQuickPick
}

const defaultDependencies: ConnectDependencies = {
  execute: executeCommand,
  invoke: Rpc.invoke,
  logError: (message) => output.appendLine(message),
  showError,
  showPick: showQuickPick,
}

const getDistributions = async (invoke: ConnectDependencies['invoke']): Promise<string[]> => {
  const value = await invoke('Wsl.listDistributions')
  if (!Array.isArray(value)) {
    throw new TypeError('WSL returned an invalid distribution list')
  }
  return value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
}

const connectToDistribution = async (distribution: string, dependencies: ConnectDependencies): Promise<void> => {
  const workspaceUri = toWorkspaceUri(distribution)
  await dependencies.invoke('WslFileSystem.connect', workspaceUri)
  await dependencies.execute('Workspace.setUri', workspaceUri)
}

export const connect = async (dependencies: ConnectDependencies = defaultDependencies): Promise<void> => {
  try {
    const distributions = await getDistributions(dependencies.invoke)
    if (distributions.length === 0) {
      await dependencies.showError('No WSL distributions are installed.')
      return
    }
    await connectToDistribution(distributions[0], dependencies)
  } catch (error) {
    await dependencies.showError(`Failed to connect to WSL: ${getErrorMessage(error)}`)
  }
}

export const connectUsingDistro = async (dependencies: ConnectDependencies = defaultDependencies): Promise<void> => {
  try {
    const distributions = await getDistributions(dependencies.invoke)
    if (distributions.length === 0) {
      await dependencies.showError('No WSL distributions are installed.')
      return
    }
    const selected = await dependencies.showPick({
      items: distributions.map((distribution) => ({
        description: '',
        label: distribution,
        value: distribution,
      })),
      placeholder: 'Select WSL distro',
    })
    if (typeof selected !== 'string') {
      return
    }
    await connectToDistribution(selected, dependencies)
  } catch (error) {
    await dependencies.showError(`Failed to connect to WSL: ${getErrorMessage(error)}`)
  }
}

export const reopenFolder = async (dependencies: ConnectDependencies = defaultDependencies): Promise<void> => {
  try {
    const workspaceUri = await dependencies.execute('Workspace.getUri')
    if (typeof workspaceUri !== 'string' || !workspaceUri) {
      await dependencies.showError('Open a Windows folder before reopening it in WSL.')
      return
    }
    if (workspaceUri.startsWith('wsl://')) {
      await dependencies.showError('The current folder is already open in WSL.')
      return
    }
    const url = new URL(workspaceUri)
    if (url.protocol !== 'file:' || (url.hostname && url.hostname !== 'localhost') || url.search || url.hash) {
      await dependencies.showError('Only Windows folders can be reopened in WSL.')
      return
    }
    let windowsPath = decodeURIComponent(url.pathname)
    if (!/^\/[a-zA-Z]:\//.test(windowsPath)) {
      await dependencies.showError('Only Windows folders can be reopened in WSL.')
      return
    }
    windowsPath = windowsPath.slice(1).replaceAll('/', '\\')

    const distributions = await getDistributions(dependencies.invoke)
    const distribution = distributions[0]
    if (!distribution) {
      await dependencies.showError('No WSL distributions are installed.')
      return
    }
    const wslPath = await dependencies.invoke('Wsl.convertWindowsPath', distribution, windowsPath)
    if (typeof wslPath !== 'string' || !wslPath.startsWith('/')) {
      throw new Error('WSL returned an invalid folder path')
    }
    const targetUri = toWslWorkspaceUri(distribution, wslPath)
    await dependencies.invoke('WslFileSystem.connect', targetUri)
    await dependencies.execute('Workspace.setUri', targetUri)
  } catch (error) {
    const message = `Failed to reopen folder in WSL: ${getErrorMessage(error)}`
    await dependencies.logError(message)
    await dependencies.showError(message)
  }
}
