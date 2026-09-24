# WSL support for Lvce Editor

This repository is the home for WSL2 support in Lvce Editor. It is intentionally
small at first: the extension package registers `WSL: Connect to WSL`, discovers
the installed distributions, and exposes the first distribution's root through
a `wsl://` workspace file-system provider.

## Development

```sh
git clone git@levivilet.github.com:lvce-editor/wsl.git
cd wsl
npm ci
npm test
npm run build
npm run dev
```

To run the browser test locally, install Chromium once and run the headed
suite:

```sh
npx playwright install chromium
npm run e2e
```

Use `npm run e2e:headless` when no desktop session is available.

`npm run dev` watches the extension and Node entrypoints and rebuilds their
bundles into `.tmp/dist` as source files change.

The WSL server installs `node-pty` directly because its Windows terminal needs
the native ConPTY addon. On Windows, make the Node.js native-addon build tools
(Python and Visual Studio C++ Build Tools) available before running `npm ci`.
The Windows CI job checks that the installed addon can spawn a shell, exchange
input and output, resize, and exit cleanly.

The `levivilet.github.com` SSH host is required for this organization. Keep it
when adding remotes or documenting clone commands.

On Windows with WSL2 enabled, run `npm run test:wsl` to verify that `wsl.exe`
can execute commands and list the root of the first distribution. The test skips
cleanly on other platforms or when WSL is unavailable. The Windows CI job
provisions Ubuntu with `Vampire/setup-wsl`, runs this smoke test, builds the
extension, and runs the Playwright suite.

## Planned milestones

1. Install and start the Lvce remote server inside WSL2.
2. Add full editor-level end-to-end coverage that opens a WSL folder and checks
   the Explorer UI.
