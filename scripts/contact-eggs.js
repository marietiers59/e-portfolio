/* Easter eggs du champ « Message » du formulaire de contact
   1. « (La) réponse à la (grande) question sur la vie, l'univers et le reste » ou « (The) answer to
      (the ultimate question of) life, the universe and everything » devient « 42 » (Douglas Adams).
   2. Un message réduit à « askew », un synonyme ou une traduction française
      fait pencher la page, comme la recherche « askew » sur Google.
   3. Un message réduit à « do a barrel roll » (ou « fais un tonneau ») fait faire
      un tour complet à la page, comme sur Google : 360° en 4 s, une seule fois.
   4. Un message réduit à « 67 » (ou « 6-7 », « six seven », « six-sept ») fait tanguer
      la page en bascule, comme sur Google, au rythme du mème « 6-7 ».
   Intégration : <script src="scripts/contact-eggs.js?v=8" defer></script> dans le <head>.
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
      for (const anim of ANIMATIONS) {
        const demande = anim.phrases.includes(message);
        if (demande && demandes.get(anim) !== message) animerPage(anim); // nouvelle phrase, ou retapée
        demandes.set(anim, demande ? message : null);
      }
    }, PAUSE_ANIMATION);
  };

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

  if (MODE_TEST) console.info('[contact-eggs] Prêt : essayez « askew », « do a barrel roll », « 67 » ou « Grande Question sur la vie, l’Univers et le reste ».');
})();
