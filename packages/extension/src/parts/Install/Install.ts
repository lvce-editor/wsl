import { showErrorMessage, showQuickPick } from '@lvce-editor/api'
import { output } from '../Output/Output.ts'
import * as Rpc from '../Rpc/Rpc.ts'

const showError = async (message: string): Promise<void> => {
  await showErrorMessage(message, { title: 'WSL' })
}

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error)
}

interface InstallDependencies {
  readonly invoke: typeof Rpc.invoke
  readonly log: typeof output.appendLine
  readonly showError: typeof showError
  readonly showPick: typeof showQuickPick
}

const defaultDependencies: InstallDependencies = {
  invoke: Rpc.invoke,
  log: (message) => output.appendLine(message),
  showError,
  showPick: showQuickPick,
}

export const installDistro = async (dependencies: InstallDependencies = defaultDependencies): Promise<void> => {
  try {
    const value = await dependencies.invoke('Wsl.listOnlineDistributions')
    if (!Array.isArray(value)) {
      throw new TypeError('WSL returned an invalid online distribution list')
    }
    const distributions = value.filter(
      (item): item is { readonly name: string; readonly friendlyName: string } =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.name === 'string' &&
        Boolean(item.name.trim()) &&
        typeof item.friendlyName === 'string' &&
        Boolean(item.friendlyName.trim()),
    )
    if (distributions.length === 0) {
      await dependencies.showError('No WSL distributions are available to install.')
      return
    }
    const selected = await dependencies.showPick({
      items: distributions.map(({ friendlyName, name }) => ({
        description: '',
        label: friendlyName,
        value: name,
      })),
      placeholder: 'Select the WSL distro to install',
    })
    if (typeof selected !== 'string') {
      return
    }
    await dependencies.log(`Installing WSL distribution ${selected}...`)
    await dependencies.invoke('Wsl.installDistribution', selected)
    await dependencies.log(`Installed WSL distribution ${selected}.`)
  } catch (error) {
    await dependencies.showError(`Failed to install WSL distribution: ${getErrorMessage(error)}`)
  }
}
