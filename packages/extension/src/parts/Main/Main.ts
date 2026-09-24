import { activate as activateExtensionApi, createOutputChannel, registerCommand, registerFileSystemProvider } from '@lvce-editor/api'
import * as Connect from '../Connect/Connect.ts'
import { fileSystem } from '../FileSystem/FileSystem.ts'
import * as Rpc from '../Rpc/Rpc.ts'
import * as ShowLog from '../ShowLog/ShowLog.ts'

const output = createOutputChannel('wsl')

const state = {
  activated: false,
}

export const activate = async (): Promise<void> => {
  if (state.activated) {
    return
  }
  state.activated = true
  try {
    await activateExtensionApi()
    registerFileSystemProvider(fileSystem)
    await output.appendLine('WSL extension activated')
    registerCommand({
      execute: Connect.connect,
      id: 'wsl.connect',
    })
    registerCommand({
      execute: ShowLog.showLog,
      id: 'wsl.showLog',
    })
  } catch (error) {
    state.activated = false
    await Rpc.dispose()
    throw error
  }
}

export const deactivate = async (): Promise<void> => {
  state.activated = false
  await Rpc.dispose()
}
