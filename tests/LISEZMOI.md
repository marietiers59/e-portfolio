# tests de bout en bout

Les tests ouvrent le site dans un vrai navigateur (Chromium, avec **Playwright**) et vérifient ce
qu'un visiteur verrait. Ils tournent sur un petit serveur local (`tests/serveur.mjs`), qui sert le
dépôt sous `/e-portfolio/` comme GitHub Pages, **sans aucun appel réseau extérieur** : polices,
GoatCounter, ipapi.is et dns.google sont interceptés (`tests/fixtures.mjs`).

| fichier | ce qui est vérifié |
| --- | --- |
| `rideau.spec.mjs` | coordonnées masquées par défaut et absentes du code ; laissez-passer (lien `?via=`, provenance LinkedIn ou site d'annonces, réseau d'entreprise, e-mail professionnel) ; refus des messageries personnelles, des adresses mal écrites et des domaines sans e-mail ; laissez-passer conservé d'une page à l'autre |
| `theme-zoom.spec.mjs` | thème selon l'appareil, posé avant l'affichage, bascule et mémorisation ; zoom : boutons, limites, mémorisation, plafond sur écran étroit |
| `pages.spec.mjs` | chacune des 17 pages : langue, titre, liens et images internes valides, aucune erreur JavaScript ; drapeau de langue ; nuage de compétences |
| `smartphone.spec.mjs` | actualiser ramène à l'accueil ; arrivée animée après un balayage |

Chaque test échoue aussi si la page déclenche une erreur JavaScript.

## lancer les tests

Une fois pour toutes : `npm install`, puis `npx playwright install chromium`.

```
npm test               tous les tests (≈ 1 minute)
npm run test:voir      interface de Playwright : lancer un test, le voir pas à pas
npx playwright test rideau     seulement les tests du rideau
```

Avec un Chrome déjà installé, on peut se passer du Chromium de Playwright :
`CHROME=/usr/bin/google-chrome npm test`.

## rapports

- `rapport-tests/index.html` : rapport détaillé (réussites, échecs, captures et traces des échecs) ;
- `couverture/index.html` : part du code des scripts exécutée pendant les tests ;
  `couverture/lcov.info` est lu par SonarQube (`sonar-project.properties`).

Ces dossiers sont régénérés à chaque lancement et ne sont pas suivis par Git. Sur GitHub, chaque
*merge request* lance les tests (workflow « vérifications ») et garde le rapport 14 jours
(onglet *Actions*, artefact `rapport-tests`).
