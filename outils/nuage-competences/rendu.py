"""
Rendu SVG du nuage spatialisé par Gephi (voir nuage.py).

Reprend tel quel le travail de Gephi (positions ForceAtlas2, communautés de modularité),
puis ajoute une petite passe « ajustement des étiquettes » (comme le Label Adjust de Gephi)
pour que les noms ne se chevauchent pas.
"""
import html
import math
import re
import xml.etree.ElementTree as ET
from collections import defaultdict

from donnees import BUT_LONG, NOTIONS
from nuage import GEPHI, IMAGE, PAGES, degres, graphe, rayon

NS = {"g": "http://gexf.net/1.3", "viz": "http://gexf.net/1.3/viz"}

# Teinte de chaque communauté, choisie d'après la compétence du BUT qu'elle contient
# (mêmes familles de couleurs que les cartes de la page) ; k1…k7 sont définies dans style.css.
TEINTE_PAR_PIVOT = {"c6": "k1", "c2": "k2", "c4": "k3", "c1": "k5", "c5": "k6", "c3": "k7"}
TEINTES = ["k1", "k2", "k3", "k4", "k5", "k6", "k7"]
# Couleurs figées pour l'image seule (thème clair), reprises de style.css
COULEURS_IMAGE = {
    "k1": "hsl(25 72% 62%)", "k2": "hsl(85 42% 48%)", "k3": "hsl(170 40% 44%)", "k4": "hsl(203 62% 56%)",
    "k5": "hsl(235 42% 62%)", "k6": "hsl(268 38% 64%)", "k7": "hsl(330 50% 63%)",
}

# Mots étrangers à la langue de la page, mis en italique dans la version texte (charte éditoriale)
ETRANGERS = {
    "fr": ("en", ["Otaku List", "Space Invaders", "FractaLens", "ToDoList+", "resumeCV", "Pac-Man", "food-truck"]),
    "en": ("fr", ["Centre Santé Bien-Être", "Les Amis de Buxton", "AFPA", "SAÉ", "BUT"]),
}


def marquer(texte, langue):
    """Échappe le texte et met en italique les mots de l'autre langue."""
    autre, mots = ETRANGERS[langue]
    texte = html.escape(texte, quote=False)
    for mot in mots:
        texte = re.sub(rf"(?<![\w>]){re.escape(html.escape(mot, quote=False))}(?![\w<])", f'<i lang="{autre}">{mot}</i>', texte)
    return texte


TYPES = {
    "but":    ("compétence du BUT", "BUT competency"),
    "notion": ("notion du programme", "syllabus topic"),
    "projet": ("projet ou expérience", "project or experience"),
    "outil":  ("outil", "tool"),
}


GROSSI = 1.3   # les disques sont dessinés un peu plus gros que dans Gephi (lisibilité)
ECART = 1.5    # espace entre un disque et son nom


def taille_police(r, t):
    if t == "but":
        return 15.0 + 0.55 * r
    if t == "notion":
        return 10.5 + 0.35 * r
    return 8.6 + 0.3 * r


def largeur_texte(texte, f, gras):
    return len(texte) * f * (0.6 if gras else 0.55) + 4


def lire_gephi():
    racine = ET.parse(GEPHI).getroot()
    pos, classe = {}, {}
    for n in racine.iter("{%s}node" % NS["g"]):
        i = n.get("id")
        p = n.find("viz:position", NS)
        pos[i] = [float(p.get("x")), -float(p.get("y"))]   # Gephi : y vers le haut ; SVG : vers le bas
        for a in n.iter("{%s}attvalue" % NS["g"]):
            if a.get("for") == "modularity_class":
                classe[i] = int(a.get("value"))
    return pos, classe


def ajuster_etiquettes(pos, boites, iterations=600):
    """Écarte les nœuds dont les boîtes « disque + nom dessous » se chevauchent.
    boites[i] = (largeur, hauteur, masse, décalage vertical du centre de la boîte)."""
    ids = list(pos)
    for _ in range(iterations):
        bouge = False
        for a_i in range(len(ids)):
            a = ids[a_i]
            wa, ha, ma, da = boites[a]
            for b in ids[a_i + 1:]:
                wb, hb, mb, db = boites[b]
                dx = pos[b][0] - pos[a][0]
                dy = (pos[b][1] + db) - (pos[a][1] + da)
                ox = (wa + wb) / 2 + 3 - abs(dx)
                oy = (ha + hb) / 2 + 2 - abs(dy)
                if ox > 0 and oy > 0:
                    bouge = True
                    part_a = mb / (ma + mb)      # le plus lourd bouge le moins
                    if ox / (wa + wb) < oy / (ha + hb):
                        s = 1 if dx >= 0 else -1
                        pos[a][0] -= s * ox * part_a * 0.5
                        pos[b][0] += s * ox * (1 - part_a) * 0.5
                    else:
                        s = 1 if dy >= 0 else -1
                        pos[a][1] -= s * oy * part_a * 0.5
                        pos[b][1] += s * oy * (1 - part_a) * 0.5
        if not bouge:
            break


def forme(i, t, x, y, r):
    """Disque (outil), carré arrondi (projet), anneau (notion), disque cerclé (compétence du BUT)."""
    if t == "projet":
        c = r * 0.9
        return f'<rect class="n" data-id="{i}" x="{x - c:.1f}" y="{y - c:.1f}" width="{2 * c:.1f}" height="{2 * c:.1f}" rx="{c * 0.38:.1f}"/>'
    if t == "notion":
        return f'<circle class="n n-anneau" data-id="{i}" cx="{x:.1f}" cy="{y:.1f}" r="{r * 0.86:.1f}" stroke-width="{r * 0.28:.1f}"/>'
    if t == "but":
        return (f'<g class="n" data-id="{i}"><circle class="n-halo" cx="{x:.1f}" cy="{y:.1f}" r="{r + 5:.1f}"/>'
                f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}"/></g>')
    return f'<circle class="n" data-id="{i}" cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}"/>'


def construire(langue):
    """Renvoie (svg, légende des communautés, version texte, nom des communautés)."""
    en = langue == "en"
    noeuds, liens = graphe()
    deg = degres(noeuds, liens)
    pos, classe = lire_gephi()
    r = {i: rayon(deg[i], noeuds[i][2]) * GROSSI for i in noeuds}
    lib = {i: noeuds[i][1 if en else 0] for i in noeuds}

    # Communautés : teinte et nom
    membres = defaultdict(list)
    for i in noeuds:
        membres[classe[i]].append(i)
    teinte, nom, libres = {}, {}, [k for k in TEINTES if k not in TEINTE_PAR_PIVOT.values()]
    for c, ms in sorted(membres.items(), key=lambda kv: -len(kv[1])):
        pivots = [m for m in ms if noeuds[m][2] == "but"]
        if pivots:
            p = max(pivots, key=lambda m: deg[m])
            teinte[c] = TEINTE_PAR_PIVOT[p]
        else:
            p = max((m for m in ms if noeuds[m][2] == "notion"), key=lambda m: deg[m], default=max(ms, key=lambda m: deg[m]))
            teinte[c] = libres.pop(0)
        nom[c] = lib[p]
    k = {i: teinte[classe[i]] for i in noeuds}

    # Ajustement des étiquettes (mêmes positions pour les deux langues : on prend la plus longue)
    boites = {}
    for i, (fr, en_, t) in noeuds.items():
        f = taille_police(r[i] / GROSSI, t)
        w = max(largeur_texte(fr, f, t in ("but", "notion")), largeur_texte(en_, f, t in ("but", "notion")))
        h = 2 * r[i] + ECART + f * 1.05                 # disque, puis le nom juste dessous
        boites[i] = (max(w, 2 * r[i] + 2), h, r[i] ** 2, h / 2 - r[i])
    ajuster_etiquettes(pos, boites)

    xs = [pos[i][0] for i in noeuds]
    ys = [pos[i][1] for i in noeuds]
    marge = 24
    x0 = min(pos[i][0] - boites[i][0] / 2 for i in noeuds) - marge
    x1 = max(pos[i][0] + boites[i][0] / 2 for i in noeuds) + marge
    y0 = min(pos[i][1] + boites[i][3] - boites[i][1] / 2 for i in noeuds) - marge
    y1 = max(pos[i][1] + boites[i][3] + boites[i][1] / 2 for i in noeuds) + marge
    vb = f"{x0:.0f} {y0:.0f} {x1 - x0:.0f} {y1 - y0:.0f}"
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2

    # Liens courbes (sens horaire, comme Gephi), couleur de l'extrémité la moins connectée
    aretes = []
    for (a, b), w in sorted(liens.items(), key=lambda kv: -kv[1]):
        if deg[a] < deg[b]:
            a, b = b, a      # b = la feuille, qui donne sa couleur
        (xa, ya), (xb, yb) = pos[a], pos[b]
        mx, my = (xa + xb) / 2, (ya + yb) / 2
        dx, dy = xb - xa, yb - ya
        qx, qy = mx - dy * 0.18, my + dx * 0.18
        aretes.append(f'<path class="l {k[b]}" data-a="{a}" data-b="{b}" pathLength="1" stroke-width="{0.5 + 0.55 * w:.2f}" '
                      f'd="M{xa:.1f} {ya:.1f}Q{qx:.1f} {qy:.1f} {xb:.1f} {yb:.1f}"/>')

    # Nœuds du centre vers l'extérieur (ordre d'apparition de l'animation), petits dessous, gros dessus
    ordre = sorted(noeuds, key=lambda i: math.hypot(pos[i][0] - cx, pos[i][1] - cy))
    rang = {i: n for n, i in enumerate(ordre)}
    formes, etiquettes = [], []
    for i in sorted(noeuds, key=lambda i: r[i]):
        t = noeuds[i][2]
        x, y = pos[i]
        f = taille_police(r[i] / GROSSI, t)
        formes.append(forme(i, t, x, y, r[i]).replace(f'data-id="{i}"', f'data-id="{i}" data-t="{t}" style="--i:{rang[i]}"', 1)
                      .replace('class="n', f'class="{k[i]} n', 1))
        etiquettes.append(f'<text class="etq etq-{t} {k[i]}" data-id="{i}" x="{x:.1f}" y="{y + r[i] + ECART:.1f}" dy=".85em" '
                          f'font-size="{f:.1f}" style="--i:{rang[i]}">{html.escape(lib[i])}</text>')

    titre = ("Nuage de compétences : projets, outils et compétences du BUT informatique, regroupés en communautés"
             if not en else "Skills network: projects, tools and BUT competencies, grouped into communities")
    etq_apercu = (x1 - x0) / 400 * 12.5      # taille des noms dans l'aperçu : ≈ 12,5 px à l'écran
    svg = (f'<svg class="nuage-svg" viewBox="{vb}" style="--etq-apercu: {etq_apercu:.0f}px" role="img" aria-label="{titre}" focusable="false" '
           f'preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">\n'
           f'<g class="liens">\n' + "\n".join(aretes) + '\n</g>\n'
           f'<g class="noeuds">\n' + "\n".join(formes) + '\n</g>\n'
           f'<g class="etiquettes">\n' + "\n".join(etiquettes) + '\n</g>\n</svg>')

    # Légende : une puce par communauté (bouton de filtre dans la vue agrandie)
    comms = sorted(membres, key=lambda c: -len(membres[c]))
    legende = "\n".join(
        f'<li><button class="nuage-puce {teinte[c]}" type="button" data-communaute="{teinte[c]}" aria-pressed="false" disabled>'
        f'<span class="nuage-pastille" aria-hidden="true"></span>{html.escape(nom[c])}</button></li>'
        for c in comms)

    # Version texte : chaque communauté, membres rangés par famille
    familles = ["but", "notion", "projet", "outil"]
    titres_familles = {"but": ("compétence", "competency"), "notion": ("notions", "topics"),
                       "projet": ("projets", "projects"), "outil": ("outils", "tools")}
    lignes = []
    for c in comms:
        parties = []
        for fam in familles:
            ms = sorted((m for m in membres[c] if noeuds[m][2] == fam), key=lambda m: (-deg[m], lib[m].lower()))
            if not ms:
                continue
            noms = ", ".join(marquer(BUT_LONG[m][1 if en else 0] if fam == "but" else lib[m], langue) for m in ms)
            parties.append(f'<em>{titres_familles[fam][1 if en else 0]}</em>{" :" if not en else ":"} {noms}')
        lignes.append(f'<li><strong class="nuage-texte-nom {teinte[c]}">{html.escape(nom[c])}</strong> — ' + ("; " if en else " ; ").join(parties) + "</li>")
    texte = "\n".join(lignes)
    return svg, legende, texte, vb


def image_seule():
    """medias/nuage-competences.svg : l'image autonome (thème clair), pour la consulter sans JavaScript."""
    svg, _, _, vb = construire("fr")
    x, y, w, h = vb.split()
    fond = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#fdfcf9"/>'

    # Couleurs écrites en clair (certains lecteurs d'images ignorent les variables CSS)
    regles = "".join(f".l.{k}{{stroke:{c}}}.n.{k}{{fill:{c}}}.n-anneau.{k},.{k} .n-halo{{stroke:{c}}}"
                     for k, c in COULEURS_IMAGE.items())
    style = ("<style>svg{background:#fdfcf9;font-family:'Atkinson Hyperlegible',Verdana,sans-serif}"
             ".l{fill:none;opacity:.45}.n{stroke:#fff;stroke-width:1.2}"
             ".n-anneau{fill:#fff!important}.n-halo{fill:none;stroke-width:2;opacity:.6}" + regles +
             "text{text-anchor:middle;fill:#2a2f3a;paint-order:stroke;stroke:#fdfcf9;stroke-width:3px;stroke-linejoin:round}"
             ".etq-but,.etq-notion{font-weight:700}</style>")
    svg = svg.replace('class="nuage-svg"', 'xmlns:xlink="http://www.w3.org/1999/xlink"', 1)
    svg = svg.replace('preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">',
                      'preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" width="1600">' + style + fond, 1)
    svg = re.sub(r' (pathLength|style|data-[a-z]+)="[^"]*"', "", svg)
    IMAGE.write_text('<?xml version="1.0" encoding="UTF-8"?>\n' + svg + "\n", encoding="utf-8")


def injecter(chemin, marqueur, contenu):
    page = chemin.read_text(encoding="utf-8")
    motif = re.compile(rf"(<!-- {marqueur}:debut -->)(.*?)(\s*<!-- {marqueur}:fin -->)", re.S)
    assert motif.search(page), f"marqueurs « {marqueur} » absents de {chemin.name}"
    retrait = re.search(rf"\n([ \t]*)<!-- {marqueur}:debut -->", page).group(1)
    corps = "\n".join(retrait + ligne if ligne else ligne for ligne in contenu.split("\n"))
    page = motif.sub(lambda m: m.group(1) + "\n" + corps + m.group(3), page)
    chemin.write_text(page, encoding="utf-8")


def rendre():
    for langue, chemin in PAGES.items():
        svg, legende, texte, _ = construire(langue)
        injecter(chemin, "nuage-svg", svg)
        injecter(chemin, "nuage-legende", legende)
        injecter(chemin, "nuage-texte", texte)
        print(f"{chemin.relative_to(chemin.parents[1])} : nuage injecté")
    image_seule()
    print(f"{IMAGE.name} écrit")
