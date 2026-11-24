/* Pages générées depuis modeles/ : langues, liens, absence d'erreurs (#199, #200) */
import { test, expect, PAGES } from './fixtures.mjs';

const toutes = [...PAGES.fr.map((url) => ['fr', url]), ...PAGES.en.map((url) => ['en-GB', url])];

for (const [langue, url] of toutes) {
  test(`${url} : langue « ${langue} », titre, liens et images internes valides`, async ({ page, request }) => {
    const reponse = await page.goto(url);
    expect(reponse.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', langue);
    await expect(page).toHaveTitle(/Marie Tiers/);

    // Chaque adresse interne (lien, image, script, feuille de styles, vidéo) répond
    const adresses = await page.evaluate(() => {
      const attributs = ['href', 'src', 'poster', 'data-source', 'data-image'];
      const brutes = [...document.querySelectorAll(attributs.map((a) => `[${a}]`).join(','))]
        .flatMap((el) => attributs.map((a) => el.getAttribute(a)))
        .filter((valeur) => valeur && !valeur.startsWith('#'))
        .map((valeur) => new URL(valeur, document.baseURI).href.split('#')[0]);
      return [...new Set(brutes)].filter((u) => u.startsWith(location.origin));
    });
    expect(adresses.length).toBeGreaterThan(3);
    for (const adresse of adresses) {
      const r = await request.get(adresse);
      expect(r.status(), `${url} → ${adresse}`).toBe(200);
    }
  });
}

const PAIRES = [['index.html', 'en/index.html'], ['pages/projets.html', 'en/projects.html'],
  ['pages/competences.html', 'en/skills.html'], ['pages/univers.html', 'en/my-world.html'],
  ['pages/cv-video.html', 'en/video-cv.html'], ['pages/accessibilite.html', 'en/accessibility.html']];

for (const [fr, en] of PAIRES) {
  test(`le drapeau mène de ${fr} à ${en}, et retour`, async ({ page }) => {
    await page.goto(fr);
    await page.locator('a.langue').click();
    await expect(page).toHaveURL(new RegExp(`/e-portfolio/${en}$`));
    await page.locator('a.langue').click();
    await expect(page).toHaveURL(new RegExp(`/e-portfolio/${fr}$`));
  });
}

test('le nuage de compétences est présent dans les deux langues', async ({ page }) => {
  for (const url of ['pages/competences.html', 'en/skills.html']) {
    await page.goto(url);
    await expect(page.locator('svg.nuage-svg'), url).toHaveCount(1);
    const donnees = await page.locator('#nuage-donnees').textContent();
    expect(() => JSON.parse(donnees), url).not.toThrow();
  }
});
