import { spawn } from 'node-pty'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const readyMarker = 'LVCE_WSL_TERMINAL_READY'
const input = 'LVCE_WSL_TERMINAL_INPUT'
const outputMarker = `RECEIVED:${input}`
const directory = mkdtempSync(join(tmpdir(), 'lvce-wsl-terminal-'))
const scriptPath = join(directory, 'terminal-smoke.cmd')
writeFileSync(scriptPath, `@echo off\r\necho ${readyMarker}\r\nset /p INPUT=\r\necho RECEIVED:%INPUT%\r\n`)

const terminal = spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/q', '/c', scriptPath], {
  cols: 80,
  rows: 24,
})
let output = ''
let sentInput = false

const timeout = setTimeout(() => {
  console.error(`PTY timed out; output=${JSON.stringify(output)}`)
  try {
    terminal.kill()
  } catch (error) {
    console.error(error)
  }
  process.exit(1)
}, 20000)

terminal.onData((data) => {
  output += data
  if (!sentInput && output.includes(readyMarker)) {
    sentInput = true
    terminal.resize(100, 30)
    terminal.write(`${input}\r`)
  }
})

terminal.onExit(({ exitCode }) => {
  clearTimeout(timeout)
  rmSync(directory, { force: true, recursive: true })
  if (exitCode !== 0 || !output.includes(outputMarker)) {
    console.error(`PTY failed; exitCode=${exitCode}, output=${JSON.stringify(output)}`)
    process.exit(1)
  }
  console.log('LVCE_WSL_TERMINAL_SMOKE_PASSED')
  process.exit(0)
})
