/* =========================================================
   Portfolio — Marie Tiers
   1. Défilement amorti (Menu ⏫, Contact ⏬, liens internes)
   2. Formulaire de contact (avec vérification de l'adresse e-mail)
   3. Compteur de visites (GoatCounter) et espace personnel
   4. Utilitaires (pastilles • de « Menu » et « Contact », année)
   5. Filtres et tri de la page Projets
   6. Calendrier au survol d'une date (accueil)
   ========================================================= */
'use strict';

/* ---------- 1. Défilement amorti ---------- */
const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)');
let idAnimation = null;

/** Courbe « ease-in-out » : démarrage doux, accélération, arrivée douce. */
const amorti = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const hauteurMax = () => document.documentElement.scrollHeight - window.innerHeight;
const borner = (y) => Math.max(0, Math.min(y, hauteurMax()));

function decalageBarre() {
  const barre = document.querySelector('.barre-haut');
  return (barre ? barre.offsetHeight : 0) + 16;
}

function arreterDefilement() {
  if (idAnimation !== null) {
    cancelAnimationFrame(idAnimation);
    idAnimation = null;
  }
}

/**
 * Fait défiler la page jusqu'à la position renvoyée par `calculerCible`.
 * La cible est recalculée à chaque image : si une image se charge
 * pendant le trajet, on arrive quand même au bon endroit.
 */
function defilerVers(calculerCible, quandArrive) {
  arreterDefilement();
  const depart = window.scrollY;
  const distance = Math.abs(borner(calculerCible()) - depart);

  if (mouvementReduit.matches || distance < 2) {
    window.scrollTo({ top: borner(calculerCible()), behavior: 'instant' });
    quandArrive?.();
    return;
  }

  const duree = Math.min(1600, 500 + distance * 0.3); // en millisecondes
  const debut = performance.now();

  const etape = (maintenant) => {
    const t = Math.min(1, (maintenant - debut) / duree);
    const cible = borner(calculerCible());
    window.scrollTo({ top: depart + (cible - depart) * amorti(t), behavior: 'instant' });

    if (t < 1) {
      idAnimation = requestAnimationFrame(etape);
    } else {
      idAnimation = null;
      quandArrive?.();
    }
  };
  idAnimation = requestAnimationFrame(etape);
}

// Le visiteur reprend la main (molette, doigt, clavier) : on arrête l'animation.
['wheel', 'touchstart', 'keydown'].forEach((type) =>
  window.addEventListener(type, arreterDefilement, { passive: true })
);

/** Place le focus clavier sur l'arrivée, sans provoquer de saut. */
function donnerLeFocus(element) {
  if (!element) return;
  if (!element.matches('a, button, input, select, textarea, [tabindex]')) {
    element.setAttribute('tabindex', '-1');
  }
  element.focus({ preventScroll: true });
}

document.addEventListener('click', (evt) => {
  const lien = evt.target.closest('a[href^="#"]');
  if (!lien || evt.defaultPrevented || evt.button !== 0 ||
      evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey) return;

  const id = decodeURIComponent(lien.hash.slice(1));
  let calculerCible;
  let aFocaliser;

  if (lien.dataset.defilement === 'haut' || id === 'haut') {
    calculerCible = () => 0;
    aFocaliser = document.getElementById('titre-principal');
  } else if (lien.dataset.defilement === 'bas' || id === 'bas') {
    calculerCible = hauteurMax;
    aFocaliser = document.getElementById('contact-titre');
  } else {
    const cible = document.getElementById(id);
    if (!cible) return;
    calculerCible = () => cible.getBoundingClientRect().top + window.scrollY - decalageBarre();
    aFocaliser = cible.querySelector('h1, h2') ?? cible;
    history.pushState(null, '', `#${id}`);
  }

  evt.preventDefault();
  defilerVers(calculerCible, () => donnerLeFocus(aFocaliser));
});

/* ---------- 2. Formulaire de contact ---------- */
const formulaire = document.getElementById('formulaire-contact');

/*
  Vérification de l'adresse e-mail, en trois temps :
  1. la syntaxe (nom@domaine.extension) ;
  2. une suggestion en cas de faute de frappe sur un domaine courant (gmial.com → gmail.com) ;
  3. l'existence du domaine et sa capacité à recevoir des e-mails, demandée au DNS public de Google.
  Seul le domaine est envoyé (jamais l'adresse complète). L'existence de la boîte elle-même
  ne peut pas être vérifiée depuis un site statique : seul un e-mail de confirmation le permet.
  Si le DNS ne répond pas (hors ligne, blocage), l'adresse est acceptée : on ne bloque jamais à tort.
*/
const SYNTAXE_EMAIL =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;
const DOMAINES_COURANTS = [
  'gmail.com', 'hotmail.fr', 'hotmail.com', 'outlook.fr', 'outlook.com', 'live.fr', 'yahoo.fr', 'yahoo.com',
  'icloud.com', 'orange.fr', 'wanadoo.fr', 'free.fr', 'sfr.fr', 'laposte.net', 'proton.me', 'univ-artois.fr',
];
const reponsesDns = new Map(); // domaine → 'oui' | 'non' | 'inconnu' (une seule question par domaine)

/** Distance d'édition entre deux mots (nombre de lettres à changer, ajouter ou retirer). */
function distance(a, b) {
  const ligne = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonale = ligne[0];
    ligne[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const memo = ligne[j];
      ligne[j] = Math.min(ligne[j] + 1, ligne[j - 1] + 1, diagonale + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonale = memo;
    }
  }
  return ligne[b.length];
}

function domaineSuggere(domaine) {
  if (DOMAINES_COURANTS.includes(domaine)) return null;
  const proche = DOMAINES_COURANTS
    .map((d) => ({ d, n: distance(domaine, d) }))
    .sort((x, y) => x.n - y.n)[0];
  return proche.n > 0 && proche.n <= 2 ? proche.d : null;
}

async function questionDns(domaine, type) {
  const controle = new AbortController();
  const minuteur = setTimeout(() => controle.abort(), 3000);
  try {
    const reponse = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domaine)}&type=${type}`,
      { signal: controle.signal, headers: { Accept: 'application/dns-json' } }
    );
    return reponse.ok ? await reponse.json() : null;
  } catch { return null; } finally { clearTimeout(minuteur); }
}

/** Le domaine existe-t-il et peut-il recevoir des e-mails ? */
async function domaineAccepteMail(domaine) {
  if (reponsesDns.has(domaine)) return reponsesDns.get(domaine);
  let verdict = 'inconnu';
  const mx = await questionDns(domaine, 'MX');
  if (mx) {
    const reponsesMx = (mx.Answer || []).filter((r) => r.type === 15);
    if (mx.Status === 3) verdict = 'non';                                   // domaine inexistant
    else if (reponsesMx.some((r) => /^0\s+\.?$/.test(r.data))) verdict = 'non'; // « MX nul » : refuse le courrier
    else if (reponsesMx.length) verdict = 'oui';
    else {                                                                  // sans MX, le courrier va à l'adresse du domaine
      const a = await questionDns(domaine, 'A');
      if (a) verdict = (a.Answer || []).some((r) => r.type === 1) ? 'oui' : 'non';
    }
  }
  if (verdict !== 'inconnu') reponsesDns.set(domaine, verdict);
  return verdict;
}

if (formulaire) {
  const champEmail = formulaire.querySelector('input[type="email"]');
  if (champEmail) {
    const aide = document.createElement('p');
    aide.className = 'champ-aide';
    aide.id = `${champEmail.id}-aide`;
    aide.setAttribute('aria-live', 'polite');
    champEmail.closest('.champ').append(aide);
    champEmail.setAttribute('aria-describedby', aide.id);

    const signaler = (message) => {
      champEmail.setCustomValidity(message);
      aide.textContent = message;
      aide.dataset.etat = 'erreur';
    };
    const effacer = () => {
      champEmail.setCustomValidity('');
      aide.textContent = '';
      delete aide.dataset.etat;
    };

    /** Renvoie true si l'adresse peut être utilisée. `complete` : interroge aussi le DNS. */
    champEmail.verifier = async (complete = true) => {
      const adresse = champEmail.value.trim();
      champEmail.value = adresse;
      effacer();
      if (!adresse) return true;                       // le champ obligatoire est géré par le navigateur
      if (!SYNTAXE_EMAIL.test(adresse)) {
        signaler('Cette adresse ne semble pas valide : elle doit ressembler à prenom.nom@domaine.fr.');
        return false;
      }
      const [nom, domaine] = [adresse.slice(0, adresse.lastIndexOf('@')), adresse.slice(adresse.lastIndexOf('@') + 1).toLowerCase()];
      const suggestion = domaineSuggere(domaine);
      if (suggestion) {                                // simple proposition, jamais bloquante
        aide.textContent = 'Vouliez-vous dire ';
        const corriger = document.createElement('button');
        corriger.type = 'button';
        corriger.textContent = `${nom}@${suggestion}`;
        corriger.addEventListener('click', () => { champEmail.value = corriger.textContent; champEmail.verifier(); champEmail.focus(); });
        aide.append(corriger, ' ?');
      }
      if (!complete) return true;
      if (await domaineAccepteMail(domaine) === 'non') {
        signaler(`Le domaine « ${domaine} » n'existe pas ou ne reçoit pas d'e-mails : vérifiez l'adresse.`);
        return false;
      }
      return true;
    };

    champEmail.addEventListener('input', effacer);
    champEmail.addEventListener('change', () => champEmail.verifier());
  }
}

if (formulaire) {
  const statut = formulaire.querySelector('.formulaire-statut');
  const bouton = formulaire.querySelector('button[type="submit"]');
  const destinataire = formulaire.dataset.destinataire;

  const afficher = (texte, etat = 'ok') => {
    statut.textContent = texte;
    statut.dataset.etat = etat;
  };

  // L'événement « submit » ne se déclenche que si les champs requis sont valides.
  formulaire.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const champEmail = formulaire.querySelector('input[type="email"]');
    if (champEmail?.verifier && !(await champEmail.verifier())) {
      champEmail.reportValidity();
      champEmail.focus();
      return;
    }
    const donnees = new FormData(formulaire);
    if (donnees.get('_gotcha')) return; // champ piège rempli : sans doute un robot

    const adresseService = (formulaire.dataset.endpoint || '').trim();

    // Sans service d'envoi : on prépare l'e-mail dans la messagerie du visiteur.
    if (!adresseService) {
      const sujet = `[Portfolio] ${donnees.get('objet')} — ${donnees.get('nom')}`;
      const corps = `${donnees.get('message')}\n\n${donnees.get('nom')}\n${donnees.get('email')}`;
      window.location.href =
        `mailto:${destinataire}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
      afficher('Votre messagerie s’ouvre avec le message prêt à partir.');
      return;
    }

    // Avec un service (Formspree ou équivalent) : envoi direct.
    bouton.disabled = true;
    afficher('Envoi en cours…');
    try {
      const reponse = await fetch(adresseService, {
        method: 'POST',
        body: donnees,
        headers: { Accept: 'application/json' },
      });
      if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
      formulaire.reset();
      afficher('Merci ! Votre message est bien parti, je vous réponds rapidement.');
    } catch (erreur) {
      console.error(erreur);
      afficher(`L’envoi n’a pas abouti. Vous pouvez m’écrire directement à ${destinataire}.`, 'erreur');
    } finally {
      bouton.disabled = false;
    }
  });
}

/* ---------- 3. Compteur de visites (GoatCounter) et espace perso ---------- */
// Remplacer marie-tiers par le code choisi à l'inscription sur goatcounter.com
const ADRESSE_GOATCOUNTER = 'https://marie-tiers.goatcounter.com/count';
const CLE_EXCLUSION = 'portfolio-ne-pas-me-compter';

/** Lecture prudente : le stockage peut être bloqué (navigation privée, réglages). */
function appareilExclu() {
  try { return localStorage.getItem(CLE_EXCLUSION) === '1'; } catch { return false; }
}

function definirExclusion(exclure) {
  try {
    if (exclure) localStorage.setItem(CLE_EXCLUSION, '1');
    else localStorage.removeItem(CLE_EXCLUSION);
    return true;
  } catch { return false; }
}

/** Le compteur ne se charge que sur le vrai site, hors appareil exclu et hors espace perso. */
function chargerCompteur() {
  const codeRenseigne = !ADRESSE_GOATCOUNTER.includes('MON' + 'CODE'); // écrit en deux morceaux : un remplacement global de marie-tiers ne le touche pas
  const enLigne = location.protocol === 'https:' && location.hostname !== 'localhost';
  const pageExclue = document.body.hasAttribute('data-sans-compteur');
  if (!codeRenseigne || !enLigne || pageExclue || appareilExclu()) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.dataset.goatcounter = ADRESSE_GOATCOUNTER;
  document.head.append(script);
}
chargerCompteur();

// Espace perso : bouton « me compter / ne plus me compter » sur cet appareil
const boutonComptage = document.getElementById('bouton-comptage');
if (boutonComptage) {
  const etat = document.getElementById('etat-comptage');
  const afficherEtat = () => {
    const exclu = appareilExclu();
    etat.textContent = exclu
      ? 'Cet appareil n’est pas compté dans les visites.'
      : 'Cet appareil est compté dans les visites.';
    etat.dataset.etat = exclu ? 'exclu' : 'compte';
    boutonComptage.textContent = exclu ? 'Recompter cet appareil' : 'Ne plus compter cet appareil';
    boutonComptage.setAttribute('aria-pressed', String(exclu));
  };
  boutonComptage.addEventListener('click', () => {
    if (!definirExclusion(!appareilExclu())) {
      etat.textContent = 'Votre navigateur bloque le stockage local : réglage impossible ici.';
      etat.dataset.etat = 'erreur';
      return;
    }
    afficherEtat();
  });
  afficherEtat();
}

/* ---------- 4. Utilitaires ---------- */
// Classes sur <html> qui changent une flèche en pastille • (cf. CSS, section 3) :
//  · « en-haut » : tout en haut de la page (flèche de « Menu ») ;
//  · « en-bas »  : le bouton « Envoyer » est entièrement visible, entre les deux barres fixes
//                  (flèche de « Contact ») ; sans formulaire, tout en bas de la page.
const racine = document.documentElement;
let verificationPrevue = false;
function verifierPositions() {
  verificationPrevue = false;
  racine.classList.toggle('en-haut', window.scrollY < 8);

  const envoyer = document.querySelector('#formulaire-contact [type="submit"]');
  let enBas = window.scrollY >= hauteurMax() - 8;
  if (envoyer) {
    const zone = envoyer.getBoundingClientRect();
    const hautVisible = document.querySelector('.barre-haut')?.offsetHeight ?? 0;
    const basVisible = window.innerHeight - (document.querySelector('.barre-bas')?.offsetHeight ?? 0);
    enBas = zone.height > 0 && zone.top >= hautVisible && zone.bottom <= basVisible;
  }
  racine.classList.toggle('en-bas', enBas);
}
const prevoirVerification = () => {
  if (!verificationPrevue) { verificationPrevue = true; requestAnimationFrame(verifierPositions); }
};
window.addEventListener('scroll', prevoirVerification, { passive: true });
window.addEventListener('resize', prevoirVerification, { passive: true });
verifierPositions();

document.querySelectorAll('[data-annee]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});

/* ---------- 5. Filtres et tri de la page Projets ---------- */
// Par défaut : filtre « Tous », tri du plus récent au plus ancien (l'ordre du HTML).
const outilsProjets = document.querySelector('.outils-projets');
if (outilsProjets) {
  const listeCartes = document.querySelector('.cartes');
  const boutonsFiltre = [...outilsProjets.querySelectorAll('.filtre')];
  const boutonTri = document.getElementById('bouton-tri');
  const boutonReinit = document.getElementById('bouton-reinitialiser');
  const statutFiltres = document.getElementById('filtres-statut');
  const cartesFiltrables = [...listeCartes.querySelectorAll(':scope > [data-cadre]')]; // ordre d'origine
  const etat = { cadre: 'tous', ordre: 'recent' };

  const compter = (cadre) =>
    cadre === 'tous' ? cartesFiltrables.length : cartesFiltrables.filter((c) => c.dataset.cadre === cadre).length;

  // Les nombres se calculent seuls : rien à mettre à jour quand on ajoute une carte.
  boutonsFiltre.forEach((b) => { b.querySelector('.filtre-nombre').textContent = compter(b.dataset.filtre); });

  const afficher = () => {
    boutonsFiltre.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filtre === etat.cadre)));
    cartesFiltrables.forEach((c) => { c.hidden = etat.cadre !== 'tous' && c.dataset.cadre !== etat.cadre; });

    const ordre = etat.ordre === 'recent' ? cartesFiltrables : [...cartesFiltrables].reverse();
    listeCartes.append(...ordre); // déplace les cartes sans les recréer
    boutonTri.dataset.ordre = etat.ordre;
    boutonTri.querySelector('.outil-texte').textContent =
      etat.ordre === 'recent' ? 'Du plus récent au plus ancien' : 'Du plus ancien au plus récent';

    boutonReinit.hidden = etat.cadre === 'tous' && etat.ordre === 'recent';
    const n = compter(etat.cadre);
    statutFiltres.textContent = `${n} projet${n > 1 ? 's' : ''} affiché${n > 1 ? 's' : ''}, ` +
      (etat.ordre === 'recent' ? 'du plus récent au plus ancien.' : 'du plus ancien au plus récent.');
  };

  outilsProjets.addEventListener('click', (evt) => {
    const filtre = evt.target.closest('.filtre');
    if (filtre) etat.cadre = filtre.dataset.filtre;
    else if (evt.target.closest('#bouton-tri')) etat.ordre = etat.ordre === 'recent' ? 'ancien' : 'recent';
    else if (evt.target.closest('#bouton-reinitialiser')) { etat.cadre = 'tous'; etat.ordre = 'recent'; boutonsFiltre[0].focus(); }
    else return;
    afficher();
  });

  outilsProjets.hidden = false; // sans JavaScript, la barre reste cachée et toutes les cartes s'affichent
}

/* ---------- 6. Calendrier au survol d'une date (accueil) ---------- */
// Sur <time datetime="2027-04-26" data-calendrier>…</time> : au survol ou au focus, le mois s'affiche
// avec le jour mis en valeur et la fin de sa semaine teintée. Il disparaît instantanément à la sortie.
// Aucune dépendance ni iframe : le mois est construit ici, en français, semaine commençant le lundi.
document.querySelectorAll('time[data-calendrier]').forEach((date, rang) => {
  const [annee, mois, jour] = date.getAttribute('datetime').split('-').map(Number);
  const cible = new Date(annee, mois - 1, jour);
  const nomMois = cible.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const nomJour = cible.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const bulle = document.createElement('div');
  bulle.className = 'calendrier';
  bulle.id = `calendrier-${rang + 1}`;
  bulle.setAttribute('role', 'tooltip');
  bulle.hidden = true;

  const premierJour = (new Date(annee, mois - 1, 1).getDay() + 6) % 7; // 0 = lundi
  const nbJours = new Date(annee, mois, 0).getDate();
  const jourSemaineCible = (cible.getDay() + 6) % 7;
  let cases = '';
  for (let k = 0; k < Math.ceil((premierJour + nbJours) / 7) * 7; k++) {
    const n = k - premierJour + 1;
    if (k % 7 === 0) cases += '<tr>';
    if (n < 1 || n > nbJours) cases += '<td></td>';
    else {
      const classes = [];
      if (k % 7 >= 5) classes.push('we');
      if (n > jour && n <= jour + (4 - jourSemaineCible)) classes.push('stage');
      if (n === jour) classes.push('jour');
      cases += `<td class="${classes.join(' ')}"><span>${n}</span></td>`;
    }
    if (k % 7 === 6) cases += '</tr>';
  }
  bulle.innerHTML =
    `<p class="calendrier-titre">${nomMois}</p>` +
    '<table><thead><tr><th abbr="lundi">L</th><th abbr="mardi">M</th><th abbr="mercredi">M</th>' +
    '<th abbr="jeudi">J</th><th abbr="vendredi">V</th><th abbr="samedi">S</th><th abbr="dimanche">D</th></tr></thead>' +
    `<tbody>${cases}</tbody></table>` +
    `<p class="calendrier-legende">Début du stage : ${nomJour}</p>`;
  document.body.append(bulle);

  date.tabIndex = 0;
  date.setAttribute('aria-describedby', bulle.id);

  const montrer = () => {
    bulle.hidden = false;
    const zone = date.getBoundingClientRect();
    const largeur = bulle.offsetWidth, hauteur = bulle.offsetHeight;
    const gauche = Math.min(Math.max(8, zone.left + zone.width / 2 - largeur / 2), document.documentElement.clientWidth - largeur - 8);
    const placeDessous = window.innerHeight - zone.bottom - (document.querySelector('.barre-bas')?.offsetHeight ?? 0);
    const haut = placeDessous >= hauteur + 12 ? zone.bottom + 8 : zone.top - hauteur - 8;
    bulle.style.left = `${gauche + window.scrollX}px`;
    bulle.style.top = `${haut + window.scrollY}px`;
  };
  const cacher = () => { bulle.hidden = true; };

  // Souris : survol. Clavier : focus. Écran tactile : toucher la date l'affiche, toucher ailleurs la cache.
  date.addEventListener('pointerenter', (evt) => { if (evt.pointerType === 'mouse') montrer(); });
  date.addEventListener('pointerleave', (evt) => { if (evt.pointerType === 'mouse') cacher(); });
  date.addEventListener('focus', montrer);
  date.addEventListener('blur', cacher);
  date.addEventListener('click', montrer);
  date.addEventListener('keydown', (evt) => { if (evt.key === 'Escape') cacher(); });
  window.addEventListener('scroll', () => { if (!bulle.hidden && document.activeElement !== date) cacher(); }, { passive: true });
});
