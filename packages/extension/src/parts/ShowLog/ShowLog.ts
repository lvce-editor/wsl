import { executeCommand } from '@lvce-editor/api'

export const showLog = async (): Promise<void> => {
  await executeCommand('Layout.openOutput', 'wsl')
}
