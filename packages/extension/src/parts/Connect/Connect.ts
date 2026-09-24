import { executeCommand, showQuickPick } from '@lvce-editor/api'
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

export const toWorkspaceUri = (distribution: string): string => {
  return `wsl://${encodeURIComponent(distribution)}/`
}

interface ConnectDependencies {
  readonly execute: typeof executeCommand
  readonly invoke: typeof Rpc.invoke
  readonly showError: typeof showError
  readonly showPick: typeof showQuickPick
}

const defaultDependencies: ConnectDependencies = {
  execute: executeCommand,
  invoke: Rpc.invoke,
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
