#!/usr/bin/env python3
"""
Nuage de compétences façon Gephi.

  python3 nuage.py graphe   → entree.gexf (nœuds, liens, tailles, positions de départ)
  java … Spatialiser.java   → ../../medias/nuage-competences.gexf (Gephi : modularité + ForceAtlas2)
  python3 nuage.py rendu    → SVG injecté dans pages/competences.html et en/skills.html,
                              + medias/nuage-competences.svg (image seule)

construire.sh enchaîne les trois étapes.
"""
import html
import math
import random
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

from donnees import BUT, BUT_LONG, NOTIONS, OUTILS, PROJETS

ICI = Path(__file__).resolve().parent
RACINE = ICI.parent.parent
ENTREE = ICI / "entree.gexf"
GEPHI = RACINE / "medias" / "nuage-competences.gexf"
IMAGE = RACINE / "medias" / "nuage-competences.svg"
PAGES = {"fr": RACINE / "pages" / "competences.html", "en": RACINE / "en" / "skills.html"}


# ---------- 1. Graphe ----------
def graphe():
    """Nœuds {id: (fr, en, type)} et liens {(a, b): poids}."""
    noeuds, liens = {}, {}

    def lier(a, b, poids):
        cle = tuple(sorted((a, b)))
        liens[cle] = max(liens.get(cle, 0), poids)

    for i, (fr, en) in BUT.items():
        noeuds[i] = (fr, en, "but")
    for i, (fr, en, comps) in NOTIONS.items():
        noeuds[i] = (fr, en, "notion")
        for c in comps:
            lier(i, c, 2.0)
    for i, (fr, en, parents) in OUTILS.items():
        noeuds[i] = (fr, en, "outil")
        for p in parents:
            lier(i, p, 1.5)
    for i, (fr, en, outils, comps) in PROJETS.items():
        noeuds[i] = (fr, en, "projet")
        for o in outils:
            assert o in OUTILS, f"outil inconnu : {o}"
            lier(i, o, 1.0)
        for c in comps:
            lier(i, c, 1.0)
    return noeuds, liens


def degres(noeuds, liens):
    d = {n: 0 for n in noeuds}
    for a, b in liens:
        d[a] += 1
        d[b] += 1
    return d


def rayon(deg, type_):
    """Taille du nœud selon son degré (comme le classement « taille » de Gephi)."""
    r = 3.2 + 2.0 * math.sqrt(deg)
    return r * (1.25 if type_ == "but" else 1.0)


def ecrire_entree():
    noeuds, liens = graphe()
    d = degres(noeuds, liens)
    alea = random.Random(2026)
    gexf = ET.Element("gexf", {"xmlns": "http://gexf.net/1.3", "xmlns:viz": "http://gexf.net/1.3/viz", "version": "1.3"})
    g = ET.SubElement(gexf, "graph", {"defaultedgetype": "undirected"})
    attrs = ET.SubElement(g, "attributes", {"class": "node"})
    ET.SubElement(attrs, "attribute", {"id": "type", "title": "type", "type": "string"})
    ET.SubElement(attrs, "attribute", {"id": "label_en", "title": "label_en", "type": "string"})
    xn = ET.SubElement(g, "nodes")
    for i, (fr, en, t) in noeuds.items():
        n = ET.SubElement(xn, "node", {"id": i, "label": fr})
        av = ET.SubElement(n, "attvalues")
        ET.SubElement(av, "attvalue", {"for": "type", "value": t})
        ET.SubElement(av, "attvalue", {"for": "label_en", "value": en})
        ET.SubElement(n, "viz:size", {"value": f"{rayon(d[i], t):.2f}"})
        ET.SubElement(n, "viz:position", {"x": f"{alea.uniform(-300, 300):.1f}", "y": f"{alea.uniform(-300, 300):.1f}", "z": "0"})
    xe = ET.SubElement(g, "edges")
    for k, ((a, b), w) in enumerate(liens.items()):
        ET.SubElement(xe, "edge", {"id": str(k), "source": a, "target": b, "weight": str(w)})
    ET.indent(gexf)
    ET.ElementTree(gexf).write(ENTREE, encoding="utf-8", xml_declaration=True)
    print(f"{len(noeuds)} nœuds, {len(liens)} liens → {ENTREE.name}")


if __name__ == "__main__":
    if sys.argv[1:] == ["graphe"]:
        ecrire_entree()
    elif sys.argv[1:] == ["rendu"]:
        from rendu import rendre
        rendre()
    else:
        print(__doc__)
