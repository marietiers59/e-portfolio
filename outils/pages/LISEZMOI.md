# pages : un modèle bilingue par page

Chaque page du site existe en français et en anglais. Plutôt que de tenir deux copies à jour à la main,
on écrit **un seul modèle** par page dans `modeles/`, avec les deux langues côte à côte ;
`construire.mjs` en tire les pages publiées.

Une analogie : le modèle est une **partition à deux voix**. Les mesures communes (structure HTML,
classes, scripts) ne sont écrites qu'une fois ; seules les paroles changent d'une voix à l'autre.

```
modeles/pages.json          quelle page publier pour chaque langue
modeles/<identifiant>.html  le modèle (ex. modeles/projets.html → pages/projets.html et en/projects.html)
modeles/fragments/          morceaux générés par d'autres outils (nuage de compétences), un par langue
```

## modifier une page

1. Modifier **le modèle** dans `modeles/`, jamais la page publiée (elle commence par un commentaire
   « Page générée à partir de… »).
2. Régénérer : `node outils/pages/construire.mjs`
3. Vérifier dans le navigateur, puis committer le modèle **et** les pages régénérées.

Le *hook* `pre-commit` et la vérification GitHub de chaque *merge request* refusent une page publiée
qui ne correspond pas à son modèle : `node outils/pages/construire.mjs --verifier`.

## syntaxe du modèle

**Texte propre à une langue** : `<!--fr-->` texte français `<!--en-->` texte anglais `<!--/-->`.

```html
<li><a href="{{page:projets}}"><!--fr-->Projets<!--en-->Projects<!--/--></a></li>
```

Sur plusieurs lignes, chaque marqueur seul sur sa ligne disparaît avec sa ligne :

```html
<p>
  <!--fr-->
  Je recherche un <strong class="kw">stage</strong>…
  <!--en-->
  I am looking for an <strong class="kw">internship</strong>…
  <!--/-->
</p>
```

Une seule langue suffit si l'autre n'a rien : `<!--en-->` (a three-year French Bachelor) `<!--/-->`.
Pas de marqueur à l'intérieur d'un commentaire HTML : on écrit alors les deux commentaires en bloc.

**Variables** (pour que le même modèle serve en français et en anglais) :

| variable | devient | exemple |
| --- | --- | --- |
| `{{racine}}` | chemin vers la racine du site | `""` sur l'accueil français, `"../"` ailleurs |
| `{{page:identifiant}}` | lien vers une page, dans la même langue | `{{page:competences}}` → `competences.html` ou `skills.html` |
| `{{traduction}}` | la même page dans l'autre langue | le drapeau de la barre du haut |
| `{{fragment:nom}}` | contenu de `modeles/fragments/nom.fr.html` ou `.en.html` | le nuage de compétences |

Une page sans version anglaise (l'espace personnel) n'a que `"fr"` dans `pages.json` ;
`{{page:espace}}` mène alors à la version française depuis les deux langues.

## ajouter une page

1. Ajouter son entrée dans `modeles/pages.json`, par exemple
   `"stages": { "fr": "pages/stages.html", "en": "en/internships.html" }`.
2. Créer `modeles/stages.html`, puis lancer `node outils/pages/construire.mjs`.

En cas d'erreur (bloc jamais refermé, page ou variable inconnue), le script indique le modèle et
la ligne concernés, et n'écrit rien.
