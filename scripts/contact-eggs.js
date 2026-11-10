/* Easter eggs du champ « Message » du formulaire de contact
   1. « (La) réponse à la (grande) question sur la vie, l'univers et le reste » ou « (The) answer to
      (the ultimate question of) life, the universe and everything » devient « 42 » (Douglas Adams).
   2. Un message réduit à « askew », un synonyme ou une traduction française
      fait pencher la page, comme la recherche « askew » sur Google.
   3. Un message réduit à « do a barrel roll » (ou « fais un tonneau ») fait faire
      un tour complet à la page, comme sur Google : 360° en 4 s, une seule fois.
   4. Un message réduit à « 67 » (ou « 6-7 », « six seven », « six-sept ») fait tanguer
      la page en bascule, comme sur Google, au rythme du mème « 6-7 ».
   5. Un message réduit à « stranger things » fait apparaître un dé à 20 faces, comme sur Google.
      Lancé, il tombe sur 1 : fissure rouge, éclair, la page s'assombrit sous les cendres et passe
      tête en bas (le Monde à l'envers). Une croix rouge en bas (ou Échap) ramène la page à l'endroit.
   Intégration : <script src="scripts/contact-eggs.js?v=9" defer></script> dans le <head>.
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

  let deLance = false, mondeEnvers = false, cendres = null, voiles = [];
  const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

  const montrerDe = (oui) => {
    if (mondeEnvers || deLance || oui === !de.hidden) return;
    de.hidden = !oui;
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
    if (deLance || mondeEnvers) return;
    deLance = true;
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
    verifierStranger(simplifier(champ.value));     // le dé revient si le message le demande toujours
  };

  const verifierStranger = (message) => montrerDe(STRANGER.includes(message));

  de.addEventListener('click', lancerDe);
  retour.addEventListener('click', revenir);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') revenir(); });

  // « 42 » apparaît après un temps de réflexion : la phrase reste lisible un instant.
  // Le minuteur part dès que la phrase est complète et n'est pas relancé par la frappe suivante.
  let minuteur42 = null;
  const contientQuestion = () => GRANDE_QUESTION.some((motif) => { motif.lastIndex = 0; return motif.test(champ.value); });
  const planifier42 = () => {
    if (minuteur42 || !contientQuestion()) return;
    minuteur42 = setTimeout(() => { minuteur42 = null; remplacer(); }, DELAI_42);
  };

  champ.addEventListener('input', () => { planifier42(); verifierTravers(); verifierAnimations(); });
  champ.form?.addEventListener('submit', () => { clearTimeout(minuteur42); minuteur42 = null; remplacer(); }, true); // envoi immédiat : remplacé avant le départ
  champ.form?.addEventListener('reset', () => setTimeout(() => { verifierTravers(); verifierAnimations(); })); // après l'envoi, la page se redresse

  if (MODE_TEST) console.info('[contact-eggs] Prêt : essayez « askew », « do a barrel roll », « 67 », « stranger things » ou « Grande Question sur la vie, l’Univers et le reste ».');
})();
