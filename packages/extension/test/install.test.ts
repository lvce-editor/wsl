import { test } from '@jest/globals'
import assert from 'node:assert/strict'
import { installDistro } from '../src/parts/Install/Install.ts'

const createDependencies = (
  distributions: unknown,
  selected: unknown = 'Ubuntu-24.04',
): {
  readonly dependencies: NonNullable<Parameters<typeof installDistro>[0]>
  readonly calls: Array<{ readonly method: string; readonly params: readonly unknown[] }>
  readonly errors: string[]
  readonly logs: string[]
  readonly items: Array<{ readonly label: string; readonly value: unknown }>
  readonly placeholders: string[]
} => {
  const calls: Array<{ readonly method: string; readonly params: readonly unknown[] }> = []
  const errors: string[] = []
  const logs: string[] = []
  const items: Array<{ readonly label: string; readonly value: unknown }> = []
  const placeholders: string[] = []
  const dependencies = {
    invoke: async (method: string, ...params: readonly unknown[]): Promise<unknown> => {
      calls.push({ method, params })
      return undefined
    },
    log: async (message: string): Promise<void> => {
      logs.push(message)
    },
    showError: async (message: string): Promise<void> => {
      errors.push(message)
    },
    showPick: async (options: {
      readonly items: readonly { readonly label: string; readonly value: unknown }[]
      readonly placeholder: string
    }): Promise<unknown> => {
      items.push(...options.items)
      placeholders.push(options.placeholder)
      return selected
    },
  }
  const configuredDependencies = {
    ...dependencies,
    invoke: async (method: string, ...params: readonly unknown[]): Promise<unknown> => {
      calls.push({ method, params })
      if (method === 'Wsl.listOnlineDistributions') {
        return distributions
      }
      return undefined
    },
  }
  return { calls, dependencies: configuredDependencies, errors, items, logs, placeholders }
}

test('shows friendly online distribution names and installs the selected CLI name', async (): Promise<void> => {
  const { calls, dependencies, errors, items, logs, placeholders } = createDependencies([
    { friendlyName: 'Ubuntu 24.04 LTS', name: 'Ubuntu-24.04' },
    { friendlyName: 'Kali Linux Rolling', name: 'kali-linux' },
  ])

  await installDistro(dependencies)

  assert.deepEqual(items, [
    { description: '', label: 'Ubuntu 24.04 LTS', value: 'Ubuntu-24.04' },
    { description: '', label: 'Kali Linux Rolling', value: 'kali-linux' },
  ])
  assert.deepEqual(placeholders, ['Select the WSL distro to install'])
  assert.deepEqual(calls, [
    { method: 'Wsl.listOnlineDistributions', params: [] },
    { method: 'Wsl.installDistribution', params: ['Ubuntu-24.04'] },
  ])
  assert.deepEqual(logs, ['Installing WSL distribution Ubuntu-24.04...', 'Installed WSL distribution Ubuntu-24.04.'])
  assert.deepEqual(errors, [])
})

test('does not install a distribution when the picker is dismissed', async (): Promise<void> => {
  const { calls, dependencies, errors, logs } = createDependencies([{ friendlyName: 'Ubuntu', name: 'Ubuntu' }], null)

  await installDistro(dependencies)

  assert.deepEqual(calls, [{ method: 'Wsl.listOnlineDistributions', params: [] }])
  assert.deepEqual(logs, [])
  assert.deepEqual(errors, [])
})

test('reports when no online distributions are available', async (): Promise<void> => {
  const { calls, dependencies, errors, items } = createDependencies([])

  await installDistro(dependencies)

  assert.deepEqual(calls, [{ method: 'Wsl.listOnlineDistributions', params: [] }])
  assert.deepEqual(items, [])
  assert.deepEqual(errors, ['No WSL distributions are available to install.'])
})

test('reports listing and installation failures', async (): Promise<void> => {
  const listing = createDependencies(undefined)
  const listingFailure = {
    ...listing.dependencies,
    invoke: async (): Promise<unknown> => {
      throw new Error('WSL is unavailable')
    },
  }
  await installDistro(listingFailure)
  assert.deepEqual(listing.errors, ['Failed to install WSL distribution: WSL is unavailable'])

  const installation = createDependencies([{ friendlyName: 'Ubuntu', name: 'Ubuntu' }])
  const installationFailure = {
    ...installation.dependencies,
    invoke: async (method: string, ...params: readonly unknown[]): Promise<unknown> => {
      installation.calls.push({ method, params })
      if (method === 'Wsl.listOnlineDistributions') {
        return [{ friendlyName: 'Ubuntu', name: 'Ubuntu' }]
      }
      throw new Error('install failed')
    },
  }
  await installDistro(installationFailure)
  assert.deepEqual(installation.errors, ['Failed to install WSL distribution: install failed'])
})
