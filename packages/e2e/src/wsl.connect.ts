import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'wsl.connect'

type Keyboard = Parameters<Test>[0]['KeyBoard']
type TestApi = Parameters<Test>[0]
type LocatorType = Parameters<TestApi['expect']>[0]

const delay = (milliseconds: number): Promise<void> => {
  const schedule = (globalThis as unknown as { setTimeout: (callback: () => void, delay: number) => unknown }).setTimeout
  return new Promise((resolve) => schedule(resolve, milliseconds))
}

const typeText = async (keyboard: Keyboard, text: string): Promise<void> => {
  for (const char of text) {
    await keyboard.press(char === ' ' ? 'Space' : char)
  }
}

const runTerminalCommand = async (keyboard: Keyboard, command: string): Promise<void> => {
  await typeText(keyboard, command)
  await keyboard.press('Enter')
}

const waitForText = async (expect: TestApi['expect'], locator: LocatorType, text: string): Promise<void> => {
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    try {
      await expect(locator).toContainText(text)
      return
    } catch {
      await delay(100)
    }
  }
  await expect(locator).toContainText(text)
}

export const test: Test = async ({ Command, expect, Explorer, KeyBoard, Locator, QuickPick, SideBar, Workspace, Wsl }) => {
  // Workspace.setPath converts this native filesystem path to a file URI for the terminal.
  const terminalDirectory = await Command.execute('PlatformPaths.getTmpDir')
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  await Workspace.setPath(terminalDirectory)
  await Command.execute('Layout.showPanel', 'Problems')
  // Selecting this tab starts and focuses the native terminal; Layout.showPanel alone does not.
  // eslint-disable-next-line e2e/no-direct-click, @typescript-eslint/no-deprecated
  await Locator('.PanelTab[name="Terminals"]').click()
  const terminal = Locator('.XtermTerminal')
  const terminalRows = terminal.locator('.xterm-rows')
  const terminalInput = terminal.locator('.xterm-helper-textarea')
  await expect(terminal).toBeVisible()
  await expect(terminalInput).toBeFocused()
  await waitForText(expect, terminalRows, 'PS ')
  // The computed result is absent from the input, so echoed keystrokes cannot pass.
  await runTerminalCommand(KeyBoard, '123456789 -band 65535')
  await waitForText(expect, terminalRows, '52501')
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
      break
    } catch {
      // The WSL command runs in a separate process; refresh until its workspace update is rendered.
    }
  }
  await expect(bootEntry).toBeVisible()

  await QuickPick.open()
  await QuickPick.setValue('>WSL: Show Log')
  await QuickPick.selectItem('WSL: Show Log', { waitUntil: 'done' })
  const outputChannel = Locator('[name="output"]')
  const outputContent = Locator('.OutputContent')
  await expect(outputContent).toBeVisible()
  await expect(outputChannel).toHaveValue('wsl')
  await expect(outputContent).toContainText('Starting WSL connection')
  await expect(outputContent).toContainText('Connected to WSL distribution:')
}
