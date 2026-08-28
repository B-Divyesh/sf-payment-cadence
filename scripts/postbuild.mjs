import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : path;
  }));
  return files.flat();
}

const root = new URL('../dist/', import.meta.url).pathname;
const files = (await walk(root))
  .map((path) => `/${relative(root, path)}`)
  .filter((path) => path !== '/sw.js' && path !== '/staticwebapp.config.json' && !path.endsWith('.map'));
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const cacheName = `gentle-nudge-${packageJson.version}`;
const worker = `
const CACHE = ${JSON.stringify(cacheName)};
const SHELL = ${JSON.stringify(files)};
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(SHELL.map(async (url) => {
    const response = await fetch(new Request(url, { cache: 'reload' }));
    if (!response.ok) throw new Error('Could not precache ' + url);
    await cache.put(url, response);
  }))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('gentle-nudge-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response;
    }).catch(async () => (await caches.match(event.request, { ignoreVary: true })) || (await caches.match(url.pathname.startsWith('/privacy') ? '/privacy/index.html' : url.pathname.startsWith('/terms') ? '/terms/index.html' : '/index.html', { ignoreVary: true })) || caches.match('/offline.html', { ignoreVary: true })));
    return;
  }
  event.respondWith(caches.match(event.request, { ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); }
    return response;
  })));
});`;
await writeFile(join(root, 'sw.js'), worker);
