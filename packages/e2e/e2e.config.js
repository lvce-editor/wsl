import { defineConfig } from '@lvce-editor/test-with-playwright'

export default defineConfig({
  headless: true,
  onlyExtension: '../../.tmp/dist',
  reusePage: true,
  serverPath: '../server/src/server.js',
  timeout: 30000,
  testPath: '.',
})
