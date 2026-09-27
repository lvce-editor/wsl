import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { test } from '@jest/globals'

const probePath = fileURLToPath(new URL('./terminal-probe.js', import.meta.url))

const testWindows = process.platform === 'win32' ? test : test.skip

testWindows('Windows terminal PTY accepts input, resizes, returns output, and exits', () => {
  const output = execFileSync(process.execPath, [probePath], {
    encoding: 'utf8',
    timeout: 25000,
    windowsHide: true,
  })

  assert.match(output, /LVCE_WSL_TERMINAL_SMOKE_PASSED/)
})
