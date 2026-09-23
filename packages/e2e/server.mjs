import { createServer } from 'node:http'

const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Lvce WSL e2e fixture</title></head>
  <body><main data-testid="wsl-fixture"><h1>WSL workspace fixture</h1><p>Ready for remote workspace tests.</p></main></body>
</html>`

const server = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  response.end(html)
})

server.listen(4173, '127.0.0.1')
