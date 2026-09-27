import * as Wsl from '../Wsl/Wsl.ts'

export const commandMap = {
  'Wsl.convertWindowsPath': Wsl.convertWindowsPath,
  'Wsl.installDistribution': Wsl.installDistribution,
  'Wsl.listDistributions': Wsl.listDistributions,
  'Wsl.listOnlineDistributions': Wsl.listOnlineDistributions,
  'WslFileSystem.connect': Wsl.connect,
  'WslFileSystem.getOpenExternalPath': Wsl.getOpenExternalPath,
  'WslFileSystem.readDirWithFileTypes': Wsl.readDirWithFileTypes,
  'WslFileSystem.readFile': Wsl.readFile,
  'WslFileSystem.stat': Wsl.stat,
}
