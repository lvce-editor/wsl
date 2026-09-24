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
  const marker = 'LVCE_WSL_TERMINAL_SMOKE'
  const terminal = spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/q', '/v:on', '/c', 'set /p INPUT= && echo !INPUT!'], {
    cols: 80,
    rows: 24,
  })
  let output = ''
  const markerReceived = new Promise((resolve) => {
    terminal.onData((data) => {
      output += data
      if (output.includes(marker)) {
        resolve()
      }
    })
  })
  const exit = new Promise((resolve) => terminal.onExit(resolve))

  terminal.resize(100, 30)
  terminal.write(`${marker}\r`)
  await waitFor(markerReceived, 'terminal command output')
  const result = await waitFor(exit, 'terminal process exit')

  assert.match(output, new RegExp(marker))
  assert.equal(result.exitCode, 0)
})
