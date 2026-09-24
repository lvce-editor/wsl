import * as Wsl from '../Wsl/Wsl.ts'

export const commandMap = {
  'Wsl.listDistributions': Wsl.listDistributions,
  'WslFileSystem.connect': Wsl.connect,
  'WslFileSystem.getOpenExternalPath': Wsl.getOpenExternalPath,
  'WslFileSystem.readDirWithFileTypes': Wsl.readDirWithFileTypes,
  'WslFileSystem.readFile': Wsl.readFile,
  'WslFileSystem.stat': Wsl.stat,
}
