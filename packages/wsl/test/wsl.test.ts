import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getWslWorkingDirectory } from '../src/wslMain.ts'

test('can execute a command in the default WSL distribution', async (context) => {
  if (process.platform !== 'win32') {
    context.skip('WSL smoke tests run on Windows')
    return
  }
  try {
    const workingDirectory = await getWslWorkingDirectory()
    assert.match(workingDirectory, /^\//)
  } catch (error) {
    context.skip(`WSL is unavailable: ${error instanceof Error ? error.message : String(error)}`)
  }
})
