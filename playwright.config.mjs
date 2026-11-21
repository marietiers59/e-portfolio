/* Tests de bout en bout du site (#200) — mode d'emploi : tests/LISEZMOI.md */
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['monocart-reporter', {
      name: 'Tests du e-portfolio',
      outputFile: 'rapport-tests/index.html',
      // Couverture des scripts du site (Chromium), lisible par SonarQube : couverture/lcov.info
      coverage: {
        outputDir: 'couverture',
        reports: ['lcovonly', 'v8', 'console-summary'],
        inline: true,                    // page de couverture autonome : pas de dossier assets/ à la racine
        entryFilter: (entree) => entree.url.includes('/e-portfolio/scripts/') && !entree.url.includes('/vendor/'),
        sourcePath: (chemin) => chemin.replace(/^.*?e-portfolio\//, ''),   // chemin dans le dépôt
      },
    }],
  ],
  use: {
    baseURL: `http://127.0.0.1:${PORT}/e-portfolio/`,
    trace: 'retain-on-failure',
    // Navigateur : celui de Playwright (npx playwright install chromium), ou un Chrome déjà installé
    launchOptions: process.env.CHROME ? { executablePath: process.env.CHROME } : {},
  },
  projects: [
    { name: 'ordinateur', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 800 } }, testIgnore: /smartphone\.spec\.mjs/ },
    { name: 'smartphone', use: { ...devices['Pixel 7'] }, testMatch: /smartphone\.spec\.mjs/ },
  ],
  webServer: {
    command: `node tests/serveur.mjs`,
    env: { PORT: String(PORT) },
    url: `http://127.0.0.1:${PORT}/e-portfolio/`,
    reuseExistingServer: !process.env.CI,
  },
});
