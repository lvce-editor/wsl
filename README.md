# WSL support for Lvce Editor

This repository is the home for WSL2 support in Lvce Editor. It is intentionally
small at first: the extension package contains the command and process layer
needed to discover WSL and execute a command inside a distribution. Workspace
transport and the remote server protocol will build on this layer.

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
can execute a command in the default distribution. The test skips cleanly on
other platforms or when WSL is unavailable, while the Windows CI job runs it
explicitly.

## Planned milestones

1. Install and start the Lvce remote server inside WSL2.
2. Add a `wsl://` workspace file-system provider and workspace transport.
3. Add end-to-end coverage that opens a WSL folder in the editor.
