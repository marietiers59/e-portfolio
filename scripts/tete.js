/* =====================================================================
   tete.js — réglages posés AVANT l'affichage de la page
   ---------------------------------------------------------------------
   Chargé dans <head>, avant la feuille de styles et SANS defer :
   il doit agir avant le premier dessin de la page (pas d'éclair blanc
   en thème sombre, pas de saut de taille avec le zoom mémorisé).
   Chaque page choisit ce qu'elle active par des attributs de la balise :
     <script src="../scripts/tete.js?v=1"
             data-zoom data-apparition data-balayage="../index.html"></script>
   - (toujours)       thème clair ou sombre : choix mémorisé, sinon réglage de l'appareil ;
   - data-zoom        zoom mémorisé (scripts/zoom.js) ;
   - data-apparition  blocs cachés le temps que scripts/apparition.js prenne le relais ;
   - data-balayage    smartphone : actualiser ramène à l'accueil (adresse de l'accueil),
                      ou, sur l'accueil (valeur « accueil »), repart du haut de la page ;
                      arrivée animée après un balayage (scripts/balayage.js).
   ===================================================================== */
(() => {
  'use strict';

  const racine = document.documentElement;
  const reglages = document.currentScript ? document.currentScript.dataset : {};

  /** Lit le stockage du navigateur sans planter s'il est bloqué (navigation privée stricte, cookies refusés). */
  function lire(stockage, cle) {
    try {
      return stockage.getItem(cle);
    } catch {
      return null;                               // stockage inaccessible : on fait comme s'il était vide
    }
  }

  /* ---------- Thème clair ou sombre ---------- */
  // Ordre de priorité : choix fait sur le site (s'il n'a pas expiré), sinon thème calculé
  // d'après le lever et le coucher du soleil (s'il est encore valable), sinon réglage de l'appareil.
  function choixValable(theme) {
    return theme === 'clair' || theme === 'sombre';
  }

  function poserTheme() {
    let theme = null;
    const maintenant = Date.now();
    try {
      const jusqua = Number(localStorage.getItem('theme-jusqua'));
      if (jusqua && jusqua <= maintenant) {
        localStorage.removeItem('theme');        // choix expiré : on l'oublie
        localStorage.removeItem('theme-jusqua');
      }
      theme = localStorage.getItem('theme');
      if (!choixValable(theme) && Number(localStorage.getItem('theme-soleil-jusqua')) > maintenant) {
        theme = localStorage.getItem('theme-soleil');
      }
    } catch {
      theme = null;                              // stockage inaccessible : réglage de l'appareil
    }
    if (!choixValable(theme)) {
      const sombre = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      theme = sombre ? 'sombre' : 'clair';
    }
    racine.dataset.theme = theme;
  }

  /* ---------- Zoom mémorisé ---------- */
  // Mêmes paliers que scripts/zoom.js ; l'indice 2 (100 %) est la taille normale.
  const PALIERS = [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.5, 1.75, 2];
  const NORMAL = 2;
  const LARGEUR_MINI = 288;                      // largeur utile minimale de la page, en pixels CSS

  function poserZoom() {
    let indice = Number.parseInt(lire(localStorage, 'zoom-page'), 10) + NORMAL;
    if (!(indice >= 0 && indice < PALIERS.length) || indice === NORMAL) {
      return;
    }
    // Sur un écran étroit, on redescend jusqu'à un palier qui laisse au moins 288 px de page
    while (indice > NORMAL && window.innerWidth / PALIERS[indice] < LARGEUR_MINI) {
      indice -= 1;
    }
    if (indice !== NORMAL) {
      racine.style.setProperty('--zoom-page', String(PALIERS[indice]));
    }
  }

  /* ---------- Attente de l'apparition au défilement ---------- */
  const ATTENTE_MAXI = 3000;                     // filet de sécurité si apparition.js ne se charge pas

  function attendreApparition() {
    if (!racine.animate) {
      return;                                    // navigateur sans animations : tout reste visible
    }
    racine.classList.add('apparition-attente');
    setTimeout(() => {
      racine.classList.remove('apparition-attente');
    }, ATTENTE_MAXI);
  }

  /* ---------- Smartphone : actualisation et arrivée après un balayage ---------- */
  const SMARTPHONE = '(pointer: coarse) and (max-width: 47.99rem), (pointer: coarse) and (max-height: 30rem)';

  function preparerBalayage(accueil) {
    if (!window.matchMedia?.(SMARTPHONE).matches) {
      return;
    }
    try {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation?.type === 'reload') {
        if (accueil === 'accueil') {
          history.scrollRestoration = 'manual';  // sur l'accueil : on repart du haut
        } else {
          location.replace(accueil);             // ailleurs : retour à l'accueil
          return;
        }
      }
      const arrivee = sessionStorage.getItem('balayage');
      if (arrivee) {
        sessionStorage.removeItem('balayage');
        racine.dataset.arrivee = arrivee;        // sens de l'animation d'arrivée
      }
    } catch {
      // stockage ou API de navigation indisponibles : la page s'affiche simplement sans animation
    }
  }

  poserTheme();
  if ('zoom' in reglages) {
    try {
      poserZoom();
    } catch {
      // en cas de souci, la page garde simplement sa taille normale
    }
  }
  if ('apparition' in reglages) {
    attendreApparition();
  }
  if (reglages.balayage) {
    preparerBalayage(reglages.balayage);
  }
})();
