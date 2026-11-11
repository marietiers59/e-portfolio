/* =====================================================================
   Apparition au défilement, sur tout le site
   ---------------------------------------------------------------------
   Chaque bloc (titre, carte, jalon de la frise, tuile de compétence…)
   entre en fondu en montant quand il arrive dans la zone visible,
   et s'efface en redescendant quand il en sort. Comme un rideau de
   théâtre : ce qui est en scène est éclairé, les coulisses restent
   dans la pénombre.

   – Web Animations API (element.animate) : rien n'écrase les transitions
     de survol ni les easter eggs, et un bloc visible n'a plus aucune
     animation sur lui (ses styles d'origine s'appliquent tels quels).
   – « Réduire les animations » sur l'appareil : simple fondu, sans
     aucun déplacement.
   – La classe html.apparition-attente (posée en tête de page) masque
     le contenu le temps que ce script prenne la main ; filet de
     sécurité : elle tombe d'elle-même au bout de 3 s.
   ===================================================================== */
(() => {
  'use strict';

  const racine = document.documentElement;
  const liberer = () => racine.classList.remove('apparition-attente');
  if (!Element.prototype.animate) { liberer(); return; }
  const mouvementReduit = matchMedia('(prefers-reduced-motion: reduce)');

  /* ----- Réglages ----- */
  const CIBLES = [
    // La une (accueil)
    '.une-portrait', '.une-entete', '.une-corps > *', '.breves > li',
    // En-têtes de section et blocs génériques
    '.section-entete > *', '.apercu-pied', '.pied-mentions',
    // Cartes, frise, compétences
    '.piliers > li', '.cartes > li', '.outils-projets', '.projets-vide', '.frise > li',
    '.nuage', '.competences-titre', '.competences-texte', '.competences-grille > li',
    // CV vidéo, accessibilité
    '.video-cadre', '.video-relais > *', '.declaration-bloc > *',
    // Pied de page : coordonnées et formulaire
    '.pied-coordonnees > *', '.formulaire > *',
  ].join(',');
  const DECALAGE_REM = 3;            // amplitude du mouvement vertical
  const DUREE_ENTREE = 1100;         // ms
  const DUREE_SORTIE = 900;          // ms (une sortie un peu plus vive qu'une entrée)
  const RETARD = 130;                // ms entre deux blocs qui entrent ensemble (effet de vague)
  const RETARD_MAX = 6;              // au-delà, plus d'attente supplémentaire
  const MARGE = 0.12;                // part de l'écran, en haut et en bas, où les blocs s'estompent
  const MARGE_MAX = 140;             // px
  const HYSTERESIS = 4;              // px : évite qu'un bloc pile au bord clignote
  const ENTREE = 'cubic-bezier(0.22, 0.8, 0.3, 1)';
  const SORTIE = 'cubic-bezier(0.45, 0, 0.55, 1)';

  /* ----- État ----- */
  let elements = [];
  const etats = new WeakMap();       // élément → { visible, anim }
  let fige = false, planifie = false, impression = false, recollecter = false;

  const decalage = () => (mouvementReduit.matches ? 0 : DECALAGE_REM * parseFloat(getComputedStyle(racine).fontSize));

  // Les blocs à animer, sans doublon imbriqué (le parent suffit) ni texte réservé aux lecteurs d'écran.
  const collecter = () => {
    const tous = [...document.querySelectorAll(CIBLES)]
      .filter((el) => !el.matches('.sr, .champ-piege') && !el.closest('.barre, dialog, .visite'));
    const ensemble = new Set(tous);
    elements = tous.filter((el) => {
      for (let p = el.parentElement; p; p = p.parentElement) if (ensemble.has(p)) return false;
      return true;
    });
    elements.forEach((el) => { if (!etats.has(el)) etats.set(el, { visible: undefined, anim: null }); });
  };

  /* ----- Les deux mouvements ----- */
  const montrer = (el, e, retard) => {
    const st = e.anim ? getComputedStyle(el) : null;           // repartir d'où il en est
    const depart = st ? { opacity: st.opacity, translate: st.translate === 'none' ? '0 0' : st.translate }
                      : { opacity: 0, translate: `0 ${decalage()}px` };
    e.anim?.cancel();
    // Une seule image clé, au départ : l'arrivée, ce sont les styles normaux du bloc.
    const anim = el.animate([{ ...depart, offset: 0 }],
      { duration: DUREE_ENTREE, delay: st ? 0 : retard, easing: ENTREE, fill: 'backwards' });
    e.anim = anim; e.visible = true;
    anim.finished.then(() => { if (e.anim === anim) e.anim = null; }).catch(() => {});
  };

  const cacher = (el, e, instantane) => {
    const st = e.anim ? getComputedStyle(el) : null;
    const images = [{ opacity: 0, translate: `0 ${decalage()}px`, offset: 1 }];
    if (st) images.unshift({ opacity: st.opacity, translate: st.translate === 'none' ? '0 0' : st.translate, offset: 0 });
    e.anim?.cancel();
    e.anim = el.animate(images, { duration: instantane ? 0 : DUREE_SORTIE, easing: SORTIE, fill: 'forwards' });
    e.visible = false;
  };

  const toutMontrer = () => {
    elements.forEach((el) => { const e = etats.get(el); e.anim?.cancel(); e.anim = null; e.visible = true; });
  };

  // Décalage vertical réellement appliqué en ce moment (pour juger de la position « au repos »).
  const decalageActuel = (el, e) => {
    if (!e.anim) return 0;
    if (!e.visible && e.anim.playState === 'finished') return decalage();
    const t = getComputedStyle(el).translate;
    return t === 'none' ? 0 : parseFloat(t.split(' ')[1] || 0) || 0;
  };

  // Pendant les easter eggs qui déplacent la page, ou une impression : tout reste affiché, rien ne bouge.
  const pageOccupee = () => impression
    || racine.matches('.gv-actif, .ng-actif, .en-mouvement')
    || !!document.querySelector('.mg-fermer:not([hidden]), .visite:not([hidden])');

  /* ----- Le cœur : qui est en scène ? ----- */
  const verifier = () => {
    planifie = false;
    if (recollecter) { recollecter = false; collecter(); }
    if (pageOccupee()) { if (!fige) { fige = true; toutMontrer(); } return; }
    fige = false;

    const rh = document.querySelector('.barre-haut')?.getBoundingClientRect();
    const rb = document.querySelector('.barre-bas')?.getBoundingClientRect();
    const haut = rh && rh.height ? Math.max(0, rh.bottom) : 0;
    const bas = rb && rb.height ? Math.min(innerHeight, rb.top) : innerHeight;
    const marge = Math.min(MARGE_MAX, (bas - haut) * MARGE);
    const debut = scrollY <= 2;
    const fin = scrollY + innerHeight >= racine.scrollHeight - 4;   // tout en bas : rien ne doit rester caché
    const zoneHaut = debut ? -Infinity : haut + marge;
    const zoneBas = fin ? Infinity : bas - marge;

    let vague = 0;
    for (const el of elements) {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) continue;                      // masqué (filtre, attribut hidden…)
      const e = etats.get(el);
      const dy = decalageActuel(el, e);
      const top = r.top - dy, bottom = r.bottom - dy;           // position au repos, sans le mouvement en cours

      if (e.visible === undefined) {                            // premier passage
        if (top < zoneBas && bottom > zoneHaut) montrer(el, e, Math.min(vague++, RETARD_MAX) * RETARD);
        else cacher(el, e, true);
        continue;
      }
      if (!e.visible && top < zoneBas - HYSTERESIS && bottom > zoneHaut + HYSTERESIS) {
        montrer(el, e, Math.min(vague++, RETARD_MAX) * RETARD);
      } else if (e.visible && (top > zoneBas + HYSTERESIS || bottom < zoneHaut - HYSTERESIS)) {
        cacher(el, e, false);
      }
    }
  };

  const planifier = () => { if (!planifie) { planifie = true; requestAnimationFrame(verifier); } };

  /* ----- Démarrage ----- */
  collecter();
  verifier();
  liberer();

  addEventListener('scroll', planifier, { passive: true });
  addEventListener('resize', planifier);
  addEventListener('load', planifier);
  // La page change de forme (carte dépliée, filtre, tri, police chargée…) : on revérifie.
  if ('ResizeObserver' in window) new ResizeObserver(planifier).observe(document.body);
  new MutationObserver((liste) => {
    if (liste.some((m) => m.type === 'childList')) recollecter = true;
    planifier();
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'open'] });
  new MutationObserver(planifier).observe(racine, { attributes: true, attributeFilter: ['class'] });

  // À l'impression, tout s'affiche.
  addEventListener('beforeprint', () => { impression = true; fige = true; toutMontrer(); });
  addEventListener('afterprint', () => { impression = false; planifier(); });
})();
