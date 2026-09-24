import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'wsl.connect'

type Keyboard = Parameters<Test>[0]['KeyBoard']

const typeText = async (keyboard: Keyboard, text: string): Promise<void> => {
  for (const char of text) {
    await keyboard.press(char === ' ' ? 'Space' : char)
  }
}

const runTerminalCommand = async (keyboard: Keyboard, command: string): Promise<void> => {
  await typeText(keyboard, command)
  await keyboard.press('Enter')
}

export const test: Test = async ({ Command, expect, Explorer, KeyBoard, Locator, SideBar, Workspace, Wsl }) => {
  // A native shell needs a filesystem path, not the default test-page or memfs URI.
  const terminalDirectory = await Command.execute('PlatformPaths.getTmpDir')
  await Workspace.setPath(terminalDirectory)
  await Command.execute('Layout.showPanel', 'Problems')
  await Locator('.PanelTab[name="Terminals"]').click()
  const terminal = Locator('.XtermTerminal')
  const terminalRows = terminal.locator('.xterm-rows')
  await expect(terminal).toBeVisible()
  await expect(terminal.locator('.xterm-helper-textarea')).toBeFocused()
  await expect(terminalRows).toContainText('PS ')
  // The computed result is absent from the input, so echoed keystrokes cannot pass.
  await runTerminalCommand(KeyBoard, '123456789 -band 65535')
  await expect(terminalRows).toContainText('52501')
  await runTerminalCommand(KeyBoard, 'exit')
  await expect(terminal).toHaveCount(0)
  await Command.execute('Layout.hidePanel')

  await Wsl.enableExtension()
  const extensions = await Command.execute('ExtensionManagement.getExtensions')
  const extension = extensions.find((candidate: { id?: string }) => candidate.id === 'lvce.wsl')
  if (!extension) {
    throw new Error(JSON.stringify(extensions))
  }
  if (!Array.isArray(extension.activation) || !extension.activation.includes('onCommand:wsl.connect')) {
    throw new Error(JSON.stringify(extension))
  }
  await Wsl.connect()

  await SideBar.open('Explorer')
  const bootEntry = Locator('.Explorer .TreeItem[aria-label="boot"]')
  for (let i = 0; i < 8; i++) {
    await Explorer.refresh()
    try {
      await expect(bootEntry).toBeVisible()
      return
    } catch {
      // The WSL command runs in a separate process; refresh until its workspace update is rendered.
    }
  }
  await Explorer.expandAll()
  await expect(bootEntry).toBeVisible()
}
