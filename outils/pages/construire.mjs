#!/usr/bin/env node
/* =====================================================================
   construire.mjs — génère les pages publiées à partir de modeles/
   ---------------------------------------------------------------------
   Un modèle par page (modeles/<identifiant>.html) contient le français
   et l'anglais côte à côte ; modeles/pages.json dit quel fichier publier
   pour chaque langue. Mode d'emploi complet : outils/pages/LISEZMOI.md.

     node outils/pages/construire.mjs              régénère les pages
     node outils/pages/construire.mjs --verifier   échoue si une page publiée
                                                   n'est pas à jour (CI, hook)

   Aucune dépendance : Node 18 ou plus suffit.
   ===================================================================== */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, posix, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MODELES = join(RACINE, 'modeles');
const LANGUES = ['fr', 'en'];

/** Erreur de modèle, avec le fichier et la ligne pour s'y retrouver. */
class ErreurModele extends Error {
  constructor(fichier, texte, position, message) {
    const ligne = texte.slice(0, position).split('\n').length;
    super(`${fichier}, ligne ${ligne} : ${message}`);
  }
}

/** Charge modeles/pages.json (sans la clé de mode d'emploi). */
export function lireCorrespondances() {
  const brut = JSON.parse(readFileSync(join(MODELES, 'pages.json'), 'utf8'));
  return Object.fromEntries(Object.entries(brut).filter(([id]) => !id.startsWith('_')));
}

/** Adresse relative de « cible » vue depuis le fichier « depuis » (chemins depuis la racine du site). */
function adresse(depuis, cible) {
  const chemin = posix.relative(posix.dirname(depuis), cible);
  return chemin === '' ? posix.basename(cible) : chemin;
}

/* ---------- 1. Blocs de langue : <!--fr-->…<!--en-->…<!--/--> ---------- */
const MARQUEUR = /<!--(fr|en|\/)-->/g;

/**
 * Étendue réellement occupée par un marqueur : seul sur sa ligne, il emporte
 * sa ligne entière (retrait et retour à la ligne compris).
 */
function etendue(texte, m) {
  const fin = m.index + m[0].length;
  const debutLigne = texte.lastIndexOf('\n', m.index - 1) + 1;
  const apres = /^[ \t]*(\n|$)/.exec(texte.slice(fin));
  if (apres && /^[ \t]*$/.test(texte.slice(debutLigne, m.index))) {
    return { avant: debutLigne, apres: fin + apres[0].length };
  }
  return { avant: m.index, apres: fin };
}

/**
 * Langue en cours après un marqueur. Ordre imposé dans un bloc : <!--fr-->, puis <!--en-->, puis <!--/-->
 * (chaque langue au plus une fois) ; sinon un oubli de <!--/--> avalerait du texte sans prévenir.
 */
function suivante(courant, sorte, signaler) {
  if (sorte === '/') {
    if (courant === null) {
      signaler('<!--/--> sans <!--fr--> ni <!--en--> ouvert');
    }
    return null;
  }
  if (sorte === 'fr' && courant !== null) {
    signaler('<!--fr--> alors que le bloc précédent n\'est pas refermé par <!--/-->');
  }
  if (sorte === 'en' && courant === 'en') {
    signaler('<!--en--> en double dans le même bloc');
  }
  return sorte;
}

/** Garde le texte commun et celui de la langue demandée. */
function garderLangue(texte, langue, fichier) {
  let sortie = '';
  let courant = null;                          // null = texte commun, sinon 'fr' ou 'en'
  let debut = 0;
  let ouverture = 0;
  for (const m of texte.matchAll(MARQUEUR)) {
    const { avant, apres } = etendue(texte, m);
    if (courant === null || courant === langue) {
      sortie += texte.slice(debut, avant);
    }
    if (courant === null) {
      ouverture = m.index;
    }
    courant = suivante(courant, m[1], (message) => {
      throw new ErreurModele(fichier, texte, m.index, message);
    });
    debut = apres;
  }
  if (courant !== null) {
    throw new ErreurModele(fichier, texte, ouverture, 'bloc de langue jamais refermé par <!--/-->');
  }
  return sortie + texte.slice(debut);
}

/* ---------- 2. Variables : {{racine}}, {{page:…}}, {{traduction}}, {{fragment:…}} ---------- */
const VARIABLE = /\{\{([a-z-]+)(?::([a-z0-9-]+))?\}\}/g;

function remplacerVariables(texte, { id, langue, sortie, pages, fichier }) {
  return texte.replace(VARIABLE, (tout, nom, valeur, position) => {
    switch (nom) {
      case 'racine': {
        const remonter = posix.relative(posix.dirname(sortie), '.');
        return remonter === '' ? '' : `${remonter}/`;
      }
      case 'page': {
        const page = pages[valeur];
        if (!page) {
          throw new ErreurModele(fichier, texte, position, `page inconnue « ${valeur} » (voir modeles/pages.json)`);
        }
        return adresse(sortie, page[langue] ?? page.fr);   // page sans version anglaise : version française
      }
      case 'traduction': {
        const autre = pages[id][langue === 'fr' ? 'en' : 'fr'];
        if (!autre) {
          throw new ErreurModele(fichier, texte, position, 'cette page n\'a pas d\'autre langue');
        }
        return adresse(sortie, autre);
      }
      case 'fragment': {
        const chemin = join(MODELES, 'fragments', `${valeur}.${langue}.html`);
        if (!existsSync(chemin)) {
          throw new ErreurModele(fichier, texte, position, `fragment absent : modeles/fragments/${valeur}.${langue}.html`);
        }
        return readFileSync(chemin, 'utf8');
      }
      default:
        throw new ErreurModele(fichier, texte, position, `variable inconnue ${tout}`);
    }
  });
}

/* ---------- 3. Une page ---------- */
export function rendre(id, langue, pages = lireCorrespondances()) {
  const fichier = `modeles/${id}.html`;
  const modele = readFileSync(join(RACINE, fichier), 'utf8');
  const sortie = pages[id][langue];
  const texte = remplacerVariables(garderLangue(modele, langue, fichier), { id, langue, sortie, pages, fichier });
  // Avertissement juste après le doctype, pour qui ouvrirait la page publiée
  const entete = `<!-- Page générée à partir de ${fichier} par outils/pages/construire.mjs : modifier le modèle, pas ce fichier. -->`;
  return texte.replace(/^(<!doctype html>\n)/i, `$1${entete}\n`);
}

/** Toutes les pages : [{ id, langue, sortie, contenu }]. */
export function toutRendre() {
  const pages = lireCorrespondances();
  return Object.entries(pages).flatMap(([id, sorties]) =>
    LANGUES.filter((langue) => sorties[langue]).map((langue) => ({
      id, langue, sortie: sorties[langue], contenu: rendre(id, langue, pages),
    })));
}

/* ---------- Ligne de commande ---------- */
function principal(argumentsCommande) {
  const verifier = argumentsCommande.includes('--verifier');
  const differentes = [];
  for (const { sortie, contenu } of toutRendre()) {
    const chemin = join(RACINE, sortie);
    const actuel = existsSync(chemin) ? readFileSync(chemin, 'utf8') : null;
    if (actuel === contenu) {
      continue;
    }
    differentes.push(sortie);
    if (!verifier) {
      writeFileSync(chemin, contenu);
    }
  }
  if (verifier && differentes.length > 0) {
    console.error('Pages publiées pas à jour par rapport à modeles/ :');
    for (const sortie of differentes) {
      console.error(`  - ${sortie}`);
    }
    console.error('Modifier le modèle (pas la page publiée), puis lancer : node outils/pages/construire.mjs');
    return 1;
  }
  console.log(differentes.length === 0
    ? 'Pages à jour.'
    : `${differentes.length} page(s) régénérée(s) : ${differentes.join(', ')}`);
  return 0;
}

if (relative(process.argv[1] ?? '', fileURLToPath(import.meta.url)) === '') {
  try {
    process.exitCode = principal(process.argv.slice(2));
  } catch (erreur) {
    console.error(erreur instanceof ErreurModele ? erreur.message : erreur);
    process.exitCode = 2;
  }
}
