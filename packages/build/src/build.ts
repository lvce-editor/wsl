import { build } from 'esbuild'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const output = join(root, '.tmp', 'dist')
const outputDist = join(output, 'dist')
const outputNode = join(output, 'node')

const readJson = async (path: string): Promise<Record<string, any>> => JSON.parse(await readFile(path, 'utf8'))

const writeJson = async (path: string, value: Record<string, any>): Promise<void> => {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`)
}

await rm(output, { recursive: true, force: true })
await mkdir(outputDist, { recursive: true })
await mkdir(outputNode, { recursive: true })

await build({
  bundle: true,
  entryPoints: [join(root, 'packages', 'extension', 'src', 'wslWorkerMain.ts')],
  external: ['electron', 'node:*'],
  format: 'esm',
  outfile: join(outputDist, 'wslWorkerMain.js'),
  platform: 'browser',
  sourcemap: true,
})

await build({
  bundle: true,
  entryPoints: [join(root, 'packages', 'node', 'src', 'wslNodeMain.ts')],
  format: 'esm',
  outfile: join(outputNode, 'wslNodeMain.js'),
  platform: 'node',
  sourcemap: true,
  packages: 'external',
})

const extensionPackage = await readJson(join(root, 'packages', 'extension', 'package.json'))
delete extensionPackage.scripts
delete extensionPackage.devDependencies
extensionPackage.main = 'dist/wslWorkerMain.js'
await writeJson(join(output, 'package.json'), extensionPackage)

const nodePackage = await readJson(join(root, 'packages', 'node', 'package.json'))
delete nodePackage.scripts
delete nodePackage.devDependencies
nodePackage.main = 'wslNodeMain.js'
nodePackage.files = ['wslNodeMain.js', 'wslNodeMain.js.map', 'package.json']
await writeJson(join(outputNode, 'package.json'), nodePackage)

await cp(join(root, 'packages', 'extension', 'extension.json'), join(output, 'extension.json'))
await cp(join(root, 'README.md'), join(output, 'README.md'))
await cp(join(root, 'LICENSE'), join(output, 'LICENSE'))
