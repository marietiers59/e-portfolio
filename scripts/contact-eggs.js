/* Easter eggs du champ « Message » du formulaire de contact
   1. « Grande Question sur la vie, l'Univers et le reste » (ou sa version anglaise)
      devient « 42 », la réponse calculée par Pensée profonde (Douglas Adams).
   2. Un message réduit à « askew », un synonyme ou une traduction française
      fait pencher la page, comme la recherche « askew » sur Google.
   Intégration : <script src="scripts/contact-eggs.js?v=4" defer></script> dans le <head>.
   Mode test : ajouter ?bug-test à l'adresse (rien n'est compté dans GoatCounter). */
(() => {
  const champ = document.querySelector('#formulaire-contact textarea[name="message"]');
  if (!champ) return;

  const MODE_TEST = new URLSearchParams(location.search).has('bug-test');
  const ANGLAIS = document.documentElement.lang.startsWith('en');

  /* ---------- Réglages ---------- */
  const ANGLE = '1deg';                  // l'inclinaison de Google
  const DELAI_42 = 1200;                 // ms entre la fin de la phrase et l’apparition de « 42 » (au moins 1 s)

  // Les phrases remplacées par « 42 » : majuscules, apostrophes, virgules et espaces indifférents.
  const APOS = "['’ʼ‘`´]";
  const GRANDE_QUESTION = [
    new RegExp(`grande\\s+question\\s+sur\\s+la\\s+vie\\s*,?\\s*l\\s*${APOS}?\\s*univers\\s*,?\\s*(?:et|&)\\s+(?:tout\\s+)?le\\s+reste(?![\\p{L}\\p{N}])`, 'giu'),
    new RegExp(`ultimate\\s+question\\s+of\\s+life\\s*,?\\s*the\\s+universe\\s*,?\\s*(?:and|&)\\s+everything(?![\\p{L}\\p{N}])`, 'giu'),
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
    html.de-travers, html.de-travers body { overflow-x: hidden; }
    html.de-travers .penchable { rotate: var(--angle-travers, ${ANGLE}); }`; // net et instantané, sans fondu
  document.head.appendChild(style);

  const blocs = [...document.querySelectorAll('body > header, body > main, body > footer')];
  blocs.forEach((bloc) => bloc.classList.add('penchable'));
  let penchee = false;

  const pencher = (oui) => {
    if (oui === penchee) return;
    penchee = oui;
    if (oui) {
      // Tous les blocs tournent autour du même point (le centre de l'écran), comme une seule feuille.
      const cx = document.documentElement.clientWidth / 2;
      const cy = innerHeight / 2;
      blocs.forEach((bloc) => {
        const r = bloc.getBoundingClientRect();
        bloc.style.transformOrigin = `${cx - r.left}px ${cy - r.top}px`;
      });
      annoncer('La page penche… comme demandé.', 'The page is now askew… as requested.');
      compter('easter-egg-askew', 'Page de travers');
    }
    document.documentElement.classList.toggle('de-travers', oui);
  };

  const verifierTravers = () => pencher(DE_TRAVERS.includes(simplifier(champ.value)));

  // « 42 » apparaît après un temps de réflexion : la phrase reste lisible un instant.
  // Le minuteur part dès que la phrase est complète et n'est pas relancé par la frappe suivante.
  let minuteur42 = null;
  const contientQuestion = () => GRANDE_QUESTION.some((motif) => { motif.lastIndex = 0; return motif.test(champ.value); });
  const planifier42 = () => {
    if (minuteur42 || !contientQuestion()) return;
    minuteur42 = setTimeout(() => { minuteur42 = null; remplacer(); }, DELAI_42);
  };

  champ.addEventListener('input', () => { planifier42(); verifierTravers(); });
  champ.form?.addEventListener('submit', () => { clearTimeout(minuteur42); minuteur42 = null; remplacer(); }, true); // envoi immédiat : remplacé avant le départ
  champ.form?.addEventListener('reset', () => setTimeout(verifierTravers)); // après l'envoi, la page se redresse

  if (MODE_TEST) console.info('[contact-eggs] Prêt : essayez « askew » ou « Grande Question sur la vie, l’Univers et le reste ».');
})();
