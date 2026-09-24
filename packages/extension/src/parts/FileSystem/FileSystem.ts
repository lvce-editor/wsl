import type { FileSystemDirent, FileSystemProvider } from '@lvce-editor/api'
import * as Rpc from '../Rpc/Rpc.ts'

const decodeBase64 = (value: string): ArrayBuffer => {
  const bytes = Uint8Array.from(atob(value), (character) => character.codePointAt(0) || 0)
  return bytes.buffer
}

export const fileSystem: FileSystemProvider = {
  getOpenExternalPath: async (uri: string): Promise<string> => {
    return (await Rpc.invoke('WslFileSystem.getOpenExternalPath', uri)) as string
  },
  id: 'wsl',
  isReadonly: () => false,
  readDirWithFileTypes: async (uri: string): Promise<readonly FileSystemDirent[]> => {
    return (await Rpc.invoke('WslFileSystem.readDirWithFileTypes', uri)) as readonly FileSystemDirent[]
  },
  readFile: async (uri: string): Promise<Blob> => {
    const value = await Rpc.invoke('WslFileSystem.readFile', uri)
    if (typeof value !== 'string') {
      throw new TypeError('WSL read returned invalid content')
    }
    return new Blob([decodeBase64(value)])
  },
  stat: async (uri: string): Promise<number> => {
    return (await Rpc.invoke('WslFileSystem.stat', uri)) as number
  },
}
