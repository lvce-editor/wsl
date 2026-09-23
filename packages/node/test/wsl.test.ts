import type { TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getWslWorkingDirectory, listDistributions, readDirWithFileTypes, stat } from '../src/parts/Wsl/Wsl.ts'

void test('can execute a command in the default WSL distribution', async (context: TestContext) => {
  if (process.platform !== 'win32') {
    context.skip('WSL smoke tests run on Windows')
    return
  }
  try {
    const workingDirectory = await getWslWorkingDirectory()
    assert.match(workingDirectory, /^\//)
  } catch (error) {
    if (process.env.CI) {
      throw error
    }
    context.skip(`WSL is unavailable: ${error instanceof Error ? error.message : String(error)}`)
  }
})

void test('can list the root of the first WSL distribution', async (context: TestContext) => {
  if (process.platform !== 'win32') {
    context.skip('WSL smoke tests run on Windows')
    return
  }
  try {
    const distributions = await listDistributions()
    const distribution = distributions[0]
    assert.ok(distribution)
    const uri = `wsl://${encodeURIComponent(distribution)}/`
    assert.equal(await stat(uri), 3)
    const entries = await readDirWithFileTypes(uri)
    assert.ok(entries.length > 0)
    assert.ok(entries.every((entry) => entry.name.length > 0))
  } catch (error) {
    if (process.env.CI) {
      throw error
    }
    context.skip(`WSL is unavailable: ${error instanceof Error ? error.message : String(error)}`)
  }
})
