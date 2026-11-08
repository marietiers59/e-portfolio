# Nuage de compétences

Graphe de la page **Compétences** : mes projets, les outils qu'ils mobilisent, les notions et les six compétences du programme national du BUT informatique.

- **Gephi** (via le Gephi Toolkit) calcule les communautés (modularité, méthode de Louvain) et la disposition (ForceAtlas2).
- `rendu.py` dessine le SVG : couleurs par communauté, taille selon le nombre de liens, noms écartés pour ne pas se chevaucher.

| Fichier | Rôle |
|---|---|
| `donnees.py` | projets, outils, notions, compétences et leurs liens : **le seul fichier à modifier** |
| `Spatialiser.java` | modularité + ForceAtlas2 avec le Gephi Toolkit |
| `nuage.py`, `rendu.py` | construction du graphe, rendu SVG et injection dans les pages |
| `construire.sh` | enchaîne le tout |

## Mettre à jour

```bash
cd outils/nuage-competences
./construire.sh
```

Le script remplace ce qui se trouve entre les marqueurs `<!-- nuage-…:debut -->` et `<!-- nuage-…:fin -->` de `pages/competences.html` et `en/skills.html`, et réécrit `medias/nuage-competences.gexf` (à ouvrir dans Gephi) et `medias/nuage-competences.svg` (image seule).
