/* Easter egg : la coccinelle cachée de la carte « Test logiciel »
   Intégration : ajouter l'attribut data-bug-egg sur la carte,
   puis <script src="bug-egg.js" defer></script> avant </body>. */
(() => {
  /* ---------- Mode test : ajouter ?bug-test à l'adresse de la page ----------
     Apparitions rapides et illimitées, recapturable, rien n'est compté
     dans GoatCounter ni mémorisé dans la session. */
  const MODE_TEST = new URLSearchParams(location.search).has("bug-test");

  /* ---------- Réglages ---------- */
  const TEXTE_BULLE = "<i>Bug</i> trouvé ✓ Ticket fermé.";
  const MAX_APPARITIONS = MODE_TEST ? Infinity : 3;  // par visite
  const DELAI_PREMIERE = MODE_TEST ? 300 : 1500;     // ms après que la carte est visible
  const DUREE_APPARITION = 3000;                     // ms pendant lesquelles elle jette un œil
  const PAUSE_ENTRE = MODE_TEST ? 4000 : 20000;      // ms entre deux apparitions
  const DUREE_BULLE = 4000;                          // ms d'affichage de la bulle après capture

  const hote = document.querySelector("[data-bug-egg]");
  if (!hote) {
    if (MODE_TEST) console.warn("[bug-egg] Aucune carte avec l'attribut data-bug-egg trouvée.");
    return;
  }

  let dejaAttrapee = false;
  try { dejaAttrapee = sessionStorage.getItem("bug-egg") === "attrapee"; } catch (e) {}
  if (dejaAttrapee && !MODE_TEST) return;
  if (MODE_TEST) console.info("[bug-egg] Mode test actif : la coccinelle va apparaître.");

  /* ---------- Styles (couleurs personnalisables via variables CSS) ---------- */
  const style = document.createElement("style");
  style.textContent = `
    .be-hote{position:relative;overflow:hidden}
    .be-bug{all:unset;position:absolute;z-index:2;right:0;bottom:1rem;width:64px;cursor:pointer;
      transform:translateX(110%);transition:transform .6s steps(5)}
    .be-bug.be-visible{transform:translateX(40%)}
    .be-bug.be-attrapee{transform:translateX(15%) rotate(-12deg);transition:transform .3s ease-out}
    .be-bug:not(.be-visible):not(.be-attrapee){pointer-events:none}
    .be-bug:focus-visible{outline:2px dashed currentColor;outline-offset:4px}
    .be-bug svg{display:block;width:100%;height:auto;shape-rendering:crispEdges}
    .be-r{fill:var(--bug-corps,#F0997B)} .be-d{fill:var(--bug-points,#993C1D)}
    .be-h,.be-g{fill:var(--bug-tete,#444441)} .be-a{fill:var(--bug-antennes,#5F5E5A)}
    .be-k{fill:var(--bug-ligne,#2C2C2A)} .be-w{fill:#fff} .be-l{fill:#FAECE7}
    .be-bulle{position:absolute;z-index:2;right:70px;bottom:4.2rem;max-width:12rem;padding:.4rem .7rem;
      border-radius:10px;background:var(--bug-bulle-fond,#E1F5EE);color:var(--bug-bulle-texte,#085041);
      font-size:.85rem;box-shadow:0 1px 3px rgba(0,0,0,.08);opacity:0;transition:opacity .3s;pointer-events:none}
    .be-bulle.be-montree{opacity:1}
    @media (prefers-reduced-motion:reduce){
      .be-bug,.be-bug.be-attrapee{transform:translateX(40%);transition:opacity .3s;opacity:0}
      .be-bug.be-visible,.be-bug.be-attrapee{opacity:1}
    }`;
  document.head.appendChild(style);

  /* ---------- Dessin pixel art (vue de dessus, tête à gauche) ---------- */
  const W = 18, H = 15;
  const g = Array.from({ length: H }, () => Array(W).fill(""));
  const pose = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
  const remplir = (lignes, c) => {
    for (const y in lignes) { const [a, b] = lignes[y]; for (let x = a; x <= b; x++) pose(x, +y, c); }
  };
  // pattes
  [[8,2],[8,1],[7,0],[11,1],[11,0],[14,1],[15,0],[8,12],[8,13],[7,14],[11,13],[11,14],[14,13],[15,14]]
    .forEach(([x, y]) => pose(x, y, "g"));
  // carapace
  remplir({2:[9,14],3:[7,16],4:[6,17],5:[6,17],6:[6,17],7:[6,17],8:[6,17],9:[6,17],10:[6,17],11:[7,16],12:[9,14]}, "r");
  for (let x = 6; x <= 17; x++) pose(x, 7, "k");                     // séparation des ailes
  [[9,4],[10,4],[9,5],[10,5],[13,4],[14,4],[13,5],[14,5],[9,9],[10,9],[9,10],[10,10],[13,9],[14,9],[13,10],[14,10],[16,5],[16,9]]
    .forEach(([x, y]) => pose(x, y, "d"));                            // points
  pose(8, 3, "l"); pose(7, 4, "l");                                   // reflet
  // tête, yeux, antennes
  remplir({5:[4,6],6:[3,6],7:[3,6],8:[3,6],9:[4,6]}, "h");
  pose(4, 6, "w"); pose(4, 8, "w");
  [[2,4],[1,3],[0,2],[2,10],[1,11],[0,12]].forEach(([x, y]) => pose(x, y, "a"));

  let rects = "";
  g.forEach((ligne, y) => ligne.forEach((c, x) => {
    if (c) rects += `<rect class="be-${c}" x="${x * 4}" y="${y * 4}" width="4" height="4"/>`;
  }));

  /* ---------- Éléments ---------- */
  hote.classList.add("be-hote");

  const bug = document.createElement("button");
  bug.type = "button";
  bug.className = "be-bug";
  bug.tabIndex = -1;
  bug.setAttribute("aria-label", "Attraper la coccinelle cachée");
  bug.innerHTML = `<svg viewBox="0 0 72 60" aria-hidden="true" focusable="false">${rects}</svg>`;

  const bulle = document.createElement("div");
  bulle.className = "be-bulle";
  bulle.setAttribute("role", "status");
  bulle.setAttribute("aria-live", "polite");

  hote.append(bulle, bug);

  /* ---------- Comportement ---------- */
  let apparitions = 0, minuteur = null, enCours = false, attrapee = false, carteVisible = false;

  const planifier = (delai) => {
    clearTimeout(minuteur);
    minuteur = setTimeout(() => { minuteur = null; if (carteVisible) apparaitre(); }, delai);
  };

  const apparaitre = () => {
    if (attrapee || apparitions >= MAX_APPARITIONS) return;
    apparitions++;
    enCours = true;
    bug.classList.add("be-visible");
    bug.tabIndex = 0;
    setTimeout(() => {
      if (attrapee) return;
      bug.classList.remove("be-visible");
      bug.tabIndex = -1;
      enCours = false;
      if (carteVisible && apparitions < MAX_APPARITIONS) planifier(PAUSE_ENTRE);
    }, DUREE_APPARITION);
  };

  const observateur = new IntersectionObserver(([entree]) => {
    carteVisible = entree.isIntersecting;
    if (carteVisible) { if (!minuteur && !enCours) planifier(DELAI_PREMIERE); }
    else { clearTimeout(minuteur); minuteur = null; }
  }, { threshold: 0.6 });
  observateur.observe(hote);

  bug.addEventListener("click", () => {
    if (attrapee) return;
    attrapee = true;
    clearTimeout(minuteur);
    observateur.disconnect();
    bug.classList.add("be-attrapee");
    bulle.innerHTML = TEXTE_BULLE;
    bulle.classList.add("be-montree");
    if (MODE_TEST) {
      console.info("[bug-egg] Capture réussie (non comptée).");
    } else {
      try { sessionStorage.setItem("bug-egg", "attrapee"); } catch (e) {}
      if (window.goatcounter && typeof window.goatcounter.count === "function") {
        window.goatcounter.count({ path: "easter-egg-bug", title: "Coccinelle attrapée", event: true });
      }
    }
    setTimeout(() => {
      bulle.classList.remove("be-montree");
      bug.classList.remove("be-attrapee", "be-visible");
      bug.tabIndex = -1;
      if (MODE_TEST) {            // on relance pour pouvoir la rattraper
        attrapee = false;
        apparitions = 0;
        observateur.observe(hote);
      }
    }, DUREE_BULLE);
  });
})();
