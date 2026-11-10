# Carte de la zone de recherche de stage

Produit `medias/zone-recherche-clair.webp` et `medias/zone-recherche-sombre.webp`, affichées au survol de
« Lille, Lens, Douai, Arras » dans le pied de page (`scripts/carte-zone.js`).

- Fond : tuiles OpenStreetMap (zoom 11), adoucies (thème clair) ou assombries (thème sombre).
  Attribution obligatoire : « © contributeurs OpenStreetMap » (sur l'image et dans la légende).
- Zone : union adoucie de disques (liste `ZONE` dans `composer.py`, rayons en km) ; les disques proches
  fusionnent en une forme d'amibe, au bord diffus.
- `villes.json` : coordonnées des communes (géocodage Nominatim).

Pour modifier la zone : changer un rayon ou ajouter une commune dans `ZONE` (et ses coordonnées dans
`villes.json`), puis, dans un dossier contenant `osm/` (tuiles x_y.png), `villes.json` et la police
`Atkinson-Bold.ttf` : `python3 composer.py <dossier> <dossier de sortie>`.
