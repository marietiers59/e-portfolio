"""
Rendu SVG du nuage spatialisé par Gephi (voir nuage.py).

Reprend tel quel le travail de Gephi (positions ForceAtlas2, communautés de modularité),
puis ajoute une petite passe « ajustement des étiquettes » (comme le Label Adjust de Gephi)
pour que les noms ne se chevauchent pas.
"""
import html
import json
import math
import random
import re
import xml.etree.ElementTree as ET
from collections import defaultdict

from couleurs import arrondir, couleur
from donnees import BUT_LONG, NOTIONS
from nuage import GEPHI, IMAGE, PAGES, degres, graphe, rayon

NS = {"g": "http://gexf.net/1.3", "viz": "http://gexf.net/1.3/viz"}

# Teintes des communautés : un dégradé à trois couleurs (orange foncé → framboise → violet),
# k1…k7 définies dans style.css. Les communautés sont rangées de gauche à droite du graphe,
# si bien que le dégradé traverse le nuage d'un bord à l'autre.
TEINTES = ["k1", "k2", "k3", "k4", "k5", "k6", "k7"]
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


def profondeur(noeuds, liens, pos, classe):
    """Troisième dimension (z) pour la vue 3D : Gephi donne x et y, on ajoute une profondeur.
    Le nuage prend la forme d'une boule : plus un nœud est près du centre, plus il peut s'enfoncer ;
    chaque communauté reçoit sa propre profondeur, puis on lisse le long des liens
    pour que des nœuds reliés restent proches, comme des neurones voisins."""
    alea = random.Random(2026)
    ids = list(noeuds)
    cx = sum(pos[i][0] for i in ids) / len(ids)
    cy = sum(pos[i][1] for i in ids) / len(ids)
    rmax = max(math.hypot(pos[i][0] - cx, pos[i][1] - cy) for i in ids)
    comms = sorted(set(classe.values()))
    decalage = {c: math.cos(n * 2.4) * 0.7 for n, c in enumerate(comms)}
    u = {i: decalage[classe[i]] + alea.uniform(-0.6, 0.6) for i in ids}
    voisins = defaultdict(list)
    for a, b in liens:
        voisins[a].append(b)
        voisins[b].append(a)
    for _ in range(6):
        u = {i: 0.55 * u[i] + 0.45 * sum(u[v] for v in voisins[i]) / max(1, len(voisins[i])) for i in ids}
    m = max(abs(v) for v in u.values())
    z = {}
    for i in ids:
        d = math.hypot(pos[i][0] - cx, pos[i][1] - cy) / rmax
        enveloppe = math.sqrt(max(1 - d * d, 0.12)) * rmax * 0.8
        z[i] = u[i] / m * enveloppe
    return z


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


def teintes_css(u, fige):
    """Attribut de couleur : variables pour les deux thèmes (page), ou couleur écrite en clair (image seule)."""
    return f'--kc:{couleur(u, "clair")};--ks:{couleur(u, "sombre")}' if not fige else couleur(u, "clair")


def construire(langue, fige=False):
    """Renvoie (svg, légende des communautés, version texte, cadrage, données 3D).
    fige=True : couleurs écrites en clair (thème clair), pour l'image seule."""
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
    teinte, nom = {}, {}
    de_gauche_a_droite = sorted(membres, key=lambda c: sum(pos[m][0] for m in membres[c]) / len(membres[c]))
    for rang_c, c in enumerate(de_gauche_a_droite):
        teinte[c] = TEINTES[round(rang_c * (len(TEINTES) - 1) / max(1, len(membres) - 1))]
    for c, ms in membres.items():
        pivots = [m for m in ms if noeuds[m][2] == "but"]
        if pivots:
            p = max(pivots, key=lambda m: deg[m])
        else:
            p = max((m for m in ms if noeuds[m][2] == "notion"), key=lambda m: deg[m], default=max(ms, key=lambda m: deg[m]))
        nom[c] = lib[p]
    k = {i: teinte[classe[i]] for i in noeuds}

    # Place de chaque nœud sur le dégradé : de gauche à droite (un peu de haut en bas), en continu ;
    # on prend le rang plutôt que la distance, pour que les trois couleurs soient également présentes
    gx = [pos[i][0] for i in noeuds]
    gy = [pos[i][1] for i in noeuds]
    axe = {i: 0.85 * (pos[i][0] - min(gx)) / (max(gx) - min(gx)) + 0.15 * (pos[i][1] - min(gy)) / (max(gy) - min(gy))
           for i in noeuds}
    rangs = sorted(noeuds, key=lambda i: axe[i])
    u = {i: arrondir(n / (len(rangs) - 1)) for n, i in enumerate(rangs)}
    u_comm = {c: arrondir(sum(u[m] for m in ms) / len(ms)) for c, ms in membres.items()}

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
        st = f'stroke:{teintes_css(u[b], True)}' if fige else teintes_css(u[b], False)
        aretes.append(f'<path class="l {k[b]}" data-a="{a}" data-b="{b}" style="{st}" stroke-width="{0.5 + 0.55 * w:.2f}" '
                      f'd="M{xa:.1f} {ya:.1f}Q{qx:.1f} {qy:.1f} {xb:.1f} {yb:.1f}"/>')

    # Nœuds du centre vers l'extérieur (ordre d'apparition de l'animation), petits dessous, gros dessus
    ordre = sorted(noeuds, key=lambda i: math.hypot(pos[i][0] - cx, pos[i][1] - cy))
    rang = {i: n for n, i in enumerate(ordre)}
    formes, etiquettes = [], []
    for i in sorted(noeuds, key=lambda i: r[i]):
        t = noeuds[i][2]
        x, y = pos[i]
        f = taille_police(r[i] / GROSSI, t)
        if fige:
            c = teintes_css(u[i], True)
            st_forme = {"notion": f"stroke:{c}", "but": f"fill:{c};stroke:{c}"}.get(t, f"fill:{c}")
            st_etq = f"fill:{c}" if t in ("but", "notion") else ""
        else:
            st_forme = st_etq = teintes_css(u[i], False)
        formes.append(forme(i, t, x, y, r[i]).replace(f'data-id="{i}"', f'data-id="{i}" data-t="{t}" style="{st_forme}"', 1)
                      .replace('class="n', f'class="{k[i]} n', 1))
        etiquettes.append(f'<text class="etq etq-{t} {k[i]}" data-id="{i}" x="{x:.1f}" y="{y + r[i] + ECART:.1f}" dy=".85em" '
                          f'font-size="{f:.1f}"' + (f' style="{st_etq}"' if st_etq else "") + f'>{html.escape(lib[i])}</text>')

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
        f'<li><button class="nuage-puce {teinte[c]}" type="button" data-communaute="{teinte[c]}" style="{teintes_css(u_comm[c], False)}" aria-pressed="false" disabled>'
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
        lignes.append(f'<li><strong class="nuage-texte-nom {teinte[c]}" style="{teintes_css(u_comm[c], False)}">{html.escape(nom[c])}</strong> — ' + ("; " if en else " ; ").join(parties) + "</li>")
    texte = "\n".join(lignes)
    # Données de la vue 3D (scripts/script.js, section 8)
    z = profondeur(noeuds, liens, pos, classe)
    index = {i: n for n, i in enumerate(noeuds)}
    donnees = {
        "noeuds": [{"id": i, "nom": lib[i], "t": noeuds[i][2], "k": k[i], "x": round(pos[i][0], 1),
                    "y": round(pos[i][1], 1), "z": round(z[i], 1), "r": round(r[i], 2),
                    "cc": couleur(u[i], "clair"), "cs": couleur(u[i], "sombre")} for i in noeuds],
        "liens": [[index[a], index[b], w] for (a, b), w in liens.items()],
    }
    json_donnees = json.dumps(donnees, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    return svg, legende, texte, vb, json_donnees


def image_seule():
    """medias/nuage-competences.svg : l'image autonome (thème clair), pour la consulter sans JavaScript."""
    svg, _, _, vb, _ = construire("fr", fige=True)
    x, y, w, h = vb.split()
    fond = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#fdfcf9"/>'
    # Couleurs écrites en clair dans chaque élément (certains lecteurs d'images ignorent les variables CSS)
    style = ("<style>svg{background:#fdfcf9;font-family:'Atkinson Hyperlegible',Verdana,sans-serif}"
             ".l{fill:none;opacity:.45}.n,.n circle:not(.n-halo){stroke:#fff;stroke-width:1.2}"
             ".n-anneau{fill:#fff!important}.n-halo{fill:none;stroke-width:2;opacity:.6}"
             "text{text-anchor:middle;fill:#2a2f3a;paint-order:stroke;stroke:#fdfcf9;stroke-width:3px;stroke-linejoin:round}"
             ".etq-but,.etq-notion{font-weight:700}</style>")
    svg = svg.replace('class="nuage-svg"', 'xmlns:xlink="http://www.w3.org/1999/xlink"', 1)
    svg = svg.replace('preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">',
                      'preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" width="1600">' + style + fond, 1)
    svg = re.sub(r' (pathLength|data-[a-z]+)="[^"]*"', "", svg)
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
        svg, legende, texte, _, json_donnees = construire(langue)
        injecter(chemin, "nuage-svg", svg)
        injecter(chemin, "nuage-legende", legende)
        injecter(chemin, "nuage-texte", texte)
        injecter(chemin, "nuage-donnees", '<script type="application/json" id="nuage-donnees">' + json_donnees + "</script>")
        print(f"{chemin.relative_to(chemin.parents[1])} : nuage injecté")
    image_seule()
    print(f"{IMAGE.name} écrit")
