/*
  Carte de la zone de recherche de stage, au survol (ou au focus, ou au toucher) de « Lille, Lens, Douai, Arras »
  dans le pied de page, et de « Lille, Lens, Douai et Arras » dans la vignette « Mobile » de la bannière
  — même principe que le calendrier de la date de stage.

  · Souris : apparaît au survol ; on peut passer sur la carte sans qu'elle se ferme.
  · Clavier : le lieu reçoit le focus (Tab) ; la carte s'ouvre, Échap la ferme (RGAA 10.13).
  · Écran tactile : un appui ouvre ou ferme la carte ; un appui ailleurs la ferme.
  · La légende décrit la zone en mots (alternative à l'image, reliée au lieu par aria-describedby).
  · Images : medias/zone-recherche-clair.webp et -sombre.webp (fond © contributeurs OpenStreetMap),
    fabriquées par outils/carte-zone/composer.py.
*/
(() => {
  // Plusieurs déclencheurs possibles (bannière « Mobile » et pied de page) : une seule carte, partagée
  const lieux = [...document.querySelectorAll('[data-carte-zone]')];
  if (!lieux.length) return;
  let lieu = lieux[0];                                  // déclencheur actif
  const ceScript = document.currentScript || document.querySelector('script[src*="carte-zone.js"]');
  const racine = new URL('../', ceScript.src);
  const anglais = document.documentElement.lang.toLowerCase().startsWith('en');
  const t = (fr, en) => (anglais ? en : fr);

  const bulle = document.createElement('figure');
  bulle.className = 'carte-zone';
  bulle.id = 'carte-zone';
  bulle.hidden = true;
  const alt = t('Carte de la zone où je recherche un stage', 'Map of the area where I am looking for an internship');
  bulle.innerHTML = `
    <img class="carte-zone-clair" src="${new URL('medias/zone-recherche-clair.webp', racine)}" width="640" height="734" alt="${alt}" loading="lazy" decoding="async">
    <img class="carte-zone-sombre" src="${new URL('medias/zone-recherche-sombre.webp', racine)}" width="640" height="734" alt="${alt}" loading="lazy" decoding="async">
    <figcaption id="carte-zone-legende">${t(
      '<strong>Zone de recherche de stage</strong> : la métropole lilloise (métro, tram et bus Ilévia, autoroute A1), Lens-Liévin, Arras, Douai et les alentours de Libercourt. Les limites restent souples.',
      '<strong>Internship search area</strong>: the Lille metropolitan area (Ilévia metro, tram and buses, A1 motorway), Lens-Liévin, Arras, Douai and the area around Libercourt. The boundaries are flexible.'
    )} <span class="carte-zone-source">${t('Fond de carte', 'Base map')} © <a href="https://www.openstreetmap.org/copyright" hreflang="en">${t('contributeurs OpenStreetMap', 'OpenStreetMap contributors')}</a></span></figcaption>`;
  document.body.append(bulle);
  lieux.forEach((el) => {
    el.setAttribute('aria-describedby', 'carte-zone-legende');
    el.setAttribute('aria-controls', 'carte-zone');
    el.setAttribute('aria-expanded', 'false');
  });

  // La carte doit tenir d'un côté du lieu sans le recouvrir (petits écrans : elle est plus haute que la place libre).
  // · Toucher, clavier : la page défile pour laisser la place sous le lieu.
  // · Souris : la page ne bouge pas (le pointeur quitterait le lieu) ; la carte se réduit à la place libre.
  function faireDeLaPlace(souris) {
    const marge = 56, vh = window.innerHeight;
    bulle.style.width = '';
    const libre = () => {
      const r = lieu.getBoundingClientRect();
      return Math.max(r.top - marge - 16, vh - marge - r.bottom - 16);
    };
    if (bulle.offsetHeight <= libre()) return;
    if (!souris) {
      const r = lieu.getBoundingClientRect();
      window.scrollBy({ top: r.top - marge - 8, behavior: 'instant' });   // lieu en haut, carte dessous
      if (bulle.offsetHeight <= libre()) return;
    }
    for (let i = 0; i < 3 && bulle.offsetHeight > libre(); i++) {           // la légende se réagence : on affine
      bulle.style.width = `${Math.max(200, Math.floor(bulle.offsetWidth * libre() / bulle.offsetHeight))}px`;
    }
  }

  function placer() {
    const r = lieu.getBoundingClientRect();
    const largeur = bulle.offsetWidth, hauteur = bulle.offsetHeight;
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const marge = 56;                                   // place des barres fixes Menu / Contact
    const caler = (y) => Math.max(marge, Math.min(y, vh - hauteur - marge));
    let x, y, cote;
    if (vw - r.right >= largeur + 30) {                 // grand écran : à droite du lieu, centrée sur lui
      cote = 'droite';
      x = r.right + 18;
      y = caler(r.top + r.height / 2 - hauteur / 2);
    } else {                                            // sinon : au-dessus ou au-dessous, du côté le plus dégagé
      cote = r.top > vh - r.bottom ? 'dessus' : 'dessous';
      x = Math.max(8, Math.min(r.left + r.width / 2 - largeur / 2, vw - largeur - 8));
      y = caler(cote === 'dessus' ? r.top - hauteur - 16 : r.bottom + 16);
    }
    // Queue de la bulle, pointée vers l'icône de localisation (même dessin que le menu « CV »)
    const i = (lieu.parentElement.querySelector('.coordonnees-icone') || lieu).getBoundingClientRect();
    if (cote === 'droite') bulle.style.setProperty('--queue-y', `${Math.max(18, Math.min(i.top + i.height / 2 - y, hauteur - 18))}px`);
    else bulle.style.setProperty('--queue-x', `${Math.max(18, Math.min(i.left + i.width / 2 - x, largeur - 18))}px`);
    bulle.dataset.cote = cote;
    bulle.style.left = `${x + window.scrollX}px`;
    bulle.style.top = `${y + window.scrollY}px`;
  }
  let minuteur, ouverteA = 0;
  function montrer(el = lieu, souris = false) {
    clearTimeout(minuteur);
    if (el !== lieu) {                                  // autre déclencheur : la carte le rejoint
      lieu.setAttribute('aria-expanded', 'false');
      lieu = el;
      if (!bulle.hidden) { lieu.setAttribute('aria-expanded', 'true'); faireDeLaPlace(souris); placer(); return; }
    }
    if (!bulle.hidden) return;
    ouverteA = performance.now();
    bulle.hidden = false;
    lieu.setAttribute('aria-expanded', 'true');
    faireDeLaPlace(souris);
    placer();
  }
  function cacher() {
    clearTimeout(minuteur);
    bulle.hidden = true;
    lieu.setAttribute('aria-expanded', 'false');
  }
  const cacherBientot = () => { clearTimeout(minuteur); minuteur = setTimeout(cacher, 250); };

  // Dernier type de pointeur utilisé : un toucher donne aussi le focus (et l'état :hover) au lieu
  let dernierPointeur = 'mouse';
  document.addEventListener('pointerdown', (e) => { dernierPointeur = e.pointerType; }, true);
  lieux.forEach((el) => {
    el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') montrer(el, true); });
    el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') cacherBientot(); });
    el.addEventListener('focus', () => montrer(el, dernierPointeur === 'mouse' && el.matches(':hover')));
    el.addEventListener('blur', () => { if (!bulle.matches(':hover')) cacherBientot(); });
    el.addEventListener('click', (e) => {               // toucher (et clic) : ouvre ou ferme
      e.preventDefault();
      if (bulle.hidden || el !== lieu) montrer(el);
      else if (performance.now() - ouverteA > 400) cacher();   // pas juste après l'ouverture par le focus ou le survol
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (bulle.hidden || el !== lieu) montrer(el); else cacher(); }
    });
  });
  bulle.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') clearTimeout(minuteur); });
  bulle.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') cacherBientot(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !bulle.hidden) cacher(); });
  document.addEventListener('pointerdown', (e) => {
    if (!bulle.hidden && !bulle.contains(e.target) && !lieux.some((el) => el.contains(e.target))) cacher();
  });
  window.addEventListener('resize', () => { if (!bulle.hidden) placer(); });
})();
