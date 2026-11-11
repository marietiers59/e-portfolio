# e-portfolio — Marie Tiers

Portfolio d'une étudiante en 2ᵉ année de **BUT informatique** à l'IUT de Lens (Université d'Artois),
parcours *réalisation d'applications*, certifiée **ISTQB Foundation**.

→ **[voir le site](https://marietiers59.github.io/e-portfolio/)** · [*English version*](https://marietiers59.github.io/e-portfolio/en/)

Je recherche un **stage** de 8 à 10 semaines à partir du 26 avril 2027, puis une **alternance**
en **développement *full-stack*** (web ou web mobile) ou en **test logiciel automatisé** (*QA engineer*).

## l'histoire du projet

Le dépôt est né vide le 26 juillet 2026. Le site s'est ensuite construit par étapes, chacune suivie
par un [jalon](https://github.com/marietiers59/e-portfolio/milestones?state=all) et des
[tickets](https://github.com/marietiers59/e-portfolio/issues?q=is%3Aissue) regroupés en *epics*.

**v1 — mise en ligne** (16 et 17 octobre 2026). Une nouvelle version du portfolio remplace le dépôt vide
et passe sur **GitHub Pages**. Dès le lendemain, refonte : les projets quittent l'accueil pour une
**page dédiée**, une section présente ma « tri-force » (guide nature, test logiciel, développement),
un **compteur de visites sans cookie** (GoatCounter) s'installe, et une première surprise se cache
dans la frise chronologique.

**v2 — projets et coordonnées protégées** (25 octobre → 6 novembre). Les cartes des projets arrivent,
chacune reliée à son dépôt (BycloWatt, SAÉ 1.01 et 1.02, Otaku List, *Space Invaders*…), puis sont
illustrées et triées, avec une catégorie « bientôt en ligne ». Côté vie privée, l'e-mail et le
téléphone passent derrière un **rideau** : il ne se lève que pour les visiteurs venus de LinkedIn,
d'un site d'annonces, de France Travail ou d'une organisation professionnelle. Le CV publié masque
aussi ces coordonnées.

**v3 — bilingue, thème sombre, compétences** (8 et 9 novembre). Le travail passe par des
*merge requests*. Le site devient **bilingue** (anglais britannique, adresses en anglais, bascule par
drapeaux), gagne un **mode sombre** qui suit d'abord le réglage de l'appareil, et une page
**Compétences** avec un **nuage façon Gephi** en 3D, calculé à partir de mes projets et du programme
national du BUT. Sur téléphone, on passe d'une page à l'autre d'un **balayage** du doigt, sans perdre
le zoom à deux doigts. Une page **accessibilité** détaille la grille RGAA.

**v4 — job-dating du 12 novembre 2026** (10 → 12 novembre). Finitions pour le rendez-vous :
formulaire de contact et **carte de la zone de recherche**, sous-menu CV (télécharger ou ouvrir),
notice « Recruteur ? », harmonie des couleurs autour d'un **bleu-cyan à 197°**, une lisible sans
défiler, **visite guidée** de chaque page, études de cas repliables sur les projets publiés, et
quelques *easter eggs* pour les curieux. Le dépôt lui-même est outillé : tickets rétroactifs reliés à
chaque *merge request*, licence stricte, ce README, relecture et convention de commits.

**v5 — après le job-dating** (jusqu'au 18 décembre 2026). Au programme : le **CV vidéo** (sous-titré
et transcrit), le calendrier d'alternance, des **QR codes nominatifs** pour lever le rideau devant une
personne précise, et la publication des projets encore « bientôt en ligne ».

## le site

| page | français | anglais | rôle |
| --- | --- | --- | --- |
| accueil | [index.html](https://marietiers59.github.io/e-portfolio/) | [en/index.html](https://marietiers59.github.io/e-portfolio/en/) | brèves, piliers, aperçu des compétences, frise du parcours, calendrier du stage, contact |
| projets | [pages/projets.html](https://marietiers59.github.io/e-portfolio/pages/projets.html) | [en/projects.html](https://marietiers59.github.io/e-portfolio/en/projects.html) | cartes filtrables et triables, études de cas, liens vers les dépôts |
| compétences | [pages/competences.html](https://marietiers59.github.io/e-portfolio/pages/competences.html) | [en/skills.html](https://marietiers59.github.io/e-portfolio/en/skills.html) | compétences par catégories, nuage Gephi en 3D et sa version texte |
| CV vidéo | [pages/cv-video.html](https://marietiers59.github.io/e-portfolio/pages/cv-video.html) | [en/video-cv.html](https://marietiers59.github.io/e-portfolio/en/video-cv.html) | en construction |
| accessibilité | [pages/accessibilite.html](https://marietiers59.github.io/e-portfolio/pages/accessibilite.html) | [en/accessibility.html](https://marietiers59.github.io/e-portfolio/en/accessibility.html) | déclaration et grille RGAA |
| CV | [cv-marie-tiers.pdf](https://marietiers59.github.io/e-portfolio/cv-marie-tiers.pdf) | [cv-marie-tiers-en.pdf](https://marietiers59.github.io/e-portfolio/cv-marie-tiers-en.pdf) | CV au format PDF |

## choix de réalisation

- **HTML, CSS et JavaScript** écrits à la main, sans *framework* ni étape de compilation ; seule
  bibliothèque : Matter.js pour un clin d'œil à la gravité.
- **Mobile d'abord** et adaptatif : une colonne sur téléphone en portrait, trois colonnes sur tablette,
  ordinateur et télévision.
- **Charte** : trois couleurs pastel équilibrées sur le cercle chromatique, Trebuchet pour le texte,
  peu d'effets ; mots anglais en italique et mots-clés en gras (règle inversée sur les pages anglaises).
- **Accessibilité** : navigation au clavier, lien d'évitement, contrastes vérifiés, animations coupées
  quand le système demande moins de mouvement, alternatives textuelles aux visuels.
- **Vie privée** : rideau sur les coordonnées, formulaire sans service tiers, mesure d'audience sans
  cookie, mention du RGPD.
- **Outils maison** (dossier `outils/`) : génération du nuage de compétences avec le Gephi Toolkit,
  composition de la carte de la zone de recherche à partir d'OpenStreetMap.

## structure

```
index.html                 accueil (français)
en/                        pages anglaises
pages/                     projets, compétences, CV vidéo, accessibilité, espace personnel
styles/style.css           feuille de styles commune (thèmes clair et sombre)
scripts/script.js          menu, formulaire, filtres, calendrier, compteur, nuage 3D
scripts/rideau.js          rideau sur les coordonnées
scripts/balayage.js        balayage entre pages sur téléphone
scripts/visite.js          visite guidée
scripts/carte-zone.js      carte de la zone de recherche
scripts/contact-eggs.js    surprises du champ Message
scripts/bug-egg.js         surprise de la frise
scripts/vendor/            Matter.js (licence MIT)
medias/                    images, drapeaux, nuage de compétences, CV masqués
outils/nuage-competences/  construction du nuage (Python, Java, Gephi)
outils/carte-zone/         composition de la carte (Python)
.github/                   modèles de tickets et de merge requests, CODEOWNERS, vérifications
.githooks/                 contrôle local des messages de commit
```

Pour afficher le site sur son ordinateur : lancer `python -m http.server` dans ce dossier, puis
ouvrir <http://localhost:8000>.

## méthode de travail

- **Tickets** : chaque besoin devient un ticket (fonctionnalité, tâche, anomalie ou documentation),
  rattaché à un *epic*, à un jalon et à ses dépendances (*blocked by*), avec ses étiquettes de zone,
  de priorité et de taille.
- **Une branche, une *merge request*** par ticket ou petit groupe de tickets ; la *merge request*
  cite ses tickets (`Closes #N`).
- **Commits numérotés** : chaque message de commit cite au moins un ticket (`#N`). Le contrôle se fait
  en local par un *hook* et sur GitHub à chaque *merge request*. Pour activer le *hook* une fois
  pour toutes : `git config core.hooksPath .githooks`
- **Relecture** : Marie Tiers est l'unique relectrice et propriétaire du code (`.github/CODEOWNERS`).

## droits

**Tous droits réservés.** Le code, le design et les contenus peuvent être consultés pour évaluer mon
travail, mais pas copiés, adaptés ni réutilisés sans mon accord écrit. Détails dans [LICENSE](LICENSE).

Site conçu avec l'assistance de Claude (Anthropic) ; certaines illustrations sont générées par IA,
comme l'indique le pied de page du site.

## contact

[Me contacter](https://marietiers59.github.io/e-portfolio/#contact) · [LinkedIn](https://www.linkedin.com/in/marie-tiers-1991-59-France)
