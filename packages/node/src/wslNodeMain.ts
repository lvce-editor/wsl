import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface WslCommandResult {
  stderr: string
  stdout: string
}

export const getWslExecutable = (): string => process.platform === 'win32' ? 'wsl.exe' : 'wsl'

export const runInWsl = async (command: string, args: readonly string[] = []): Promise<WslCommandResult> => {
  const result = await execFileAsync(getWslExecutable(), ['--exec', command, ...args], {
    maxBuffer: 10 * 1024 * 1024,
    windowsHide: true,
  })
  return {
    stderr: result.stderr,
    stdout: result.stdout,
  }
}

export const getWslWorkingDirectory = async (): Promise<string> => {
  const { stdout } = await runInWsl('pwd')
  return stdout.trim()
}
