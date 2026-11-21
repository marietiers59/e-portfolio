# Nuage de compétences

Graphe de la page **Compétences** : mes projets, les outils qu'ils mobilisent, les notions et les six compétences du programme national du BUT informatique.

- **Gephi** (via le Gephi Toolkit) calcule les communautés (modularité, méthode de Louvain) et la disposition (ForceAtlas2).
- `rendu.py` dessine le SVG à plat (sans JavaScript) et prépare les données de la vue 3D : dégradé continu orange foncé → framboise → violet selon la place de chaque nœud, profondeur ajoutée aux positions de Gephi.
- `scripts/script.js` (section 8) dessine le réseau en 3D dans un canvas : rotation, influx le long des liens, zoom, mise en évidence.

| Fichier | Rôle |
|---|---|
| `donnees.py` | projets, outils, notions, compétences et leurs liens : **le seul fichier à modifier** |
| `Spatialiser.java` | modularité + ForceAtlas2 avec le Gephi Toolkit |
| `couleurs.py` | dégradé orange foncé → framboise → violet (luminosité constante, contraste vérifié : `python3 couleurs.py`) |
| `nuage.py`, `rendu.py` | construction du graphe, rendu SVG et injection dans les pages |
| `construire.sh` | enchaîne le tout |

## Mettre à jour

```bash
cd outils/nuage-competences
./construire.sh
```

Le script écrit ce qui va entre les marqueurs `<!-- nuage-…:debut -->` et `<!-- nuage-…:fin -->` du modèle `modeles/competences.html` dans `modeles/fragments/nuage-*.fr.html` et `nuage-*.en.html`, régénère les pages `pages/competences.html` et `en/skills.html` (voir `outils/pages/LISEZMOI.md`), et réécrit `medias/nuage-competences.gexf` (à ouvrir dans Gephi) et `medias/nuage-competences.svg` (image seule).
