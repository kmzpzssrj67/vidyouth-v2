/**
 * Tiny static server for the device-preview wrapper.
 * Serves index.html on http://localhost:8090.
 *
 * Run: node device-preview/serve.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8090;
const FILE = path.join(__dirname, 'index.html');

const server = http.createServer((req, res) => {
  // Strip query string
  const url = (req.url || '/').split('?')[0];
  if (url === '/' || url === '/index.html') {
    fs.readFile(FILE, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('preview wrapper read failed: ' + err.message);
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(data);
    });
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Vidyouth device preview ready at http://localhost:${PORT}`);
});
