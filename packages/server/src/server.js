import { fileURLToPath } from 'node:url'

const workerPath = fileURLToPath(new URL('../../../.tmp/dist', import.meta.url))
process.argv.push(`--link=${workerPath}`)

await import('@lvce-editor/server/bin/server.js')
