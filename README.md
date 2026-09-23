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
```

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
