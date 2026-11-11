# e-portfolio — Marie Tiers

Portfolio d'une étudiante en 2ᵉ année de **BUT informatique** à l'IUT de Lens (Université d'Artois),
parcours *réalisation d'applications*, certifiée **ISTQB Foundation**.

→ **[voir le site](https://marietiers59.github.io/e-portfolio/)**

Je recherche un **stage** de 8 à 10 semaines à partir du 26 avril 2027, puis une **alternance**
en développement *full-stack* ou en test logiciel.

## contenu

| page | rôle |
| --- | --- |
| [accueil](https://marietiers59.github.io/e-portfolio/) | présentation, objectif, parcours en frise chronologique, contact |
| [projets](https://marietiers59.github.io/e-portfolio/pages/projets.html) | projets de cours et projets personnels, filtrables et triables, avec un lien vers chaque dépôt |
| [CV](https://marietiers59.github.io/e-portfolio/cv-marie-tiers.pdf) | CV au format PDF |

## réalisation

- **HTML, CSS et JavaScript** sans bibliothèque ni étape de compilation, hébergés sur **GitHub Pages**.
- **Mobile d'abord** et adaptatif : une colonne sur téléphone, trois à partir de la tablette.
- **Accessibilité** : navigation au clavier, lien d'évitement, animations coupées
  quand le système demande de réduire les mouvements.
- **Formulaire de contact** sans serveur, avec vérification de l'adresse e-mail (syntaxe, faute de frappe,
  existence du domaine).
- **Mesure d'audience sans cookie** avec GoatCounter.

## structure

```
index.html            accueil
pages/projets.html    projets (cartes, filtres, tri)
pages/espace.html     espace personnel (réglage du compteur de visites)
styles/style.css      feuille de styles commune
scripts/script.js     défilement, formulaire, filtres, calendrier, compteur
scripts/apparition.js fondu des blocs au défilement (entrée en montant, sortie en descendant)
scripts/bug-egg.js    une petite surprise dans la frise chronologique
medias/               images
```

Pour l'afficher sur son ordinateur : ouvrir `index.html` dans un navigateur, ou lancer
`python -m http.server` dans ce dossier puis aller sur <http://localhost:8000>.

## droits

Le code est sous licence MIT ; les textes, photos, illustrations et le CV restent tous droits réservés.
Détails dans [LICENSE](LICENSE).

## contact

[Me contacter](https://marietiers59.github.io/e-portfolio/#contact) · [LinkedIn](https://www.linkedin.com/in/marie-tiers-1991-59-France)
