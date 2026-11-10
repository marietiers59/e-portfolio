/*
  Smartphone : balayage gauche / droite entre les pages du menu, en boucle.
  Accueil → Projets → Compétences → CV vidéo → Accueil… (et l'inverse en balayant vers la droite).

  · Seulement sur smartphone (écran tactile étroit, ou téléphone tenu en paysage) :
    ordinateur et tablette ne changent pas.
  · Le menu reste le moyen principal de navigation ; le balayage est un raccourci (RGAA 13.10).
  · Pas de balayage quand le geste part d'un champ de formulaire, d'un tableau qui défile en largeur,
    du nuage de compétences, d'une vue agrandie, ou des bords de l'écran (gestes du navigateur).
  · Avec « animations réduites », la page change sans glissement.
  · Zoom à deux doigts toujours possible : un pincement n'est jamais pris pour un balayage,
    et une page agrandie se parcourt au doigt sans changer de page.
  · Arrivée animée et retour à l'accueil quand on actualise : petit script en tête de chaque page.
*/
(() => {
  const TELEPHONE = '(pointer: coarse) and (max-width: 47.99rem), (pointer: coarse) and (max-height: 30rem)';
  const telephone = window.matchMedia(TELEPHONE);
  const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)');

  const anglais = document.documentElement.lang.toLowerCase().startsWith('en');
  const PAGES = anglais
    ? [['en/index.html', 'Home'], ['en/projects.html', 'Projects'], ['en/skills.html', 'Skills'], ['en/video-cv.html', 'Video CV']]
    : [['index.html', 'Accueil'], ['pages/projets.html', 'Projets'], ['pages/competences.html', 'Compétences'], ['pages/cv-video.html', 'CV vidéo']];

  // Racine du site, déduite de l'adresse de ce script (…/scripts/balayage.js)
  const ceScript = document.currentScript || document.querySelector('script[src*="balayage.js"]');
  if (!ceScript) return;
  const racine = new URL('../', ceScript.src);
  const adresse = (i) => new URL(PAGES[i][0], racine).href;

  // Page actuelle dans la boucle ? (« …/e-portfolio/ » et « …/en/ » valent index.html)
  let chemin = location.pathname;
  if (chemin.endsWith('/')) chemin += 'index.html';
  const courante = PAGES.findIndex(([p]) => new URL(p, racine).pathname === chemin);
  if (courante < 0) return;                             // Accessibilité, Espace personnel… : pas de balayage
  const voisine = (sens) => (courante + sens + PAGES.length) % PAGES.length;

  /* ----- Points de position dans la barre du bas, et indices sur les côtés ----- */
  let points = null, indices = null;
  function installer() {
    if (points) return;
    const barre = document.querySelector('.barre-bas');
    if (barre) {
      points = document.createElement('span');
      points.className = 'balayage-points';
      points.setAttribute('aria-hidden', 'true');       // repère visuel : le menu donne déjà la navigation
      PAGES.forEach((_, i) => {
        const p = document.createElement('span');
        if (i === courante) p.className = 'actif';
        points.append(p);
      });
      barre.prepend(points);
    }
    indices = [-1, 1].map((sens) => {
      const el = document.createElement('div');
      el.className = `balayage-indice balayage-indice-${sens < 0 ? 'gauche' : 'droite'}`;
      el.setAttribute('aria-hidden', 'true');
      el.textContent = sens < 0 ? `‹ ${PAGES[voisine(-1)][1]}` : `${PAGES[voisine(1)][1]} ›`;
      document.body.append(el);
      return el;
    });
    // Pages voisines préchargées : le changement est quasi instantané
    [-1, 1].forEach((sens) => {
      const lien = document.createElement('link');
      lien.rel = 'prefetch';
      lien.href = adresse(voisine(sens));
      document.head.append(lien);
    });
  }
  function retirer() {
    points?.remove(); points = null;
    indices?.forEach((el) => el.remove()); indices = null;
  }
  if (telephone.matches) installer();
  telephone.addEventListener('change', () => (telephone.matches ? installer() : retirer()));

  /* ----- Suivi du doigt ----- */
  // L'en-tête (logo, menu, notice « Recruteur ? ») et les barres fixes ne bougent pas : seul le contenu glisse
  const mobiles = () => [...document.querySelectorAll('body > header > :not(.entete-nav, .notice-recruteur), body > main, body > footer')];
  const EXCLUS = 'input, textarea, select, button, canvas, dialog, .nuage, .tableau-defilant, .calendrier, [data-pas-de-balayage]';
  let x0 = 0, y0 = 0, t0 = 0, dx = 0, etat = null;     // etat : null | 'attente' | 'horizontal'

  function defileEnLargeur(el) {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      if (n.scrollWidth > n.clientWidth + 2 && /(auto|scroll)/.test(getComputedStyle(n).overflowX)) return true;
    }
    return false;
  }

  function suivre(decalage, transition) {
    const largeur = window.innerWidth;
    mobiles().forEach((el) => {
      el.style.transition = transition || 'none';
      el.style.transform = decalage ? `translateX(${decalage}px)` : '';
      el.style.opacity = decalage ? String(1 - Math.min(0.5, Math.abs(decalage) / largeur)) : '';
    });
    if (indices) {
      const [g, d] = indices;
      const force = Math.min(1, Math.abs(decalage) / (largeur * 0.3));
      g.style.transition = d.style.transition = transition || 'none';
      g.style.opacity = decalage > 0 ? String(force) : '0';
      d.style.opacity = decalage < 0 ? String(force) : '0';
      g.style.transform = `translateX(${decalage > 0 ? -100 + 100 * force : -100}%)`;
      d.style.transform = `translateX(${decalage < 0 ? 100 - 100 * force : 100}%)`;
    }
  }

  function partir(sens) {
    const cible = adresse(voisine(sens));
    try { sessionStorage.setItem('balayage', sens > 0 ? 'droite' : 'gauche'); } catch { /* stockage bloqué : arrivée sans glissement */ }
    if (mouvementReduit.matches) { location.href = cible; return; }
    suivre(-sens * window.innerWidth, 'transform 200ms ease-in, opacity 200ms ease-in');
    setTimeout(() => { location.href = cible; }, 190);
  }

  // Page agrandie au pincement : le doigt sert à se déplacer dans la page, pas à changer de page
  const pageAgrandie = () => (window.visualViewport ? window.visualViewport.scale > 1.01 : false);

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {                         // deuxième doigt : c'est un pincement (zoom), on laisse faire
      if (etat === 'horizontal') suivre(0, 'transform 180ms ease-out');
      etat = null;
      return;
    }
    etat = null;
    if (!telephone.matches || pageAgrandie()) return;
    if (document.querySelector('dialog[open]')) return;
    const t = e.touches[0];
    if (t.clientX < 18 || t.clientX > window.innerWidth - 18) return;
    if (e.target.closest(EXCLUS) || defileEnLargeur(e.target)) return;
    x0 = t.clientX; y0 = t.clientY; t0 = performance.now(); dx = 0;
    etat = 'attente';
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!etat) return;
    if (e.touches.length > 1) {                         // pincement commencé en cours de geste : annulé
      if (etat === 'horizontal') suivre(0, 'transform 180ms ease-out');
      etat = null;
      return;
    }
    const t = e.touches[0];
    const ddx = t.clientX - x0, ddy = t.clientY - y0;
    if (etat === 'attente') {
      if (Math.hypot(ddx, ddy) < 10) return;
      if (Math.abs(ddx) > Math.abs(ddy) * 1.3) etat = 'horizontal';
      else { etat = null; return; }                     // geste vertical : défilement normal
    }
    e.preventDefault();
    dx = ddx;
    suivre(mouvementReduit.matches ? 0 : dx);
  }, { passive: false });

  function finir() {
    if (etat !== 'horizontal') { etat = null; return; }
    etat = null;
    const vitesse = Math.abs(dx) / Math.max(1, performance.now() - t0);
    if (Math.abs(dx) > window.innerWidth * 0.28 || (Math.abs(dx) > 40 && vitesse > 0.5)) partir(dx < 0 ? 1 : -1);
    else suivre(0, 'transform 180ms ease-out, opacity 180ms ease-out');
  }
  document.addEventListener('touchend', finir);
  document.addEventListener('touchcancel', () => { if (etat === 'horizontal') suivre(0, 'transform 180ms ease-out'); etat = null; });

  // Retour par l'historique (cache du navigateur) : la page revient en place
  window.addEventListener('pageshow', (e) => { if (e.persisted) suivre(0); });
})();
