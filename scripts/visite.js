/*
  Visite guidée de l'accueil, des projets et des compétences (français et anglais)

  · Lancement : bouton ▷ de la barre du haut, ou bouton « Visite guidée » sous la présentation (accueil)
    ou sous l'introduction (Projets, Compétences).
  · Chaque halte éclaire un disque aux bords flous ; le reste de la page est voilé de noir translucide.
    Entre deux haltes, le voile s'estompe, la page défile, puis le voile revient sur la halte suivante.
  · Commandes (icônes, info-bulle au survol ou au focus) : retour au début, précédent, lecture / pause,
    suivant, ralentir, choix de la vitesse, accélérer, vitesse normale, fermer.
  · Clavier : ← et → (halte précédente / suivante), P (lecture / pause), − et + (vitesse), Échap (fermer).
  · Le voile laisse passer les clics : la page reste utilisable pendant la visite.
  · Avec « animations réduites », la page saute d'une halte à l'autre, sans défilement animé.

  Pour modifier une halte : tableau PAGES ci-dessous, une liste de haltes par page (cible = sélecteur CSS, ou liste de sélecteurs
  dont on éclaire l'ensemble). Une halte dont la cible est absente ou cachée est sautée.
*/
(() => {
  const anglais = document.documentElement.lang.toLowerCase().startsWith('en');
  const t = (fr, en) => (anglais ? en : fr);
  const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)');
  const geste = window.matchMedia('(hover: hover)').matches ? t('Survolez', 'Hover over') : t('Touchez', 'Tap');

  /* ----- Les haltes, page par page ----- */
  // repere : élément qui identifie la page ; lancement : où placer le bouton « Visite guidée » dans la page
  const RELANCE = {
    cible: '.visite-lancer-barre',
    titre: t('À vous de jouer !', 'Over to you!'),
    texte: t(
      'Merci de votre visite. Ce bouton la relance quand vous voulez.',
      'Thank you for taking the tour. This button starts it again whenever you like.'),
  };
  const lienVers = (fr, en) => `.navigation-liste a[href$="${t(fr, en)}"]`;

  const PAGES = [
    {
      repere: '.une-entete',
      lancement: (b) => document.querySelector('.une-actions')?.append(b),
      haltes: [
        {
          cible: '.une-entete',
          titre: t('Bienvenue !', 'Welcome!'),
          texte: t(
            'Je suis Marie, étudiante en <strong class="kw">BUT informatique</strong> : je conçois, développe <strong>et teste</strong> des applications. Suivez le guide !',
            'I\'m Marie, a <strong class="kw"><i lang="fr">BUT</i> in Computer Science</strong> student: I design, develop <strong>and test</strong> applications. Follow the guide!'),
        },
        {
          cible: '.navigation',
          titre: t('Le menu', 'The menu'),
          texte: t(
            'Mes <strong>projets</strong>, mes <strong>compétences</strong>, mon <strong class="kw">CV</strong> en PDF et mon CV vidéo : tout part d\'ici.',
            'My <strong>projects</strong>, my <strong>skills</strong>, my <strong class="kw">CV</strong> as a PDF and my video CV: it all starts here.'),
        },
        {
          cible: '.breve:nth-child(1)',
          titre: t('Certifiée ISTQB', 'ISTQB certified'),
          texte: t(
            'La certification internationale du <strong class="kw">test logiciel</strong>, obtenue avant mon entrée en BUT : la qualité est mon réflexe.',
            'The international <strong class="kw">software testing</strong> certification, earned before starting my degree: quality is my reflex.'),
        },
        {
          cible: '.breve:nth-child(2)',
          titre: t('Mon stage', 'My internship'),
          texte: t(
            `<strong class="kw">8 à 10 semaines</strong> à partir du 26 avril 2027. ${geste} la date : le calendrier s'affiche.`,
            `<strong class="kw">8 to 10 weeks</strong> from 26 April 2027. ${geste} the date to see the calendar.`),
        },
        {
          cible: '.breve:nth-child(3)',
          titre: t('Ma mobilité', 'Where I can work'),
          texte: t(
            `Lille, Lens, Douai et Arras. ${geste} les villes : la carte de ma zone apparaît.`,
            `Lille, Lens, Douai and Arras. ${geste} the towns to see a map of the area.`),
        },
        {
          cible: '.piliers',
          titre: t('En bref', 'In brief'),
          texte: t(
            'Ma <strong>philosophie</strong>, mon <strong>parcours</strong> et mon <strong>objectif</strong> : trois cartes qui se déplient pour en dire plus.',
            'My <strong>philosophy</strong>, my <strong>journey</strong> and my <strong>goal</strong>: three cards that unfold to tell you more.'),
        },
        {
          cible: ['#apercu-titre', '.apercu-grille'],
          titre: t('Mes compétences', 'My skills'),
          texte: t(
            'Ce que le BUT m\'a fait pratiquer. La page complète ajoute mes outils de <strong class="kw">test logiciel</strong> et un <strong>nuage de compétences</strong>.',
            'What my degree has had me practise. The full page adds my <strong class="kw">software testing</strong> tools and a <strong>skills cloud</strong>.'),
        },
        {
          cible: ['#parcours-titre', '.frise-legende', '.frise-etape:first-child'],
          titre: t('Mon parcours', 'My journey'),
          texte: t(
            'Une frise du plus récent au plus ancien : les <strong>projets</strong> et les <strong>formations</strong>, chacun avec sa couleur.',
            'A timeline from newest to oldest: <strong>projects</strong> and <strong>education</strong>, each in its own colour.'),
        },
        {
          cible: '.pied-coordonnees',
          titre: t('Me contacter', 'Contact me'),
          texte: t(
            'Le <strong>formulaire</strong>, LinkedIn ou GitHub : à vous de choisir. Mon e-mail et mon téléphone sont réservés aux <strong class="kw">recruteurs</strong>.',
            'The <strong>form</strong>, LinkedIn or GitHub: your choice. My email address and phone number are kept for <strong class="kw">recruiters</strong>.'),
        },
        {
          cible: ['.langue', '.theme'],
          titre: t('Langue et thème', 'Language and theme'),
          texte: t(
            'Le site existe aussi <strong>en anglais</strong> et en <strong>thème sombre</strong> : un clic sur les drapeaux ou sur le soleil.',
            'The site also comes <strong>in French</strong> and in a <strong>dark theme</strong>: one click on the flags or on the sun.'),
        },
        RELANCE,
      ],
    },
    {
      repere: '.cartes .carte-emplacement',
      lancement: lancementSousIntro,
      haltes: [
        {
          cible: ['#titre-principal', '.section-intro'],
          titre: t('Mes projets', 'My projects'),
          texte: t(
            'Travaux d\'<strong>équipe</strong> ou en <strong>solo</strong>, de cours ou personnels : chaque carte raconte une étape de mon apprentissage.',
            '<strong>Team</strong> or <strong>solo</strong> work, coursework or personal: each card tells one step of my learning journey.'),
        },
        {
          cible: '.filtres',
          titre: t('Les filtres', 'The filters'),
          texte: t(
            'Un clic pour ne garder que les projets de <strong class="kw">BUT 2</strong>, de <strong class="kw">BUT 1</strong> ou mes <strong>projets perso</strong>.',
            'One click to keep only <strong class="kw">second-year</strong>, <strong class="kw">first-year</strong> or <strong>personal</strong> projects.'),
        },
        {
          cible: '.bascule',
          titre: t('Bientôt en ligne', 'Coming soon'),
          texte: t(
            'Cochez pour voir aussi les projets dont le dépôt est encore <strong>en préparation</strong>.',
            'Tick to also see the projects whose repository is still <strong>being prepared</strong>.'),
        },
        {
          cible: '#bouton-tri',
          titre: t('Le tri', 'Sorting'),
          texte: t(
            'Du plus récent au plus ancien, ou l\'inverse : voyez mon code <strong>mûrir</strong> d\'un projet à l\'autre.',
            'Newest first, or oldest first: watch my code <strong>mature</strong> from one project to the next.'),
        },
        {
          cible: '.carte-emplacement',
          titre: t('Une carte projet', 'A project card'),
          texte: t(
            `${geste} une carte : elle se déplie avec les <strong>technologies</strong>, un résumé et le lien vers le <strong class="kw">code</strong>.`,
            `${geste} a card: it unfolds to show the <strong>technologies</strong>, a summary and the link to the <strong class="kw">code</strong>.`),
        },
        {
          cible: '.carte-emplacement:has(.carte-web)',
          titre: t('Les sites web', 'Websites'),
          texte: t(
            'Les cartes <strong>site web</strong> ouvrent le site en ligne : il se visite directement dans le navigateur.',
            '<strong>Website</strong> cards open the live site: you can browse it straight away.'),
        },
        {
          cible: lienVers('competences.html', 'skills.html'),
          titre: t('Et ensuite ?', 'What next?'),
          texte: t(
            'Mes <strong>compétences</strong> ont leur page, et leur propre visite guidée.',
            'My <strong>skills</strong> have their own page, and their own guided tour.'),
        },
        RELANCE,
      ],
    },
    {
      repere: '.section-competences',
      lancement: lancementSousIntro,
      haltes: [
        {
          cible: ['#titre-principal', '.section-intro'],
          titre: t('Mes compétences', 'My skills'),
          texte: t(
            'Une double culture <strong class="kw">développement</strong> et <strong class="kw">test logiciel</strong>, présentée de deux façons : en réseau, puis par catégorie.',
            'A dual background in <strong class="kw">development</strong> and <strong class="kw">software testing</strong>, shown two ways: as a network, then by category.'),
        },
        {
          cible: '.nuage-apercu',
          titre: t('Le nuage de compétences', 'The skills cloud'),
          texte: t(
            'Mes <strong>projets</strong>, leurs <strong>outils</strong> et les compétences du BUT, reliés comme un réseau. Un clic l\'agrandit.',
            'My <strong>projects</strong>, their <strong>tools</strong> and my degree\'s competencies, linked as a network. One click enlarges it.'),
        },
        {
          cible: '.nuage-legende .nuage-puces',
          titre: t('Les compétences du BUT', 'The degree\'s competencies'),
          texte: t(
            'Chacune a sa couleur. Cliquez-en une : le nuage s\'agrandit et la met en <strong>évidence</strong>.',
            'Each has its own colour. Click one: the cloud enlarges and <strong>highlights</strong> it.'),
        },
        {
          cible: 'section[aria-labelledby="cat-test"]',
          titre: t('Test et qualité', 'Testing and quality'),
          texte: t(
            'Ma spécialité, en tête de liste. Chaque catégorie se <strong>lit</strong> en une phrase ou se <strong>voit</strong> d\'un coup d\'œil, logo par logo.',
            'My speciality, first on the list. Each category can be <strong>read</strong> in one sentence or <strong>seen</strong> at a glance, logo by logo.'),
        },
        {
          cible: 'section[aria-labelledby="cat-langages"]',
          titre: t('Langages', 'Programming languages'),
          texte: t(
            'Du <i lang="en">back-end</i> au <i lang="en">front-end</i>, en passant par les scripts et les bases de données.',
            'From back end to front end, including scripts and databases.'),
        },
        {
          cible: 'section[aria-labelledby="cat-langues"]',
          titre: t('Langues', 'Languages'),
          texte: t(
            '<strong>Anglais</strong> professionnel et technique, <strong>espagnol</strong> courant : de quoi travailler en équipe internationale.',
            'Professional and technical <strong>English</strong>, fluent <strong>Spanish</strong>: ready for an international team.'),
        },
        {
          cible: '.apercu-pied',
          titre: t('À l\'œuvre', 'In action'),
          texte: t(
            'Retrouvez ces compétences dans mes <strong>projets</strong>, ou téléchargez mon <strong class="kw">CV</strong>.',
            'See these skills at work in my <strong>projects</strong>, or download my <strong class="kw">CV</strong>.'),
        },
        RELANCE,
      ],
    },
  ];

  // Projets et Compétences : bouton « Visite guidée » sous l'introduction de la page
  function lancementSousIntro(b) {
    const entete = document.querySelector('.section-entete');
    if (!entete) return;
    const p = document.createElement('p');
    p.className = 'visite-lancement';
    p.append(b);
    entete.append(p);
  }

  const page = PAGES.find((p) => document.querySelector(p.repere));
  if (!page) return;
  const HALTES = page.haltes;

  const VITESSES = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
  const formatVitesse = (v) => `${v.toLocaleString(anglais ? 'en-GB' : 'fr-FR')}×`;

  /* ----- Icônes (traits arrondis, comme le soleil et la lune du thème) ----- */
  const svg = (contenu) => `<svg class="visite-icone" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${contenu}</svg>`;
  const ICONES = {
    lancer:   svg('<circle class="contour" cx="12" cy="12" r="9.2"/><path d="M10 8.3v7.4l5.6-3.7z"/>'),
    debut:    svg('<path d="M5 6v12"/><path d="M12.5 6.5v11L7.5 12z"/><path d="M19.5 6.5v11L14.5 12z"/>'),
    precedent: svg('<path class="contour" d="M15 5.5 8.5 12l6.5 6.5"/>'),
    suivant:  svg('<path class="contour" d="M9 5.5l6.5 6.5L9 18.5"/>'),
    lecture:  svg('<path d="M8 5.5v13L18.5 12z"/>'),
    pause:    svg('<path d="M8.5 6v12"/><path d="M15.5 6v12"/>'),
    rejouer:  svg('<path class="contour" d="M5 12a7 7 0 1 0 2.1-5"/><path d="M4.5 4.5v4h4z"/>'),
    moins:    svg('<path d="M6 12h12"/>'),
    plus:     svg('<path d="M6 12h12"/><path d="M12 6v12"/>'),
    normale:  svg('<path class="contour" d="M4 16.5a8 8 0 1 1 16 0"/><path d="M12 16.5V9.5"/><circle cx="12" cy="16.5" r="1.3"/>'),
  };

  /* ----- Boutons de lancement : barre du haut et dans la page ----- */
  const lanceurs = [];
  const barre = document.querySelector('.barre-haut');
  if (barre) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'visite-lancer visite-lancer-barre';
    b.setAttribute('aria-label', t('Visite guidée', 'Guided tour'));
    b.dataset.infobulle = t('Visite guidée', 'Guided tour');
    b.dataset.bulle = 'bas';
    b.innerHTML = ICONES.lancer;
    const theme = barre.querySelector('.theme');
    (theme ?? barre.querySelector('.langue'))?.after(b);
    lanceurs.push(b);
  }
  {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bouton bouton-second visite-lancer visite-lancer-une';
    b.innerHTML = `${ICONES.lancer}${t('Visite guidée', 'Guided tour')}`;
    page.lancement(b);
    if (b.isConnected) lanceurs.push(b);
  }

  /* ----- Voile et panneau de commande (créés une fois, au premier lancement) ----- */
  let racine, voile, panneau, message, titre, texte, compteur, barreProgression, select, boutons;

  function construire() {
    racine = document.createElement('div');
    racine.className = 'visite';
    racine.hidden = true;
    const bouton = (nom, etiquette, raccourci, extra = '') => `
      <button class="visite-bouton visite-${nom}" type="button" data-action="${nom}"
        aria-label="${etiquette}"${raccourci ? ` aria-keyshortcuts="${raccourci}"` : ''} ${extra}>${ICONES[nom] ?? ''}</button>`;
    racine.innerHTML = `
      <div class="visite-voile" aria-hidden="true"></div>
      <section class="visite-panneau" aria-label="${t('Visite guidée', 'Guided tour')}" data-pas-de-balayage>
        <div class="visite-tete">
          <p class="visite-compteur"></p>
          <button class="visite-bouton visite-fermer" type="button" data-action="fermer"
            aria-label="${t('Fermer la visite', 'Close the tour')}" aria-keyshortcuts="Escape"
            data-infobulle="${t('Fermer la visite (Échap)', 'Close the tour (Esc)')}" data-bulle="fin">×</button>
        </div>
        <div class="visite-message" aria-live="polite" aria-atomic="true">
          <p class="visite-titre"></p>
          <p class="visite-texte"></p>
        </div>
        <div class="visite-progression" aria-hidden="true"><span></span></div>
        <div class="visite-commandes" role="group" aria-label="${t('Commandes de la visite', 'Tour controls')}">
          <div class="visite-groupe">
            ${bouton('debut', t('Retour au début', 'Back to the start'), '', `data-infobulle="${t('Retour au début', 'Back to the start')}" data-bulle="debut"`)}
            ${bouton('precedent', t('Précédent', 'Previous'), 'ArrowLeft', `data-infobulle="${t('Précédent (←)', 'Previous (←)')}"`)}
            ${bouton('lecture', t('Pause', 'Pause'), 'P', `data-infobulle="${t('Pause (P)', 'Pause (P)')}"`)}
            ${bouton('suivant', t('Suivant', 'Next'), 'ArrowRight', `data-infobulle="${t('Suivant (→)', 'Next (→)')}"`)}
          </div>
          <div class="visite-groupe">
            ${bouton('moins', t('Ralentir', 'Slower'), '-', `data-infobulle="${t('Ralentir (−)', 'Slower (−)')}"`)}
            <span class="visite-vitesse" data-infobulle="${t('Choisir la vitesse', 'Choose the speed')}">
              <select aria-label="${t('Vitesse', 'Speed')}">
                ${VITESSES.map((v) => `<option value="${v}">${formatVitesse(v)}</option>`).join('')}
              </select>
            </span>
            ${bouton('plus', t('Accélérer', 'Faster'), '+', `data-infobulle="${t('Accélérer (+)', 'Faster (+)')}"`)}
            ${bouton('normale', t('Vitesse normale', 'Normal speed'), '', `data-infobulle="${t('Vitesse normale (1×)', 'Normal speed (1×)')}" data-bulle="fin"`)}
          </div>
        </div>
      </section>`;
    document.body.append(racine);

    voile = racine.querySelector('.visite-voile');
    panneau = racine.querySelector('.visite-panneau');
    message = racine.querySelector('.visite-message');
    titre = racine.querySelector('.visite-titre');
    texte = racine.querySelector('.visite-texte');
    compteur = racine.querySelector('.visite-compteur');
    barreProgression = racine.querySelector('.visite-progression');
    select = racine.querySelector('select');
    boutons = Object.fromEntries([...racine.querySelectorAll('[data-action]')].map((b) => [b.dataset.action, b]));
    select.value = '1';

    racine.addEventListener('click', (e) => {
      const b = e.target.closest('[data-action]');
      if (!b || b.getAttribute('aria-disabled') === 'true') return;
      ACTIONS[b.dataset.action]?.();
    });
    select.addEventListener('change', () => regler(Number(select.value)));
  }

  /* ----- État ----- */
  let haltes = [];          // haltes dont la cible est visible au lancement
  let index = 0;
  let lecture = false;
  let vitesse = 1;
  let ecoule = 0;           // temps passé sur la halte, en millisecondes « vitesse normale »
  let visible = false;      // disque affiché (hors transition)
  let jeton = 0;            // annule une transition dépassée par un nouveau clic
  let boucle = null, dernier = null, lanceur = null, majPrevue = false;

  const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const fondu = () => (mouvementReduit.matches ? 120 : Math.round(420 / Math.sqrt(vitesse)));
  const texteBrut = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent; };
  const dureeHalte = () => haltes[index].duree;     // temps de lecture, à vitesse normale

  /* ----- Géométrie ----- */
  const estVisible = (el) => el.getClientRects().length > 0 && !el.closest('[hidden]');
  const cibles = (h) => [h.cible].flat()
    .map((sel) => [...document.querySelectorAll(sel)].find(estVisible))   // premier élément visible (cartes filtrées…)
    .filter(Boolean);

  function rectangle(els) {
    const r = els.map((el) => el.getBoundingClientRect());
    const haut = Math.min(...r.map((x) => x.top)), bas = Math.max(...r.map((x) => x.bottom));
    const gauche = Math.min(...r.map((x) => x.left)), droite = Math.max(...r.map((x) => x.right));
    return { top: haut, bottom: bas, left: gauche, right: droite, width: droite - gauche, height: bas - haut };
  }

  const estFixe = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      if (getComputedStyle(n).position === 'fixed') return true;
    }
    return false;
  };

  // Bande d'écran où la halte doit apparaître : entre la barre du haut et le panneau (ou l'inverse)
  function zone() {
    const hBarre = document.querySelector('.barre-haut')?.offsetHeight ?? 48;
    const hBas = document.querySelector('.barre-bas')?.offsetHeight ?? 48;
    const p = panneau.getBoundingClientRect();
    return panneau.classList.contains('visite-en-haut')
      ? { haut: p.bottom + 8, bas: innerHeight - hBas - 8 }
      : { haut: hBarre + 8, bas: p.top - 8 };
  }

  // Défile pour centrer la halte dans la zone libre ; se résout quand la page est immobile
  function defilerVers(els) {
    if (!els.length || els.some(estFixe)) return Promise.resolve();
    const r = rectangle(els);
    const { haut, bas } = zone();
    const hauteur = bas - haut;
    const delta = r.height <= hauteur ? (r.top + r.height / 2) - (haut + hauteur / 2) : r.top - haut;
    const max = document.documentElement.scrollHeight - innerHeight;
    const but = Math.max(0, Math.min(max, scrollY + delta));
    if (Math.abs(but - scrollY) < 2) return Promise.resolve();

    return new Promise((ok) => {
      let fini = false, precedent = -1, immobile = 0;
      const finir = () => {
        if (fini) return;
        fini = true;
        clearInterval(sonde); clearTimeout(limite);
        removeEventListener('scrollend', finir);
        ok();
      };
      addEventListener('scrollend', finir);
      const sonde = setInterval(() => {                 // repli pour les navigateurs sans « scrollend »
        if (Math.abs(scrollY - precedent) < 1) { if (++immobile >= 3) finir(); } else immobile = 0;
        precedent = scrollY;
      }, 70);
      const limite = setTimeout(finir, 1600);
      window.scrollTo({ top: but, behavior: mouvementReduit.matches ? 'instant' : 'smooth' });
    });
  }

  // Place le disque sur la partie visible de la halte ; bascule le panneau en haut s'il la cache trop
  function placerTrou(autoriserBascule = false) {
    const els = cibles(haltes[index]);
    if (!els.length) return;
    const r = rectangle(els);
    let { haut, bas } = zone();
    const fixe = els.some(estFixe);
    if (fixe) { haut = 0; bas = innerHeight; }
    let vHaut = Math.max(r.top, haut), vBas = Math.min(r.bottom, bas);

    if (autoriserBascule && !fixe && !panneau.classList.contains('visite-en-haut')
        && (vBas - vHaut) < Math.min(r.height, bas - haut) * 0.6) {
      panneau.classList.add('visite-en-haut');
      ({ haut, bas } = zone());
      vHaut = Math.max(r.top, haut); vBas = Math.min(r.bottom, bas);
    }
    if (vBas < vHaut) { vHaut = r.top; vBas = r.bottom; }   // halte hors champ (défilement manuel) : on la suit quand même

    const vGauche = Math.max(r.left, 0), vDroite = Math.min(r.right, innerWidth);
    const x = (vGauche + vDroite) / 2, y = (vHaut + vBas) / 2;
    const plafond = Math.max(60, Math.min(innerWidth * 0.55, innerHeight * 0.48));
    const rayon = Math.max(44, Math.min(plafond, Math.hypot(vDroite - vGauche, vBas - vHaut) / 2 + 14));
    const flou = Math.min(110, Math.max(28, rayon * 0.35));
    voile.style.setProperty('--x', `${x}px`);
    voile.style.setProperty('--y', `${y}px`);
    voile.style.setProperty('--r', `${rayon}px`);
    voile.style.setProperty('--f', `${flou}px`);
  }

  // Défilement manuel ou redimensionnement : le disque suit la halte
  function suivre() {
    if (majPrevue || racine.hidden) return;
    majPrevue = true;
    requestAnimationFrame(() => { majPrevue = false; placerTrou(false); });
  }

  /* ----- Déroulement ----- */
  function remplir() {
    const h = haltes[index];
    titre.textContent = h.titre;
    texte.innerHTML = h.texte;
    compteur.textContent = `${index + 1} / ${haltes.length}`;
  }

  function majBoutons() {
    const fin = index === haltes.length - 1;
    const desactiver = (b, oui) => b.setAttribute('aria-disabled', String(oui));
    desactiver(boutons.debut, index === 0);
    desactiver(boutons.precedent, index === 0);
    desactiver(boutons.suivant, fin);
    desactiver(boutons.moins, vitesse === VITESSES[0]);
    desactiver(boutons.plus, vitesse === VITESSES.at(-1));
    desactiver(boutons.normale, vitesse === 1);

    const termine = fin && !lecture && ecoule >= dureeHalte();
    const etat = lecture ? 'pause' : termine ? 'rejouer' : 'lecture';
    const libelles = {
      pause:   [t('Pause', 'Pause'), t('Pause (P)', 'Pause (P)')],
      lecture: [t('Lecture', 'Play'), t('Lecture (P)', 'Play (P)')],
      rejouer: [t('Rejouer depuis le début', 'Replay from the start'), t('Rejouer (P)', 'Replay (P)')],
    }[etat];
    const b = boutons.lecture;
    if (b.dataset.etat !== etat) {
      b.dataset.etat = etat;
      b.innerHTML = ICONES[etat];
    }
    b.setAttribute('aria-label', libelles[0]);
    b.dataset.infobulle = libelles[1];
  }

  async function aller(i) {
    const moi = ++jeton;
    index = Math.max(0, Math.min(haltes.length - 1, i));
    ecoule = 0;
    barreProgression.style.setProperty('--p', 0);
    visible = false;
    majBoutons();

    racine.classList.add('en-transit');                 // le voile s'estompe : retour à la page normale
    racine.style.setProperty('--visite-fondu', `${fondu()}ms`);
    await attendre(fondu());
    if (moi !== jeton) return;

    remplir();
    panneau.classList.remove('visite-en-haut');
    await defilerVers(cibles(haltes[index]));
    if (moi !== jeton) return;

    placerTrou(true);
    racine.classList.remove('en-transit');              // le voile revient, troué sur la nouvelle halte
    await attendre(fondu());
    if (moi !== jeton) return;
    visible = true;
  }

  function tic(maintenant) {
    boucle = requestAnimationFrame(tic);
    const dt = dernier === null ? 0 : Math.min(100, maintenant - dernier);
    dernier = maintenant;
    if (!lecture || !visible || document.querySelector('dialog[open]')) return;   // en attente pendant une vue agrandie
    ecoule += dt * vitesse;
    barreProgression.style.setProperty('--p', Math.min(1, ecoule / dureeHalte()));
    if (ecoule < dureeHalte()) return;
    if (index < haltes.length - 1) {
      aller(index + 1);
    } else {
      lecture = false;
      majBoutons();
    }
  }

  function regler(v) {
    vitesse = v;
    select.value = String(v);
    racine.style.setProperty('--visite-fondu', `${fondu()}ms`);
    majBoutons();
  }
  const pasVitesse = (sens) => {
    const i = VITESSES.indexOf(vitesse) + sens;
    if (i >= 0 && i < VITESSES.length) regler(VITESSES[i]);
  };

  const ACTIONS = {
    debut: () => aller(0),
    precedent: () => { if (index > 0) aller(index - 1); },
    suivant: () => { if (index < haltes.length - 1) aller(index + 1); },
    lecture: () => {
      const termine = index === haltes.length - 1 && ecoule >= dureeHalte();
      if (termine) { lecture = true; aller(0); return; }
      lecture = !lecture;
      majBoutons();
    },
    moins: () => pasVitesse(-1),
    plus: () => pasVitesse(1),
    normale: () => regler(1),
    fermer: () => fermer(),
  };

  function clavier(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'Escape') { fermer(); return; }
    if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const touche = { ArrowRight: 'suivant', ArrowLeft: 'precedent', p: 'lecture', P: 'lecture', '+': 'plus', '-': 'moins', '−': 'moins' }[e.key];
    if (!touche) return;
    e.preventDefault();
    ACTIONS[touche]();
  }

  /* ----- Ouverture et fermeture ----- */
  function ouvrir(depuis) {
    if (!racine) construire();
    if (!racine.hidden && !racine.classList.contains('en-fermeture')) { boutons.lecture.focus(); return; }
    haltes = HALTES.filter((h) => cibles(h).length).map((h) => ({ ...h, duree: 2200 + 55 * texteBrut(h.texte).length }));
    if (!haltes.length) return;
    lanceur = depuis;
    lecture = true;
    racine.classList.add('en-transit', 'en-fermeture');
    racine.hidden = false;
    document.body.setAttribute('data-pas-de-balayage', '');   // pas de changement de page au doigt pendant la visite
    requestAnimationFrame(() => racine.classList.remove('en-fermeture'));
    addEventListener('scroll', suivre, { passive: true });
    addEventListener('resize', suivre);
    document.addEventListener('keydown', clavier);
    dernier = null;
    boucle = requestAnimationFrame(tic);
    boutons.lecture.focus({ preventScroll: true });
    aller(0);
  }

  async function fermer() {
    if (!racine || racine.hidden) return;
    jeton++;
    lecture = false;
    visible = false;
    cancelAnimationFrame(boucle);
    removeEventListener('scroll', suivre);
    removeEventListener('resize', suivre);
    document.removeEventListener('keydown', clavier);
    document.body.removeAttribute('data-pas-de-balayage');
    racine.classList.add('en-fermeture');
    const moi = jeton;
    lanceur?.focus({ preventScroll: true });
    await attendre(fondu());
    if (moi === jeton) racine.hidden = true;
  }

  lanceurs.forEach((b) => b.addEventListener('click', () => ouvrir(b)));
})();
