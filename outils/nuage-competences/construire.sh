#!/usr/bin/env bash
# Régénère le nuage de compétences de la page Compétences (FR et EN).
#   1. donnees.py → entree.gexf
#   2. Gephi Toolkit : communautés (modularité) + spatialisation ForceAtlas2 → medias/nuage-competences.gexf
#   3. rendu SVG injecté dans pages/competences.html et en/skills.html, + medias/nuage-competences.svg
# Prérequis : Python 3, Java 11 ou plus. Le Gephi Toolkit (≈ 80 Mo) est téléchargé une fois dans /tmp.
set -euo pipefail
cd "$(dirname "$0")"

VERSION=0.10.1
JAR="/tmp/gephi-toolkit-$VERSION-all.jar"
if [ ! -s "$JAR" ]; then
  echo "Téléchargement du Gephi Toolkit $VERSION…"
  curl -fL -o "$JAR" "https://github.com/gephi/gephi-toolkit/releases/download/v$VERSION/gephi-toolkit-$VERSION-all.jar"
fi

python3 nuage.py graphe
java -Djava.awt.headless=true -Dstdout.encoding=UTF-8 -cp "$JAR" Spatialiser.java entree.gexf ../../medias/nuage-competences.gexf 2>&1 \
  | grep -v -E '^(Picked up|[A-Z][a-z]{2} [0-9]{2}, |INFO:|WARNING:)' || true
python3 nuage.py rendu
