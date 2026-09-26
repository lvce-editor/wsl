import assert from 'node:assert/strict'
import { test } from 'node:test'
import { connect, connectUsingDistro, reopenFolder } from '../src/parts/Connect/Connect.ts'

const createDependencies = (
  distributions: unknown,
  selected: unknown = 'Ubuntu',
  workspaceUri: unknown = 'file:///C:/Users/test/Project%20%231/%E2%9C%93%20folder',
): {
  readonly dependencies: NonNullable<Parameters<typeof connectUsingDistro>[0]>
  readonly errors: string[]
  readonly calls: Array<{ readonly method: string; readonly params: readonly unknown[] }>
  readonly items: Array<{ readonly label: string; readonly value: unknown }>
} => {
  const errors: string[] = []
  const calls: Array<{ readonly method: string; readonly params: readonly unknown[] }> = []
  const items: Array<{ readonly label: string; readonly value: unknown }> = []
  const dependencies = {
    execute: async (command: string, ...params: readonly unknown[]): Promise<unknown> => {
      calls.push({ method: command, params })
      if (command === 'Workspace.getUri') {
        return workspaceUri
      }
      return undefined
    },
    invoke: async (method: string, ...params: readonly unknown[]): Promise<unknown> => {
      calls.push({ method, params })
      if (method === 'Wsl.listDistributions') {
        return distributions
      }
      if (method === 'Wsl.convertWindowsPath') {
        return '/mnt/c/Users/test/Project #1/✓ folder'
      }
      return undefined
    },
    showError: async (message: string): Promise<void> => {
      errors.push(message)
    },
    showPick: async (options: { readonly items: readonly { readonly label: string; readonly value: unknown }[] }): Promise<unknown> => {
      items.push(...options.items)
      return selected
    },
  }
  return { calls, dependencies, errors, items }
}

test('connects the selected non-first distribution', async (): Promise<void> => {
  const { calls, dependencies, errors, items } = createDependencies(['Ubuntu', 'Debian'], 'Debian')

  await connectUsingDistro(dependencies)

  assert.deepEqual(
    items.map((item) => item.label),
    ['Ubuntu', 'Debian'],
  )
  assert.equal(items[1].value, 'Debian')
  assert.deepEqual(calls, [
    { method: 'Wsl.listDistributions', params: [] },
    { method: 'WslFileSystem.connect', params: ['wsl://Debian/'] },
    { method: 'Workspace.setUri', params: ['wsl://Debian/'] },
  ])
  assert.deepEqual(errors, [])
})

test('does not change the workspace when the picker is cancelled', async (): Promise<void> => {
  const { calls, dependencies, errors } = createDependencies(['Ubuntu', 'Debian'], null)

  await connectUsingDistro(dependencies)

  assert.deepEqual(calls, [{ method: 'Wsl.listDistributions', params: [] }])
  assert.deepEqual(errors, [])
})

test('reports when no WSL distributions are installed', async (): Promise<void> => {
  const { calls, dependencies, errors, items } = createDependencies([])

  await connectUsingDistro(dependencies)

  assert.deepEqual(calls, [{ method: 'Wsl.listDistributions', params: [] }])
  assert.deepEqual(items, [])
  assert.deepEqual(errors, ['No WSL distributions are installed.'])
})

test('reports WSL list failures without changing the workspace', async (): Promise<void> => {
  const { calls, dependencies, errors } = createDependencies(undefined)
  const failingDependencies = {
    ...dependencies,
    invoke: async (): Promise<unknown> => {
      throw new Error('WSL is unavailable')
    },
  }

  await connectUsingDistro(failingDependencies)

  assert.deepEqual(calls, [])
  assert.deepEqual(errors, ['Failed to connect to WSL: WSL is unavailable'])
})

test('reports connection failures without changing the workspace', async (): Promise<void> => {
  const { calls, dependencies, errors } = createDependencies(['Ubuntu'], 'Ubuntu')
  const failingDependencies = {
    ...dependencies,
    invoke: async (method: string, ...params: readonly unknown[]): Promise<unknown> => {
      calls.push({ method, params })
      if (method === 'Wsl.listDistributions') {
        return ['Ubuntu']
      }
      throw new Error('distribution failed')
    },
  }

  await connectUsingDistro(failingDependencies)

  assert.deepEqual(calls, [
    { method: 'Wsl.listDistributions', params: [] },
    { method: 'WslFileSystem.connect', params: ['wsl://Ubuntu/'] },
  ])
  assert.deepEqual(errors, ['Failed to connect to WSL: distribution failed'])
})

test('keeps the existing command connected to the first distribution', async (): Promise<void> => {
  const { calls, dependencies, errors } = createDependencies(['Ubuntu', 'Debian'])

  await connect(dependencies)

  assert.deepEqual(calls, [
    { method: 'Wsl.listDistributions', params: [] },
    { method: 'WslFileSystem.connect', params: ['wsl://Ubuntu/'] },
    { method: 'Workspace.setUri', params: ['wsl://Ubuntu/'] },
  ])
  assert.deepEqual(errors, [])
})

test('reopens the current Windows folder in the first WSL distribution', async (): Promise<void> => {
  const { calls, dependencies, errors } = createDependencies(['Ubuntu', 'Debian'])

  await reopenFolder(dependencies)

  assert.deepEqual(calls, [
    { method: 'Workspace.getUri', params: [] },
    { method: 'Wsl.listDistributions', params: [] },
    { method: 'Wsl.convertWindowsPath', params: ['Ubuntu', 'C:\\Users\\test\\Project #1\\✓ folder'] },
    { method: 'WslFileSystem.connect', params: ['wsl://Ubuntu/mnt/c/Users/test/Project%20%231/%E2%9C%93%20folder'] },
    { method: 'Workspace.setUri', params: ['wsl://Ubuntu/mnt/c/Users/test/Project%20%231/%E2%9C%93%20folder'] },
  ])
  assert.deepEqual(errors, [])
})

test('does not change the workspace when the current folder is already in WSL', async (): Promise<void> => {
  const { calls, dependencies, errors } = createDependencies(['Ubuntu'], 'Ubuntu', 'wsl://Ubuntu/home/test')

  await reopenFolder(dependencies)

  assert.deepEqual(calls, [{ method: 'Workspace.getUri', params: [] }])
  assert.deepEqual(errors, ['The current folder is already open in WSL.'])
})

test('does not change the workspace when Windows path conversion fails', async (): Promise<void> => {
  const { calls, dependencies, errors } = createDependencies(['Ubuntu'])
  const failingDependencies = {
    ...dependencies,
    invoke: async (method: string, ...params: readonly unknown[]): Promise<unknown> => {
      calls.push({ method, params })
      if (method === 'Wsl.listDistributions') {
        return ['Ubuntu']
      }
      throw new Error('cannot convert path')
    },
  }

  await reopenFolder(failingDependencies)

  assert.deepEqual(calls, [
    { method: 'Workspace.getUri', params: [] },
    { method: 'Wsl.listDistributions', params: [] },
    { method: 'Wsl.convertWindowsPath', params: ['Ubuntu', 'C:\\Users\\test\\Project #1\\✓ folder'] },
  ])
  assert.deepEqual(errors, ['Failed to reopen folder in WSL: cannot convert path'])
})
