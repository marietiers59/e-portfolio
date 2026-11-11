/* =====================================================================
   Bascule de zoom (barre du bas, à gauche) : loupe « − » ⇄ loupe « + »
   ---------------------------------------------------------------------
   Comme un interrupteur à bascule monté sur ressort : on appuie d'un
   côté, la crête (la barre centrale) file au bout du plateau, la page
   change d'un cran, et la crête revient toute seule au milieu. Un clic
   sur la crête ramène au zoom 0, la taille réelle.

   – Le zoom agrandit la taille de base (rem) : textes, marges, cartes
     et barres grandissent ensemble, comme avec le zoom du navigateur.
   – Niveau mémorisé sur l'appareil (localStorage, clé « zoom-page ») et
     appliqué dès la tête de page (petit script en ligne), donc sans
     clignotement d'une page à l'autre.
   – Plafond selon la largeur de l'écran : la page garde toujours au moins
     18 rem « virtuels » de large, donc jamais de défilement horizontal.
   – Maintenir « − » ou « + » appuyé répète le cran.
   ===================================================================== */
(() => {
  'use strict';

  const racine = document.documentElement;
  const bloc = document.querySelector('.zoom');
  if (!bloc) return;

  const anglais = racine.lang.startsWith('en');
  const t = (fr, en) => (anglais ? en : fr);

  // Niveaux : l'indice 2 est le zoom 0 (100 %). Les mêmes valeurs figurent dans le script en tête de page.
  const FACTEURS = [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.5, 1.75, 2];
  const ZERO = 2;
  const LARGEUR_MIN = 288;        // px « virtuels » minimum (18 rem) : au-delà, la page déborderait
  const CLE = 'zoom-page';
  const REPETITION_DEPART = 450;  // ms avant que l'appui maintenu ne répète
  const REPETITION = 260;         // ms entre deux crans répétés
  const APPUI_MIN = 170;          // ms : même un clic bref laisse la crête arriver au bout

  const moins = bloc.querySelector('.zoom-moins');
  const plus = bloc.querySelector('.zoom-plus');
  const crete = bloc.querySelector('.zoom-crete');
  const annonce = bloc.querySelector('.zoom-annonce');

  const lire = () => {
    let n = NaN;
    try { n = parseInt(localStorage.getItem(CLE), 10); } catch { /* stockage indisponible */ }
    return Number.isInteger(n) ? Math.min(FACTEURS.length - 1, Math.max(0, n + ZERO)) : ZERO;
  };
  const ecrire = (i) => {
    try { if (i === ZERO) localStorage.removeItem(CLE); else localStorage.setItem(CLE, String(i - ZERO)); } catch { /* idem */ }
  };

  // Plus grand niveau permis par la largeur de l'écran (largeur de la fenêtre, indépendante du zoom).
  const plafond = () => {
    let i = FACTEURS.length - 1;
    while (i > ZERO && innerWidth / FACTEURS[i] < LARGEUR_MIN) i--;
    return i;
  };

  let voulu = lire();             // le niveau choisi (mémorisé tel quel)
  let applique = ZERO;            // le niveau effectivement affiché (voulu, borné par le plafond)

  const pourcent = (i) => {
    const p = Math.round(FACTEURS[i] * 100);
    return anglais ? `${p}%` : `${p} %`;
  };

  /* ----- Appliquer un niveau, en gardant sous les yeux ce qu'on regardait ----- */
  const appliquer = (annoncer) => {
    const cible = Math.min(voulu, plafond());
    if (cible !== applique) {
      // Repère : l'élément au centre de l'écran reste au centre après le changement de taille.
      const x = innerWidth / 2, y = innerHeight / 2;
      const repere = document.elementFromPoint(x, y);
      const avant = repere?.getBoundingClientRect();
      const proportion = avant && avant.height ? (y - avant.top) / avant.height : 0;
      if (cible === ZERO) racine.style.removeProperty('--zoom-page');
      else racine.style.setProperty('--zoom-page', String(FACTEURS[cible]));
      applique = cible;
      if (repere && avant && scrollY > 0) {
        const apres = repere.getBoundingClientRect();
        window.scrollBy({ top: apres.top + proportion * apres.height - y, behavior: 'instant' });
      }
    }
    // État des boutons et des bulles
    const max = plafond();
    moins.setAttribute('aria-disabled', String(applique <= 0));
    plus.setAttribute('aria-disabled', String(applique >= max));
    bloc.classList.toggle('zoom-modifie', applique !== ZERO);
    const niveau = pourcent(applique);
    crete.dataset.infobulle = t(`Taille réelle (actuellement ${niveau})`, `Actual size (now ${niveau})`);
    crete.setAttribute('aria-label', t(`Taille réelle, zoom actuel ${niveau}`, `Actual size, current zoom ${niveau}`));
    if (annoncer) annoncerNiveau();
  };

  // Lecteur d'écran : « Zoom 120 % », avec la limite atteinte s'il y a lieu.
  const annoncerNiveau = () => {
    const max = plafond();
    let limite = '';
    if (applique >= max) limite = max < FACTEURS.length - 1 ? t(' (maximum pour cet écran)', ' (maximum for this screen)') : t(' (maximum)', ' (maximum)');
    else if (applique <= 0) limite = t(' (minimum)', ' (minimum)');
    annonce.textContent = '';
    requestAnimationFrame(() => { annonce.textContent = `Zoom ${pourcent(applique)}${limite}`; });
    montrerNiveau();
  };

  // La bulle de la crête affiche le niveau un instant après chaque cran.
  let minuterieBulle = 0;
  const montrerNiveau = () => {
    bloc.classList.add('zoom-montre');
    clearTimeout(minuterieBulle);
    minuterieBulle = setTimeout(() => bloc.classList.remove('zoom-montre'), 1400);
  };

  const cran = (pas) => {
    const max = plafond();
    const depart = Math.min(voulu, max);
    const suivant = Math.min(max, Math.max(0, depart + pas));
    if (suivant === depart) { annoncerNiveau(); return false; }
    voulu = suivant;
    ecrire(voulu);
    appliquer(true);
    return true;
  };

  const remettreAZero = () => {
    voulu = ZERO;
    ecrire(ZERO);
    appliquer(true);
    crete.classList.remove('zoom-pulse');
    void crete.offsetWidth;                      // relance l'animation même si on clique deux fois
    crete.classList.add('zoom-pulse');
  };

  /* ----- La bascule : la crête file du côté appuyé, revient au milieu en ressort ----- */
  let debutAppui = 0, minuterieRelache = 0;
  const pencher = (pas) => {
    clearTimeout(minuterieRelache);
    bloc.dataset.appui = pas < 0 ? 'moins' : 'plus';
    debutAppui = performance.now();
  };
  const relacher = () => {                         // au moins APPUI_MIN au bout, puis le ressort
    clearTimeout(minuterieRelache);
    const reste = APPUI_MIN - (performance.now() - debutAppui);
    minuterieRelache = setTimeout(() => { delete bloc.dataset.appui; }, Math.max(0, reste));
  };
  crete.addEventListener('animationend', () => crete.classList.remove('zoom-pulse'));

  [[moins, -1], [plus, 1]].forEach(([bouton, pas]) => {
    let attente = 0, repetition = 0, aRepete = false, appuiPointeur = false;
    const arreter = () => {
      clearTimeout(attente); clearInterval(repetition);
      if (appuiPointeur) relacher();
      appuiPointeur = false;
    };
    bouton.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      appuiPointeur = true; aRepete = false;
      pencher(pas);
      attente = setTimeout(() => {
        aRepete = true;
        cran(pas);
        repetition = setInterval(() => { if (!cran(pas)) clearInterval(repetition); }, REPETITION);
      }, REPETITION_DEPART);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => bouton.addEventListener(type, arreter));
    bouton.addEventListener('click', (e) => {
      if (aRepete) { aRepete = false; return; }   // l'appui maintenu a déjà fait son travail
      cran(pas);
      if (e.detail === 0) { pencher(pas); relacher(); }   // clavier : même aller-retour de la crête
    });
    bouton.addEventListener('contextmenu', (e) => e.preventDefault());   // appui long sur écran tactile
  });
  crete.addEventListener('click', remettreAZero);

  /* ----- Démarrage et suivi ----- */
  applique = (() => {                              // ce que le script en tête de page a déjà appliqué
    const f = parseFloat(racine.style.getPropertyValue('--zoom-page'));
    const i = FACTEURS.indexOf(f);
    return i >= 0 ? i : ZERO;
  })();
  appliquer(false);
  bloc.hidden = false;

  let minuterieTaille = 0;
  addEventListener('resize', () => { clearTimeout(minuterieTaille); minuterieTaille = setTimeout(() => appliquer(false), 150); });
  // Même réglage dans un autre onglet du site : on suit.
  addEventListener('storage', (e) => { if (e.key === CLE || e.key === null) { voulu = lire(); appliquer(false); } });
  // Retour par le bouton Précédent (page restaurée depuis le cache) : le niveau a pu changer ailleurs.
  addEventListener('pageshow', (e) => { if (e.persisted) { voulu = lire(); appliquer(false); } });
})();
