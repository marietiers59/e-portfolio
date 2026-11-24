/* =====================================================================
   fixtures.mjs — base commune des tests (#200)
   ---------------------------------------------------------------------
   · Aucun appel réseau extérieur : polices, GoatCounter, ipapi.is et
     dns.google sont interceptés. Par défaut, le visiteur est chez un
     fournisseur d'accès grand public (le rideau reste baissé) et tous
     les domaines reçoivent des e-mails ; chaque test peut changer ces
     réponses avec reseau.visiteur(…) et reseau.mx(…).
   · Les erreurs JavaScript de la page font échouer le test.
   · Couverture des scripts du site (Chromium), réunie par monocart-reporter.
   ===================================================================== */
import { test as base, expect } from '@playwright/test';
import { addCoverageReport } from 'monocart-reporter';

export const PAGES = {
  fr: ['index.html', 'pages/projets.html', 'pages/competences.html', 'pages/univers.html', 'pages/cv-video.html',
    'pages/accessibilite.html', 'pages/calendrier-alternance.html', 'pages/formulaire-convention.html', 'pages/espace.html'],
  en: ['en/index.html', 'en/projects.html', 'en/skills.html', 'en/my-world.html', 'en/video-cv.html',
    'en/accessibility.html', 'en/work-study-calendar.html', 'en/internship-form.html'],
};

export const test = base.extend({
  reseau: [async ({ context }, use) => {
    const reglages = {
      visiteur: { company: '', asn: 'AS3215 Orange S.A.' },   // box à la maison
      mx: { Status: 0, Answer: [{ type: 15, data: '10 mx.exemple.fr.' }] },
    };
    await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, async (route) => {
      const url = route.request().url();
      if (url.startsWith('https://api.ipapi.is/')) {
        await route.fulfill({ json: reglages.visiteur });
      } else if (url.startsWith('https://dns.google/')) {
        await route.fulfill({ json: reglages.mx });
      } else {
        await route.abort();                                      // polices, compteur, liens sortants
      }
    });
    await use({
      visiteur: (info) => { reglages.visiteur = info; },
      mx: (reponse) => { reglages.mx = reponse; },
    });
  }, { auto: true }],

  page: async ({ page, browserName }, use, testInfo) => {
    const erreurs = [];
    page.on('pageerror', (erreur) => erreurs.push(erreur.message));
    const couverture = browserName === 'chromium';
    if (couverture) {
      await page.coverage.startJSCoverage({ resetOnNavigation: false });
    }
    await use(page);
    if (couverture) {
      // « scripts/zoom.js?v=2 » → « scripts/zoom.js » : un seul fichier par script dans le rapport
      const entrees = (await page.coverage.stopJSCoverage())
        .map((entree) => ({ ...entree, url: entree.url.replace(/\?v=\d+$/, '') }));
      await addCoverageReport(entrees, testInfo);
    }
    expect(erreurs, 'erreurs JavaScript dans la page').toEqual([]);
  },
});

/** Thème lu au moment où le <body> apparaît : prouve qu'il est posé avant l'affichage. */
export async function espionnerThemeAuPremierAffichage(page) {
  await page.addInitScript(() => {
    new MutationObserver((_, observateur) => {
      if (document.body) {
        window.themeAuPremierAffichage = document.documentElement.dataset.theme ?? null;
        window.zoomAuPremierAffichage = document.documentElement.style.getPropertyValue('--zoom-page');
        observateur.disconnect();
      }
    }).observe(document, { childList: true, subtree: true });
  });
}

export { expect };
