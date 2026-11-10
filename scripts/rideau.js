/* =====================================================================
   rideau.js — coordonnées réservées aux recruteurs
   ---------------------------------------------------------------------
   Un « rideau » cache l'e-mail, le téléphone et le CV complet.
   Il se lève tout seul avec un laissez-passer (jusqu'à la fermeture du navigateur) :
     1. code QR remis en main propre (?cle=…) ;
     2. lien marqué que Marie diffuse (?via=linkedin, ?via=annonce…) ;
     3. arrivée depuis LinkedIn, France Travail ou un site d'annonces ;
     4. réseau d'entreprise ou d'administration (adresse IP, via ipapi.is) ;
     5. e-mail professionnel saisi par le visiteur.
   Sinon, le visiteur voit un petit formulaire « e-mail professionnel ».
   C'est un rideau, pas un coffre-fort : il arrête les robots et les
   curieux pressés, pas une personne déterminée qui lit ce code.
   Ce fichier doit être chargé AVANT script.js (attribut defer).
   Textes en français ou en anglais britannique, selon <html lang="…">.
   ===================================================================== */
(() => {
  'use strict';

  const ANGLAIS = document.documentElement.lang.toLowerCase().startsWith('en');
  const t = (fr, en) => (ANGLAIS ? en : fr);

  /* ---------- 1. Réglages ---------- */
  // Nom du fichier téléchargé par le visiteur (à ton choix), pour chaque langue
  const NOM_CV = t('CV_TIERS_MARIE_BUT_IT.pdf', 'CV_TIERS_MARIE_BUT_IT_EN.pdf');
  // Le rideau reste levé jusqu'à la fermeture du navigateur (cookie de session), sauf sur l'appareil
  // de Marie, reconnu par la case « ne pas me compter » de son espace personnel : toujours levé.
  const CLE_STOCKAGE = 'portfolio-rideau';
  const CLE_APPAREIL_MARIE = 'portfolio-ne-pas-me-compter';
  const MESSAGE_MERCI = t('Merci de votre intérêt ! Mes coordonnées et mon CV complet sont maintenant disponibles.',
                          'Thank you for your interest! My contact details and full CV are now available.');
  const DUREE_MERCI = 6000;                       // la fenêtre de remerciement disparaît après 6 s
  const LINKEDIN = document.querySelector('.coordonnees a[href*="linkedin.com"]')?.href
    || 'https://www.linkedin.com/in/marie-tiers-1991-59-France';
  const VIA_ACCEPTES = ['linkedin', 'annonce', 'francetravail', 'candidature'];

  // Sites d'origine qui lèvent le rideau (le domaine ou un sous-domaine)
  const ORIGINES = [
    'linkedin.com', 'lnkd.in', 'com.linkedin.android',
    'francetravail.fr', 'pole-emploi.fr', '1jeune1solution.gouv.fr', 'labonnealternance.apprentissage.beta.gouv.fr',
    'indeed.com', 'indeed.fr', 'hellowork.com', 'welcometothejungle.com', 'jobteaser.com',
    'apec.fr', 'meteojob.com', 'monster.fr', 'glassdoor.fr', 'glassdoor.com', 'cadremploi.fr',
    'letudiant.fr', 'studentjob.fr', 'walt.community', 'iquesta.com',
  ];

  // Messageries grand public et adresses jetables : pas un laissez-passer
  // (orange.fr est personnel, orange.com est l'adresse des salariés d'Orange : d'où deux listes)
  const PERSO_EXACTS = new Set([
    'orange.fr', 'wanadoo.fr', 'free.fr', 'sfr.fr', 'neuf.fr', 'club-internet.fr', 'cegetel.net',
    'aliceadsl.fr', 'laposte.net', 'bbox.fr', 'numericable.fr', 'voila.fr', 'me.com', 'mac.com',
    'icloud.com', 'mail.com', 'email.com', 'web.de', 'pm.me', 'hey.com', 'mailo.com', 'netcourrier.com',
    'zoho.com', 'zohomail.com',
  ]);
  const PERSO_TOUTES_EXTENSIONS = new RegExp('^(' + [
    'gmail', 'googlemail', 'hotmail', 'outlook', 'live', 'msn', 'yahoo', 'ymail', 'aol', 'gmx',
    'proton', 'protonmail', 'tutanota', 'tuta', 'yandex',
    'yopmail', 'mailinator', 'guerrillamail', 'temp-mail', 'tempmail', '10minutemail', 'trashmail', 'jetable',
  ].join('|') + ')\\.[a-z.]+$');
  const estPerso = (domaine) => PERSO_EXACTS.has(domaine) || PERSO_TOUTES_EXTENSIONS.test(domaine);

  // Réseaux d'accès grand public et hébergeurs (robots) : pas un laissez-passer
  const RESEAUX_EXCLUS = new RegExp('(' + [
    'orange', '\\bsfr\\b', '\\bfree\\b', 'proxad', 'bouygues', 'numericable', 'altice', 'nordnet', 'coriolis',
    'vodafone', 'telefonica', 'telekom', 'proximus', 'telenet', 'swisscom', 'comcast', 'verizon', 'at&t',
    'charter comm', 't-mobile', 'virgin media', '\\btim\\b', '\\bwind\\b', 'iliad', '\\bkpn\\b', '\\bsky\\b',
    'amazon', 'google', 'microsoft', 'azure', '\\bovh', 'hetzner', 'scaleway', 'online s\\.?a', 'digitalocean',
    'linode', 'akamai', 'cloudflare', 'fastly', 'oracle', 'alibaba', 'tencent', 'contabo', 'ionos', 'leaseweb',
    'choopa', 'vultr', '\\bm247', 'datacamp', 'zscaler', 'hostinger', 'gandi', 'o2switch', 'netcup',
    'telecom', 'télécom', 'mobile', 'broadband', '\\bcable', 'fibre', 'fiber', 'hosting', 'cloud', 'data ?cent',
    'server', '\\bvpn', 'internet service', '\\bisp\\b',
    // écoles et universités : les camarades de Marie ne lèvent pas le rideau depuis le campus
    'renater', 'univ', '\\biut\\b', 'école', 'ecole', 'school', 'college', 'lycée', 'lycee', 'academ', 'éducation',
    'education', 'campus', 'crous',
  ].join('|') + ')', 'i');

  // Données brouillées (générées par le script de préparation, ne pas modifier à la main)
  const COORDONNEES = 'NWAQOVAjX0dichEBLzAcMUUjVhcrfFUeLywWMXEtXgQxPh0PIS9XeBFoRwA0cAlMbHJDdAdzE1FvcgddbntAdh1qERE9Pn8FKyxXbhFoGFZrZAVVenVBZQh/ERg=';
  const CLE_BROUILLAGE = 'NBuT1J3eXR3l';
  const CLE_CV = 'f0SBRcg9xV/AlfaTixGOn7q0IK0aPWvjiz57gPibJKY=';
  const CLES_QR = {
      'f755f0f60146e0bc2993412c9e44ca39f9fc10a3db52c1f3a2549653a6e1602a': 'job-dating',
      '643e465d5fd61c088a105ef341a7ed436953ebca9ccabc5366fdb6bc8c2163cd': 'contact-1',
      '68a4e98e25a0a406b8ab8feb85d349d5b8a7a864e1166390a5ee67bdee5a66e2': 'contact-2',
      'a63f3a9acb275374eadc44f3eff27159861e8e85e1067a47ab39067d62bf625e': 'contact-3',
      '20130c6634baa49b64a328af4967448dd58452d4c3f7e7a8685c20e99debaeac': 'contact-4',
      '19ff8bcbee41baeb301b69c7825490707a842948b343d303a7d06c19da02bda6': 'contact-5'
  };                     // empreinte SHA-256 de la clé → étiquette
  const FICHIER_CV = new URL(t('../medias/cv.bin', '../medias/cv-en.bin'), document.currentScript.src).href;

  /* ---------- 2. Outils ---------- */
  const octets = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  function debrouiller() {
    const donnees = octets(COORDONNEES);
    const cle = new TextEncoder().encode(CLE_BROUILLAGE);
    const clair = donnees.map((o, i) => o ^ cle[i % cle.length]);
    return JSON.parse(new TextDecoder().decode(clair));
  }

  async function empreinte(texte) {
    const tampon = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texte));
    return [...new Uint8Array(tampon)].map((o) => o.toString(16).padStart(2, '0')).join('');
  }

  const appareilDeMarie = () => { try { return localStorage.getItem(CLE_APPAREIL_MARIE) === '1'; } catch { return false; } };
  try { localStorage.removeItem(CLE_STOCKAGE); } catch { /* ancienne mémorisation de 30 jours : effacée */ }

  const RACINE_SITE = new URL('../', document.currentScript.src).pathname;   // /e-portfolio/ en ligne
  function lireStockage() {
    const morceau = document.cookie.split('; ').find((c) => c.startsWith(`${CLE_STOCKAGE}=`));
    return morceau ? decodeURIComponent(morceau.split('=')[1]) : null;
  }
  function ecrireStockage(passe) {
    // Sans date d'expiration : le cookie disparaît à la fermeture du navigateur
    document.cookie = `${CLE_STOCKAGE}=${encodeURIComponent(passe)}; path=${RACINE_SITE}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  }

  /** Signale à GoatCounter quel laissez-passer a servi (si le compteur est chargé). */
  function compter(passe, essais = 12) {
    if (window.goatcounter?.count) {
      window.goatcounter.count({ path: `rideau/${passe}`, title: `Rideau levé : ${passe}`, event: true });
    } else if (essais > 0) {
      setTimeout(() => compter(passe, essais - 1), 500);
    }
  }

  const domaineCorrespond = (hote, liste) =>
    liste.some((d) => hote === d || hote.endsWith(`.${d}`));

  /* ---------- 3. Laissez-passer synchrones (adresse de la page, provenance) ---------- */
  const adresse = new URL(location.href);
  const cleQr = adresse.searchParams.get('cle');
  const via = (adresse.searchParams.get('via') || '').toLowerCase();
  if (cleQr || via) {                              // on retire les marqueurs de la barre d'adresse
    adresse.searchParams.delete('cle');
    adresse.searchParams.delete('via');
    history.replaceState(history.state, '', adresse.pathname + adresse.search + adresse.hash);
  }

  function passeProvenance() {
    if (VIA_ACCEPTES.includes(via)) return `via-${via}`;
    try {
      const origine = new URL(document.referrer);
      const hote = origine.hostname.toLowerCase() || origine.href.replace(/^android-app:\/\//, '').split('/')[0];
      if (hote && hote !== location.hostname && domaineCorrespond(hote, ORIGINES)) return `origine-${hote}`;
    } catch { /* pas de provenance */ }
    return null;
  }

  /* ---------- 4. Laissez-passer asynchrones ---------- */
  async function passeQr() {
    if (!cleQr) return null;
    const etiquette = CLES_QR[await empreinte(cleQr.trim().toUpperCase())];
    return etiquette ? `qr-${etiquette}` : null;
  }

  async function passeReseau() {
    const controle = new AbortController();
    const minuteur = setTimeout(() => controle.abort(), 3000);
    try {
      const reponse = await fetch('https://api.ipapi.is/', { signal: controle.signal });
      if (!reponse.ok) return null;
      const info = await reponse.json();
      const societe = (info.company || '').trim();
      const reseau = (info.asn || '').replace(/^AS\d+\s*/, '').trim();
      if (!societe || RESEAUX_EXCLUS.test(societe) || RESEAUX_EXCLUS.test(reseau)) return null;
      return 'reseau-organisation';
    } catch { return null; } finally { clearTimeout(minuteur); }
  }

  async function domaineRecoitMail(domaine) {
    try {
      const reponse = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domaine)}&type=MX`,
        { headers: { Accept: 'application/dns-json' } });
      if (!reponse.ok) return true;                // doute : on ne bloque pas
      const mx = await reponse.json();
      return mx.Status !== 3 && (mx.Answer || []).some((r) => r.type === 15 && !/^0\s+\.?$/.test(r.data));
    } catch { return true; }
  }

  /** Renvoie un message d'erreur, ou null si l'adresse est un laissez-passer. */
  async function verifierEmailPro(valeur) {
    const email = valeur.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email)) return t('Cette adresse ne semble pas valide.', 'This address does not look valid.');
    const domaine = email.split('@').pop();
    if (estPerso(domaine)) {
      return t('Merci d’indiquer une adresse professionnelle (pas une messagerie personnelle), ou de me contacter via LinkedIn.',
               'Please enter a work address (not a personal mailbox), or contact me via LinkedIn.');
    }
    if (!(await domaineRecoitMail(domaine))) {
      return t(`Le domaine « ${domaine} » ne reçoit pas d’e-mails : vérifiez l’adresse.`,
               `The domain “${domaine}” cannot receive emails: please check the address.`);
    }
    return null;
  }

  /* ---------- 5. Affichage ---------- */
  const lignesEmail = document.querySelectorAll('[data-rideau="email"]');
  const lignesTel = document.querySelectorAll('[data-rideau="tel"]');
  const formulaire = document.getElementById('formulaire-contact');
  const SELECTEUR_CV = 'a[href$="cv-marie-tiers.pdf"], a[href$="cv-marie-tiers-en.pdf"]';

  /* Sous-menu « CV » de la barre de navigation : télécharger le PDF ou l'ouvrir dans un nouvel onglet.
     Il s'ouvre au survol (souris) ou au clic (doigt, clavier) ; Échap ou un clic ailleurs le referme. */
  let entrerSurvolCv = () => {}, quitterSurvolCv = () => {};
  function construireSousMenuCv() {
    const lienNav = document.querySelector(`.navigation-liste ${SELECTEUR_CV.split(', ').join(', .navigation-liste ')}`);
    const li = lienNav?.closest('li');
    if (!li) return;
    const pdf = lienNav.getAttribute('href');
    li.classList.add('nav-cv');
    li.innerHTML = `
      <button type="button" class="nav-cv-bouton" aria-expanded="false" aria-controls="sous-menu-cv">
        CV <span class="nav-cv-fleche" aria-hidden="true">▾</span></button>
      <ul class="sous-menu-cv" id="sous-menu-cv">
        <li><a href="${pdf}" type="application/pdf" data-cv="telecharger">${t('Télécharger le PDF', 'Download the PDF')}</a></li>
        <li><a href="${pdf}" type="application/pdf" data-cv="ouvrir" target="_blank" rel="noopener">${t('Ouvrir dans un nouvel onglet', 'Open in a new tab')}</a></li>
      </ul>`;
    const bouton = li.querySelector('button');
    const menu = li.querySelector('.sous-menu-cv');
    // Garde le sous-menu dans l'écran, quel que soit l'emplacement du bouton CV (menu sur deux lignes sur mobile)
    const ajuster = () => requestAnimationFrame(() => {
      menu.style.left = ''; menu.style.right = '';
      // La notice « Recruteur ? » apparaît sous les boutons : le sous-menu s'ouvre sous elle, jamais par-dessus
      const n = document.querySelector('.notice-recruteur');
      menu.style.top = n && n.offsetHeight
        ? `${n.getBoundingClientRect().bottom - li.getBoundingClientRect().top + 14}px` : '';
      const cadre = menu.getBoundingClientRect();
      if (!cadre.width) return;
      if (cadre.right > innerWidth - 8) { menu.style.left = 'auto'; menu.style.right = '0'; }
      if (menu.getBoundingClientRect().left < 8) { menu.style.left = `${8 - li.getBoundingClientRect().left}px`; menu.style.right = 'auto'; }
      // La queue de la bulle pointe vers le milieu du bouton « CV », où que soit le menu
      const b = bouton.getBoundingClientRect();
      menu.style.setProperty('--queue-x', `${b.left + b.width / 2 - menu.getBoundingClientRect().left}px`);
    });
    const basculer = (ouvert) => {
      li.classList.toggle('ouvert', ouvert);
      bouton.setAttribute('aria-expanded', String(ouvert));
      if (ouvert) { li.classList.remove('replie'); ajuster(); }
    };
    // Souris : le survol du bouton « CV » ouvre le sous-menu et fait apparaître la notice « Recruteur ? » ;
    // un court délai laisse le temps de passer sur la notice (ses liens restent cliquables) ou sur le menu.
    let minuteurSurvol;
    entrerSurvolCv = (evt) => {
      if (evt.pointerType !== 'mouse') return;
      clearTimeout(minuteurSurvol);
      li.classList.remove('replie');                    // nouveau survol après Échap : on réaffiche
      if (!li.classList.contains('survol')) { li.classList.add('survol'); ajuster(); }
    };
    quitterSurvolCv = (evt) => {
      if (evt.pointerType !== 'mouse') return;
      clearTimeout(minuteurSurvol);
      minuteurSurvol = setTimeout(() => li.classList.remove('survol'), 300);
    };
    li.addEventListener('pointerenter', entrerSurvolCv);
    li.addEventListener('pointerleave', quitterSurvolCv);
    bouton.addEventListener('focus', ajuster);
    bouton.addEventListener('click', () => basculer(!li.classList.contains('ouvert')));
    li.querySelectorAll('.sous-menu-cv a').forEach((a) => a.addEventListener('click', () => basculer(false)));
    document.addEventListener('click', (evt) => { if (!li.contains(evt.target)) basculer(false); });
    // Échap referme tout ce qui est apparu (sous-menu, notice), même au simple survol (RGAA 10.13)
    document.addEventListener('keydown', (evt) => {
      if (evt.key !== 'Escape') return;
      const actif = li.classList.contains('ouvert') || li.classList.contains('survol') || li.contains(document.activeElement);
      if (!actif) return;
      const avaitFocus = li.contains(document.activeElement) && li.classList.contains('ouvert');
      clearTimeout(minuteurSurvol);
      li.classList.remove('survol');
      basculer(false);
      li.classList.add('replie');
      if (avaitFocus) bouton.focus();
    });
    li.addEventListener('focusout', (evt) => {
      if (!li.contains(evt.relatedTarget)) { basculer(false); li.classList.remove('replie'); }
    });
    li.addEventListener('focusin', (evt) => { if (!li.contains(evt.relatedTarget)) li.classList.remove('replie'); });
  }
  construireSousMenuCv();

  const liensCv = document.querySelectorAll(SELECTEUR_CV);
  // Le CV (public ou complet) se télécharge toujours sous le nom choisi ; le lien « ouvrir » l'affiche dans un onglet
  liensCv.forEach((a) => { if (a.dataset.cv !== 'ouvrir') a.download = NOM_CV; });
  let leve = false;
  let blocRideau = null;

  function remplirLigne(li, icone, lien, texte) {
    li.replaceChildren();
    const pastille = document.createElement('span');
    pastille.className = 'coordonnees-icone';
    pastille.setAttribute('aria-hidden', 'true');
    pastille.textContent = icone;
    li.append(pastille);
    if (lien) {
      const a = document.createElement('a');
      a.href = lien;
      a.textContent = texte;
      li.append(a);
    } else {
      const masque = document.createElement('span');
      masque.className = 'rideau-masque';
      masque.textContent = texte;
      li.append(masque);
    }
  }

  async function brancherCvComplet() {
    try {
      const reponse = await fetch(FICHIER_CV);
      if (!reponse.ok) return;
      const donnees = new Uint8Array(await reponse.arrayBuffer());
      const cle = await crypto.subtle.importKey('raw', octets(CLE_CV), 'AES-GCM', false, ['decrypt']);
      const pdf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: donnees.slice(0, 12) }, cle, donnees.slice(12));
      const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
      liensCv.forEach((a) => { a.href = url; });
    } catch { /* le CV public reste en place */ }
  }

  /** Notice « Recruteur ? » sous le menu, visible seulement tant que le rideau est baissé. */
  let notice = null;
  function afficherNotice() {
    const navigation = document.querySelector('.navigation');
    if (!navigation) return;
    notice = document.createElement('p');
    notice.className = 'notice-recruteur';
    notice.id = 'notice-recruteur';
    notice.innerHTML = t(
      `<strong>Recruteur ?</strong> Mon CV complet et mes coordonnées s’affichent avec votre
       <a href="#rideau-email">e-mail professionnel</a>, ou écrivez-moi sur <a href="${LINKEDIN}">LinkedIn</a>.`,
      `<strong>Recruiter?</strong> My full CV and contact details appear once you enter your
       <a href="#rideau-email">work email</a>, or message me on <a href="${LINKEDIN}">LinkedIn</a>.`);
    notice.querySelector('a[href="#rideau-email"]').addEventListener('click', (evt) => {
      const champ = document.getElementById('rideau-email');
      if (!champ) return;
      evt.preventDefault();
      champ.scrollIntoView({ block: 'center', behavior: 'smooth' });
      champ.focus({ preventScroll: true });
    });
    navigation.append(notice);
    // Cachée tant qu'on ne survole pas « CV » ; le bouton la décrit aux lecteurs d'écran
    notice.addEventListener('pointerenter', entrerSurvolCv);
    notice.addEventListener('pointerleave', quitterSurvolCv);
    document.querySelector('.nav-cv-bouton')?.setAttribute('aria-describedby', 'notice-recruteur');
  }

  /** Petite fenêtre de remerciement, qui disparaît seule (pause au survol ou au clavier). */
  function remercier() {
    const fenetre = document.createElement('div');
    fenetre.className = 'rideau-merci';
    fenetre.setAttribute('role', 'status');
    fenetre.innerHTML = `<p>${MESSAGE_MERCI}</p>
      <button type="button" class="rideau-merci-fermer" aria-label="${t('Fermer ce message', 'Close this message')}">×</button>`;
    document.body.append(fenetre);
    requestAnimationFrame(() => fenetre.classList.add('visible'));
    let minuteur;
    const fermer = () => {
      clearTimeout(minuteur);
      fenetre.classList.remove('visible');
      setTimeout(() => fenetre.remove(), 400);
    };
    const lancer = () => { clearTimeout(minuteur); minuteur = setTimeout(fermer, DUREE_MERCI); };
    fenetre.querySelector('button').addEventListener('click', fermer);
    fenetre.addEventListener('mouseenter', () => clearTimeout(minuteur));
    fenetre.addEventListener('mouseleave', lancer);
    fenetre.addEventListener('focusin', () => clearTimeout(minuteur));
    fenetre.addEventListener('focusout', lancer);
    lancer();
  }

  function lever(passe, nouveau = true) {
    if (leve) return;
    leve = true;
    const c = debrouiller();
    lignesEmail.forEach((li) => remplirLigne(li, '✉︎', `mailto:${c.email}`, c.email));
    lignesTel.forEach((li) => remplirLigne(li, '☎︎', `tel:${c.telLien}`, c.tel));
    if (formulaire) {
      formulaire.dataset.destinataire = c.email;
      formulaire.classList.remove('rideau-ferme');
    }
    blocRideau?.remove();
    notice?.remove();
    document.querySelector('.nav-cv-bouton')?.removeAttribute('aria-describedby');
    brancherCvComplet();
    if (nouveau) { ecrireStockage(passe); compter(passe); remercier(); }
  }

  function afficherRideau() {
    lignesEmail.forEach((li) => remplirLigne(li, '✉︎', null, t('adresse e-mail masquée', 'email address hidden')));
    lignesTel.forEach((li) => remplirLigne(li, '☎︎', null, t('numéro masqué', 'phone number hidden')));
    formulaire?.classList.add('rideau-ferme');
    afficherNotice();

    const liste = lignesEmail[0]?.closest('ul');
    if (!liste) return;
    blocRideau = document.createElement('form');
    blocRideau.className = 'rideau';
    blocRideau.noValidate = true;
    blocRideau.innerHTML = t(`
      <p class="rideau-texte">Mon <strong>e-mail</strong> et mon <strong>téléphone</strong> sont réservés aux recruteurs :
        indiquez votre <strong class="kw">e-mail professionnel</strong> pour les afficher,
        ou écrivez-moi sur <a href="${LINKEDIN}">LinkedIn</a>.</p>
      <p class="rideau-ligne">
        <label class="sr" for="rideau-email">E-mail professionnel</label>
        <input id="rideau-email" type="email" autocomplete="email" placeholder="prenom.nom@entreprise.fr" required>
        <button class="bouton bouton-second" type="submit">Afficher</button>
      </p>`, `
      <p class="rideau-texte">My <strong>email address</strong> and <strong>phone number</strong> are for recruiters only:
        enter your <strong class="kw">work email</strong> to reveal them,
        or message me on <a href="${LINKEDIN}">LinkedIn</a>.</p>
      <p class="rideau-ligne">
        <label class="sr" for="rideau-email">Work email</label>
        <input id="rideau-email" type="email" autocomplete="email" placeholder="firstname.lastname@company.co.uk" required>
        <button class="bouton bouton-second" type="submit">Show</button>
      </p>`) + `
      <p class="rideau-aide" role="status" aria-live="polite"></p>`;
    liste.after(blocRideau);

    const champ = blocRideau.querySelector('input');
    const aide = blocRideau.querySelector('.rideau-aide');
    const bouton = blocRideau.querySelector('button');
    blocRideau.addEventListener('submit', async (evt) => {
      evt.preventDefault();
      bouton.disabled = true;
      aide.textContent = t('Vérification…', 'Checking…');
      const erreur = await verifierEmailPro(champ.value);
      bouton.disabled = false;
      if (erreur) { aide.textContent = erreur; aide.dataset.etat = 'erreur'; champ.focus(); return; }
      lever('email-pro');
      // Pré-remplit le formulaire de contact avec la même adresse
      const champContact = formulaire?.querySelector('input[type="email"]');
      if (champContact && !champContact.value) champContact.value = champ.value.trim();
    });
  }

  // Formulaire de contact : tant que le rideau est baissé, l'envoi exige un e-mail professionnel.
  // Écouteur en phase de capture sur document : il passe avant celui de script.js.
  document.addEventListener('submit', async (evt) => {
    if (leve || evt.target !== formulaire) return;
    evt.preventDefault();
    evt.stopImmediatePropagation();
    const champ = formulaire.querySelector('input[type="email"]');
    const statut = formulaire.querySelector('.formulaire-statut');
    const erreur = await verifierEmailPro(champ?.value || '');
    if (erreur) {
      if (statut) { statut.textContent = erreur; statut.dataset.etat = 'erreur'; }
      champ?.focus();
      return;
    }
    if (statut) statut.textContent = '';
    lever('email-pro-formulaire');
    formulaire.requestSubmit();                    // relance l'envoi normal (script.js)
  }, true);

  /* ---------- 6. Démarrage ---------- */
  const dejaLeve = appareilDeMarie() ? 'appareil-de-marie' : lireStockage();
  const provenance = passeProvenance();
  if (dejaLeve) lever(dejaLeve, false);
  else if (provenance) lever(provenance);
  else {
    afficherRideau();
    (async () => {
      const passe = (await passeQr()) || (await passeReseau());
      if (passe) lever(passe);
    })();
  }
})();
