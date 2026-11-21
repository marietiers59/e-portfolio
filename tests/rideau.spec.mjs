/* Rideau sur les coordonnées (scripts/rideau.js) — #200 */
import { readFileSync } from 'node:fs';
import { test, expect, PAGES } from './fixtures.mjs';

const coordonnees = (page) => page.locator('.coordonnees');
const champRideau = (page) => page.locator('#rideau-email');

async function attendreRideauBaisse(page) {
  await expect(champRideau(page)).toBeVisible();
  await expect(coordonnees(page).locator('a[href^="mailto:"]')).toHaveCount(0);
  await expect(coordonnees(page).locator('a[href^="tel:"]')).toHaveCount(0);
}

async function attendreRideauLeve(page) {
  await expect(coordonnees(page).locator('a[href^="mailto:"]').first()).toBeVisible();
  await expect(coordonnees(page).locator('a[href^="tel:"]').first()).toBeVisible();
  await expect(champRideau(page)).toHaveCount(0);
}

test.describe('rideau baissé', () => {
  test('par défaut, e-mail et téléphone sont masqués', async ({ page }) => {
    await page.goto('index.html');
    await attendreRideauBaisse(page);
    await expect(coordonnees(page)).toContainText('adresse e-mail masquée');
    await expect(coordonnees(page)).toContainText('numéro masqué');
    await expect(page.locator('#notice-recruteur')).toBeAttached();      // volet ouvert au survol du CV
  });

  test('version anglaise : textes du rideau traduits', async ({ page }) => {
    await page.goto('en/index.html');
    await attendreRideauBaisse(page);
    await expect(coordonnees(page)).toContainText('email address hidden');
    await expect(page.getByRole('button', { name: 'Show', exact: true })).toBeVisible();
  });

  test('aucune coordonnée en clair dans le code des pages', () => {
    for (const fichier of [...PAGES.fr, ...PAGES.en, 'scripts/rideau.js']) {
      const source = readFileSync(fichier, 'utf8');
      expect(source, fichier).not.toMatch(/mailto:[^$`'"{]/);
      expect(source, fichier).not.toMatch(/tel:\+?\d/);
      expect(source, fichier).not.toMatch(/(?:\+33|0)\s?[67](?:[\s.]?\d{2}){4}/);
    }
  });

  test('un lien sans paramètre reconnu ne lève rien', async ({ page }) => {
    await page.goto('index.html?via=inconnu');
    await attendreRideauBaisse(page);
  });

  test('une connexion d\'école ou de fournisseur d\'accès ne lève rien', async ({ page, reseau }) => {
    reseau.visiteur({ company: 'Université d\'Artois', asn: 'AS2200 Renater' });
    await page.goto('index.html');
    await attendreRideauBaisse(page);
  });
});

test.describe('laissez-passer', () => {
  test('lien LinkedIn (?via=linkedin) : coordonnées affichées et adresse nettoyée', async ({ page }) => {
    await page.goto('index.html?via=linkedin');
    await attendreRideauLeve(page);
    expect(new URL(page.url()).searchParams.has('via')).toBe(false);
  });

  test('arrivée depuis LinkedIn (provenance)', async ({ page }) => {
    await page.goto('index.html', { referer: 'https://www.linkedin.com/feed/' });
    await attendreRideauLeve(page);
  });

  test('arrivée depuis un site d\'annonces (sous-domaine)', async ({ page }) => {
    await page.goto('index.html', { referer: 'https://fr.indeed.com/viewjob?jk=123' });
    await attendreRideauLeve(page);
  });

  test('connexion depuis le réseau d\'une entreprise', async ({ page, reseau }) => {
    reseau.visiteur({ company: 'Worldline SA', asn: 'AS12345 Worldline' });
    await page.goto('index.html');
    await attendreRideauLeve(page);
  });

  test('le laissez-passer suit le visiteur sur les autres pages', async ({ page }) => {
    await page.goto('index.html?via=annonce');
    await attendreRideauLeve(page);
    await page.goto('pages/projets.html');
    await attendreRideauLeve(page);
    await page.goto('en/skills.html');
    await attendreRideauLeve(page);
  });
});

test.describe('e-mail professionnel', () => {
  test('une messagerie personnelle est refusée', async ({ page }) => {
    await page.goto('index.html');
    await champRideau(page).fill('prenom.nom@gmail.com');
    await page.getByRole('button', { name: 'Afficher', exact: true }).click();
    await expect(page.locator('.rideau-aide')).toContainText('adresse professionnelle');
    await attendreRideauBaisse(page);
  });

  test('une adresse mal écrite est refusée', async ({ page }) => {
    await page.goto('index.html');
    await champRideau(page).fill('recruteur@entreprise');
    await page.getByRole('button', { name: 'Afficher', exact: true }).click();
    await expect(page.locator('.rideau-aide')).toContainText('ne semble pas valide');
  });

  test('un domaine qui ne reçoit pas d\'e-mails est refusé', async ({ page, reseau }) => {
    reseau.mx({ Status: 3 });
    await page.goto('index.html');
    await champRideau(page).fill('rh@domaine-inexistant.fr');
    await page.getByRole('button', { name: 'Afficher', exact: true }).click();
    await expect(page.locator('.rideau-aide')).toContainText('ne reçoit pas d’e-mails');
    await attendreRideauBaisse(page);
  });

  test('une adresse d\'entreprise lève le rideau et pré-remplit le formulaire', async ({ page }) => {
    await page.goto('index.html');
    await champRideau(page).fill('  Recrutement@Entreprise.fr ');
    await page.getByRole('button', { name: 'Afficher', exact: true }).click();
    await attendreRideauLeve(page);
    await expect(page.locator('#formulaire-contact input[type="email"]')).toHaveValue('Recrutement@Entreprise.fr');
  });

  test('orange.com (salariés) est accepté, orange.fr (particuliers) refusé', async ({ page }) => {
    await page.goto('index.html');
    await champRideau(page).fill('jean.dupont@orange.fr');
    await page.getByRole('button', { name: 'Afficher', exact: true }).click();
    await expect(page.locator('.rideau-aide')).toContainText('adresse professionnelle');
    await champRideau(page).fill('jean.dupont@orange.com');
    await page.getByRole('button', { name: 'Afficher', exact: true }).click();
    await attendreRideauLeve(page);
  });
});
