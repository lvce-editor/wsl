import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'wsl.quickpick'

export const test: Test = async ({ expect, Wsl }) => {
  await Wsl.enableExtension()
  await Wsl.shouldHaveConnectCommand()
}
