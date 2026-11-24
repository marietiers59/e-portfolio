/* Petit serveur statique pour les tests : sert le dépôt sous /e-portfolio/, comme GitHub Pages. */
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = fileURLToPath(new URL('..', import.meta.url));
const PREFIXE = '/e-portfolio/';
const PORT = Number(process.env.PORT ?? 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.vtt': 'text/vtt; charset=utf-8', '.woff2': 'font/woff2',
  '.gexf': 'application/xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.bin': 'application/octet-stream',
};

createServer((requete, reponse) => {
  const chemin = decodeURIComponent(new URL(requete.url, 'http://localhost').pathname);
  if (!chemin.startsWith(PREFIXE)) {
    reponse.writeHead(302, { Location: PREFIXE }).end();
    return;
  }
  let fichier = normalize(join(RACINE, chemin.slice(PREFIXE.length)));
  if (!fichier.startsWith(RACINE) || fichier.split(sep).includes('.git')) {
    reponse.writeHead(403).end();
    return;
  }
  try {
    if (statSync(fichier).isDirectory()) {
      fichier = join(fichier, 'index.html');
    }
    const taille = statSync(fichier).size;
    reponse.writeHead(200, {
      'Content-Type': TYPES[extname(fichier).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': taille,
      'Cache-Control': 'no-store',
    });
    createReadStream(fichier).pipe(reponse);
  } catch {
    reponse.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('introuvable');
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`site de test : http://127.0.0.1:${PORT}${PREFIXE}`);
});
