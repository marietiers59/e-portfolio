/* =========================================================
   Mon univers (#173, #174) — maison de poupée en 3D CSS
   · Inclinaison : suit la souris sur la scène ; sinon léger balancement (bouton « pause » pour l'arrêter).
   · Zoom « caméra » sur une pièce (écrans ≥ 40em) ; sur téléphone, la pièce vient en haut de l'écran
     et son cartel monte du bas.
   · Cartel : texte recopié depuis .piece-texte ; pastilles d'objets ⇄ liste du cartel.
   · Jeu des indices : 14 détails trahissent la maquette (trouvés gardés le temps de l'onglet).
   · Mouvement réduit : ni balancement ni suivi de la souris, changements de vue instantanés.
   · Grenier sous le toit, trois étages de 3 pièces, salle commune sur tout le rez-de-chaussée (11 pièces).
   · Carte de mes voyages (#179) : SVG chargé à la première ouverture, puis affiché dans un dialogue.
   ========================================================= */
'use strict';

(() => {
  const racine = document.querySelector('[data-univers]');
  if (!racine) return;

  const anglais = document.documentElement.lang.toLowerCase().startsWith('en');
  const t = (fr, en) => (anglais ? en : fr);

  const scene = racine.querySelector('.univers-scene');
  const maison = racine.querySelector('.maison');
  const pieces = [...maison.querySelectorAll('.piece')];
  const cartel = racine.querySelector('.cartel');
  const contenu = cartel.querySelector('.cartel-contenu');
  const position = cartel.querySelector('.cartel-position');
  const message = racine.querySelector('.univers-message');
  const indices = [...maison.querySelectorAll('.indice')];
  const compteur = racine.querySelector('[data-trouves]');

  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)');
  const large = window.matchMedia('(min-width: 40em)');

  /* ----- Images des pièces : data-image="../medias/univers/atelier.webp" ----- */
  pieces.forEach((li) => {
    const src = li.dataset.image;
    if (!src) return;
    li.style.setProperty('--image', `url("${src}")`);
    li.setAttribute('data-avec-image', '');
  });

  /* ----- Géométrie ----- */
  /** Position du coin haut gauche d'un élément dans le repère (non transformé) d'un ancêtre. */
  function decalage(el, ancetre) {
    let x = 0, y = 0;
    while (el && el !== ancetre) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    return { x, y };
  }
  function mesurer() {
    const largeur = maison.querySelector('.maison-pieces .piece').offsetWidth;   // une pièce d'étage (le grenier est plus large)
    maison.style.setProperty('--p', `${(largeur * 0.32).toFixed(1)}px`);
    const grenier = maison.querySelector('.piece-grenier');           // grenier bas de plafond : moins profond
    if (grenier) grenier.style.setProperty('--p', `${Math.min(largeur * 0.32, grenier.offsetHeight * 0.45).toFixed(1)}px`);
  }

  /* ----- État de la caméra : valeurs visées et valeurs affichées (rapprochées à chaque image) ----- */
  const REPOS_X = 6;
  const cible = { rx: REPOS_X, ry: 0, zoom: 1, dx: 0, dy: 0, ox: 0, oy: 0 };
  const vue = { ...cible };
  let ouverte = -1;
  let pause = false;
  let pointeur = null;              // position de la souris sur la scène, de -1 à 1
  let visible = true;
  let idImage = null;
  let derniere = 0;

  function viser(i) {
    if (i < 0 || !large.matches) { Object.assign(cible, { zoom: 1, dx: 0, dy: 0, ox: 0, oy: 0 }); return; }
    const li = pieces[i];
    const L = maison.offsetWidth, H = maison.offsetHeight;
    const coin = decalage(li, maison);
    const cx = coin.x + li.offsetWidth / 2 - L / 2;
    const cy = coin.y + li.offsetHeight / 2 - H / 2;
    const sw = scene.clientWidth, sh = scene.clientHeight;
    const marge = 16;
    const libre = sw - (cartel.offsetWidth || sw * 0.36) - 3 * marge;     // place à gauche du cartel
    const zoom = Math.min((libre * 0.92) / li.offsetWidth, (sh * 0.8) / li.offsetHeight, 3.2);
    const hx = maison.offsetLeft + L / 2, hy = maison.offsetTop + H / 2;
    Object.assign(cible, { zoom, dx: -cx, dy: -cy, ox: marge + libre / 2 - hx, oy: sh / 2 - hy });
  }

  function angles(temps) {
    const base = ouverte >= 0 && large.matches ? 1.5 : REPOS_X;
    const ampleur = ouverte >= 0 && large.matches ? 0.5 : 1;
    if (reduit.matches || pause) { cible.rx = base; cible.ry = 0; return; }
    if (pointeur) {
      cible.ry = pointeur.x * 11 * ampleur;
      cible.rx = base - pointeur.y * 6 * ampleur;
    } else {
      cible.ry = Math.sin(temps / 2600) * 6 * ampleur;
      cible.rx = base + Math.sin(temps / 3400) * 1.8 * ampleur;
    }
  }

  function appliquer() {
    const s = maison.style;
    s.setProperty('--rx', `${vue.rx.toFixed(3)}deg`);
    s.setProperty('--ry', `${vue.ry.toFixed(3)}deg`);
    s.setProperty('--zoom', vue.zoom.toFixed(4));
    s.setProperty('--dx', `${vue.dx.toFixed(2)}px`);
    s.setProperty('--dy', `${vue.dy.toFixed(2)}px`);
    s.setProperty('--ox', `${vue.ox.toFixed(2)}px`);
    s.setProperty('--oy', `${vue.oy.toFixed(2)}px`);
  }

  function image(temps) {
    idImage = null;
    const dt = Math.min(64, temps - (derniere || temps));
    derniere = temps;
    angles(temps);
    const k = reduit.matches ? 1 : 1 - Math.exp(-dt / 160);
    let ecart = 0;
    for (const cle of Object.keys(cible)) {
      const d = cible[cle] - vue[cle];
      vue[cle] += d * k;
      ecart = Math.max(ecart, Math.abs(d));
    }
    appliquer();
    const immobile = reduit.matches || pause;
    if (visible && (!immobile || pointeur || ecart > 0.01)) idImage = requestAnimationFrame(image);
  }
  function demarrer() {
    if (idImage === null && visible) { derniere = 0; idImage = requestAnimationFrame(image); }
  }

  /* ----- Ouvrir / fermer une pièce ----- */
  /** Nom de la pièce au milieu d'une phrase : « du côté de l'atelier » (la plaque porte une majuscule, #181). */
  function nomPiece(li) {
    const nom = li.querySelector('.piece-plaque').textContent;
    return nom.charAt(0).toLowerCase() + nom.slice(1);
  }

  function ouvrir(i, { focus = true } = {}) {
    ouverte = i;
    maison.dataset.vue = 'piece';
    pieces.forEach((li, j) => {
      const elle = j === i;
      li.classList.toggle('ouverte', elle);
      li.querySelector('.piece-ouvrir').setAttribute('aria-expanded', String(elle));
      li.querySelectorAll('.objet, .indice').forEach((b) => { b.tabIndex = elle ? 0 : -1; });
    });
    contenu.innerHTML = pieces[i].querySelector('.piece-texte').innerHTML;
    position.textContent = position.dataset.modele.replace('{i}', String(i + 1));
    cartel.hidden = false;
    viser(i);
    demarrer();
    if (!large.matches) {
      const barre = document.querySelector('.barre-haut');
      const haut = pieces[i].getBoundingClientRect().top + window.scrollY - (barre ? barre.offsetHeight : 0) - 12;
      window.scrollTo({ top: haut, behavior: reduit.matches ? 'auto' : 'smooth' });
    }
    if (focus) contenu.querySelector('.cartel-titre')?.focus({ preventScroll: true });
  }

  function fermer({ focus = true } = {}) {
    const avant = ouverte;
    ouverte = -1;
    delete maison.dataset.vue;
    pieces.forEach((li) => {
      li.classList.remove('ouverte');
      li.querySelector('.piece-ouvrir').setAttribute('aria-expanded', 'false');
      li.querySelectorAll('.objet, .indice').forEach((b) => { b.tabIndex = -1; });
    });
    cartel.hidden = true;
    viser(-1);
    demarrer();
    if (focus && avant >= 0) pieces[avant].querySelector('.piece-ouvrir').focus({ preventScroll: !large.matches ? false : true });
  }

  pieces.forEach((li, i) => li.querySelector('.piece-ouvrir').addEventListener('click', () => ouvrir(i)));
  cartel.querySelector('.cartel-fermer').addEventListener('click', () => fermer());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ouverte >= 0 && !document.querySelector('dialog[open]')) fermer();
  });

  /* ----- Objets : pastille ⇄ ligne du cartel ----- */
  function activerObjet(n) {
    const li = pieces[ouverte];
    if (!li) return;
    li.querySelectorAll('.objet').forEach((b) => b.classList.toggle('actif', b.dataset.objet === n));
    contenu.querySelectorAll('.cartel-objets li').forEach((l) => l.classList.toggle('actif', l.dataset.objet === n));
    const ligne = contenu.querySelector(`.cartel-objets li[data-objet="${n}"]`);
    if (ligne) ligne.scrollIntoView({ block: 'nearest', behavior: reduit.matches ? 'auto' : 'smooth' });
  }
  maison.addEventListener('click', (e) => {
    const objet = e.target.closest('.objet');
    if (objet) activerObjet(objet.dataset.objet);
  });
  contenu.addEventListener('pointerover', (e) => {
    const ligne = e.target.closest('.cartel-objets li');
    if (ligne) activerObjet(ligne.dataset.objet);
  });

  /* ----- Inclinaison à la souris ----- */
  scene.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = scene.getBoundingClientRect();
    pointeur = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1 };
    demarrer();
  });
  scene.addEventListener('pointerleave', () => { pointeur = null; demarrer(); });

  /* ----- Messages (indices, aide) ----- */
  let minuterie = null;
  function annoncer(texte) {
    message.textContent = texte;
    clearTimeout(minuterie);
    minuterie = setTimeout(() => { message.textContent = ''; }, 7000);
  }

  /* ----- Jeu des indices ----- */
  const CLE = 'univers-indices';
  let trouves = new Set();
  try { trouves = new Set(JSON.parse(sessionStorage.getItem(CLE) || '[]')); } catch { /* stockage indisponible */ }
  function enregistrer() { try { sessionStorage.setItem(CLE, JSON.stringify([...trouves])); } catch { /* stockage indisponible : tant pis */ } }
  function afficherCompte() {
    compteur.textContent = String(trouves.size);
    indices.forEach((b) => b.classList.toggle('trouve', trouves.has(b.dataset.indice)));
  }
  afficherCompte();

  maison.addEventListener('click', (e) => {
    const b = e.target.closest('.indice');
    if (!b) return;
    e.stopPropagation();
    const nouveau = !trouves.has(b.dataset.indice);
    trouves.add(b.dataset.indice);
    b.classList.remove('revele', 'piste');
    enregistrer();
    afficherCompte();
    let texte = b.dataset.texte;
    if (nouveau && trouves.size === indices.length) texte += t(' Bravo, les quatorze indices sont trouvés !', ' Well done, you found all fourteen clues!');
    annoncer(texte);
  });

  function pisteSuivante() {
    const b = indices.find((x) => !trouves.has(x.dataset.indice));
    if (!b) { annoncer(t('Tous les indices sont déjà trouvés !', 'All the clues have already been found!')); return; }
    const li = b.closest('.piece');
    if (li) {
      const i = pieces.indexOf(li);
      if (ouverte !== i) ouvrir(i, { focus: false });
      annoncer(t(`Regardez bien du côté de ${nomPiece(li)}…`, `Take a close look at ${nomPiece(li)}…`));
    } else {
      if (ouverte >= 0) fermer({ focus: false });
      annoncer(b.dataset.indice === 'ficelle'
        ? t('Levez les yeux vers le toit…', 'Look up at the roof…')
        : t('Regardez le socle de la maquette…', 'Look at the base of the model…'));
    }
    b.classList.remove('piste');
    void b.offsetWidth;                              // relance l'animation
    setTimeout(() => b.classList.add('piste'), reduit.matches ? 0 : 650);
  }

  function reponses() {
    const restants = indices.filter((b) => !trouves.has(b.dataset.indice));
    restants.forEach((b) => b.classList.add('revele'));
    annoncer(restants.length
      ? t('Les indices restants sont entourés : ouvrez les pièces et cliquez dessus pour lire l’explication.',
          'The remaining clues are circled: open the rooms and click them to read why.')
      : t('Tous les indices sont déjà trouvés !', 'All the clues have already been found!'));
  }

  function remettreAZero() {
    trouves.clear();
    enregistrer();
    indices.forEach((b) => b.classList.remove('revele', 'piste'));
    afficherCompte();
    if (ouverte >= 0) fermer({ focus: false });
    annoncer(t('Partie remise à zéro : à vous de jouer !', 'Game reset: your turn!'));
  }

  /* ----- Commandes ----- */
  racine.querySelector('.univers-commandes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const n = pieces.length;
    switch (b.dataset.action) {
      case 'precedente': ouvrir(ouverte < 0 ? n - 1 : (ouverte - 1 + n) % n, { focus: false }); break;
      case 'suivante':   ouvrir(ouverte < 0 ? 0 : (ouverte + 1) % n, { focus: false }); break;
      case 'ensemble':   fermer({ focus: false }); break;
      case 'pause':
        pause = !pause;
        b.setAttribute('aria-pressed', String(pause));
        b.querySelector('span').textContent = pause ? t('Reprendre', 'Resume') : t('Pause', 'Pause');
        demarrer();
        break;
      case 'indice':   pisteSuivante(); break;
      case 'reponses': reponses(); break;
      case 'zero':     remettreAZero(); break;
      default: break;
    }
  });

  /* ----- Carte de mes voyages (#179) ----- */
  // Le lien mène au fichier SVG (repli sans JavaScript) ; ici, la carte est insérée dans la page
  // pour suivre le thème clair ou sombre, puis montrée dans un dialogue (×, Échap, clic sur le voile).
  const dialogueCarte = document.querySelector('.carte-voyages');
  if (dialogueCarte && typeof dialogueCarte.showModal === 'function') {
    const corps = dialogueCarte.querySelector('.carte-voyages-corps');
    let chargee = false;
    async function charger() {
      if (chargee) return;
      try {
        const reponse = await fetch(corps.dataset.source);
        if (!reponse.ok) throw new Error(String(reponse.status));
        corps.innerHTML = await reponse.text();
        chargee = true;
      } catch {
        // carte indisponible (hors ligne…) : simple lien vers l'image
        corps.innerHTML = `<p class="carte-voyages-attente"><a href="${corps.dataset.source}">${t('Ouvrir la carte', 'Open the map')}</a></p>`;
      }
    }
    document.addEventListener('click', (e) => {
      const lien = e.target.closest('[data-carte-voyages]');
      if (!lien || e.ctrlKey || e.metaKey || e.shiftKey || e.button > 0) return;
      e.preventDefault();
      dialogueCarte.showModal();
      charger();
    });
    dialogueCarte.addEventListener('click', (e) => {
      if (e.target === dialogueCarte || e.target.closest('.carte-voyages-fermer')) dialogueCarte.close();
    });
  }

  /* ----- Redimensionnement, visibilité, préférences ----- */
  new ResizeObserver(() => {
    mesurer();
    if (ouverte >= 0) viser(ouverte);
    demarrer();
  }).observe(scene);
  large.addEventListener('change', () => { viser(ouverte); demarrer(); });
  reduit.addEventListener('change', demarrer);
  new IntersectionObserver((entrees) => {
    visible = entrees[0].isIntersecting;
    if (visible) demarrer();
  }).observe(scene);

  mesurer();
  appliquer();
  demarrer();
})();
