import { fileURLToPath } from 'node:url'

const workerPath = fileURLToPath(new URL('../../../.tmp/dist', import.meta.url))
process.argv.push(`--link=${workerPath}`)

if (process.env.WSL_TEST_EXPLORER_PATH) {
  process.argv.push(`--link=${process.env.WSL_TEST_EXPLORER_PATH}`)
}

await import('@lvce-editor/server/bin/server.js')
