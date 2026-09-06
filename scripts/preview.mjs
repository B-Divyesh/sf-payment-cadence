import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const dist = resolve(new URL('../dist/', import.meta.url).pathname);
const config = JSON.parse(await readFile(join(dist, 'staticwebapp.config.json'), 'utf8'));
const port = Number(process.env.PORT || 4173);

const mime = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8'
};

function matches(pattern, pathname) {
  return pattern.endsWith('*') ? pathname.startsWith(pattern.slice(0, -1)) : pathname === pattern;
}

async function fileAt(pathname) {
  const decoded = decodeURIComponent(pathname);
  const candidate = normalize(join(dist, decoded.replace(/^\/+/, '')));
  if (candidate !== dist && !candidate.startsWith(`${dist}/`)) return null;
  try {
    const details = await stat(candidate);
    const file = details.isDirectory() ? join(candidate, 'index.html') : candidate;
    return (await stat(file)).isFile() ? file : null;
  } catch {
    return null;
  }
}

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
    const route = config.routes.find((entry) => matches(entry.route, pathname));
    let status = route?.statusCode ?? 200;
    let file = route?.rewrite ? await fileAt(route.rewrite) : await fileAt(pathname === '/' ? '/index.html' : pathname);

    if (!file) {
      status = 404;
      file = await fileAt(config.responseOverrides?.['404']?.rewrite ?? '/404.html');
    }
    if (!file) throw new Error('The built 404 page is missing.');

    for (const [name, value] of Object.entries(config.globalHeaders ?? {})) response.setHeader(name, value);
    for (const [name, value] of Object.entries(route?.headers ?? {})) response.setHeader(name, value);
    response.setHeader('Content-Type', config.mimeTypes?.[extname(file)] ?? mime[extname(file)] ?? 'application/octet-stream');
    response.writeHead(status);
    if (request.method === 'HEAD') response.end();
    else response.end(await readFile(file));
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(error instanceof Error ? error.message : 'Preview server error');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Local: http://127.0.0.1:${port}/`);
});
