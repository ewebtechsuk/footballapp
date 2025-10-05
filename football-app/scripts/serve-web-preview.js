const fs = require('fs');
const http = require('http');
const path = require('path');
const url = require('url');

const projectRoot = path.resolve(__dirname, '..');
const buildRoot = path.join(projectRoot, 'dist', 'web');
const port = Number(process.env.PORT || 4173);

if (!fs.existsSync(buildRoot)) {
  console.error('No exported web build found. Run "npm run deploy:web" first.');
  process.exit(1);
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function sendFile(res, filePath, statusCode = 200) {
  const extension = path.extname(filePath).toLowerCase();
  const mimeType = mimeTypes[extension] || 'application/octet-stream';

  fs.createReadStream(filePath)
    .on('open', () => {
      res.writeHead(statusCode, { 'Content-Type': mimeType });
    })
    .on('error', (error) => {
      if (error.code === 'ENOENT') {
        serveIndex(res);
        return;
      }

      console.error(error);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal server error');
    })
    .pipe(res);
}

function serveIndex(res) {
  const indexPath = path.join(buildRoot, 'index.html');
  if (!fs.existsSync(indexPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('index.html not found in the exported bundle.');
    return;
  }

  sendFile(res, indexPath);
}

const server = http.createServer((req, res) => {
  const { pathname } = url.parse(req.url || '/');
  const requestPath = decodeURIComponent(pathname || '/');
  const targetPath = path.join(buildRoot, requestPath);

  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
    const filePath = path.join(targetPath, 'index.html');
    if (fs.existsSync(filePath)) {
      sendFile(res, filePath);
      return;
    }
  }

  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    sendFile(res, targetPath);
    return;
  }

  serveIndex(res);
});

server.listen(port, () => {
  console.log(`Serving Expo web preview from ${buildRoot}`);
  console.log(`Open http://localhost:${port} to test the app.`);
});
