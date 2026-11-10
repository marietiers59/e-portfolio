/*
  Carte de la zone de recherche de stage, au survol (ou au focus, ou au toucher) de « Lille, Lens, Douai, Arras »
  dans le pied de page — même principe que le calendrier de la date de stage.

  · Souris : apparaît au survol ; on peut passer sur la carte sans qu'elle se ferme.
  · Clavier : le lieu reçoit le focus (Tab) ; la carte s'ouvre, Échap la ferme (RGAA 10.13).
  · Écran tactile : un appui ouvre ou ferme la carte ; un appui ailleurs la ferme.
  · La légende décrit la zone en mots (alternative à l'image, reliée au lieu par aria-describedby).
  · Images : medias/zone-recherche-clair.webp et -sombre.webp (fond © contributeurs OpenStreetMap),
    fabriquées par outils/carte-zone/composer.py.
*/
(() => {
  const lieu = document.querySelector('[data-carte-zone]');
  if (!lieu) return;
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
  lieu.setAttribute('aria-describedby', 'carte-zone-legende');
  lieu.setAttribute('aria-controls', 'carte-zone');
  lieu.setAttribute('aria-expanded', 'false');

  function placer() {
    const r = lieu.getBoundingClientRect();
    const largeur = bulle.offsetWidth, hauteur = bulle.offsetHeight;
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const marge = 56;                                   // place des barres fixes Menu / Contact
    const caler = (y) => Math.max(marge, Math.min(y, vh - hauteur - marge));
    let x, y, cote;
    if (vw - r.right >= largeur + 24) {                 // grand écran : à droite du lieu, centrée sur lui
      cote = 'droite';
      x = r.right + 12;
      y = caler(r.top + r.height / 2 - hauteur / 2);
    } else {                                            // sinon : au-dessus ou au-dessous, du côté le plus dégagé
      cote = r.top > vh - r.bottom ? 'dessus' : 'dessous';
      x = Math.max(8, Math.min(r.left + r.width / 2 - largeur / 2, vw - largeur - 8));
      y = caler(cote === 'dessus' ? r.top - hauteur - 10 : r.bottom + 10);
    }
    bulle.dataset.cote = cote;
    bulle.style.left = `${x + window.scrollX}px`;
    bulle.style.top = `${y + window.scrollY}px`;
  }
  let minuteur, ouverteA = 0;
  function montrer() {
    clearTimeout(minuteur);
    if (!bulle.hidden) return;
    ouverteA = performance.now();
    bulle.hidden = false;
    lieu.setAttribute('aria-expanded', 'true');
    placer();
  }
  function cacher() {
    clearTimeout(minuteur);
    bulle.hidden = true;
    lieu.setAttribute('aria-expanded', 'false');
  }
  const cacherBientot = () => { clearTimeout(minuteur); minuteur = setTimeout(cacher, 250); };

  lieu.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') montrer(); });
  lieu.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') cacherBientot(); });
  bulle.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') clearTimeout(minuteur); });
  bulle.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') cacherBientot(); });
  lieu.addEventListener('focus', montrer);
  lieu.addEventListener('blur', () => { if (!bulle.matches(':hover')) cacherBientot(); });
  lieu.addEventListener('click', (e) => {               // toucher (et clic) : ouvre ou ferme
    e.preventDefault();
    if (bulle.hidden) montrer();
    else if (performance.now() - ouverteA > 400) cacher();   // pas juste après l'ouverture par le focus ou le survol
  });
  lieu.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (bulle.hidden) montrer(); else cacher(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !bulle.hidden) cacher(); });
  document.addEventListener('pointerdown', (e) => {
    if (!bulle.hidden && !bulle.contains(e.target) && !lieu.contains(e.target)) cacher();
  });
  window.addEventListener('resize', () => { if (!bulle.hidden) placer(); });
})();
