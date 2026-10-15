const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const root = path.resolve(__dirname, '..');
const address = 'http://127.0.0.1:8766/hero/userHero.html';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.glb': 'model/gltf-binary', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' };
function openPage() { execFile('cmd.exe', ['/c', 'start', '', address]); }
const server = http.createServer((req, res) => {
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url === '/' ? '/index.html' : req.url, address).pathname)); }
  catch { res.writeHead(400).end(); return; }
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(8766, '127.0.0.1', () => { console.log('CareerHub: ' + address); openPage(); });
