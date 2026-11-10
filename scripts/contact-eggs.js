/* Easter eggs du champ « Message » du formulaire de contact
   1. « (La) réponse à la (grande) question sur la vie, l'univers et le reste » ou « (The) answer to
      (the ultimate question of) life, the universe and everything » devient « 42 » (Douglas Adams).
   2. Un message réduit à « askew », un synonyme ou une traduction française
      fait pencher la page, comme la recherche « askew » sur Google.
   3. Un message réduit à « do a barrel roll » (ou « fais un tonneau ») fait faire
      un tour complet à la page, comme sur Google : 360° en 4 s, une seule fois.
   4. Un message réduit à « 67 » (ou « 6-7 », « six seven », « six-sept ») fait tanguer
      la page en bascule, comme sur Google, au rythme du mème « 6-7 ».
   5. Un message réduit à « stranger things » fait apparaître un dé à 20 faces, comme sur Google
      (une seule fois par chargement de page ; il s'en va dès que le texte change).
      Lancé, il tombe sur 1 : fissure rouge, éclair, la page s'assombrit sous les cendres et passe
      tête en bas (le Monde à l'envers). Une croix rouge en bas (ou Échap) ramène la page à l'endroit.
   6. Un message réduit à « zerg rush » lâche des aliens façon Space Invaders qui grignotent la page,
      comme les « o » de Google. Trois clics abattent un alien. Quand tout est dévoré, ils écrivent « GG ».
   7. « wicked » (ou « elphaba », « glinda », « defying gravity ») : un chapeau de sorcière apparaît ;
      au clic, la page défie la gravité dans la fumée verte et les bulles roses, comme sur Google.
   8. « grogu » (ou « baby yoda », « la force », « the force ») : une main lumineuse apparaît ;
      chaque clic soulève un élément par la Force, qui retombe de travers, comme l'effet de Google.
   Intégration : <script src="scripts/contact-eggs.js?v=11" defer></script> dans le <head>.
   Mode test : ajouter ?bug-test à l'adresse (rien n'est compté dans GoatCounter). */
(() => {
  const champ = document.querySelector('#formulaire-contact textarea[name="message"]');
  if (!champ) return;

  const MODE_TEST = new URLSearchParams(location.search).has('bug-test');
  const ANGLAIS = document.documentElement.lang.startsWith('en');

  /* ---------- Réglages ---------- */
  const ANGLE = '1deg';                  // l'inclinaison de Google
  const DUREE_TONNEAU = 4000;            // ms : la durée du tonneau de Google
  const DUREE_67 = 1600;                 // ms : la bascule « 67 », quatre allers-retours
  const ANGLE_67 = 3;                    // degrés de chaque côté
  const DELAI_42 = 1000;                 // ms entre la fin de la phrase et l’apparition de « 42 » (1 s ; le navigateur ne déclenche jamais en avance)

  // Les phrases remplacées par « 42 » : majuscules, apostrophes, virgules et espaces indifférents.
  const APOS = "['’ʼ‘`´]";
  // Toute la phrase disparaît, depuis « (la) réponse » / « (the) answer » s'il y en a un.
  // Il faut au moins « réponse » ou « question » (« answer » ou « question ») ; « grande » / « ultimate » sont facultatifs.
  const S = '\\s+', V = '\\s*,?\\s*';                       // espace ; virgule facultative
  const DEBUT = '(?<![\\p{L}\\p{N}])', FIN = '(?![\\p{L}\\p{N}])'; // mots entiers seulement
  const QUESTION_FR = `(?:grande${S})?question${S}(?:sur|de)${S}`;
  const QUESTION_EN = `(?:(?:ultimate|great)${S})?question${S}of${S}`;
  const GRANDE_QUESTION = [
    // « (la) réponse à (la) (grande) question sur la vie, l'univers et (tout) le reste », « (la) (grande) question sur la vie… »,
    // « (la) réponse à la vie, l'univers et le reste »
    new RegExp(`${DEBUT}(?:(?:la${S})?r[eé]ponse${S}[aà]${S}(?:la${S})?(?:${QUESTION_FR})?|(?:la${S})?${QUESTION_FR})`
      + `la${S}vie${V}(?:de${S})?l\\s*${APOS}?\\s*univers${V}(?:et|&)${S}(?:(?:de${S})?tout${S})?(?:(?:le|du)${S})?reste${FIN}`, 'giu'),
    // « (the) answer to (the) (ultimate) question of life, the universe(,) and everything », « (the) (ultimate) question of life… »,
    // « (the) answer to life, the universe and everything »
    new RegExp(`${DEBUT}(?:(?:the${S})?answer${S}to${S}(?:the${S})?(?:${QUESTION_EN})?|(?:the${S})?${QUESTION_EN})`
      + `life${V}(?:the${S})?universe${V}(?:and|&)${S}everything${FIN}`, 'giu'),
  ];

  // Les messages qui font pencher la page (comparés sans majuscules ni accents).
  const DE_TRAVERS = [
    // anglais
    'askew', 'awry', 'aslant', 'atilt', 'skew', 'skewed', 'tilt', 'tilted', 'slanted', 'slanting',
    'crooked', 'lopsided', 'cockeyed', 'off kilter', 'off-kilter', 'out of kilter', 'oblique',
    // français
    'de travers', 'en travers', 'de guingois', 'de traviole', 'en biais', 'de biais', 'pas droit',
    'penche', 'penchee', 'penches', 'penchees', 'incline', 'inclinee', 'inclines', 'inclinees',
    'bancal', 'bancale', 'tordu', 'tordue', 'tors', 'torse', 'oblique', 'biscornu',
  ];

  // Les messages qui font faire un tonneau à la page (comparés sans majuscules ni accents).
  const TONNEAU = [
    'do a barrel roll', 'do a barrel-roll', 'barrel roll', 'z or r twice',
    'fais un tonneau', 'fait un tonneau', 'faire un tonneau', 'fais une vrille', 'z ou r deux fois',
  ];

  // Les messages qui font tanguer la page, comme la recherche « 67 » sur Google.
  const SIX_SEPT = [
    '67', '6 7', '6-7', '6 - 7', '6–7', '6—7', '6/7', 'six seven', 'six-seven', 'sixseven',
    'six sept', 'six-sept', 'sixsept',
  ];

  // Les messages qui font apparaître le dé de Stranger Things.
  const STRANGER = [
    'stranger things', 'strangerthings', 'stranger thing', 'upside down', 'the upside down',
    'monde a l\'envers', 'le monde a l\'envers', 'monde a l’envers', 'le monde a l’envers',
  ];

  /* ---------- Outils ---------- */
  const simplifier = (texte) => texte
    .normalize('NFD').replace(/\p{M}/gu, '')       // sans accents
    .toLowerCase()
    .replace(/[\s.!?…]+$/u, '')                    // ponctuation finale ignorée
    .replace(/^\s+/u, '')
    .replace(/\s+/gu, ' ');

  const compter = (chemin, titre) => {
    if (MODE_TEST || compter[chemin]) return;      // une fois par page vue
    compter[chemin] = true;
    if (window.goatcounter && typeof window.goatcounter.count === 'function') {
      window.goatcounter.count({ path: chemin, title: titre, event: true });
    }
  };

  // Annonce discrète pour les lecteurs d'écran (zone invisible à l'écran)
  const annonce = document.createElement('p');
  annonce.setAttribute('role', 'status');
  annonce.style.cssText = 'position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap';
  champ.after(annonce);
  const annoncer = (fr, en) => { annonce.textContent = ''; setTimeout(() => { annonce.textContent = ANGLAIS ? en : fr; }, 50); };

  /* ---------- 1. La Grande Question devient 42 ---------- */
  const remplacer = () => {
    let remplace = false;
    for (const motif of GRANDE_QUESTION) {
      motif.lastIndex = 0;
      const trouvailles = [...champ.value.matchAll(motif)].reverse(); // de la fin vers le début : les positions restent justes
      for (const t of trouvailles) {
        const debut = t.index, fin = t.index + t[0].length, ecart = 2 - t[0].length;
        let curseur = champ.selectionEnd;
        if (curseur >= fin) curseur += ecart;          // curseur après la phrase : il recule d'autant
        else if (curseur > debut) curseur = debut + 2; // curseur dans la phrase : juste après « 42 »
        champ.setRangeText('42', debut, fin);
        champ.setSelectionRange(curseur, curseur);     // sans sélection, la frappe suivante n'efface pas « 42 »
        remplace = true;
      }
    }
    if (remplace) {
      annoncer('La Grande Question a été remplacée par sa réponse : 42.',
               'The Ultimate Question has been replaced by its answer: 42.');
      compter('easter-egg-42', 'Grande Question → 42');
    }
  };

  /* ---------- 2. La page penche ---------- */
  // Le contenu qui défile penche ; les barres fixes du haut et du bas restent droites.
  const style = document.createElement('style');
  style.textContent = `
    html.de-travers, html.de-travers body, html.en-mouvement, html.en-mouvement body { overflow-x: hidden; }
    html.de-travers .penchable { rotate: var(--angle-travers, ${ANGLE}); }`; // net et instantané, sans fondu
  document.head.appendChild(style);

  const blocs = [...document.querySelectorAll('body > header, body > main, body > footer')];
  blocs.forEach((bloc) => bloc.classList.add('penchable'));
  let penchee = false;

  // Tous les blocs tournent autour du même point (le centre de l'écran), comme une seule feuille.
  const alignerOrigines = () => {
    const cx = document.documentElement.clientWidth / 2;
    const cy = innerHeight / 2;
    blocs.forEach((bloc) => {
      const r = bloc.getBoundingClientRect();
      bloc.style.transformOrigin = `${cx - r.left}px ${cy - r.top}px`;
    });
  };

  const pencher = (oui) => {
    if (oui === penchee) return;
    penchee = oui;
    if (oui) {
      alignerOrigines();
      annoncer('La page penche… comme demandé.', 'The page is now askew… as requested.');
      compter('easter-egg-askew', 'Page de travers');
    }
    document.documentElement.classList.toggle('de-travers', oui);
  };

  const verifierTravers = () => pencher(DE_TRAVERS.includes(simplifier(champ.value)));

  /* ---------- 3 et 4. Les animations de toute la page : tonneau et « 67 » ---------- */
  // Toute la page bouge d'un bloc autour du centre de l'écran, puis revient à sa place.
  // L'animation part quand le message DEVIENT la phrase : pour recommencer, il faut la retaper.
  // Rien ne bouge si l'appareil demande moins d'animations.
  const mouvementReduit = matchMedia('(prefers-reduced-motion: reduce)');
  let enMouvement = false;

  const animerPage = ({ chemin, titre, images, options, fr, en, cri }) => {
    compter(chemin, titre);
    if (mouvementReduit.matches) {
      annoncer(`${cri[0]} (Animation désactivée : votre appareil demande moins de mouvements.)`,
               `${cri[1]} (Animation skipped: your device asks for reduced motion.)`);
      return;
    }
    if (enMouvement) return;                     // une animation à la fois
    annoncer(fr, en);
    enMouvement = true;
    alignerOrigines();
    document.documentElement.classList.add('en-mouvement');
    const anims = blocs.map((bloc) => bloc.animate(images, options));
    Promise.all(anims.map((a) => a.finished)).finally(() => {
      enMouvement = false;
      document.documentElement.classList.remove('en-mouvement');
    });
  };

  const ANIMATIONS = [
    { // comme Google : 360°, 4 s, une seule fois
      phrases: TONNEAU, chemin: 'easter-egg-barrel-roll', titre: 'Do a barrel roll',
      images: [{ rotate: '0deg' }, { rotate: '360deg' }],
      options: { duration: DUREE_TONNEAU, easing: 'ease', iterations: 1 },
      fr: 'Tonneau ! La page fait un tour complet.', en: 'Barrel roll! The page spins all the way round.',
      cri: ['Tonneau !', 'Barrel roll!'],
    },
    { // comme Google : la page tangue en bascule, au rythme des mains du mème « 6-7 »
      phrases: SIX_SEPT, chemin: 'easter-egg-67', titre: '6-7',
      images: [0, -ANGLE_67, ANGLE_67, -ANGLE_67, ANGLE_67, -ANGLE_67 / 2, 0]
        .map((a) => ({ rotate: `${a}deg`, easing: 'ease-in-out' })),  // chaque bascule amortie, au même rythme
      options: { duration: DUREE_67, iterations: 1 },
      fr: 'Six-sept ! La page se balance.', en: 'Six-seven! The page seesaws.',
      cri: ['Six-sept !', 'Six-seven!'],
    },
  ];
  // L'animation attend une courte pause dans la frappe : « 678 » ou « 67 rue… » ne déclenchent rien en passant par « 67 ».
  const PAUSE_ANIMATION = 500;           // ms
  const demandes = new Map();
  let minuteurAnimation = null;

  const verifierAnimations = () => {
    clearTimeout(minuteurAnimation);
    minuteurAnimation = setTimeout(() => {
      const message = simplifier(champ.value);
      verifierStranger(message);
      verifierZerg(message);
      verifierMagies(message);
      for (const anim of ANIMATIONS) {
        const demande = anim.phrases.includes(message);
        if (demande && demandes.get(anim) !== message) animerPage(anim); // nouvelle phrase, ou retapée
        demandes.set(anim, demande ? message : null);
      }
    }, PAUSE_ANIMATION);
  };

  /* ---------- 5. Stranger Things : le dé et le Monde à l'envers ---------- */
  const ROUGE = '#e11d2e';
  const styleST = document.createElement('style');
  styleST.textContent = `
    .st-de { all: unset; position: fixed; z-index: 60; right: 1rem; bottom: calc(var(--barre-h, 3rem) + 1rem);
      width: 4.5rem; height: 4.5rem; cursor: pointer; filter: drop-shadow(0 0.25rem 0.6rem rgb(0 0 0 / 0.35)); }
    .st-de[hidden], .st-retour[hidden] { display: none; }
    .st-de svg { display: block; width: 100%; height: 100%; }
    .st-de:focus-visible, .st-retour:focus-visible { outline: 3px solid ${ROUGE}; outline-offset: 4px; border-radius: 50%; }
    .st-arrivee { animation: st-arrivee 0.5s cubic-bezier(0.3, 1.6, 0.5, 1); }
    @keyframes st-arrivee { from { transform: translateY(2.5rem) scale(0.6); opacity: 0; } }
    .st-voile { position: fixed; inset: 0; z-index: 62; pointer-events: none; }
    .st-fissure svg { display: block; width: 100%; height: 100%; }
    .st-fissure path { fill: none; stroke: ${ROUGE}; stroke-width: 4; stroke-linejoin: bevel; stroke-linecap: round;
      filter: drop-shadow(0 0 0.4rem #ff3347); }
    .st-fissure path + path { stroke-width: 2.5; }
    .st-flash { background: ${ROUGE}; opacity: 0; }
    html.monde-envers, html.monde-envers body { overflow-x: hidden; }
    html.monde-envers body { background: #15171c; }
    html.monde-envers .penchable { rotate: 180deg; filter: grayscale(0.8) brightness(0.42) contrast(1.2); }
    .st-cendres { position: fixed; inset: 0; z-index: 59; pointer-events: none; overflow: hidden; }
    .st-cendre { position: absolute; bottom: -1rem; border-radius: 50%; background: rgb(214 214 220 / 0.75);
      animation: st-flotte linear infinite; }
    @keyframes st-flotte { to { transform: translate(var(--dx), -110vh); } }
    .st-retour { all: unset; position: fixed; z-index: 63; left: 50%; bottom: calc(var(--barre-h, 3rem) + 1rem);
      translate: -50% 0; width: 3.25rem; height: 3.25rem; border-radius: 50%; background: ${ROUGE}; color: #fff;
      display: grid; place-items: center; font: 700 1.75rem/1 "Trebuchet MS", sans-serif; cursor: pointer;
      box-shadow: 0 0 1.25rem rgb(225 29 46 / 0.6); }
    @media (prefers-reduced-motion: reduce) { .st-cendres { display: none; } .st-arrivee { animation: none; } }`;
  document.head.appendChild(styleST);

  // Le dé à 20 faces vu de face : un hexagone, une face centrale qui porte le chiffre, et ses voisines.
  const svgDe = `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <g stroke="#3b0710" stroke-width="1.6" stroke-linejoin="round">
      <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="#8f1022"/>
      <polygon points="50,4 90,27 50,26" fill="#b0182d"/><polygon points="50,4 10,27 50,26" fill="#a3152a"/>
      <polygon points="90,27 90,73 78,68" fill="#7c0d1d"/><polygon points="10,27 10,73 22,68" fill="#86101f"/>
      <polygon points="90,73 50,96 78,68" fill="#6e0a18"/><polygon points="10,73 50,96 22,68" fill="#760c1b"/>
      <polygon points="50,96 78,68 22,68" fill="#9a1326"/>
      <polygon points="90,27 50,26 78,68" fill="#a8162b"/><polygon points="10,27 50,26 22,68" fill="#9e1428"/>
      <polygon points="50,26 78,68 22,68" fill="#d4243a"/>
    </g>
    <text class="st-chiffre" x="50" y="59" text-anchor="middle" fill="#fff"
      font-family="Trebuchet MS, sans-serif" font-weight="700" font-size="20">20</text>
  </svg>`;

  const de = document.createElement('button');
  de.type = 'button';
  de.className = 'st-de';
  de.hidden = true;
  de.setAttribute('aria-label', ANGLAIS ? 'Twenty-sided die: roll it' : 'Dé à vingt faces : le lancer');
  de.innerHTML = svgDe;
  const chiffre = de.querySelector('.st-chiffre');

  const retour = document.createElement('button');
  retour.type = 'button';
  retour.className = 'st-retour';
  retour.hidden = true;
  retour.textContent = '✕';
  retour.setAttribute('aria-label', ANGLAIS ? 'Come back from the Upside Down' : 'Revenir du Monde à l’envers');
  document.body.append(de, retour);

  let deLance = false, deUtilise = false, messageDe = null, mondeEnvers = false, cendres = null, voiles = [];
  const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

  const montrerDe = (oui) => {
    if (oui && deUtilise) return;                  // un seul lancer par chargement de page
    if (mondeEnvers || deLance || oui === !de.hidden) return;
    de.hidden = !oui;
    messageDe = oui ? champ.value : null;          // le texte exact qui a fait venir le dé
    if (oui) {
      chiffre.textContent = '20';
      de.classList.remove('st-arrivee'); void de.offsetWidth; de.classList.add('st-arrivee');
      annoncer('Un dé à vingt faces est apparu en bas à droite.', 'A twenty-sided die has appeared at the bottom right.');
    }
  };

  const voile = (classe, html = '') => {
    const v = document.createElement('div');
    v.className = `st-voile ${classe}`;
    v.setAttribute('aria-hidden', 'true');
    v.innerHTML = html;
    document.body.append(v);
    voiles.push(v);
    return v;
  };

  const semerCendres = () => {
    cendres = document.createElement('div');
    cendres.className = 'st-cendres';
    cendres.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 45; i++) {
      const c = document.createElement('span');
      const taille = 2 + Math.random() * 4;
      c.className = 'st-cendre';
      c.style.cssText = `left:${Math.random() * 100}%;width:${taille}px;height:${taille}px;`
        + `--dx:${(Math.random() - 0.5) * 30}vw;animation-duration:${9 + Math.random() * 10}s;`
        + `animation-delay:${-Math.random() * 18}s;opacity:${0.35 + Math.random() * 0.6}`;
      cendres.append(c);
    }
    document.body.append(cendres);
  };

  const lancerDe = async () => {
    if (deLance || mondeEnvers || deUtilise) return;
    deLance = true;
    deUtilise = true;
    const reduit = mouvementReduit.matches;
    if (!reduit) {
      // Le dé roule : il tourne, rebondit, ses faces défilent… et tombe sur 1, l'échec critique.
      const roule = de.animate(
        [{ rotate: '0deg', scale: 1 }, { rotate: '540deg', scale: 1.25, offset: 0.45 }, { rotate: '1080deg', scale: 1 }],
        { duration: 1300, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' });
      const defile = setInterval(() => { chiffre.textContent = String(2 + Math.floor(Math.random() * 19)); }, 70);
      await roule.finished.catch(() => {});
      clearInterval(defile);
    }
    chiffre.textContent = '1';
    annoncer('Le dé tombe sur 1 : échec critique !', 'The die lands on 1: critical fail!');
    await pause(reduit ? 300 : 600);

    if (!reduit) {
      // La fissure rouge se dessine en travers de l'écran, puis un éclair rouge.
      // Tracée en pixels d'écran, en zigzag, avec deux éclats qui partent du trait principal.
      const L = innerWidth, H = innerHeight, pas = Math.max(L / 14, 28);
      const zigzag = (x, y, longueur, pente) => {
        let d = `M ${x.toFixed(0)} ${y.toFixed(0)}`; const points = [];
        for (let fait = 0; fait < longueur; fait += pas * (0.5 + Math.random())) {
          x += pas * (0.5 + Math.random()); y += pente * pas + (Math.random() - 0.5) * pas * 0.9;
          d += ` L ${x.toFixed(0)} ${y.toFixed(0)}`; points.push([x, y]);
        }
        return { d, points };
      };
      const tronc = zigzag(-10, H * (0.25 + Math.random() * 0.2), L + 20, 0.25);
      const eclats = [0.35, 0.65].map((t) => {
        const [x, y] = tronc.points[Math.floor(tronc.points.length * t)];
        return zigzag(x, y, L * 0.12, Math.random() < 0.5 ? -0.9 : 0.9).d;
      });
      const fissure = voile('st-fissure', `<svg viewBox="0 0 ${L} ${H}">`
        + [tronc.d, ...eclats].map((d) => `<path d="${d}"/>`).join('') + '</svg>');
      await Promise.all([...fissure.querySelectorAll('path')].map((chemin, i) => {
        const long = chemin.getTotalLength();
        chemin.style.strokeDasharray = `${long}`;
        return chemin.animate([{ strokeDashoffset: long }, { strokeDashoffset: 0 }],
          { duration: i ? 200 : 450, delay: i ? 300 : 0, easing: 'ease-in', fill: 'both' }).finished;
      }));
      const flash = voile('st-flash');
      await flash.animate([{ opacity: 0 }, { opacity: 0.8, offset: 0.25 }, { opacity: 0 }],
        { duration: 500, easing: 'ease-out' }).finished;   // un seul éclair, bref
      voiles.forEach((v) => v.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }));
      setTimeout(() => { voiles.forEach((v) => v.remove()); voiles = []; }, 450);
    }

    // Bienvenue dans le Monde à l'envers.
    alignerOrigines();
    document.documentElement.classList.add('monde-envers');
    mondeEnvers = true;
    de.hidden = true;
    deLance = false;
    if (!reduit) semerCendres();
    retour.hidden = false;
    retour.focus({ preventScroll: true });
    annoncer('Bienvenue dans le Monde à l’envers. La croix rouge en bas, ou Échap, ramène la page à l’endroit.',
             'Welcome to the Upside Down. The red cross at the bottom, or Escape, brings the page back.');
    compter('easter-egg-stranger-things', 'Stranger Things : Monde à l’envers');
  };

  const revenir = () => {
    if (!mondeEnvers) return;
    mondeEnvers = false;
    document.documentElement.classList.remove('monde-envers');
    cendres?.remove(); cendres = null;
    retour.hidden = true;
    champ.focus({ preventScroll: true });
    annoncer('Retour à l’endroit.', 'Back to the right way up.');
  };

  const verifierStranger = (message) => montrerDe(STRANGER.includes(message));

  de.addEventListener('click', lancerDe);
  retour.addEventListener('click', revenir);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { revenir(); arreterZerg(); fermerMagies(); } });

  /* ---------- 6. Zerg rush, version Space Invaders ---------- */
  const ZERG = ['zerg rush', 'zergrush', 'zerg-rush', 'zerg'];
  const PIXEL = 3;                                  // taille d'un pixel d'alien, en px
  const COULEURS_ALIENS = ['#2f8f4e', '#4f55c8', '#1d7f86'];
  // Les trois aliens du jeu original, chacun sur deux images, et l'explosion.
  const SPRITES = [
    [['...##...', '..####..', '.######.', '##.##.##', '########', '..#..#..', '.#.##.#.', '#.#..#.#'],
     ['...##...', '..####..', '.######.', '##.##.##', '########', '.#.##.#.', '#......#', '.#....#.']],
    [['..#.....#..', '...#...#...', '..#######..', '.##.###.##.', '###########', '#.#######.#', '#.#.....#.#', '...##.##...'],
     ['..#.....#..', '#..#...#..#', '#.#######.#', '###.###.###', '###########', '.#########.', '..#.....#..', '.#.......#.']],
    [['....####....', '.##########.', '############', '###..##..###', '############', '...##..##...', '..##.##.##..', '##........##'],
     ['....####....', '.##########.', '############', '###..##..###', '############', '..###..###..', '.##..##..##.', '..##....##..']],
  ];
  const EXPLOSION = ['....#...#....', '.#...#.#...#.', '..#.......#..', '...#.....#...', '##.........##', '...#.....#...', '..#..#.#..#..', '.#..#...#..#.'];
  const LETTRE_G = ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'];

  const pixels = (motif, classe = '') => {
    let r = '';
    motif.forEach((ligne, y) => [...ligne].forEach((c, x) => { if (c === '#') r += `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`; }));
    return `<g class="${classe}">${r}</g>`;
  };

  const styleZR = document.createElement('style');
  styleZR.textContent = `
    .zr-zone { position: fixed; inset: 0; z-index: 64; pointer-events: none; overflow: hidden; }
    .zr-alien { position: absolute; left: 0; top: 0; pointer-events: auto; cursor: crosshair; touch-action: manipulation; }
    .zr-alien svg { display: block; width: 100%; height: 100%; shape-rendering: crispEdges; }
    .zr-zone.zr-pas2 .zr-i1, .zr-zone:not(.zr-pas2) .zr-i2 { display: none; }
    .zr-touche { filter: brightness(1.8); }
    .zr-mort { pointer-events: none; }
    .zr-panneau { position: fixed; z-index: 65; top: calc(var(--barre-h, 3rem) + 0.5rem); right: 0.75rem;
      display: flex; align-items: center; gap: 0.75rem; padding: 0.4rem 0.5rem 0.4rem 0.9rem; border-radius: 999px;
      background: #14161c; color: #e8ecf2; font: 0.9rem/1.2 "Trebuchet MS", sans-serif;
      box-shadow: 0 0.25rem 0.75rem rgb(0 0 0 / 0.3); }
    .zr-panneau strong { color: #7ee2a0; }
    .zr-panneau button { all: unset; cursor: pointer; padding: 0.3rem 0.75rem; border-radius: 999px;
      background: #e8ecf2; color: #14161c; font-weight: 700; }
    .zr-panneau button:focus-visible { outline: 3px solid #7ee2a0; outline-offset: 2px; }`;
  document.head.appendChild(styleZR);

  let zerg = null;                                  // l'état de la partie, ou null

  const choisirCibles = () => {
    const haut = document.querySelector('.barre-haut')?.getBoundingClientRect().bottom ?? 0;
    const bas = document.querySelector('.barre-bas')?.getBoundingClientRect().top ?? innerHeight;
    const selecteur = 'h1,h2,h3,h4,p,li,label,input,select,textarea,button,img,svg,blockquote,figure,time,a,.tag';
    // Visible, à l'écran, et pas un champ caché (le piège à robots du formulaire est hors de l'écran).
    const atteignable = (el, r) => r.width * r.height >= 300 && r.bottom > haut && r.top < bas
      && r.right > 0 && r.left < innerWidth && getComputedStyle(el).visibility !== 'hidden'
      && !el.closest('[aria-hidden="true"], [hidden], [inert]');
    const choisies = [];
    blocs.forEach((bloc) => bloc.querySelectorAll(selecteur).forEach((el) => {
      if (choisies.some((c) => c.contains(el))) return;          // déjà mangé avec son parent
      const r = el.getBoundingClientRect();
      if (!atteignable(el, r)) return;
      choisies.push(el);
    }));
    // Les cadres (cartes, encadrés) passent au menu une fois leur contenu dévoré.
    const cadres = [];
    blocs.forEach((bloc) => bloc.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > innerWidth * 0.94 || !atteignable(el, r)) return;
      if (choisies.includes(el) || choisies.some((c) => c.contains(el))) return;
      const st = getComputedStyle(el);
      const fond = st.backgroundColor !== 'rgba(0, 0, 0, 0)' && st.backgroundColor !== 'transparent';
      const bord = parseFloat(st.borderTopWidth) > 0 || st.boxShadow !== 'none';
      if (fond || bord) cadres.push(el);
    }));
    const cible = (el, max) => {
      const r = el.getBoundingClientRect();
      return { el, morsures: [], vie: Math.min(max, Math.max(2, Math.ceil((r.width * r.height) / 6000))), mangee: false, apres: [] };
    };
    const cibles = choisies.slice(0, 45).map((el) => cible(el, 7));
    cadres.slice(0, 15).forEach((el) => {
      const c = cible(el, 5);
      c.apres = cibles.filter((d) => el.contains(d.el));   // ce qu'il faut avoir mangé avant
      cibles.push(c);
    });
    return cibles;
  };

  const nouvelAlien = (x, y) => {
    const n = Math.floor(Math.random() * SPRITES.length);
    const [i1, i2] = SPRITES[n];
    const l = i1[0].length, h = i1.length;
    const el = document.createElement('div');
    el.className = 'zr-alien';
    el.setAttribute('aria-hidden', 'true');
    el.style.width = `${l * PIXEL}px`; el.style.height = `${h * PIXEL}px`;
    el.innerHTML = `<svg viewBox="0 0 ${l} ${h}" fill="${COULEURS_ALIENS[n]}">${pixels(i1, 'zr-i1')}${pixels(i2, 'zr-i2')}</svg>`;
    const alien = { el, x, y, l: l * PIXEL, h: h * PIXEL, coups: 0, cible: null, ox: 0, oy: 0, etat: 'va', prochaineMorsure: 0, place: null };
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); toucher(alien); });
    zerg.zone.append(el);
    zerg.aliens.push(alien);
    return alien;
  };

  const apparaitre = () => {
    const depuisCote = Math.random() < 0.3;
    const x = depuisCote ? (Math.random() < 0.5 ? -40 : innerWidth + 10) : Math.random() * innerWidth;
    const y = depuisCote ? Math.random() * innerHeight * 0.6 : -30;
    return nouvelAlien(x, y);
  };

  const toucher = (alien) => {
    if (!zerg || alien.etat === 'mort' || zerg.phase !== 'jeu') return;
    zerg.clics++;
    alien.coups++;
    alien.el.classList.add('zr-touche');
    setTimeout(() => alien.el.classList.remove('zr-touche'), 90);
    if (alien.coups < 3) return;
    alien.etat = 'mort';
    zerg.abattus++;
    alien.el.classList.add('zr-mort');
    const couleur = alien.el.querySelector('svg').getAttribute('fill');
    alien.el.style.width = `${EXPLOSION[0].length * PIXEL}px`;
    alien.el.innerHTML = `<svg viewBox="0 0 ${EXPLOSION[0].length} ${EXPLOSION.length}" fill="${couleur}">${pixels(EXPLOSION)}</svg>`;
    setTimeout(() => { alien.el.remove(); zerg && (zerg.aliens = zerg.aliens.filter((a) => a !== alien)); }, 280);
    majPanneau();
  };

  const majPanneau = () => {
    if (!zerg) return;
    const minutes = (performance.now() - zerg.debut) / 60000;
    const apm = minutes > 0.02 ? Math.round(zerg.clics / minutes) : 0;
    zerg.score.innerHTML = zerg.phase === 'gg'
      ? `<strong>GG !</strong> ${ANGLAIS ? 'Page digested' : 'Page digérée'} · ${ANGLAIS ? 'aliens shot' : 'aliens abattus'} : <strong>${zerg.abattus}</strong>`
      : `${ANGLAIS ? 'Aliens shot' : 'Aliens abattus'} : <strong>${zerg.abattus}</strong> · APM : <strong>${apm}</strong>`;
  };

  const mordre = (alien, cible, r) => {
    const x = alien.x + alien.l / 2 - r.left, y = alien.y + alien.h / 2 - r.top;
    cible.morsures.push(`radial-gradient(circle at ${x.toFixed(0)}px ${y.toFixed(0)}px, transparent ${10 + Math.random() * 8}px, #000 0)`);
    cible.el.style.maskImage = cible.morsures.join(',');
    cible.el.style.webkitMaskImage = cible.el.style.maskImage;
    cible.el.style.maskComposite = 'intersect';
    cible.el.style.webkitMaskComposite = 'source-in';
    if (--cible.vie <= 0) {
      cible.mangee = true;
      cible.el.style.visibility = 'hidden';               // digéré ; la mise en page ne bouge pas
    }
    alien.ox = Math.random(); alien.oy = Math.random();    // la bouchée suivante, ailleurs sur l'élément
  };

  const choisirCible = (alien) => {
    // Garde-fou : une cible devenue invisible ou sortie de la page compte comme mangée.
    zerg.cibles.forEach((c) => {
      const r = c.el.getBoundingClientRect();
      if (!c.mangee && (!c.el.isConnected || r.width * r.height === 0 || r.right < -200 || r.left > innerWidth + 200)) c.mangee = true;
    });
    const restantes = zerg.cibles.filter((c) => !c.mangee && c.apres.every((d) => d.mangee));
    if (!restantes.length) return null;
    const charge = (c) => zerg.aliens.filter((a) => a.cible === c).length;
    restantes.sort((a, b) => charge(a) - charge(b) || Math.random() - 0.5);
    return restantes[0];
  };

  const formerGG = () => {
    zerg.phase = 'gg';
    clearInterval(zerg.renforts);
    const places = [];
    const cellule = Math.min(42, (innerWidth - 32) / 12);
    const x0 = innerWidth / 2 - cellule * 5.5, y0 = innerHeight / 2 - cellule * 3.5;
    [0, 6].forEach((dx) => LETTRE_G.forEach((ligne, y) => [...ligne].forEach((c, x) => {
      if (c === '#') places.push([x0 + (x + dx) * cellule, y0 + y * cellule]);
    })));
    const vivants = zerg.aliens.filter((a) => a.etat !== 'mort');
    while (vivants.length < places.length) vivants.push(apparaitre());
    vivants.forEach((a, i) => {
      if (i < places.length) { a.place = places[i]; a.etat = 'gg'; a.cible = null; }
      else { a.etat = 'part'; }                             // les aliens en trop s'en vont
    });
    majPanneau();
    zerg.bouton.textContent = ANGLAIS ? 'Restore the page' : 'Remettre la page';
    annoncer('GG ! Les aliens ont digéré la page. Échap ou « Remettre la page » pour la retrouver.',
             'GG! The aliens have digested the page. Press Escape or “Restore the page” to get it back.');
  };

  const boucle = (t) => {
    if (!zerg) return;
    const dt = Math.min(0.05, (t - (zerg.t || t)) / 1000); zerg.t = t;
    let enPlace = 0;
    for (const a of zerg.aliens) {
      if (a.etat === 'mort') continue;
      let cx, cy, vitesse = 110;
      if (a.etat === 'gg') { [cx, cy] = a.place; vitesse = 650; }
      else if (a.etat === 'part') { cx = a.x; cy = -80; vitesse = 260; }
      else {
        if (!a.cible || a.cible.mangee) { a.cible = choisirCible(a); a.ox = Math.random(); a.oy = Math.random(); a.etat = 'va'; }
        if (!a.cible) continue;
        const r = a.cible.el.getBoundingClientRect();
        cx = r.left + a.ox * r.width - a.l / 2; cy = r.top + a.oy * r.height - a.h / 2;
        if (a.etat === 'mange' && t >= a.prochaineMorsure) {
          mordre(a, a.cible, r);
          a.prochaineMorsure = t + 300 + Math.random() * 150;
        }
      }
      const dx = cx - a.x, dy = cy - a.y, d = Math.hypot(dx, dy);
      if (d <= vitesse * dt || d < 1) {
        a.x = cx; a.y = cy;
        if (a.etat === 'va') { a.etat = 'mange'; a.prochaineMorsure = t; }
        if (a.etat === 'gg') enPlace++;
      } else {
        a.x += (dx / d) * vitesse * dt; a.y += (dy / d) * vitesse * dt;
        if (a.etat === 'mange') a.etat = 'va';
      }
      a.el.style.transform = `translate(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px)`;
    }
    if (zerg.phase === 'jeu' && zerg.cibles.every((c) => c.mangee)) formerGG();
    zerg.aliens = zerg.aliens.filter((a) => !(a.etat === 'part' && a.y < -60 && (a.el.remove(), true)));
    if (zerg.phase === 'gg' && enPlace && !zerg.ggAnnonce) { zerg.ggAnnonce = true; compter('easter-egg-zerg-rush-gg', 'Zerg rush : GG'); }
    zerg.raf = requestAnimationFrame(boucle);
  };

  const lancerZerg = () => {
    if (zerg || mondeEnvers || enMouvement) return;
    compter('easter-egg-zerg-rush', 'Zerg rush');
    if (mouvementReduit.matches) {
      annoncer('Zerg rush ! (Animation désactivée : votre appareil demande moins de mouvements.)',
               'Zerg rush! (Animation skipped: your device asks for reduced motion.)');
      return;
    }
    const zone = document.createElement('div');
    zone.className = 'zr-zone';
    zone.setAttribute('aria-hidden', 'true');
    const panneau = document.createElement('div');
    panneau.className = 'zr-panneau';
    panneau.innerHTML = '<span class="zr-score"></span><button type="button"></button>';
    document.body.append(zone, panneau);
    zerg = { zone, panneau, score: panneau.querySelector('.zr-score'), bouton: panneau.querySelector('button'),
      aliens: [], cibles: choisirCibles(), abattus: 0, clics: 0, debut: performance.now(), phase: 'jeu' };
    zerg.bouton.textContent = ANGLAIS ? 'Stop' : 'Arrêter';
    zerg.bouton.setAttribute('aria-label', ANGLAIS ? 'Stop the Zerg rush and restore the page' : 'Arrêter le Zerg rush et remettre la page');
    zerg.bouton.addEventListener('click', arreterZerg);
    for (let i = 0; i < 4; i++) apparaitre();
    zerg.renforts = setInterval(() => { if (zerg.aliens.filter((a) => a.etat !== 'mort').length < 18) apparaitre(); }, 800);
    zerg.pas = setInterval(() => zone.classList.toggle('zr-pas2'), 320);   // les pattes bougent, comme dans le jeu
    zerg.chrono = setInterval(majPanneau, 1000);
    majPanneau();
    zerg.raf = requestAnimationFrame(boucle);
    annoncer('Zerg rush ! Des aliens dévorent la page. Trois clics abattent un alien. Échap pour arrêter.',
             'Zerg rush! Aliens are eating the page. Three clicks shoot one down. Press Escape to stop.');
  };

  function arreterZerg() {
    if (!zerg) return;
    cancelAnimationFrame(zerg.raf);
    [zerg.renforts, zerg.pas, zerg.chrono].forEach(clearInterval);
    zerg.cibles.forEach(({ el }) => {
      ['maskImage', 'webkitMaskImage', 'maskComposite', 'webkitMaskComposite', 'visibility'].forEach((p) => { el.style[p] = ''; });
    });
    zerg.zone.remove(); zerg.panneau.remove();
    zerg = null;
    annoncer('La page est revenue.', 'The page is back.');
  }

  let derniereZerg = null;
  const verifierZerg = (message) => {
    const demande = ZERG.includes(message);
    if (demande && derniereZerg !== message) lancerZerg();
    derniereZerg = demande ? message : null;
  };

  /* ---------- 7 et 8. Wicked et la Force : un bouton au bord de l'écran, puis la page s'envole ---------- */
  const styleMG = document.createElement('style');
  styleMG.textContent = `
    .mg-bouton { all: unset; position: fixed; z-index: 60; right: 1rem; bottom: calc(var(--barre-h, 3rem) + 1rem);
      width: 4rem; height: 4rem; border-radius: 50%; cursor: pointer; box-shadow: 0 0.25rem 0.75rem rgb(0 0 0 / 0.3); }
    .mg-bouton svg { display: block; width: 100%; height: 100%; }
    .mg-bouton[hidden], .mg-fermer[hidden] { display: none; }
    .mg-bouton:focus-visible, .mg-fermer:focus-visible { outline: 3px solid #2e8b4e; outline-offset: 4px; }
    .mg-pulse { animation: mg-pulse 0.6s ease-out; }
    @keyframes mg-pulse { 40% { scale: 1.15; box-shadow: 0 0 1.5rem 0.5rem var(--mg-halo); } }
    .mg-fermer { all: unset; position: fixed; z-index: 63; left: 50%; bottom: calc(var(--barre-h, 3rem) + 1rem);
      translate: -50% 0; width: 3.25rem; height: 3.25rem; border-radius: 50%; display: grid; place-items: center;
      background: #14161c; color: #fff; font: 700 1.6rem/1 "Trebuchet MS", sans-serif; cursor: pointer;
      box-shadow: 0 0.25rem 0.75rem rgb(0 0 0 / 0.35); }
    .mg-zone { position: fixed; inset: 0; z-index: 61; pointer-events: none; overflow: hidden; }
    .mg-fumee, .mg-bulle { position: absolute; border-radius: 50%; animation: mg-monte var(--duree) ease-out var(--delai) forwards; opacity: 0; }
    .mg-fumee { background: radial-gradient(circle, rgb(46 160 67 / 0.55), rgb(46 160 67 / 0) 70%); filter: blur(6px); }
    .mg-bulle { border: 2px solid rgb(255 140 196 / 0.85);
      background: radial-gradient(circle at 30% 30%, rgb(255 255 255 / 0.85), rgb(255 170 210 / 0.25) 35%, rgb(255 120 190 / 0.12)); }
    @keyframes mg-monte { 0% { opacity: 0; } 12% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--dx), -115vh) scale(var(--s)); } }`;
  document.head.appendChild(styleMG);

  // Les éléments qu'on peut voir bouger : visibles à l'écran, pas en ligne dans le texte, ni cachés.
  const elementsVisibles = () => {
    const haut = document.querySelector('.barre-haut')?.getBoundingClientRect().bottom ?? 0;
    const bas = document.querySelector('.barre-bas')?.getBoundingClientRect().top ?? innerHeight;
    const liste = [];
    blocs.forEach((bloc) => bloc.querySelectorAll('h1,h2,h3,h4,p,li,label,input,select,textarea,button,img,figure,blockquote,.tag').forEach((el) => {
      if (liste.some((c) => c.contains(el))) return;
      const r = el.getBoundingClientRect(), st = getComputedStyle(el);
      if (r.width * r.height < 300 || r.bottom < haut || r.top > bas || r.right < 0 || r.left > innerWidth) return;
      if (st.display === 'inline' || st.visibility === 'hidden' || el.closest('[aria-hidden="true"], [hidden], [inert]')) return;
      liste.push(el);
    }));
    return liste.slice(0, 40);
  };

  const MAGIES = [
    {
      nom: 'wicked', phrases: ['wicked', 'elphaba', 'glinda', 'defying gravity', 'wicked defying gravity'],
      halo: 'rgb(46 160 67 / 0.6)',
      label: ANGLAIS ? 'Witch’s hat: cast the spell' : 'Chapeau de sorcière : lancer le sort',
      // Un chapeau pointu noir sur un disque vert.
      svg: `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="32" fill="#2e8b4e"/>
        <path d="M33 9 L22 40 H43 Z" fill="#141414"/><path d="M33 9 Q40 14 45 13 Q39 18 37 21 Z" fill="#141414"/>
        <rect x="23" y="34" width="19.5" height="4" fill="#ff9ccc"/><ellipse cx="32.5" cy="42" rx="20" ry="5" fill="#141414"/></svg>`,
      annonce: ['Le sort est lancé : la page défie la gravité !', 'The spell is cast: the page is defying gravity!'],
      compteur: ['easter-egg-wicked', 'Wicked : défier la gravité'],
    },
    {
      nom: 'force', phrases: ['grogu', 'baby yoda', 'la force', 'the force', 'que la force soit avec toi', 'may the force be with you'],
      halo: 'rgb(110 220 255 / 0.7)',
      label: ANGLAIS ? 'Glowing hand: use the Force' : 'Main lumineuse : utiliser la Force',
      // Une main ouverte, lumineuse, sur un disque bleu nuit.
      svg: `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="32" fill="#0f3b4c"/>
        <g fill="#c9f6ff" style="filter: drop-shadow(0 0 3px #6edcff)">
          <rect x="21" y="27" width="22" height="20" rx="8"/><rect x="21.5" y="15" width="5" height="17" rx="2.5"/>
          <rect x="27.5" y="12" width="5" height="18" rx="2.5"/><rect x="33.5" y="13" width="5" height="18" rx="2.5"/>
          <rect x="39" y="17" width="4.6" height="15" rx="2.3"/><rect x="12" y="30" width="5" height="15" rx="2.5" transform="rotate(-38 14.5 37.5)"/>
        </g></svg>`,
      annonce: ['La Force soulève un élément de la page.', 'The Force lifts a piece of the page.'],
      compteur: ['easter-egg-force', 'La Force'],
    },
  ];

  const fermer = document.createElement('button');
  fermer.type = 'button';
  fermer.className = 'mg-fermer';
  fermer.hidden = true;
  fermer.textContent = '✕';
  fermer.setAttribute('aria-label', ANGLAIS ? 'Put the page back' : 'Remettre la page en place');
  document.body.append(fermer);

  let animsMagie = [], zoneMagie = null;

  MAGIES.forEach((m) => {
    m.bouton = document.createElement('button');
    m.bouton.type = 'button';
    m.bouton.className = 'mg-bouton';
    m.bouton.hidden = true;
    m.bouton.style.setProperty('--mg-halo', m.halo);
    m.bouton.setAttribute('aria-label', m.label);
    m.bouton.innerHTML = m.svg;
    m.bouton.addEventListener('click', () => lancerMagie(m));
    document.body.append(m.bouton);
  });

  const montrerMagie = (m, oui) => {
    if (oui === !m.bouton.hidden) return;
    m.bouton.hidden = !oui;
    m.message = oui ? champ.value : null;
    if (oui) {
      m.bouton.animate([{ scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1 }], { duration: 450, easing: 'cubic-bezier(0.3, 1.6, 0.5, 1)' });
      annoncer('Un bouton est apparu en bas à droite.', 'A button has appeared at the bottom right.');
    }
  };

  const verifierMagies = (message) => MAGIES.forEach((m) => {
    if (m.phrases.includes(message)) montrerMagie(m, true);
  });

  const rafale = () => {                          // fumée verte et bulles roses qui montent
    zoneMagie ??= Object.assign(document.createElement('div'), { className: 'mg-zone' });
    zoneMagie.setAttribute('aria-hidden', 'true');
    document.body.append(zoneMagie);
    for (let i = 0; i < 40; i++) {
      const p = document.createElement('span');
      const fumee = i % 2 === 0, taille = fumee ? 8 + Math.random() * 12 : 1 + Math.random() * 2.5;
      p.className = fumee ? 'mg-fumee' : 'mg-bulle';
      p.style.cssText = `left:${Math.random() * 100}%;bottom:-${taille}${fumee ? 'vmin' : 'rem'};`
        + `width:${taille}${fumee ? 'vmin' : 'rem'};height:${taille}${fumee ? 'vmin' : 'rem'};`
        + `--dx:${(Math.random() - 0.5) * 30}vw;--s:${fumee ? 1.6 : 1};--duree:${3 + Math.random() * 3}s;--delai:${Math.random() * 1.2}s`;
      p.addEventListener('animationend', () => p.remove());
      zoneMagie.append(p);
    }
  };

  const lancerMagie = (m) => {
    m.bouton.classList.remove('mg-pulse'); void m.bouton.offsetWidth; m.bouton.classList.add('mg-pulse');
    if (mouvementReduit.matches) {
      annoncer(`${m.annonce[0]} (Animation désactivée : votre appareil demande moins de mouvements.)`,
               `${m.annonce[1]} (Animation skipped: your device asks for reduced motion.)`);
      return;
    }
    if (!m.actif) compter(...m.compteur);
    annoncer(...m.annonce);
    fermer.hidden = false;

    if (m.nom === 'wicked') {
      rafale();                                    // un nouveau clic relance la fumée et les bulles
      if (m.actif) return;
      m.actif = true;
      elementsVisibles().forEach((el, i) => {
        const h = 40 + Math.random() * 90, monte = `0 ${-h}px`;
        const envol = el.animate([{ translate: '0 0' }, { translate: monte }],
          { duration: 1600, delay: i * 45, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' });
        animsMagie.push(envol);
        envol.finished.then(() => {                // puis il flotte doucement
          if (!m.actif) return;
          animsMagie.push(el.animate([{ translate: monte }, { translate: `0 ${-h - 10}px` }],
            { duration: 1400 + Math.random() * 900, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', fill: 'forwards' }));
        }).catch(() => {});
      });
    } else {
      m.actif = true;
      // Chaque clic : un élément pas encore déplacé monte, hésite, puis retombe de travers.
      const libres = elementsVisibles().filter((el) => !el.dataset.mgForce);
      const el = libres[Math.floor(Math.random() * libres.length)];
      if (!el) return;
      el.dataset.mgForce = '1';
      const dx = (Math.random() - 0.5) * 80, dy = 10 + Math.random() * 25, r = (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 8);
      animsMagie.push(el.animate([
        { translate: '0 0', rotate: '0deg', easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
        { translate: '0 -90px', rotate: '-2deg', offset: 0.4, easing: 'ease-in-out' },
        { translate: '0 -100px', rotate: '2deg', offset: 0.62, easing: 'cubic-bezier(0.55, 0, 0.85, 0.35)' },
        { translate: `${dx}px ${dy}px`, rotate: `${r}deg`, offset: 0.92, easing: 'ease-out' },
        { translate: `${dx}px ${dy - 6}px`, rotate: `${r}deg` },
      ], { duration: 1900, fill: 'forwards' }));
    }
  };

  function fermerMagies() {
    if (!MAGIES.some((m) => m.actif) && fermer.hidden) return;
    animsMagie.forEach((a) => a.cancel()); animsMagie = [];
    document.querySelectorAll('[data-mg-force]').forEach((el) => delete el.dataset.mgForce);
    zoneMagie?.remove(); zoneMagie = null;
    MAGIES.forEach((m) => { m.actif = false; });
    fermer.hidden = true;
    annoncer('La page est revenue à sa place.', 'The page is back in place.');
    MAGIES.forEach((m) => { if (champ.value !== m.message) montrerMagie(m, false); });
  }
  fermer.addEventListener('click', fermerMagies);

  // « 42 » apparaît après un temps de réflexion : la phrase reste lisible un instant.
  // Le minuteur part dès que la phrase est complète et n'est pas relancé par la frappe suivante.
  let minuteur42 = null;
  const contientQuestion = () => GRANDE_QUESTION.some((motif) => { motif.lastIndex = 0; return motif.test(champ.value); });
  const planifier42 = () => {
    if (minuteur42 || !contientQuestion()) return;
    minuteur42 = setTimeout(() => { minuteur42 = null; remplacer(); }, DELAI_42);
  };

  champ.addEventListener('input', () => {
    if (!deLance && !de.hidden && champ.value !== messageDe) montrerDe(false); // texte modifié ou effacé : le dé s'en va tout de suite
    MAGIES.forEach((m) => { if (!m.actif && !m.bouton.hidden && champ.value !== m.message) montrerMagie(m, false); });
    planifier42(); verifierTravers(); verifierAnimations();
  });
  champ.form?.addEventListener('submit', () => { clearTimeout(minuteur42); minuteur42 = null; remplacer(); }, true); // envoi immédiat : remplacé avant le départ
  champ.form?.addEventListener('reset', () => setTimeout(() => { verifierTravers(); verifierAnimations(); })); // après l'envoi, la page se redresse

  if (MODE_TEST) console.info('[contact-eggs] Prêt : essayez « askew », « do a barrel roll », « 67 », « stranger things », « zerg rush », « wicked », « grogu » ou « Grande Question sur la vie, l’Univers et le reste ».');
})();
