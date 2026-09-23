/* eslint-disable unicorn/no-top-level-side-effects, unicorn/prefer-export-from */

import { activate, deactivate } from './parts/Main/Main.ts'

await activate()

export { activate, deactivate }
