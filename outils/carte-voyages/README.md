# Carte de mes voyages (#179)

Produit `medias/carte-voyages.svg` (environ 40 Ko) et copie les drapeaux dans `medias/drapeaux/`.
La carte s'ouvre depuis l'objet « la carte de mes voyages » du refuge, page Mon univers (`scripts/univers.js`) :
le SVG est inséré dans la page, ce qui lui permet de suivre le thème clair ou sombre (`styles/univers.css`, section 8).
Sans JavaScript, le lien ouvre directement le fichier SVG (couleurs du thème clair).

- Fond de carte : [Natural Earth](https://www.naturalearthdata.com) 1:50 m (domaine public), via le paquet npm `world-atlas` ;
  tracés simplifiés avec `topojson-simplify`, projection conique conforme centrée sur l'Europe (`d3-geo`).
- Drapeaux : [flag-icons](https://github.com/lipis/flag-icons) (licence MIT), format 4:3 ; l'Angleterre a la croix de saint Georges.
- Gibraltar n'existe pas au 1:50 m : seul son drapeau et son point sont dessinés.

Pour ajouter un pays ou un territoire : une ligne dans `VISITES` (code numérique ISO 3166, code du drapeau,
noms français et anglais, point d'ancrage [longitude, latitude], et décalage en pixels si le pays est trop petit),
puis, dans ce dossier :

    npm install
    node construire.mjs

Penser à mettre à jour le texte du refuge (nombre de pays) dans `pages/univers.html` et `en/my-world.html`.
