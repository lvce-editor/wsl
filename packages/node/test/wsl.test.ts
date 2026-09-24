import type { TestContext } from 'node:test'
import assert, { rejects } from 'node:assert/strict'
import { test } from 'node:test'
import { getOpenExternalPath, getWslWorkingDirectory, listDistributions, parseWslUri, readDirWithFileTypes, stat } from '../src/parts/Wsl/Wsl.ts'

void test('rejects malformed WSL URIs before invoking WSL', async () => {
  await rejects(getOpenExternalPath('wsl:///workspace'), /WSL URI has no distribution/)
  await rejects(getOpenExternalPath('wsl://Ubuntu/workspace?query=1'), /must not contain a query or fragment/)
})

void test('preserves distribution case and decodes WSL paths exactly once', () => {
  assert.deepStrictEqual(parseWslUri('wsl://Ubuntu-24.04/My%20Folder/%E2%9C%93'), {
    distribution: 'Ubuntu-24.04',
    path: '/My Folder/✓',
  })
})

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

void test('converts WSL URIs to Windows UNC paths without losing distribution or path characters', async (context: TestContext) => {
  if (process.platform !== 'win32') {
    context.skip('WSL smoke tests run on Windows')
    return
  }
  const distributions = await listDistributions()
  const distribution = distributions[0]
  assert.ok(distribution)
  const uri = `wsl://${encodeURIComponent(distribution)}/tmp/space%20and%20%E2%9C%93`
  const path = await getOpenExternalPath(uri)
  assert.ok(path.startsWith('\\\\'), path)
  assert.ok(path.includes(`\\${distribution}\\`), path)
  assert.ok(path.endsWith('tmp\\space and ✓'), path)
})
