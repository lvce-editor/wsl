import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const DIRECTORY = 3
const FILE = 7
const SYMLINK = 9

const run = async (args: readonly string[]): Promise<Buffer> => {
  const result = await execFileAsync('wsl.exe', args, {
    encoding: 'buffer',
    maxBuffer: 10 * 1024 * 1024,
    windowsHide: true,
  })
  return result.stdout
}

const decode = (value: Buffer): string => {
  if (value.length >= 2 && value[1] === 0) {
    return value.toString('utf16le')
  }
  return value.toString('utf8')
}

export const parseWslUri = (uri: string): { distribution: string; path: string } => {
  const url = new URL(uri)
  if (url.protocol !== 'wsl:') {
    throw new Error(`Expected wsl URI, received ${uri}`)
  }
  const authority = /^wsl:\/\/([^/?#]*)/i.exec(uri)?.[1]
  if (!url.hostname || !authority) {
    throw new Error(`WSL URI has no distribution: ${uri}`)
  }
  if (url.username || url.password || url.port) {
    throw new Error(`Invalid WSL distribution authority: ${uri}`)
  }
  if (url.search || url.hash) {
    throw new Error('WSL URIs must not contain a query or fragment')
  }
  const path = decodeURIComponent(url.pathname || '/')
  if (!path.startsWith('/') || path.includes('\0')) {
    throw new Error(`Invalid WSL path: ${path}`)
  }
  return {
    distribution: decodeURIComponent(authority),
    path,
  }
}

const runInDistribution = (distribution: string, command: string, args: readonly string[] = []): Promise<Buffer> => {
  return run(['--distribution', distribution, '--exec', command, ...args])
}

export const listDistributions = async (): Promise<readonly string[]> => {
  const output = decode(await run(['--list', '--quiet']))
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export const connect = async (uri: string): Promise<{ readonly distribution: string }> => {
  const location = parseWslUri(uri)
  const output = decode(await runInDistribution(location.distribution, 'stat', ['--format=%F', location.path])).trim()
  if (output !== 'directory') {
    throw new Error(`WSL workspace is not a directory: ${location.path}`)
  }
  return { distribution: location.distribution }
}

const getType = (type: string): number => {
  if (type === 'directory' || type === 'd') {
    return DIRECTORY
  }
  if (type === 'symbolic link' || type === 'l') {
    return SYMLINK
  }
  return FILE
}

export const readDirWithFileTypes = async (uri: string): Promise<readonly { readonly name: string; readonly type: number }[]> => {
  const location = parseWslUri(uri)
  const output = decode(
    await runInDistribution(location.distribution, 'find', [location.path, '-mindepth', '1', '-maxdepth', '1', '-printf', '%f\\0%y\\0']),
  )
  const values = output.split('\0').filter(Boolean)
  const entries: Array<{ readonly name: string; readonly type: number }> = []
  for (let i = 0; i + 1 < values.length; i += 2) {
    const [name, type] = values.slice(i, i + 2)
    entries.push({ name, type: getType(type) })
  }
  return entries.toSorted((a, b) => a.name.localeCompare(b.name))
}

export const readFile = async (uri: string): Promise<string> => {
  const location = parseWslUri(uri)
  const output = await runInDistribution(location.distribution, 'cat', [location.path])
  return output.toString('base64')
}

export const stat = async (uri: string): Promise<number> => {
  const location = parseWslUri(uri)
  const output = decode(await runInDistribution(location.distribution, 'stat', ['--format=%F', location.path])).trim()
  return getType(output)
}

export const getOpenExternalPath = async (uri: string): Promise<string> => {
  const location = parseWslUri(uri)
  const output = decode(await runInDistribution(location.distribution, 'wslpath', ['-w', location.path]))
  const path = output.trim()
  if (!path.startsWith('\\\\')) {
    throw new Error(`WSL did not return a Windows network path for ${uri}`)
  }
  return path
}

export const getWslWorkingDirectory = async (): Promise<string> => {
  const distributions = await listDistributions()
  const distribution = distributions[0]
  if (!distribution) {
    throw new Error('No WSL distributions are installed')
  }
  const output = await runInDistribution(distribution, 'pwd')
  return decode(output).trim()
}
