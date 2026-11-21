/* Thème clair / sombre (scripts/tete.js, script.js) et zoom de la page (tete.js, zoom.js) — #200 */
import { test, expect, espionnerThemeAuPremierAffichage } from './fixtures.mjs';

const racine = (page) => page.locator('html');
const zoomPage = (page) => page.evaluate(() => document.documentElement.style.getPropertyValue('--zoom-page'));

test.describe('thème', () => {
  test('suit le réglage clair de l\'appareil', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('index.html');
    await expect(racine(page)).toHaveAttribute('data-theme', 'clair');
    await expect(page.locator('.theme')).toHaveAttribute('aria-pressed', 'false');
  });

  test('suit le réglage sombre de l\'appareil, avant même l\'affichage', async ({ page }) => {
    await espionnerThemeAuPremierAffichage(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('pages/projets.html');
    expect(await page.evaluate(() => window.themeAuPremierAffichage)).toBe('sombre');
    await expect(page.locator('.theme')).toHaveAttribute('aria-pressed', 'true');
  });

  test('la bascule change le thème, le mémorise et le garde d\'une page à l\'autre', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('index.html');
    await page.locator('.theme').click();
    await expect(racine(page)).toHaveAttribute('data-theme', 'sombre');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#222d3a');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('sombre');

    await espionnerThemeAuPremierAffichage(page);
    await page.goto('en/skills.html');
    expect(await page.evaluate(() => window.themeAuPremierAffichage)).toBe('sombre');

    await page.locator('.theme').click();
    await expect(racine(page)).toHaveAttribute('data-theme', 'clair');
  });

  test('le choix mémorisé l\'emporte sur le réglage de l\'appareil, y compris sur les aperçus', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('index.html');
    await page.evaluate(() => localStorage.setItem('theme', 'clair'));
    for (const url of ['pages/univers.html', 'pages/calendrier-alternance.html', 'en/internship-form.html']) {
      await page.goto(url);
      await expect(racine(page), url).toHaveAttribute('data-theme', 'clair');
    }
  });

  test('une valeur mémorisée invalide est ignorée', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('index.html');
    await page.evaluate(() => localStorage.setItem('theme', 'violet'));
    await page.reload();
    await expect(racine(page)).toHaveAttribute('data-theme', 'sombre');
  });
});

test.describe('zoom', () => {
  test('les boutons agrandissent et réduisent la page, dans les limites', async ({ page }) => {
    await page.goto('index.html');
    const plus = page.locator('.zoom-plus');
    const moins = page.locator('.zoom-moins');
    await expect(plus).toBeVisible();

    await plus.click();
    await expect.poll(() => zoomPage(page)).toBe('1.1');
    expect(await page.evaluate(() => localStorage.getItem('zoom-page'))).toBe('1');

    await moins.click();
    await expect.poll(() => zoomPage(page)).toBe('');
    await moins.click();
    await moins.click();
    await expect.poll(() => zoomPage(page)).toBe('0.8');
    await expect(moins).toHaveAttribute('aria-disabled', 'true');
  });

  test('la crête remet la page à sa taille réelle', async ({ page }) => {
    await page.goto('index.html');
    await page.locator('.zoom-plus').click();
    await expect.poll(() => zoomPage(page)).toBe('1.1');
    await page.locator('.zoom-crete').click();
    await expect.poll(() => zoomPage(page)).toBe('');
    expect(await page.evaluate(() => localStorage.getItem('zoom-page'))).toBeNull();
  });

  test('le zoom mémorisé s\'applique avant l\'affichage des autres pages', async ({ page }) => {
    await page.goto('index.html');
    await page.evaluate(() => localStorage.setItem('zoom-page', '3'));
    await espionnerThemeAuPremierAffichage(page);
    await page.goto('pages/competences.html');
    expect(await page.evaluate(() => window.zoomAuPremierAffichage)).toBe('1.3');
  });

  test('sur un écran étroit, le zoom mémorisé est plafonné', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('index.html');
    await page.evaluate(() => localStorage.setItem('zoom-page', '6'));   // 200 %
    await page.goto('pages/projets.html');
    expect(await zoomPage(page)).toBe('1.1');                            // 320 / 1,1 ≥ 288 px
  });

  test('pas de zoom sur les aperçus de documents', async ({ page }) => {
    await page.goto('index.html');
    await page.evaluate(() => localStorage.setItem('zoom-page', '2'));
    await page.goto('pages/calendrier-alternance.html');
    expect(await zoomPage(page)).toBe('');
  });
});
