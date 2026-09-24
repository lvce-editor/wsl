import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawn } from 'node-pty'

const waitFor = async (promise, description) => {
  let timeout
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${description}`)), 15000)
      }),
    ])
  } finally {
    clearTimeout(timeout)
  }
}

test('Windows terminal PTY accepts input, resizes, returns output, and exits', { skip: process.platform !== 'win32' }, async () => {
  const input = 'LVCE_WSL_TERMINAL_INPUT'
  const outputMarker = `LVCE_WSL_TERMINAL_OUTPUT:${input}`
  const command = 'echo LVCE_WSL_TERMINAL_READY & set /p INPUT= && echo RECEIVED:!INPUT!'
  const terminal = spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/q', '/v:on', '/c', command], {
    cols: 80,
    rows: 24,
  })
  let output = ''
  let exited = false
  try {
    const outputReceived = new Promise((resolve) => {
      terminal.onData((data) => {
        output += data
        if (output.includes(outputMarker)) {
          resolve()
        }
      })
    })
    const exit = new Promise((resolve) =>
      terminal.onExit((result) => {
        exited = true
        resolve(result)
      }),
    )

    terminal.resize(100, 30)
    terminal.write(`${input}\r`)
    await waitFor(outputReceived, 'terminal command output')
    const result = await waitFor(exit, 'terminal process exit')

    assert.ok(output.includes(outputMarker), `Expected ${JSON.stringify(output)} to include ${outputMarker}`)
    assert.equal(result.exitCode, 0)
  } finally {
    if (!exited) {
      terminal.kill()
    }
  }
})
