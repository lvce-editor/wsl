import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const probePath = fileURLToPath(new URL('./terminal-probe.js', import.meta.url))

test('Windows terminal PTY accepts input, resizes, returns output, and exits', { skip: process.platform !== 'win32', timeout: 30000 }, () => {
  const output = execFileSync(process.execPath, [probePath], {
    encoding: 'utf8',
    timeout: 25000,
    windowsHide: true,
  })

  assert.match(output, /LVCE_WSL_TERMINAL_SMOKE_PASSED/)
})
