import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const locations: string[] = [
  'package.json',
  'package-lock.json',
  '.nvmrc',
  '.github/workflows/ci.yml',
  'packages/build/src/computeNodeModulesCacheKey.ts',
]

const computeCacheKey = async (): Promise<string> => {
  const hash = createHash('sha1')
  for (const location of locations) {
    const content = await readFile(join(process.cwd(), location), 'utf8')
    hash.update(location)
    hash.update('\0')
    hash.update(content)
    hash.update('\0')
  }
  return hash.digest('hex')
}

const main = async (): Promise<void> => {
  process.stdout.write(await computeCacheKey())
}

main()
