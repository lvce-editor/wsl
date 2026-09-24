// Temporary Windows CI diagnostic; remove after the terminal failure is isolated.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const host = fileURLToPath(import.meta.resolve('@lvce-editor/pty-host'))
const output = resolve('.tmp/terminal-diagnostic.jsonl')
mkdirSync('.tmp', { recursive: true })
let source = readFileSync(host, 'utf8')
const replace = (from, to) => {
  if (!source.includes(from)) throw new Error(`Missing instrumentation boundary: ${from}`)
  source = source.replace(from, to)
}
replace('const handleData = data => {', 'const handleData = data => { debugTerminal({ data: String(data).slice(0, 4096) });')
replace('const handleExit = data => {', 'const handleExit = data => { debugTerminal({ exit: data });')
replace(
  'const pty = spawn(command, args, {',
  'debugTerminal({ command, args, cwdPath, exists: debugExists(cwdPath) }); const pty = spawn(command, args, {',
)
replace(
  'throw new VError(error, `Failed to create terminal`);',
  'debugTerminal({ error: String(error), stack: error.stack }); throw new VError(error, `Failed to create terminal`);',
)
source =
  `import { appendFileSync as debugAppend, existsSync as debugExists } from 'node:fs';\nconst debugTerminal = (entry) => debugAppend(${JSON.stringify(output)}, JSON.stringify({time: Date.now(), ...entry}) + '\\n');\n` +
  source
writeFileSync(host, source)
