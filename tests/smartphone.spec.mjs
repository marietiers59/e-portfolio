/* Smartphone : actualisation et arrivée après un balayage (scripts/tete.js, balayage.js) — #200 */
import { test, expect } from './fixtures.mjs';

test('actualiser une sous-page ramène à l\'accueil de la même langue', async ({ page }) => {
  await page.goto('pages/projets.html');
  await page.reload();
  await expect(page).toHaveURL(/\/e-portfolio\/index\.html$/);

  await page.goto('en/skills.html');
  await page.reload();
  await expect(page).toHaveURL(/\/e-portfolio\/en\/index\.html$/);
});

test('actualiser la page Accessibilité la laisse en place', async ({ page }) => {
  await page.goto('pages/accessibilite.html');
  await page.reload();
  await expect(page).toHaveURL(/accessibilite\.html$/);
});

test('actualiser l\'accueil repart du haut de la page', async ({ page }) => {
  await page.goto('index.html');
  await page.reload();
  expect(await page.evaluate(() => history.scrollRestoration)).toBe('manual');
});

test('l\'arrivée après un balayage reprend le sens du geste', async ({ page }) => {
  await page.goto('index.html');
  await page.evaluate(() => sessionStorage.setItem('balayage', 'gauche'));
  await page.goto('pages/competences.html');
  await expect(page.locator('html')).toHaveAttribute('data-arrivee', 'gauche');
  expect(await page.evaluate(() => sessionStorage.getItem('balayage'))).toBeNull();
});
