/* Easter egg : la coccinelle cachée sous une carte de la timeline
   Intégration : ajouter l'attribut data-bug-egg sur la boîte (.frise-boite),
   puis <script src="scripts/bug-egg.js" defer></script> avant </body>.
   La coccinelle se cache derrière la boîte et passe la tête par son bord inférieur. */
(() => {
  /* ---------- Mode test : ajouter ?bug-test à l'adresse de la page ----------
     Apparitions rapides et illimitées, recapturable, rien n'est compté
     dans GoatCounter ni mémorisé dans la session. */
  const MODE_TEST = new URLSearchParams(location.search).has("bug-test");

  /* ---------- Réglages ---------- */
  const TEXTE_BULLE = "<i>Bug</i> trouvé ✓ Ticket fermé.";
  const MAX_APPARITIONS = MODE_TEST ? Infinity : 3;  // par visite
  const DELAI_PREMIERE = MODE_TEST ? 300 : 2500;     // ms après que la boîte est visible
  const DUREE_APPARITION = 3000;                     // ms pendant lesquelles elle jette un œil
  const PAUSE_ENTRE = MODE_TEST ? 4000 : 20000;      // ms entre deux apparitions
  const DUREE_BULLE = 4000;                          // ms d'affichage de la bulle après capture

  const boite = document.querySelector("[data-bug-egg]");
  if (!boite || !boite.parentElement) {
    if (MODE_TEST) console.warn("[bug-egg] Aucun élément avec l'attribut data-bug-egg trouvé.");
    return;
  }
  const couche = boite.parentElement;   // l'étape de la timeline, qui sert de repère

  let dejaAttrapee = false;
  try { dejaAttrapee = sessionStorage.getItem("bug-egg") === "attrapee"; } catch (e) {}
  if (dejaAttrapee && !MODE_TEST) return;
  if (MODE_TEST) console.info("[bug-egg] Mode test actif : la coccinelle va apparaître.");

  /* ---------- Styles (couleurs personnalisables via variables CSS) ---------- */
  const style = document.createElement("style");
  style.textContent = `
    .be-couche{position:relative}
    .be-boite{position:relative;z-index:1}
    .be-bug{all:unset;position:absolute;z-index:0;right:1.75rem;bottom:0;width:36px;cursor:pointer;
      transform:translateY(0);transition:transform .7s steps(5)}
    .be-bug.be-visible{transform:translateY(18px)}
    .be-bug.be-attrapee{transform:translateY(22px) rotate(10deg);transition:transform .3s ease-out}
    .be-bug:not(.be-visible):not(.be-attrapee){pointer-events:none}
    .be-bug:focus-visible{outline:2px dashed currentColor;outline-offset:4px}
    .be-bug svg{display:block;width:100%;height:auto;shape-rendering:crispEdges}
    .be-r{fill:var(--bug-corps,#F0997B)} .be-d{fill:var(--bug-points,#993C1D)}
    .be-h,.be-g{fill:var(--bug-tete,#444441)} .be-a{fill:var(--bug-antennes,#5F5E5A)}
    .be-k{fill:var(--bug-ligne,#2C2C2A)} .be-w{fill:#fff} .be-l{fill:#FAECE7}
    .be-bulle{position:absolute;z-index:2;right:3.5rem;bottom:-1.55rem;white-space:nowrap;padding:.35rem .7rem;
      border-radius:10px;background:var(--bug-bulle-fond,#fff);color:var(--bug-bulle-texte,#3C3C3A);
      font-size:.85rem;box-shadow:0 1px 3px rgba(0,0,0,.12);opacity:0;transition:opacity .3s;pointer-events:none}
    .be-bulle.be-montree{opacity:1}
    @media (prefers-reduced-motion:reduce){
      .be-bug,.be-bug.be-attrapee{transform:translateY(18px);transition:opacity .3s;opacity:0}
      .be-bug.be-visible,.be-bug.be-attrapee{opacity:1}
    }`;
  document.head.appendChild(style);

  /* ---------- Dessin pixel art (vue de dessus, tête vers le bas) ---------- */
  // Dessin de base tête à gauche (18 × 15), puis pivoté pour que la tête pointe vers le bas.
  const W = 18, H = 15;
  const g = Array.from({ length: H }, () => Array(W).fill(""));
  const pose = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
  const remplir = (lignes, c) => {
    for (const y in lignes) { const [a, b] = lignes[y]; for (let x = a; x <= b; x++) pose(x, +y, c); }
  };
  [[8,2],[8,1],[7,0],[11,1],[11,0],[14,1],[15,0],[8,12],[8,13],[7,14],[11,13],[11,14],[14,13],[15,14]]
    .forEach(([x, y]) => pose(x, y, "g"));                            // pattes
  remplir({2:[9,14],3:[7,16],4:[6,17],5:[6,17],6:[6,17],7:[6,17],8:[6,17],9:[6,17],10:[6,17],11:[7,16],12:[9,14]}, "r");
  for (let x = 6; x <= 17; x++) pose(x, 7, "k");                     // séparation des ailes
  [[9,4],[10,4],[9,5],[10,5],[13,4],[14,4],[13,5],[14,5],[9,9],[10,9],[9,10],[10,10],[13,9],[14,9],[13,10],[14,10],[16,5],[16,9]]
    .forEach(([x, y]) => pose(x, y, "d"));                            // points
  pose(8, 3, "l"); pose(7, 4, "l");                                   // reflet
  remplir({5:[4,6],6:[3,6],7:[3,6],8:[3,6],9:[4,6]}, "h");           // tête
  pose(4, 6, "w"); pose(4, 8, "w");                                   // yeux
  [[2,4],[1,3],[0,2],[2,10],[1,11],[0,12]].forEach(([x, y]) => pose(x, y, "a")); // antennes

  let rects = "";
  g.forEach((ligne, y) => ligne.forEach((c, x) => {
    if (c) rects += `<rect class="be-${c}" x="${y * 4}" y="${(W - 1 - x) * 4}" width="4" height="4"/>`;
  }));

  /* ---------- Éléments ---------- */
  couche.classList.add("be-couche");
  boite.classList.add("be-boite");

  const bug = document.createElement("button");
  bug.type = "button";
  bug.className = "be-bug";
  bug.tabIndex = -1;
  bug.setAttribute("aria-label", "Attraper la coccinelle cachée");
  bug.innerHTML = `<svg viewBox="0 0 ${H * 4} ${W * 4}" aria-hidden="true" focusable="false">${rects}</svg>`;

  const bulle = document.createElement("div");
  bulle.className = "be-bulle";
  bulle.setAttribute("role", "status");
  bulle.setAttribute("aria-live", "polite");

  couche.append(bug, bulle);

  /* ---------- Comportement ---------- */
  let apparitions = 0, minuteur = null, enCours = false, attrapee = false, boiteVisible = false;

  const planifier = (delai) => {
    clearTimeout(minuteur);
    minuteur = setTimeout(() => { minuteur = null; if (boiteVisible) apparaitre(); }, delai);
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
      if (boiteVisible && apparitions < MAX_APPARITIONS) planifier(PAUSE_ENTRE);
    }, DUREE_APPARITION);
  };

  const observateur = new IntersectionObserver(([entree]) => {
    boiteVisible = entree.isIntersecting;
    if (boiteVisible) { if (!minuteur && !enCours) planifier(DELAI_PREMIERE); }
    else { clearTimeout(minuteur); minuteur = null; }
  }, { threshold: 0.9 });
  observateur.observe(boite);

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
        observateur.observe(boite);
      }
    }, DUREE_BULLE);
  });
})();
