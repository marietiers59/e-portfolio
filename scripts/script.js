/* =========================================================
   Portfolio — Marie Tiers
   1. Défilement amorti (Menu ⏫, Contact ⏬, liens internes)
   2. Formulaire de contact (avec vérification de l'adresse e-mail)
   3. Compteur de visites (GoatCounter) et espace personnel
   4. Utilitaires (pastilles • de « Menu » et « Contact », année)
   5. Filtres et tri de la page Projets
   6. Calendrier au survol d'une date (accueil)
   7. Thème clair / sombre (bouton de la barre du haut)
   8. Cartes déployées : la touche Échap les replie
   9. Images animées (GIF) : en mouvement seulement à la demande
  10. Nuage de compétences en 3D (page Compétences : aperçu animé, vue agrandie)
  11. Vignettes de compétences : rangées équilibrées et centrées
   Les textes affichés existent en français et en anglais britannique :
   la langue suit l'attribut lang de la page (<html lang="fr"> ou "en-GB").
   ========================================================= */
'use strict';

const ANGLAIS = document.documentElement.lang.toLowerCase().startsWith('en');
/** Renvoie le texte dans la langue de la page. */
const t = (fr, en) => (ANGLAIS ? en : fr);
const LOCALE = ANGLAIS ? 'en-GB' : 'fr-FR';

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
  Réglages d'envoi : à remplir une seule fois ici, ils valent pour toutes les pages.
  · formspree : adresse du formulaire Formspree (https://formspree.io/f/xxxxxxxx).
                Vide : le message s'ouvre dans la messagerie du visiteur (mailto).
  · turnstile : clé de site Cloudflare Turnstile (widget en mode « Non-interactive »).
                Vide : pas de vérification anti-robots. Ne sert qu'avec formspree,
                car c'est Formspree qui contrôle le jeton avec la clé secrète.
*/
const REGLAGES_ENVOI = { formspree: '', turnstile: '' };

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
        signaler(t('Cette adresse ne semble pas valide : elle doit ressembler à prenom.nom@domaine.fr.',
                   'This address does not look valid: it should look like firstname.lastname@domain.co.uk.'));
        return false;
      }
      const [nom, domaine] = [adresse.slice(0, adresse.lastIndexOf('@')), adresse.slice(adresse.lastIndexOf('@') + 1).toLowerCase()];
      const suggestion = domaineSuggere(domaine);
      if (suggestion) {                                // simple proposition, jamais bloquante
        aide.textContent = t('Vouliez-vous dire ', 'Did you mean ');
        const corriger = document.createElement('button');
        corriger.type = 'button';
        corriger.textContent = `${nom}@${suggestion}`;
        corriger.addEventListener('click', () => { champEmail.value = corriger.textContent; champEmail.verifier(); champEmail.focus(); });
        aide.append(corriger, t(' ?', '?'));
      }
      if (!complete) return true;
      if (await domaineAccepteMail(domaine) === 'non') {
        signaler(t(`Le domaine « ${domaine} » n'existe pas ou ne reçoit pas d'e-mails : vérifiez l'adresse.`,
                   `The domain “${domaine}” does not exist or cannot receive emails: please check the address.`));
        return false;
      }
      return true;
    };

    champEmail.addEventListener('input', effacer);
    champEmail.addEventListener('change', () => champEmail.verifier());
  }

  /*
    Champs obligatoires laissés vides ou mal remplis (RGAA 11.10) : à la place de la bulle
    éphémère du navigateur, un message reste affiché sous le champ, relié par aria-describedby,
    et le champ reçoit aria-invalid="true". Le focus va au premier champ à corriger.
  */
  let focusDonne = false;
  formulaire.querySelectorAll('input[required], textarea[required], select[required]').forEach((champ) => {
    let aide = document.getElementById(`${champ.id}-aide`);
    if (!aide) {
      aide = document.createElement('p');
      aide.className = 'champ-aide';
      aide.id = `${champ.id}-aide`;
      aide.setAttribute('aria-live', 'polite');
      champ.closest('.champ').append(aide);
      champ.setAttribute('aria-describedby', aide.id);
    }
    champ.addEventListener('invalid', (evt) => {
      evt.preventDefault();
      champ.setAttribute('aria-invalid', 'true');
      aide.textContent = champ.validity.valueMissing
        ? t('Ce champ est obligatoire.', 'This field is required.')
        : champ.validity.typeMismatch
          ? t('Cette adresse ne semble pas valide : elle doit ressembler à prenom.nom@domaine.fr.',
              'This address does not look valid: it should look like firstname.lastname@domain.com.')
          : champ.validationMessage;
      aide.dataset.etat = 'erreur';
      if (!focusDonne) {
        focusDonne = true;
        champ.focus();
        setTimeout(() => { focusDonne = false; }, 0);
      }
    });
    champ.addEventListener('input', () => {
      champ.removeAttribute('aria-invalid');
      if (champ.type !== 'email' && aide.dataset.etat === 'erreur') {
        aide.textContent = '';
        delete aide.dataset.etat;
      }
    });
  });
}

/*
  Vérification anti-robots Cloudflare Turnstile, en mode non interactif : le visiteur n'a rien à faire,
  le petit cadre au logo Cloudflare se valide seul. Chargée seulement si les deux réglages sont remplis.
*/
let idTurnstile = null;
const adresseEnvoi = () => ((formulaire?.dataset.endpoint || '').trim() || REGLAGES_ENVOI.formspree);
if (formulaire && REGLAGES_ENVOI.turnstile && adresseEnvoi()) {
  const zone = formulaire.querySelector('[data-turnstile]');
  if (zone) {
    window.surTurnstilePret = () => {
      idTurnstile = window.turnstile.render(zone, {
        sitekey: REGLAGES_ENVOI.turnstile,
        language: t('fr', 'en'),
        theme: document.documentElement.dataset.theme === 'sombre' ? 'dark' : 'light',
        size: 'flexible',
      });
    };
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=surTurnstilePret&render=explicit';
    script.async = true;
    document.head.append(script);
    zone.hidden = false;
    document.querySelectorAll('[data-mention-turnstile]').forEach((el) => { el.hidden = false; });
  }
}

if (formulaire) {
  const statut = formulaire.querySelector('.formulaire-statut');
  const bouton = formulaire.querySelector('button[type="submit"]');
  const destinataire = { toString: () => formulaire.dataset.destinataire ?? '' }; // lue à l'envoi : rideau.js la renseigne

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

    const adresseService = adresseEnvoi();

    // Sans service d'envoi : on prépare l'e-mail dans la messagerie du visiteur.
    if (!adresseService) {
      const sujet = `[Portfolio] ${donnees.get('objet')} — ${donnees.get('nom')}`;
      const corps = `${donnees.get('message')}\n\n${donnees.get('nom')}\n${donnees.get('email')}`;
      window.location.href =
        `mailto:${destinataire}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
      afficher(t('Votre messagerie s’ouvre avec le message prêt à partir.',
                 'Your email app is opening with the message ready to send.'));
      return;
    }

    // Avec un service (Formspree ou équivalent) : envoi direct.
    if (idTurnstile !== null && !window.turnstile?.getResponse(idTurnstile)) {
      afficher(t('Vérification anti-robots en cours : réessayez dans un instant.',
                 'Anti-bot check in progress: please try again in a moment.'), 'erreur');
      return;
    }
    bouton.disabled = true;
    afficher(t('Envoi en cours…', 'Sending…'));
    try {
      const reponse = await fetch(adresseService, {
        method: 'POST',
        body: donnees,
        headers: { Accept: 'application/json' },
      });
      if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
      formulaire.reset();
      afficher(t('Merci ! Votre message est bien parti, je vous réponds rapidement.',
                 'Thank you! Your message has been sent and I will reply shortly.'));
    } catch (erreur) {
      console.error(erreur);
      afficher(t(`L’envoi n’a pas abouti. Vous pouvez m’écrire directement à ${destinataire}.`,
                 `The message could not be sent. You can write to me directly at ${destinataire}.`), 'erreur');
    } finally {
      bouton.disabled = false;
      if (idTurnstile !== null) window.turnstile?.reset(idTurnstile);   // un jeton ne sert qu'une fois
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
      ? t('Cet appareil n’est pas compté dans les visites.', 'This device is not counted in the visits.')
      : t('Cet appareil est compté dans les visites.', 'This device is counted in the visits.');
    etat.dataset.etat = exclu ? 'exclu' : 'compte';
    boutonComptage.textContent = exclu
      ? t('Recompter cet appareil', 'Count this device again')
      : t('Ne plus compter cet appareil', 'Stop counting this device');
    boutonComptage.setAttribute('aria-pressed', String(exclu));
  };
  boutonComptage.addEventListener('click', () => {
    if (!definirExclusion(!appareilExclu())) {
      etat.textContent = t('Votre navigateur bloque le stockage local : réglage impossible ici.',
                           'Your browser blocks local storage: this setting cannot be changed here.');
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
// Par défaut : filtre « Tous », tri du plus récent au plus ancien (l'ordre du HTML),
// projets « bientôt en ligne » (cartes .carte-bientot) masqués tant que la case n'est pas cochée.
const outilsProjets = document.querySelector('.outils-projets');
if (outilsProjets) {
  const listeCartes = document.querySelector('.cartes');
  const boutonsFiltre = [...outilsProjets.querySelectorAll('.filtre')];
  const boutonTri = document.getElementById('bouton-tri');
  const boutonReinit = document.getElementById('bouton-reinitialiser');
  const caseEnCours = document.getElementById('afficher-en-cours');
  const nombreEnCours = document.getElementById('nombre-en-cours');
  const messageVide = document.getElementById('projets-vide');
  const statutFiltres = document.getElementById('filtres-statut');
  const cartesFiltrables = [...listeCartes.querySelectorAll(':scope > [data-cadre]')]; // ordre d'origine
  const estEnCours = (c) => c.querySelector('.carte-bientot') !== null;
  const etat = { cadre: 'tous', ordre: 'recent', enCours: false };

  const dansCadre = (c, cadre) => cadre === 'tous' || c.dataset.cadre === cadre;
  const visible = (c, cadre) => dansCadre(c, cadre) && (etat.enCours || !estEnCours(c));
  const compter = (cadre) => cartesFiltrables.filter((c) => visible(c, cadre)).length;

  const afficher = () => {
    // Les nombres se recalculent seuls : rien à mettre à jour quand on ajoute une carte.
    boutonsFiltre.forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.filtre === etat.cadre));
      b.querySelector('.filtre-nombre').textContent = compter(b.dataset.filtre);
    });
    cartesFiltrables.forEach((c) => { c.hidden = !visible(c, etat.cadre); });

    // Pastille de la case : combien de projets en cours dans le filtre choisi
    const enCoursDuCadre = cartesFiltrables.filter((c) => dansCadre(c, etat.cadre) && estEnCours(c)).length;
    caseEnCours.checked = etat.enCours;
    caseEnCours.closest('.bascule').hidden = enCoursDuCadre === 0 && !etat.enCours;
    nombreEnCours.textContent = enCoursDuCadre;

    const ordre = etat.ordre === 'recent' ? cartesFiltrables : [...cartesFiltrables].reverse();
    listeCartes.append(...ordre); // déplace les cartes sans les recréer
    boutonTri.dataset.ordre = etat.ordre;
    const sensTri = etat.ordre === 'recent'
      ? t('du plus récent au plus ancien', 'newest first')
      : t('du plus ancien au plus récent', 'oldest first');
    boutonTri.querySelector('.outil-texte').textContent = sensTri.charAt(0).toUpperCase() + sensTri.slice(1);

    const n = compter(etat.cadre);
    messageVide.hidden = n > 0;
    boutonReinit.hidden = etat.cadre === 'tous' && etat.ordre === 'recent' && !etat.enCours;
    const pluriel = n > 1 ? 's' : '';
    statutFiltres.textContent =
      t(`${n} projet${pluriel} affiché${pluriel}, `, `${n} project${n === 1 ? '' : 's'} shown, `) + sensTri +
      (etat.enCours ? t(', projets bientôt en ligne compris.', ', including projects coming soon.') : '.');
  };

  outilsProjets.addEventListener('click', (evt) => {
    const filtre = evt.target.closest('.filtre');
    if (filtre) etat.cadre = filtre.dataset.filtre;
    else if (evt.target.closest('#bouton-tri')) etat.ordre = etat.ordre === 'recent' ? 'ancien' : 'recent';
    else if (evt.target.closest('#bouton-reinitialiser')) {
      Object.assign(etat, { cadre: 'tous', ordre: 'recent', enCours: false });
      boutonsFiltre[0].focus();
    }
    else return;
    afficher();
  });

  caseEnCours.addEventListener('change', () => { etat.enCours = caseEnCours.checked; afficher(); });

  // Bouton du message « catégorie vide » : coche la case à la place du visiteur
  document.getElementById('bouton-voir-en-cours').addEventListener('click', () => {
    etat.enCours = true;
    afficher();
    caseEnCours.focus();
  });

  afficher();
  outilsProjets.hidden = false; // sans JavaScript, la barre reste cachée et toutes les cartes s'affichent
}

/* ---------- 6. Calendrier au survol d'une date (accueil) ---------- */
// Sur <time datetime="2027-04-26" data-calendrier>…</time> : au survol ou au focus, le mois s'affiche
// avec le jour de début mis en valeur et la période de stage colorée, sur tous les mois concernés :
//  · durée minimale (8 semaines) : du jour de début au samedi de la 8e semaine (dimanche exclu) ;
//  · prolongation possible, dans un ton plus clair : du dimanche qui suit la 8e semaine au samedi de la 10e semaine.
//    Durées réglables avec data-semaines="8-10" sur la balise <time> (8 et 10 par défaut).
//  · une petite colonne à gauche numérote les semaines de stage (1 → 10).
//  · Il reste ouvert tant que le curseur est sur la date OU sur le calendrier, et disparaît
//    instantanément dès qu'il quitte les deux.
//  · Les flèches ‹ › (ou les touches ← → quand la date a le focus) changent de mois ;
//    « Revenir à avril 2027 » ramène au mois de départ.
// Aucune dépendance ni iframe : le mois est construit ici, dans la langue de la page, semaine commençant le lundi.
document.querySelectorAll('time[data-calendrier]').forEach((date, rang) => {
  const [annee, mois, jour] = date.getAttribute('datetime').split('-').map(Number);
  const cible = new Date(annee, mois - 1, jour);
  const nomMoisCible = cible.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });
  const nomJour = cible.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  // En-têtes des colonnes, du lundi au dimanche : [nom complet, initiale]
  const joursSemaine = [...Array(7)].map((_, k) => {
    const jourK = new Date(2024, 0, 1 + k);   // le 1er janvier 2024 est un lundi
    const nom = jourK.toLocaleDateString(LOCALE, { weekday: 'long' });
    return [nom, nom.charAt(0).toUpperCase()];
  });
  const jourSemaineCible = (cible.getDay() + 6) % 7;   // 0 = lundi
  let affiche = new Date(annee, mois - 1, 1);           // mois actuellement affiché

  // Période de stage : fin = samedi de la Ne semaine (la semaine 1 est celle du jour de début)
  const [semMin, semMax] = (date.dataset.semaines || '8-10').split('-').map(Number);
  const samediSemaine = (n) => new Date(annee, mois - 1, jour + (n - 1) * 7 + (5 - jourSemaineCible));
  const finMin = samediSemaine(semMin);
  const finMax = samediSemaine(semMax || semMin);
  const lundiDebut = new Date(annee, mois - 1, jour - jourSemaineCible);   // lundi de la 1re semaine de stage
  const debutProlongation = new Date(finMin.getFullYear(), finMin.getMonth(), finMin.getDate() + 1);   // dimanche suivant : il ouvre la prolongation
  const finCourte = (d) => d.toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'long' });

  const bulle = document.createElement('div');
  bulle.className = 'calendrier';
  bulle.id = `calendrier-${rang + 1}`;
  // Aide visuelle seulement : la date et la légende « Début du stage » sont déjà écrites en clair dans la page.
  bulle.setAttribute('aria-hidden', 'true');
  bulle.hidden = true;
  bulle.innerHTML =
    '<div class="calendrier-entete">' +
      `<button class="calendrier-fleche" type="button" tabindex="-1" data-pas="-1" aria-label="${t('Mois précédent', 'Previous month')}">&#x2039;</button>` +
      '<p class="calendrier-titre" aria-live="polite"></p>' +
      `<button class="calendrier-fleche" type="button" tabindex="-1" data-pas="1" aria-label="${t('Mois suivant', 'Next month')}">&#x203A;</button>` +
    '</div>' +
    '<table><thead><tr>' +
      `<th class="calendrier-sem" abbr="${t('semaine de stage', 'internship week')}" title="${t('Semaine de stage', 'Internship week')}">${t('n°', 'wk')}</th>` +
      joursSemaine.map(([nom, initiale]) => `<th abbr="${nom}">${initiale}</th>`).join('') +
    '</tr></thead><tbody></tbody></table>' +
    `<p class="calendrier-legende">${t('Début du stage : ', 'Internship starts on ')}${nomJour}</p>` +
    '<ul class="calendrier-cles">' +
      `<li><span class="cle cle-stage" aria-hidden="true"></span>${t(`${semMin} sem. : jusqu'au `, `${semMin} weeks: until `)}${finCourte(finMin)}</li>` +
      (finMax > finMin ? `<li><span class="cle cle-prolongation" aria-hidden="true"></span>${t(`${semMax} sem. : jusqu'au `, `${semMax} weeks: until `)}${finCourte(finMax)}</li>` : '') +
    '</ul>' +
    `<button class="calendrier-retour" type="button" tabindex="-1">${t('Revenir à ', 'Back to ')}${nomMoisCible}</button>`;
  document.body.append(bulle);
  const titre = bulle.querySelector('.calendrier-titre');
  const corps = bulle.querySelector('tbody');
  const retour = bulle.querySelector('.calendrier-retour');

  /** Construit la grille du mois affiché. */
  const dessiner = () => {
    const a = affiche.getFullYear(), m = affiche.getMonth();
    const premierJour = (new Date(a, m, 1).getDay() + 6) % 7;
    const nbJours = new Date(a, m + 1, 0).getDate();
    const memeMois = a === annee && m === mois - 1;
    let cases = '';
    for (let k = 0; k < 42; k++) {   // toujours 6 semaines : le calendrier garde la même hauteur d'un mois à l'autre
      const n = k - premierJour + 1;
      if (k % 7 === 0) {
        // Compteur de semaines : numéro de la semaine de stage (1 → semMax), si la rangée contient des jours du mois
        const lundi = new Date(a, m, n);
        const sem = Math.round((lundi - lundiDebut) / 864e5 / 7) + 1;
        const rangeeUtile = n <= nbJours && n + 6 >= 1;
        const typeSem = sem >= 1 && sem <= semMin ? 'sem-stage' : sem > semMin && sem <= semMax ? 'sem-prolongation' : '';
        cases += '<tr>' + (rangeeUtile && typeSem
          ? `<th class="calendrier-sem ${typeSem}" scope="row" title="${t(`Semaine ${sem} de stage`, `Internship week ${sem}`)}">${sem}</th>`
          : '<th class="calendrier-sem" scope="row"></th>');
      }
      if (n < 1 || n > nbJours) cases += '<td><span></span></td>';
      else {
        const classes = [];
        const ce = new Date(a, m, n);
        let info = '';
        if (k % 7 >= 5) classes.push('we');
        if (ce >= cible && ce <= finMin) { classes.push('stage'); info = ` title="${t(`Stage : ${semMin} premières semaines`, `Internship: first ${semMin} weeks`)}"`; }
        else if (ce >= debutProlongation && ce <= finMax) { classes.push('prolongation'); info = ` title="${t(`Prolongation possible jusqu'à ${semMax} semaines`, `Possible extension up to ${semMax} weeks`)}"`; }
        if (memeMois && n === jour) classes.push('jour');
        cases += `<td class="${classes.join(' ')}"${info}><span>${n}</span></td>`;
      }
      if (k % 7 === 6) cases += '</tr>';
    }
    corps.innerHTML = cases;
    titre.textContent = affiche.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });
    retour.style.visibility = memeMois ? 'hidden' : 'visible';   // garde sa place : rien ne bouge sous le curseur
  };

  /** Place le calendrier sous la date, ou au-dessus s'il manque de place en bas. */
  const placer = () => {
    const zone = date.getBoundingClientRect();
    const largeur = bulle.offsetWidth, hauteur = bulle.offsetHeight;
    const gauche = Math.min(Math.max(8, zone.left + zone.width / 2 - largeur / 2), document.documentElement.clientWidth - largeur - 8);
    const placeDessous = window.innerHeight - zone.bottom - (document.querySelector('.barre-bas')?.offsetHeight ?? 0);
    const dessous = placeDessous >= hauteur + 12;
    bulle.dataset.cote = dessous ? 'dessous' : 'dessus';   // sert au « pont » invisible entre la date et le calendrier
    bulle.style.left = `${gauche + window.scrollX}px`;
    bulle.style.top = `${(dessous ? zone.bottom + 8 : zone.top - hauteur - 8) + window.scrollY}px`;
  };

  const montrer = () => {
    if (!bulle.hidden) return;
    affiche = new Date(annee, mois - 1, 1);   // chaque ouverture repart du mois de la date
    dessiner();
    bulle.hidden = false;
    placer();
  };
  const cacher = () => { bulle.hidden = true; };
  const changerMois = (pas) => {
    affiche = new Date(affiche.getFullYear(), affiche.getMonth() + pas, 1);
    dessiner();
    placer();                                 // le nombre de semaines peut changer la hauteur
  };
  const survole = () => date.matches(':hover') || bulle.matches(':hover');

  // Souris : survol de la date ou du calendrier ; sortie des deux = disparition immédiate
  date.addEventListener('pointerenter', (evt) => { if (evt.pointerType === 'mouse') montrer(); });
  const quitter = (evt) => {
    if (evt.pointerType !== 'mouse') return;
    const versOu = evt.relatedTarget;
    if (versOu && (date.contains(versOu) || bulle.contains(versOu))) return;
    cacher();
  };
  date.addEventListener('pointerleave', quitter);
  bulle.addEventListener('pointerleave', quitter);

  // Clavier : focus sur la date ; ← → changent de mois ; Début y revient ; Échap ferme
  date.tabIndex = 0;
  date.addEventListener('focus', montrer);
  date.addEventListener('blur', () => { if (!survole()) cacher(); });
  date.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape') cacher();
    else if (!bulle.hidden && evt.key === 'Home') {           // Début : retour au mois de la date
      evt.preventDefault();
      affiche = new Date(annee, mois - 1, 1); dessiner(); placer();
    }
    else if (!bulle.hidden && (evt.key === 'ArrowLeft' || evt.key === 'ArrowRight')) {
      evt.preventDefault();
      changerMois(evt.key === 'ArrowLeft' ? -1 : 1);
    }
  });

  // Écran tactile : toucher la date l'ouvre, toucher ailleurs la ferme
  date.addEventListener('click', montrer);

  // Boutons du calendrier : un clic ne retire pas le focus de la date (le calendrier reste ouvert)
  bulle.addEventListener('mousedown', (evt) => evt.preventDefault());
  bulle.addEventListener('click', (evt) => {
    const fleche = evt.target.closest('.calendrier-fleche');
    if (fleche) changerMois(Number(fleche.dataset.pas));
    else if (evt.target.closest('.calendrier-retour')) { affiche = new Date(annee, mois - 1, 1); dessiner(); placer(); }
  });

  window.addEventListener('scroll', () => {
    if (!bulle.hidden && document.activeElement !== date && !survole()) cacher();
  }, { passive: true });
});

/* ---------- 7. Thème clair / sombre ---------- */
// Le thème est déjà posé avant l'affichage par le petit script du <head> de chaque page
// (choix mémorisé, sinon réglage clair/sombre de l'appareil). Ici :
//  · le bouton soleil ⇄ lune de la barre du haut (caché sans JavaScript) ;
//  · la mémorisation du choix sur cet appareil (localStorage, clé « theme ») ;
//  · le suivi du réglage de l'appareil tant que le visiteur n'a rien choisi.
(() => {
  const racine = document.documentElement;
  const bouton = document.querySelector('.theme');
  const systeme = window.matchMedia('(prefers-color-scheme: dark)');
  const couleurNavigateur = document.querySelector('meta[name="theme-color"]');

  const choixMemorise = () => {
    try { return localStorage.getItem('theme'); } catch { return null; }
  };

  function appliquer(theme, avecTransition) {
    if (avecTransition && !mouvementReduit.matches) {
      racine.classList.add('theme-bascule');               // fondu des couleurs (CSS, section 3)
      setTimeout(() => racine.classList.remove('theme-bascule'), 350);
    }
    racine.dataset.theme = theme;
    if (bouton) bouton.setAttribute('aria-pressed', String(theme === 'sombre'));
    if (couleurNavigateur) couleurNavigateur.content = theme === 'sombre' ? '#222d3a' : '#ddedf8';
  }

  appliquer(racine.dataset.theme === 'sombre' ? 'sombre' : 'clair', false);

  if (bouton) {
    bouton.hidden = false;
    bouton.addEventListener('click', () => {
      const suivant = racine.dataset.theme === 'sombre' ? 'clair' : 'sombre';
      appliquer(suivant, true);
      try { localStorage.setItem('theme', suivant); } catch { /* stockage bloqué : le choix vaut pour cette page seulement */ }
      // Juste après le clic, la pastille va jusqu'au bout de l'interrupteur, même si la souris est encore dessus
      bouton.classList.add('vient-de-basculer');
    });
    bouton.addEventListener('pointerleave', () => bouton.classList.remove('vient-de-basculer'));
    bouton.addEventListener('blur', () => bouton.classList.remove('vient-de-basculer'));
  }

  systeme.addEventListener('change', (e) => {
    if (!['clair', 'sombre'].includes(choixMemorise())) appliquer(e.matches ? 'sombre' : 'clair', true);
  });
})();

/* ---------- 8. Cartes déployées : la touche Échap les replie ---------- */
// Une carte déployée au survol ou au focus recouvre la rangée suivante : Échap la replie
// sans déplacer la souris ni le focus (RGAA 10.13, WCAG 1.4.13). Elle se redéploie au prochain survol.
document.addEventListener('keydown', (evt) => {
  if (evt.key !== 'Escape') return;
  document.querySelectorAll('.emplacement:hover, .emplacement:focus-within').forEach((el) => el.classList.add('replie'));
});
document.querySelectorAll('.emplacement').forEach((el) => {
  el.addEventListener('pointerleave', () => el.classList.remove('replie'));
  el.addEventListener('focusout', (evt) => { if (!el.contains(evt.relatedTarget)) el.classList.remove('replie'); });
});

/* ---------- 9. Images animées (GIF) : en mouvement seulement à la demande ---------- */
// Par défaut, l'image fixe (la <source> PNG du <picture>). L'animation joue au survol ou au focus
// de la carte et s'arrête en la quittant ; sur écran tactile, 5 secondes quand la carte apparaît.
// Avec « animations réduites » activé sur l'appareil, l'image reste fixe (RGAA 13.8).
document.querySelectorAll('.carte picture').forEach((image) => {
  const img = image.querySelector('img[src$=".gif"]');
  const fixe = image.querySelector('source[srcset]')?.getAttribute('srcset');
  if (!img || !fixe) return;
  const anime = img.getAttribute('src');
  const zone = img.closest('.emplacement') ?? img.closest('.carte');
  const jouer = () => { if (!mouvementReduit.matches) img.src = anime; };
  const arreter = () => { img.src = fixe; };
  arreter();
  zone.addEventListener('pointerenter', jouer);
  zone.addEventListener('pointerleave', arreter);
  zone.addEventListener('focusin', jouer);
  zone.addEventListener('focusout', (evt) => { if (!zone.contains(evt.relatedTarget)) arreter(); });
  if (!window.matchMedia('(hover: hover)').matches && 'IntersectionObserver' in window) {
    let minuteur;
    new IntersectionObserver(([entree]) => {
      clearTimeout(minuteur);
      if (entree.isIntersecting) { jouer(); minuteur = setTimeout(arreter, 5000); }
      else arreter();
    }, { threshold: 0.6 }).observe(img);
  }
});
/* ---------- 10. Nuage de compétences en 3D (page Compétences) ---------- */
// Le graphe de Gephi (#nuage-donnees : x, y de ForceAtlas2, z ajouté pour la profondeur) est dessiné
// dans un <canvas>, en perspective, comme un réseau de neurones : il tourne lentement sur lui-même,
// les nœuds brillent et des influx lumineux filent le long des liens, comme de petites étoiles filantes.
//  · Aperçu : petit, tourne tant qu'il est à l'écran ; clic = vue agrandie. Bouton Pause sous la légende.
//  · Vue agrandie (<dialog>) : glisser = faire tourner ; molette, pincement, + / − = zoom ;
//    survol ou toucher d'un point = ses voisins ; couleur de la légende = sa communauté ;
//    Pause, Recentrer, étiquettes réduites, Tout afficher, Retour à la page (ou Échap).
//  · Mouvement réduit demandé par l'appareil : ni rotation automatique ni influx.
// Sans JavaScript, le SVG à plat et l'image seule (medias/nuage-competences.svg) prennent le relais.
(() => {
  const figure = document.querySelector('.nuage');
  const dialogue = document.querySelector('.nuage-dialogue');
  const source = document.getElementById('nuage-donnees');
  if (!figure || !dialogue || !source || typeof dialogue.showModal !== 'function') return;
  if (!document.createElement('canvas').getContext) return;

  const donnees = JSON.parse(source.textContent);
  const N = donnees.noeuds.length;
  const scene = dialogue.querySelector('.nuage-scene');
  const info = dialogue.querySelector('.nuage-info');
  const infoDefaut = info.textContent;
  const pucesDialogue = dialogue.querySelector('.nuage-puces');
  const TYPES = {
    but: t('compétence du BUT', 'BUT competency'),
    notion: t('notion du programme', 'syllabus topic'),
    projet: t('projet ou expérience', 'project or experience'),
    outil: t('outil', 'tool'),
  };
  const ORDRE_TYPES = ['but', 'notion', 'projet', 'outil'];
  const POLICE = { but: 15, notion: 11.5, projet: 10.5, outil: 10.5 };   // px CSS, au premier plan

  // --- Données : centrées, ramenées dans une boule de rayon 1 ---
  const moy = (cle) => donnees.noeuds.reduce((s, n) => s + n[cle], 0) / N;
  const [mx, my, mz] = [moy('x'), moy('y'), moy('z')];
  const rayonMax = Math.max(...donnees.noeuds.map((n) => Math.hypot(n.x - mx, n.y - my, n.z - mz)));
  const noeuds = donnees.noeuds.map((n) => ({
    ...n,
    x: (n.x - mx) / rayonMax, y: (n.y - my) / rayonMax, z: (n.z - mz) / rayonMax, r: n.r / rayonMax,
  }));
  const liens = donnees.liens.map(([a, b, w]) => ({ a, b, w }));
  const voisins = noeuds.map(() => new Set());
  const liensDe = noeuds.map(() => []);
  liens.forEach((l, i) => {
    voisins[l.a].add(l.b); voisins[l.b].add(l.a);
    liensDe[l.a].push(i); liensDe[l.b].push(i);
  });
  const distanceCentre = noeuds.map((n) => Math.hypot(n.x, n.y, n.z));
  const nomsCommunautes = new Map([...figure.querySelectorAll('.nuage-puce')]
    .map((p) => [p.dataset.communaute, p.textContent.trim()]));

  // --- Couleurs lues dans la feuille de styles (suivent le thème clair / sombre) ---
  let palette = null;
  const sprites = new Map();
  // Toute couleur CSS (hsl, oklch, color-mix…) ramenée en rgb(), que tous les canvas comprennent
  const pixel = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  function enRgb(couleur) {
    pixel.clearRect(0, 0, 1, 1);
    pixel.fillStyle = '#808080';
    pixel.fillStyle = couleur;
    pixel.fillRect(0, 0, 1, 1);
    const [r, v, b] = pixel.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${v}, ${b})`;
  }
  const nuance = (i) => (palette.sombre ? noeuds[i].cs : noeuds[i].cc);
  const nuanceTexte = (i) => (palette.sombre ? noeuds[i].ts : noeuds[i].tc);   // même teinte, contraste 4,5:1 pour les noms
  function lirePalette() {
    const style = getComputedStyle(document.documentElement);
    palette = {
      encre: enRgb(style.getPropertyValue('--encre').trim()),
      carte: enRgb(style.getPropertyValue('--carte').trim()),
      sombre: document.documentElement.dataset.theme === 'sombre',
    };
    sprites.clear();
  }

  // Sprites pré-dessinés (une image par teinte et par famille) : halo lumineux + corps en relief
  const S = 96, B = 20;                        // taille de l'image, rayon du corps dans l'image
  function sprite(couleur, famille) {
    const cle = `${couleur}|${famille}`;
    if (sprites.has(cle)) return sprites.get(cle);
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    // halo : masque radial, puis colorié
    const masque = g.createRadialGradient(S / 2, S / 2, B * 0.6, S / 2, S / 2, S / 2);
    masque.addColorStop(0, `rgba(0,0,0,${palette.sombre ? 0.75 : 0.42})`);
    masque.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = masque;
    g.fillRect(0, 0, S, S);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = couleur;
    g.fillRect(0, 0, S, S);
    if (famille === 'halo') { sprites.set(cle, c); return c; }
    g.globalCompositeOperation = 'source-over';
    const m = S / 2;
    const reflet = () => {                     // éclat de lumière en haut à gauche : effet de sphère
      const l = g.createRadialGradient(m - B * 0.35, m - B * 0.4, 0, m - B * 0.2, m - B * 0.2, B * 1.1);
      l.addColorStop(0, 'rgba(255,255,255,0.75)');
      l.addColorStop(0.35, 'rgba(255,255,255,0.12)');
      l.addColorStop(1, 'rgba(0,0,0,0.22)');
      return l;
    };
    g.fillStyle = couleur;
    g.beginPath();
    if (famille === 'projet') g.roundRect(m - B * 0.9, m - B * 0.9, B * 1.8, B * 1.8, B * 0.4);
    else g.arc(m, m, famille === 'notion' ? B * 0.95 : B, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = reflet();
    g.fill();
    if (famille === 'notion') {                // anneau : cœur clair
      g.fillStyle = palette.carte;
      g.beginPath();
      g.arc(m, m, B * 0.55, 0, Math.PI * 2);
      g.fill();
    }
    if (famille === 'but') {                   // compétence du BUT : cerclée
      g.strokeStyle = couleur;
      g.globalAlpha = 0.7;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(m, m, B + 6, 0, Math.PI * 2);
      g.stroke();
      g.globalAlpha = 1;
    }
    sprites.set(cle, c);
    return c;
  }

  // --- Une vue = un canvas qui dessine le réseau ---
  const RAPPEL = !mouvementReduit.matches;     // animations permises ?
  class Vue {
    constructor(conteneur, apercu) {
      this.apercu = apercu;
      this.toile = document.createElement('canvas');
      this.toile.className = 'nuage-toile';
      if (apercu) this.toile.setAttribute('aria-hidden', 'true');
      else {
        this.toile.setAttribute('role', 'img');
        this.toile.setAttribute('aria-label', t('Réseau de compétences en 3D (version texte sur la page)', '3D skills network (text version on the page)'));
      }
      conteneur.append(this.toile);
      this.g = this.toile.getContext('2d');
      this.p = noeuds.map(() => ({ x: 0, y: 0, s: 1, z: 0 }));
      this.ordre = noeuds.map((_, i) => i);
      this.eclats = new Float32Array(N);
      this.impulsions = [];
      this.prochaine = 0;
      this.recentrer();
      this.enPause = false;
      this.selection = null;                   // Set d'indices mis en évidence
      this.liensActifs = null;
      this.etiquettesReduites = false;
      this.apparition = RAPPEL ? 0 : 1;
      this.sale = true;
      this.redimensionner();
      this.observateur = new ResizeObserver(() => { this.redimensionner(); this.sale = true; });
      this.observateur.observe(conteneur);
    }
    recentrer() {
      this.theta = -0.5; this.phi = 0.22; this.zoom = 1;
      this.vTheta = 0; this.vPhi = 0;
      this.repos = 0;                          // ms avant la reprise de la rotation automatique
      this.sale = true;
    }
    redimensionner() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.dpr = dpr;
      this.toile.width = Math.max(1, Math.round(this.toile.clientWidth * dpr));
      this.toile.height = Math.max(1, Math.round(this.toile.clientHeight * dpr));
    }
    detruire() { this.observateur.disconnect(); this.toile.remove(); }
    get anime() { return RAPPEL && !this.enPause; }

    // Projection en perspective (rotation autour de la verticale, puis de l'horizontale)
    projeter() {
      const { width: w, height: h } = this.toile;
      const echelle = (this.apercu ? Math.min(w, h) * 0.5 : Math.min(w * 0.42, h * 0.56)) * this.zoom;   // portrait : plus étroit
      const ct = Math.cos(this.theta), st = Math.sin(this.theta);
      const cp = Math.cos(this.phi), sp = Math.sin(this.phi);
      const D = 3.4;                           // distance de la caméra
      noeuds.forEach((n, i) => {
        const x1 = n.x * ct + n.z * st;
        const z1 = -n.x * st + n.z * ct;
        const y2 = n.y * cp - z1 * sp;
        const z2 = n.y * sp + z1 * cp;
        const pers = D / (D - z2);
        const q = this.p[i];
        q.x = w / 2 + x1 * pers * echelle;
        q.y = h / 2 + y2 * pers * echelle;
        q.s = pers * echelle;
        q.z = z2;                              // > 0 : vers le spectateur
      });
      this.ordre.sort((a, b) => this.p[a].z - this.p[b].z);
    }
    profondeur(z) { return Math.min(1, Math.max(0, (z + 1) / 2)); }       // 0 au fond, 1 devant
    eclosion(i) {                              // apparition du centre vers les bords
      if (this.apparition >= 1) return 1;
      const v = (this.apparition * 1.6 - distanceCentre[i] * 0.6) / 0.4;
      return Math.min(1, Math.max(0, v));
    }

    // Influx : un signal part d'un nœud, file le long d'un lien et fait briller le nœud d'arrivée,
    // qui le relaie parfois à son tour (réaction en chaîne).
    lancer(depuis) {
      const choix = this.selection ? [...this.selection] : null;
      let a = depuis ?? (choix ? choix[Math.floor(Math.random() * choix.length)] : Math.floor(Math.random() * N));
      const possibles = liensDe[a].filter((li) => !this.liensActifs || this.liensActifs.has(li));
      if (!possibles.length) return;
      const l = liens[possibles[Math.floor(Math.random() * possibles.length)]];
      const b = l.a === a ? l.b : l.a;
      this.impulsions.push({ a, b, t: 0, duree: 650 + Math.random() * 650 });
      this.eclats[a] = Math.max(this.eclats[a], 0.6);
    }
    avancer(dt) {
      if (this.apparition < 1) { this.apparition = Math.min(1, this.apparition + dt / 1800); this.sale = true; }
      // rotation : automatique, ou élan après un glisser
      if (Math.abs(this.vTheta) > 1e-5 || Math.abs(this.vPhi) > 1e-5) {
        this.theta += this.vTheta * dt;
        this.phi = Math.max(-1.3, Math.min(1.3, this.phi + this.vPhi * dt));
        const frein = Math.exp(-dt / 280);
        this.vTheta *= frein; this.vPhi *= frein;
        this.sale = true;
      } else if (this.anime && !this.glisse) {
        if (this.repos > 0) this.repos -= dt;
        else { this.theta += dt * (this.apercu ? 0.00016 : (this.selection ? 0.00004 : 0.0001)); this.sale = true; }
      }
      if (!this.anime) { this.impulsions.length = 0; this.eclats.fill(0); return; }
      this.prochaine -= dt;
      if (this.prochaine <= 0 && this.apparition >= 1) {
        this.lancer();
        this.prochaine = (this.apercu ? 420 : 240) * (0.5 + Math.random());   // influx espacés : discrets
      }
      for (let i = this.impulsions.length - 1; i >= 0; i--) {
        const im = this.impulsions[i];
        im.t += dt / im.duree;
        if (im.t >= 1) {
          this.impulsions.splice(i, 1);
          this.eclats[im.b] = 1;
          if (Math.random() < 0.5 && this.impulsions.length < (this.apercu ? 10 : 20)) this.lancer(im.b);
        }
      }
      const extinction = Math.exp(-dt / 420);
      for (let i = 0; i < N; i++) this.eclats[i] *= extinction;
      this.sale = true;
    }

    dessiner() {
      if (!palette) lirePalette();
      this.projeter();
      const g = this.g, dpr = this.dpr, P = this.p;
      g.clearRect(0, 0, this.toile.width, this.toile.height);
      const sel = this.selection;

      // 1. Liens (synapses) : dégradé d'une extrémité à l'autre, estompés au fond
      g.lineCap = 'round';
      liens.forEach((l, i) => {
        const a = P[l.a], b = P[l.b];
        const e = Math.min(this.eclosion(l.a), this.eclosion(l.b));
        if (e <= 0) return;
        const prof = (this.profondeur(a.z) + this.profondeur(b.z)) / 2;
        let alpha = (palette.sombre ? 0.2 : 0.24) + 0.32 * prof;
        if (sel) alpha = this.liensActifs.has(i) ? 0.95 : 0.035;
        const degrade = g.createLinearGradient(a.x, a.y, b.x, b.y);
        degrade.addColorStop(0, nuance(l.a));
        degrade.addColorStop(1, nuance(l.b));
        g.strokeStyle = degrade;
        g.globalAlpha = alpha * e;
        g.lineWidth = (0.45 + 0.4 * l.w) * dpr * (0.6 + 0.6 * prof) * (sel && this.liensActifs.has(i) ? 1.8 : 1);
        g.beginPath();
        g.moveTo(a.x, a.y);
        if (e < 1) g.lineTo(a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * e); else g.lineTo(b.x, b.y);
        g.stroke();
      });

      // 2. Influx en vol : petites étoiles filantes, un cœur blanc incandescent et une courte traîne dorée
      g.globalCompositeOperation = palette.sombre ? 'lighter' : 'source-over';
      g.lineCap = 'round';
      this.impulsions.forEach((im) => {
        const a = P[im.a], b = P[im.b];
        const x = a.x + (b.x - a.x) * im.t, y = a.y + (b.y - a.y) * im.t;
        const prof = this.profondeur((a.z + b.z) / 2);
        const longueur = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const traine = Math.min((10 + 12 * prof) * dpr, longueur * im.t);     // la traîne ne dépasse pas le départ
        const ux = (b.x - a.x) / longueur, uy = (b.y - a.y) / longueur;
        const ox = x - ux * traine, oy = y - uy * traine;
        const or = palette.sombre ? '255, 226, 170' : '235, 170, 60';         // or pâle (sombre) ou ambré (clair)
        // traîne
        const fil = g.createLinearGradient(ox, oy, x, y);
        fil.addColorStop(0, `rgba(${or}, 0)`);
        fil.addColorStop(1, `rgba(${or}, ${palette.sombre ? 0.55 : 0.45})`);
        g.globalAlpha = 0.6 + 0.4 * prof;
        g.strokeStyle = fil;
        g.lineWidth = (0.9 + 0.6 * prof) * dpr;
        g.beginPath();
        g.moveTo(ox, oy);
        g.lineTo(x, y);
        g.stroke();
        // lueur
        const r = (2.6 + 2.4 * prof) * dpr;
        const lueur = g.createRadialGradient(x, y, 0, x, y, r);
        lueur.addColorStop(0, palette.sombre ? 'rgba(255, 252, 240, 0.9)' : 'rgba(255, 244, 214, 0.95)');
        lueur.addColorStop(0.45, `rgba(${or}, ${palette.sombre ? 0.35 : 0.3})`);
        lueur.addColorStop(1, `rgba(${or}, 0)`);
        g.fillStyle = lueur;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
        // cœur blanc
        g.globalAlpha = 0.9;
        g.fillStyle = '#fff';
        g.beginPath();
        g.arc(x, y, (0.8 + 0.4 * prof) * dpr, 0, Math.PI * 2);
        g.fill();
      });
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';

      // 3. Nœuds, du fond vers l'avant
      this.ordre.forEach((i) => {
        const n = noeuds[i], q = P[i];
        const e = this.eclosion(i);
        if (e <= 0) return;
        const prof = this.profondeur(q.z);
        const rayon = Math.max(1.2 * dpr, n.r * q.s * (this.apercu ? 1.15 : 1)) * e;
        const tailleImg = rayon * S / B;
        let alpha = 0.45 + 0.55 * prof;
        if (sel) alpha = sel.has(i) ? 1 : 0.12;
        if (this.eclats[i] > 0.02) {           // neurone qui s'allume
          g.globalCompositeOperation = palette.sombre ? 'lighter' : 'source-over';
          g.globalAlpha = Math.min(1, this.eclats[i]) * (sel && !sel.has(i) ? 0.2 : 0.9);
          const t2 = tailleImg * (1.3 + 0.5 * this.eclats[i]);
          g.drawImage(sprite(nuance(i), 'halo'), q.x - t2 / 2, q.y - t2 / 2, t2, t2);
          g.globalCompositeOperation = 'source-over';
        }
        g.globalAlpha = alpha;
        g.drawImage(sprite(nuance(i), n.t), q.x - tailleImg / 2, q.y - tailleImg / 2, tailleImg, tailleImg);
      });

      // 4. Noms sous les nœuds : les compétences seulement dans l'aperçu ; dans la vue agrandie,
      //    du plus important au moins important, en sautant ceux qui en chevaucheraient un autre
      g.textAlign = 'center';
      g.textBaseline = 'top';
      g.lineJoin = 'round';
      const RANG = { but: 0, notion: 1, projet: 2, outil: 2 };
      const candidats = this.ordre.filter((i) => {
        if (this.eclosion(i) < 1) return false;
        const n = noeuds[i];
        if (this.apercu) return n.t === 'but';
        if (sel) return sel.has(i);
        if (this.etiquettesReduites) return n.t === 'but' || n.t === 'notion';
        return true;
      }).sort((a, b) => RANG[noeuds[a].t] - RANG[noeuds[b].t] || P[b].z - P[a].z);
      const places = [];
      const marge = 2 * dpr;
      candidats.forEach((i) => {
        const n = noeuds[i], q = P[i];
        const prof = this.profondeur(q.z);
        const taille = (this.apercu ? 12.5 : POLICE[n.t] * Math.sqrt(this.zoom)) * dpr * (0.75 + 0.35 * prof);
        g.font = `${n.t === 'but' || n.t === 'notion' ? 700 : 400} ${taille.toFixed(1)}px "Atkinson Hyperlegible", Verdana, sans-serif`;
        const rayon = n.r * q.s * (this.apercu ? 1.15 : 1);
        const y = q.y + rayon + 2 * dpr;
        const l = g.measureText(n.nom).width;
        const boite = { x0: q.x - l / 2 - marge, x1: q.x + l / 2 + marge, y0: y - marge, y1: y + taille + marge };
        if (!sel && places.some((o) => boite.x0 < o.x1 && boite.x1 > o.x0 && boite.y0 < o.y1 && boite.y1 > o.y0)) return;
        places.push(boite);
        g.globalAlpha = sel ? 1 : (n.t === 'but' ? 1 : 0.55 + 0.45 * prof);
        g.strokeStyle = palette.carte;
        g.lineWidth = 3.5 * dpr;
        g.strokeText(n.nom, q.x, y);
        g.fillStyle = n.t === 'but' || n.t === 'notion' ? nuanceTexte(i) : palette.encre;
        g.fillText(n.nom, q.x, y);
      });
      g.globalAlpha = 1;
    }
    image(dt) {
      this.avancer(dt);
      if (!this.sale) return;
      this.sale = false;
      this.dessiner();
    }

    // Point sous le pointeur (le plus proche du spectateur en cas de chevauchement)
    pointSous(xEcran, yEcran) {
      const r = this.toile.getBoundingClientRect();
      const x = (xEcran - r.left) * this.dpr, y = (yEcran - r.top) * this.dpr;
      let meilleur = -1, zMeilleur = -Infinity;
      noeuds.forEach((n, i) => {
        const q = this.p[i];
        const rayon = n.r * q.s + 6 * this.dpr;
        if (Math.hypot(q.x - x, q.y - y) <= rayon && q.z > zMeilleur) { meilleur = i; zMeilleur = q.z; }
      });
      return meilleur;
    }
    zoomer(f) { this.zoom = Math.min(6, Math.max(0.5, this.zoom * f)); this.sale = true; }
    mettreEnEvidence(ensemble, liensActifs) {
      this.selection = ensemble; this.liensActifs = liensActifs;
      this.impulsions.length = 0; this.sale = true;
    }
  }

  // --- Boucle d'animation commune ---
  const vues = new Set();
  let precedent = 0;
  function boucle(instant) {
    const dt = precedent ? Math.min(64, instant - precedent) : 16;
    precedent = instant;
    vues.forEach((v) => v.image(dt));
    if (vues.size) requestAnimationFrame(boucle); else precedent = 0;
  }
  function animer(v) {
    v.sale = true;
    if (!vues.size) requestAnimationFrame(boucle);
    vues.add(v);
  }
  const suspendre = (v) => vues.delete(v);

  // --- Aperçu ---
  lirePalette();
  figure.classList.add('nuage-3d');
  const apercu = new Vue(figure.querySelector('.nuage-apercu'), true);
  const boutonPause = figure.querySelector('[data-nuage-pause]');
  new IntersectionObserver((entrees) => {
    if (entrees.some((e) => e.isIntersecting)) animer(apercu); else suspendre(apercu);
  }, { threshold: 0.05 }).observe(apercu.toile);
  if (RAPPEL) {
    boutonPause.hidden = false;
    boutonPause.addEventListener('click', () => {
      apercu.enPause = !apercu.enPause;
      boutonPause.setAttribute('aria-pressed', String(apercu.enPause));
      apercu.sale = true;
    });
  }
  // Thème changé : nouvelles couleurs
  new MutationObserver(() => {
    lirePalette();
    vues.forEach((v) => { v.sale = true; });
    apercu.sale = true;
    if (vue) vue.sale = true;
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // --- Vue agrandie ---
  let vue = null;
  let verrou = null;
  pucesDialogue.innerHTML = figure.querySelector('.nuage-puces').innerHTML;
  document.querySelectorAll('.nuage-puce').forEach((p) => { p.disabled = false; });
  document.querySelectorAll('button[data-nuage-ouvrir]').forEach((b) => { b.hidden = false; });
  const boutonEtiquettes = dialogue.querySelector('[data-nuage="etiquettes"]');
  const boutonPauseDialogue = dialogue.querySelector('[data-nuage="pause"]');
  if (!RAPPEL) boutonPauseDialogue.hidden = true;

  // Bouton ou geste « retour » du navigateur / du téléphone : il doit refermer la vue agrandie,
  // pas quitter la page. On ajoute donc une étape à l'historique à l'ouverture ; « retour » la retire
  // (popstate → fermeture), et toute autre fermeture (bouton, Échap, voile) la retire aussi.
  if (history.state?.nuage) history.replaceState(null, '');   // étape restée après un rechargement
  window.addEventListener('popstate', () => { if (dialogue.open) dialogue.close(); });

  function ouvrir(communaute) {
    dialogue.showModal();
    if (!history.state?.nuage) history.pushState({ nuage: true }, '');
    vue = new Vue(scene, false);
    vue.theta = apercu.theta;                  // on reprend l'angle de l'aperçu : continuité
    vue.enPause = apercu.enPause;
    boutonPauseDialogue.setAttribute('aria-pressed', String(vue.enPause));
    boutonEtiquettes.setAttribute('aria-pressed', 'true');
    animer(vue);
    if (communaute) filtrer(communaute); else effacer();
  }
  document.querySelectorAll('[data-nuage-ouvrir]').forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault();
    ouvrir();
  }));
  figure.querySelectorAll('.nuage-puce').forEach((p) => p.addEventListener('click', () => ouvrir(p.dataset.communaute)));
  dialogue.addEventListener('close', () => {
    if (history.state?.nuage) history.back();  // fermée autrement que par « retour » : on retire l'étape
    if (!vue) return;
    suspendre(vue);
    vue.detruire();
    vue = null;
    verrou = null;
  });
  let appuiSurVoile = false;    // clic sur le voile, autour du cadre (pas la fin d'un glisser)
  dialogue.addEventListener('pointerdown', (e) => { appuiSurVoile = e.target === dialogue; });
  dialogue.addEventListener('click', (e) => { if (appuiSurVoile && e.target === dialogue) dialogue.close(); });

  // Mise en évidence : un point et ses voisins, ou une communauté
  function effacer() {
    verrou = null;
    vue?.mettreEnEvidence(null, null);
    pucesDialogue.querySelectorAll('.nuage-puce').forEach((p) => p.setAttribute('aria-pressed', 'false'));
    info.textContent = infoDefaut;
  }
  function choisirPoint(i) {
    vue.mettreEnEvidence(new Set([i, ...voisins[i]]), new Set(liensDe[i]));
    const n = noeuds[i];
    const liste = [...voisins[i]].sort((a, b) => ORDRE_TYPES.indexOf(noeuds[a].t) - ORDRE_TYPES.indexOf(noeuds[b].t)
      || noeuds[a].nom.localeCompare(noeuds[b].nom, LOCALE));
    const nom = document.createElement('strong');
    nom.textContent = n.nom;
    const precision = n.t === 'but' ? TYPES.but : `${TYPES[n.t]}, ${nomsCommunautes.get(n.k)}`;
    info.replaceChildren(nom, ` (${precision}) — `
      + t(`${liste.length} lien${liste.length > 1 ? 's' : ''} : `, `${liste.length} link${liste.length > 1 ? 's' : ''}: `)
      + liste.map((v) => noeuds[v].nom).join(', '));
  }
  function filtrer(k) {
    const membres = new Set(noeuds.flatMap((n, i) => (n.k === k ? [i] : [])));
    const actifs = new Set(liens.flatMap((l, i) => (membres.has(l.a) && membres.has(l.b) ? [i] : [])));
    vue.mettreEnEvidence(membres, actifs);
    verrou = `communauté:${k}`;
    pucesDialogue.querySelectorAll('.nuage-puce').forEach((p) => p.setAttribute('aria-pressed', String(p.dataset.communaute === k)));
    const nom = document.createElement('strong');
    nom.textContent = nomsCommunautes.get(k);
    info.replaceChildren(nom, t(` : ${membres.size} éléments, `, `: ${membres.size} items, `)
      + [...membres].map((m) => noeuds[m].nom).sort((a, b) => a.localeCompare(b, LOCALE)).join(', '));
  }
  pucesDialogue.addEventListener('click', (e) => {
    const puce = e.target.closest('.nuage-puce');
    if (!puce || !vue) return;
    if (puce.getAttribute('aria-pressed') === 'true') effacer(); else filtrer(puce.dataset.communaute);
  });

  // Glisser = tourner (avec élan), pincer = zoomer, appui sans bouger = choisir un point
  const pointeurs = new Map();
  let parcours = 0, ecartPrecedent = 0;
  const ecart = () => { const [a, b] = [...pointeurs.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  scene.addEventListener('pointerdown', (e) => {
    if (!vue) return;
    scene.setPointerCapture(e.pointerId);
    pointeurs.set(e.pointerId, { x: e.clientX, y: e.clientY, t: e.timeStamp });
    if (pointeurs.size === 1) { parcours = 0; vue.vTheta = vue.vPhi = 0; }
    if (pointeurs.size === 2) ecartPrecedent = ecart();
    vue.glisse = true;
  });
  scene.addEventListener('pointermove', (e) => {
    if (!vue) return;
    const avant = pointeurs.get(e.pointerId);
    if (!avant) {                                   // simple survol à la souris
      if (e.pointerType === 'mouse' && !verrou) {
        const i = vue.pointSous(e.clientX, e.clientY);
        if (i >= 0) choisirPoint(i); else if (vue.selection) effacer();
      }
      return;
    }
    const dx = e.clientX - avant.x, dy = e.clientY - avant.y;
    const dt = Math.max(1, e.timeStamp - avant.t);
    pointeurs.set(e.pointerId, { x: e.clientX, y: e.clientY, t: e.timeStamp });
    parcours += Math.hypot(dx, dy);
    if (pointeurs.size === 1 && parcours > 6) {
      scene.classList.add('glisse');
      const k = 0.0085;
      vue.theta += dx * k;
      vue.phi = Math.max(-1.3, Math.min(1.3, vue.phi + dy * k));
      vue.vTheta = (dx * k) / dt * 0.8;
      vue.vPhi = (dy * k) / dt * 0.8;
      vue.sale = true;
    } else if (pointeurs.size === 2) {
      const nouvelEcart = ecart();
      if (ecartPrecedent > 0) vue.zoomer(nouvelEcart / ecartPrecedent);
      ecartPrecedent = nouvelEcart;
      parcours = Infinity;                          // un pincement n'est jamais un clic
    }
  });
  function relacher(e) {
    if (!pointeurs.delete(e.pointerId) || !vue) return;
    if (pointeurs.size) return;
    scene.classList.remove('glisse');
    vue.glisse = false;
    vue.repos = 2500;                               // la rotation automatique reprend un peu plus tard
    if (parcours <= 6 && e.type === 'pointerup') {
      const i = vue.pointSous(e.clientX, e.clientY);
      if (i >= 0 && verrou !== i) { verrou = i; choisirPoint(i); } else effacer();
    }
  }
  scene.addEventListener('pointerup', relacher);
  scene.addEventListener('pointercancel', relacher);
  scene.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !verrou && !pointeurs.size && vue?.selection) effacer(); });
  scene.addEventListener('wheel', (e) => {
    if (!vue) return;
    e.preventDefault();
    vue.zoomer(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015)));
  }, { passive: false });

  // Boutons et clavier
  const tourner = (dt, dp) => { vue.theta += dt; vue.phi = Math.max(-1.3, Math.min(1.3, vue.phi + dp)); vue.repos = 2500; vue.sale = true; };
  const actions = {
    plus: () => vue.zoomer(1.3),
    moins: () => vue.zoomer(1 / 1.3),
    recentrer: () => vue.recentrer(),
    tout: () => effacer(),
    pause: () => {
      vue.enPause = !vue.enPause;
      boutonPauseDialogue.setAttribute('aria-pressed', String(vue.enPause));
      vue.sale = true;
    },
    etiquettes: () => {
      vue.etiquettesReduites = !vue.etiquettesReduites;
      boutonEtiquettes.setAttribute('aria-pressed', String(!vue.etiquettesReduites));
      vue.sale = true;
    },
    fermer: () => dialogue.close(),
  };
  dialogue.querySelectorAll('[data-nuage]').forEach((b) => b.addEventListener('click', () => vue && actions[b.dataset.nuage]()));
  dialogue.addEventListener('keydown', (e) => {
    if (!vue || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === ' ' && e.target.closest('button')) return;   // la barre d'espace garde son rôle sur un bouton
    const touches = {
      '+': actions.plus, '=': actions.plus, '-': actions.moins, '0': actions.recentrer, ' ': actions.pause,
      ArrowLeft: () => tourner(-0.15, 0), ArrowRight: () => tourner(0.15, 0),
      ArrowUp: () => tourner(0, -0.12), ArrowDown: () => tourner(0, 0.12),
    };
    if (touches[e.key]) { e.preventDefault(); touches[e.key](); }
  });
})();

/* ---------- 11. Vignettes de compétences : rangées équilibrées et centrées ---------- */
// Pour chaque grille de vignettes (page Compétences, aperçu de l'accueil) : combien en tiennent sur
// une ligne ? On répartit ensuite les vignettes en rangées aussi égales que possible, les plus
// longues d'abord, chacune centrée dans la carte : 4 vignettes pour 3 places → 2 + 2 ;
// 3 pour 2 places → 2 + 1 ; 10 pour 4 places → 4 + 3 + 3.
// Grille en demi-colonnes (voir style.css) : la première vignette d'une rangée plus courte
// commence une demi-colonne plus loin par vignette manquante, ce qui centre la rangée.
// Toutes les vignettes d'une carte gardent la largeur qu'elles auraient sur une ligne pleine.
(() => {
  const grilles = document.querySelectorAll('.competences-grille');
  if (!grilles.length || !('ResizeObserver' in window)) return;
  const LARGEUR_MIN = 5.25;                    // rem : largeur minimale d'une vignette
  const APERCU_MAX = 56;                       // rem : largeur maximale de l'aperçu de l'accueil

  function equilibrer(grille) {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const parent = grille.parentElement;
    const styleParent = getComputedStyle(parent);
    let dispo = parent.clientWidth - parseFloat(styleParent.paddingLeft) - parseFloat(styleParent.paddingRight);
    if (grille.classList.contains('apercu-grille')) dispo = Math.min(dispo, APERCU_MAX * rem);
    const ecart = 0.6 * rem;                   // même valeur que « gap » dans style.css
    const vignettes = [...grille.children].filter((li) => getComputedStyle(li).display !== 'none');
    const n = vignettes.length;
    if (!n || dispo <= 0) return;

    const places = Math.max(1, Math.floor((dispo + ecart) / (LARGEUR_MIN * rem + ecart)));
    const tuile = Math.floor(((dispo - (places - 1) * ecart) / places) * 10) / 10;
    const rangees = Math.ceil(n / places);
    const base = Math.floor(n / rangees);
    const enPlus = n % rangees;               // les premières rangées ont une vignette de plus
    const parRangee = base + (enPlus ? 1 : 0);

    grille.style.setProperty('--tuile', `${tuile}px`);
    grille.style.setProperty('--colonnes', String(parRangee * 2));
    let i = 0;
    for (let r = 0; r < rangees; r++) {
      const k = base + (r < enPlus ? 1 : 0);
      vignettes.forEach((v, j) => {
        if (j >= i && j < i + k) v.style.gridColumnStart = j === i ? String(parRangee - k + 1) : '';
      });
      i += k;
    }
    grille.classList.add('equilibree');
  }

  const observateur = new ResizeObserver((entrees) => {
    entrees.forEach((e) => e.target.querySelectorAll(':scope > .competences-grille').forEach(equilibrer));
  });
  grilles.forEach((g) => {
    equilibrer(g);
    observateur.observe(g.parentElement);
  });
})();
