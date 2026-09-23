import { executeCommand } from '@lvce-editor/api'
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

export const connect = async (): Promise<void> => {
  try {
    const value = await Rpc.invoke('Wsl.listDistributions')
    if (!Array.isArray(value)) {
      throw new TypeError('WSL returned an invalid distribution list')
    }
    const distributions = value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    if (distributions.length === 0) {
      await showError('No WSL distributions are installed.')
      return
    }
    const distribution = distributions[0]
    const workspaceUri = toWorkspaceUri(distribution)
    await Rpc.invoke('WslFileSystem.connect', workspaceUri)
    await executeCommand('Workspace.setUri', workspaceUri)
  } catch (error) {
    await showError(`Failed to connect to WSL: ${getErrorMessage(error)}`)
  }
}
