"""
Couleurs du nuage.

PALETTE (en usage) : une couleur par communauté, choisie pour rester distincte aussi pour les
personnes daltoniennes (protanopie, deutéranopie, tritanopie : simulation de Machado et al., 2009) ;
contraste ≥ 3:1 pour les points, et ≥ 4,5:1 pour les noms (variante « texte », même teinte).

Ancien dégradé (non utilisé, gardé pour mémoire) :
Dégradé du nuage : trois teintes (orange foncé → framboise → violet), interpolées en continu.

Principes, pour un rendu pétillant mais pas bariolé, et lisible :
  · luminosité constante tout le long du dégradé (espace OKLCH) : aucune couleur ne « saute » ;
  · saturation (chroma) au maximum de ce qu'un écran sRGB peut afficher pour chaque teinte, sans dépasser un plafond ;
  · luminosité choisie pour un contraste d'au moins 4,5:1 (WCAG AA, texte) sur tous les fonds du site,
    dans le thème clair comme dans le thème sombre : les noms colorés restent lisibles.
Pour changer de couleurs : modifier TEINTES (angles OKLCH) ou THEMES, puis relancer construire.sh.
"""
import math

TEINTES = (52, 1, -58)          # orange foncé, framboise, violet (302°) ; la teinte tourne dans ce sens
THEMES = {
    "clair":  {"L": 0.545, "C": 0.19},
    "sombre": {"L": 0.78,  "C": 0.13},
}
PAS = 40                        # nuances distinctes (le canvas prépare une image par nuance)


def _lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _delin(c):
    c = min(1.0, max(0.0, c))
    return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


def _oklch_vers_rgb_lineaire(L, C, h):
    a, b = C * math.cos(math.radians(h)), C * math.sin(math.radians(h))
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)


def _affichable(rgb):
    return all(-1e-4 <= c <= 1 + 1e-4 for c in rgb)


def teinte(u):
    """Angle de teinte à la position u ∈ [0, 1] du dégradé (deux segments)."""
    u = min(1.0, max(0.0, u))
    seg = 0 if u < 0.5 else 1
    t = (u - 0.5 * seg) * 2
    return TEINTES[seg] + (TEINTES[seg + 1] - TEINTES[seg]) * t


def couleur(u, theme):
    """Couleur hexadécimale à la position u, pour le thème « clair » ou « sombre »."""
    L, cmax = THEMES[theme]["L"], THEMES[theme]["C"]
    h = teinte(u)
    bas, haut = 0.0, cmax                   # chroma la plus forte encore affichable
    if not _affichable(_oklch_vers_rgb_lineaire(L, haut, h)):
        for _ in range(30):
            milieu = (bas + haut) / 2
            if _affichable(_oklch_vers_rgb_lineaire(L, milieu, h)):
                bas = milieu
            else:
                haut = milieu
        haut = bas
    rgb = _oklch_vers_rgb_lineaire(L, haut * 0.98, h)
    return "#%02x%02x%02x" % tuple(round(_delin(c) * 255) for c in rgb)


def arrondir(u):
    return round(min(1.0, max(0.0, u)) * PAS) / PAS


if __name__ == "__main__":
    # Vérification des contrastes (WCAG) sur les fonds du site
    import colorsys

    def lum(hexa):
        r, g, b = (int(hexa[i:i + 2], 16) / 255 for i in (1, 3, 5))
        return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)

    def hsl(h, s, l):
        r, g, b = colorsys.hls_to_rgb(h / 360, l / 100, s / 100)
        return "#%02x%02x%02x" % tuple(round(c * 255) for c in (r, g, b))

    fonds = {"clair": [hsl(0, 0, 100), hsl(42, 42, 98), hsl(36, 14, 94)],
             "sombre": [hsl(228, 16, 16.5), hsl(228, 15, 14), hsl(228, 18, 12)]}
    for theme in THEMES:
        cols = [couleur(i / PAS, theme) for i in range(PAS + 1)]
        pire = min((max(lum(c), lum(f)) + 0.05) / (min(lum(c), lum(f)) + 0.05) for c in cols for f in fonds[theme])
        print(f"{theme} : contraste minimal {pire:.2f}:1 —", " ".join(cols[::10]))


# Une couleur par communauté (k1…k7), pour chaque thème : [point, nom]
# k1 Collaborer, k2 Optimiser, k3 Gérer les données, k4 Développement web,
# k5 Réaliser, k6 Conduire un projet, k7 Administrer
PALETTE = {
    "clair":  {"k1": "#9d1b0f", "k2": "#767708", "k3": "#05654e", "k4": "#0c8cb8",
               "k5": "#6b5dcd", "k6": "#94368f", "k7": "#df5a61"},
    "sombre": {"k1": "#fe9787", "k2": "#aaab35", "k3": "#59e7bd", "k4": "#10a0d1",
               "k5": "#b0adfe", "k6": "#fecbf9", "k7": "#d96c6f"},
}
FONDS = {"clair": ["#ffffff", "#fcfaf5", "#f2efea"], "sombre": ["#23262f", "#1f2129", "#1a1c24"]}


def _luminance(hexa):
    r, g, b = (_lin(int(hexa[i:i + 2], 16) / 255) for i in (1, 3, 5))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _contraste(a, b):
    la, lb = sorted((_luminance(a), _luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def _oklch(hexa):
    r, g, b = (_lin(int(hexa[i:i + 2], 16) / 255) for i in (1, 3, 5))
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s_ = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s_
    a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s_
    b2 = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s_
    return L, math.hypot(a, b2), math.degrees(math.atan2(b2, a))


def couleur_point(k, theme):
    return PALETTE[theme][k]


def couleur_texte(k, theme):
    """Même teinte que le point, assombrie (thème clair) ou éclaircie (thème sombre) jusqu'à 4,5:1."""
    hexa = PALETTE[theme][k]
    L, C, h = _oklch(hexa)
    pas = -0.01 if theme == "clair" else 0.01
    while min(_contraste(hexa, f) for f in FONDS[theme]) < 4.6 and 0.05 < L < 0.99:
        L += pas
        rgb = _oklch_vers_rgb_lineaire(L, C, h)
        while not _affichable(rgb) and C > 0:
            C *= 0.97
            rgb = _oklch_vers_rgb_lineaire(L, C, h)
        hexa = "#%02x%02x%02x" % tuple(round(_delin(c) * 255) for c in rgb)
    return hexa
