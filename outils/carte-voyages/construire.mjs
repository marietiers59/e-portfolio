// Carte d'Europe des voyages (#179) : produit medias/carte-voyages.svg et copie les drapeaux dans medias/drapeaux/.
// Fond : Natural Earth 1:50 m (domaine public) via le paquet npm world-atlas ; drapeaux : flag-icons (licence MIT).
// Usage (dans ce dossier) : npm install, puis node construire.mjs
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { feature, mesh } from 'topojson-client';
import { presimplify, simplify, quantile } from 'topojson-simplify';
import { geoConicConformal, geoPath } from 'd3-geo';

const require = createRequire(import.meta.url);
const RACINE = new URL('../../', import.meta.url);
const brut = require('world-atlas/countries-50m.json');
const pre = presimplify(brut);
const monde = simplify(pre, quantile(pre, 0.25));             // allège les côtes très découpées, sans toucher aux petits pays
const pays = feature(monde, monde.objects.countries).features;

// Pays et territoires visités : code numérique ISO 3166 (fond de carte), code du drapeau, nom FR / EN,
// point d'ancrage [longitude, latitude] et décalage du drapeau en pixels (petits territoires : trait de rappel).
const VISITES = [
  ['250', 'fr',     'France', 'France',                    [2.4, 46.7]],
  ['056', 'be',     'Belgique', 'Belgium',                 [4.6, 50.6],   [-30, -6]],
  ['276', 'de',     'Allemagne', 'Germany',                [10.2, 51.0]],
  ['826', 'gb-eng', 'Angleterre', 'England',               [-1.4, 52.5]],
  ['442', 'lu',     'Luxembourg', 'Luxembourg',            [6.13, 49.75], [-4, 26]],
  ['528', 'nl',     'Pays-Bas', 'Netherlands',             [5.6, 52.3],   [-10, -18]],
  ['492', 'mc',     'Monaco', 'Monaco',                    [7.42, 43.74], [26, 16]],
  ['756', 'ch',     'Suisse', 'Switzerland',               [8.1, 46.8]],
  ['336', 'va',     'Vatican', 'Vatican City',             [12.45, 41.9], [-22, 22]],
  ['832', 'je',     'Jersey', 'Jersey',                    [-2.13, 49.21], [-30, 8]],
  ['724', 'es',     'Espagne', 'Spain',                    [-3.7, 40.2]],
  ['620', 'pt',     'Portugal', 'Portugal',                [-8.0, 39.7]],
  ['372', 'ie',     'Irlande', 'Ireland',                  [-8.0, 53.2]],
  ['040', 'at',     'Autriche', 'Austria',                 [14.4, 47.6]],
  ['703', 'sk',     'Slovaquie', 'Slovakia',               [19.6, 48.7]],
  ['203', 'cz',     'République tchèque', 'Czech Republic', [15.4, 49.8]],
  ['208', 'dk',     'Danemark', 'Denmark',                 [9.2, 56.1]],
  ['348', 'hu',     'Hongrie', 'Hungary',                  [19.4, 47.1]],
  ['292', 'gi',     'Gibraltar', 'Gibraltar',              [-5.35, 36.14], [26, -4]],
  ['020', 'ad',     'Andorre', 'Andorra',                  [1.55, 42.55], [10, 22]],
  ['246', 'fi',     'Finlande', 'Finland',                 [26.0, 62.6]],
  ['428', 'lv',     'Lettonie', 'Latvia',                  [25.0, 56.9]],
];

const L = 800, H = 640;
const projection = geoConicConformal().parallels([40, 62]).rotate([-10, 0]).center([0, 51])
  .fitExtent([[10, 10], [L - 10, H - 10]], { type: 'MultiPoint', coordinates: [[-11, 34.6], [33, 34.6], [-11, 66.5], [33, 66.5]] });
projection.clipExtent([[0, 0], [L, H]]);
const chemin = geoPath(projection);
const r = (d) => (d || '').replace(/(\d+)\.\d+/g, '$1');        // au pixel près : suffisant à cette échelle

const visites = new Set(VISITES.map((v) => v[0]));
const autres = pays.filter((p) => !visites.has(p.id)).map((p) => chemin(p)).filter(Boolean);
const vus = pays.filter((p) => visites.has(p.id)).map((p) => `<path class="cv-visite" d="${r(chemin(p))}"><title>${p.properties.name}</title></path>`);
const frontieres = r(chemin(mesh(monde, monde.objects.countries, (a, b) => a !== b)));

const D = { l: 22, h: 16.5 };                                    // drapeau 4:3
const drapeaux = VISITES.map(([, code, fr, en, ancre, dec]) => {
  const [x, y] = projection(ancre);
  const [dx, dy] = dec || [0, 0];
  const cx = x + dx, cy = y + dy;
  const trait = dec ? `<line class="cv-trait" x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${cy.toFixed(1)}"/><circle class="cv-point" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2"/>` : '';
  return `<g class="cv-drapeau" data-fr="${fr}" data-en="${en}">${trait}<title>${fr} · ${en}</title>`
    + `<image href="../medias/drapeaux/${code}.svg" x="${(cx - D.l / 2).toFixed(1)}" y="${(cy - D.h / 2).toFixed(1)}" width="${D.l}" height="${D.h}" preserveAspectRatio="none"/>`
    + `<rect class="cv-cadre" x="${(cx - D.l / 2).toFixed(1)}" y="${(cy - D.h / 2).toFixed(1)}" width="${D.l}" height="${D.h}" rx="1.5"/></g>`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="carte-voyages-svg" viewBox="0 0 ${L} ${H}" role="img" aria-labelledby="cv-titre cv-desc">
<title id="cv-titre">Carte de mes voyages en Europe · Map of my travels in Europe</title>
<desc id="cv-desc">22 pays et territoires visités : ${VISITES.map((v) => v[2]).join(', ')}.</desc>
<style>
.cv-mer{fill:hsl(205 70% 95%)}.cv-pays{fill:hsl(40 20% 92%);stroke:none}.cv-visite{fill:hsl(165 34% 74%)}
.cv-frontiere{fill:none;stroke:hsl(30 10% 62%);stroke-width:.5;stroke-linejoin:round}
.cv-trait{stroke:hsl(220 18% 30%);stroke-width:.9}.cv-point{fill:hsl(220 18% 30%)}
.cv-cadre{fill:none;stroke:hsl(220 18% 20% / .55);stroke-width:.8}.cv-credit{font:11px Verdana,sans-serif;fill:hsl(220 9% 38%)}
</style>
<rect class="cv-mer" width="${L}" height="${H}"/>
<path class="cv-pays" d="${r(autres.join(''))}"/>
${vus.join('\n')}
<path class="cv-frontiere" d="${frontieres}"/>
${drapeaux.join('\n')}
<text class="cv-credit" x="${L - 8}" y="${H - 8}" text-anchor="end">Natural Earth · flag-icons</text>
</svg>
`;
writeFileSync(new URL('medias/carte-voyages.svg', RACINE), svg);
mkdirSync(new URL('medias/drapeaux/', RACINE), { recursive: true });
for (const [, code] of VISITES) copyFileSync(require.resolve(`flag-icons/flags/4x3/${code}.svg`), new URL(`medias/drapeaux/${code}.svg`, RACINE));
console.log(`carte-voyages.svg : ${(svg.length / 1024).toFixed(0)} Ko, ${VISITES.length} drapeaux`);
