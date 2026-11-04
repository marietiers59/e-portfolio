/* =====================================================================
   rideau.js — coordonnées réservées aux recruteurs
   ---------------------------------------------------------------------
   Un « rideau » cache l'e-mail, le téléphone et le CV complet.
   Il se lève tout seul avec un laissez-passer :
     1. code QR remis en main propre (?cle=…) ;
     2. lien marqué que Marie diffuse (?via=linkedin, ?via=annonce…) ;
     3. arrivée depuis LinkedIn, France Travail ou un site d'annonces ;
     4. réseau d'entreprise ou d'administration (adresse IP, via ipapi.is) ;
     5. e-mail professionnel saisi par le visiteur.
   Sinon, le visiteur voit un petit formulaire « e-mail professionnel ».
   C'est un rideau, pas un coffre-fort : il arrête les robots et les
   curieux pressés, pas une personne déterminée qui lit ce code.
   Ce fichier doit être chargé AVANT script.js (attribut defer).
   ===================================================================== */
(() => {
  'use strict';

  /* ---------- 1. Réglages ---------- */
  const DUREE_JOURS = 30;                         // le rideau reste levé 30 jours sur l'appareil
  const CLE_STOCKAGE = 'portfolio-rideau';
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
  const FICHIER_CV = new URL('../medias/cv.bin', document.currentScript.src).href;

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

  function lireStockage() {
    try {
      const memo = JSON.parse(localStorage.getItem(CLE_STOCKAGE) || 'null');
      return memo && memo.expire > Date.now() ? memo.passe : null;
    } catch { return null; }
  }
  function ecrireStockage(passe) {
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify({ passe, expire: Date.now() + DUREE_JOURS * 864e5 }));
    } catch { /* stockage bloqué : le rideau se relèvera à la prochaine visite */ }
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
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email)) return 'Cette adresse ne semble pas valide.';
    const domaine = email.split('@').pop();
    if (estPerso(domaine)) {
      return 'Merci d’indiquer une adresse professionnelle (pas une messagerie personnelle), ou de me contacter via LinkedIn.';
    }
    if (!(await domaineRecoitMail(domaine))) return `Le domaine « ${domaine} » ne reçoit pas d’e-mails : vérifiez l’adresse.`;
    return null;
  }

  /* ---------- 5. Affichage ---------- */
  const lignesEmail = document.querySelectorAll('[data-rideau="email"]');
  const lignesTel = document.querySelectorAll('[data-rideau="tel"]');
  const formulaire = document.getElementById('formulaire-contact');
  const liensCv = document.querySelectorAll('a[href$="cv-marie-tiers.pdf"]');
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
      liensCv.forEach((a) => { a.href = url; a.target = '_blank'; a.rel = 'noopener'; });
    } catch { /* le CV public reste en place */ }
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
    brancherCvComplet();
    if (nouveau) { ecrireStockage(passe); compter(passe); }
  }

  function afficherRideau() {
    lignesEmail.forEach((li) => remplirLigne(li, '✉︎', null, 'adresse e-mail masquée'));
    lignesTel.forEach((li) => remplirLigne(li, '☎︎', null, 'numéro masqué'));
    formulaire?.classList.add('rideau-ferme');

    const liste = lignesEmail[0]?.closest('ul');
    if (!liste) return;
    blocRideau = document.createElement('form');
    blocRideau.className = 'rideau';
    blocRideau.noValidate = true;
    blocRideau.innerHTML = `
      <p class="rideau-texte">Mon <strong>e-mail</strong> et mon <strong>téléphone</strong> sont réservés aux recruteurs :
        indiquez votre <strong class="kw">e-mail professionnel</strong> pour les afficher.</p>
      <p class="rideau-ligne">
        <label class="sr" for="rideau-email">E-mail professionnel</label>
        <input id="rideau-email" type="email" autocomplete="email" placeholder="prenom.nom@entreprise.fr" required>
        <button class="bouton bouton-second" type="submit">Afficher</button>
      </p>
      <p class="rideau-aide" role="status" aria-live="polite"></p>`;
    liste.after(blocRideau);

    const champ = blocRideau.querySelector('input');
    const aide = blocRideau.querySelector('.rideau-aide');
    const bouton = blocRideau.querySelector('button');
    blocRideau.addEventListener('submit', async (evt) => {
      evt.preventDefault();
      bouton.disabled = true;
      aide.textContent = 'Vérification…';
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
  const dejaLeve = lireStockage();
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
