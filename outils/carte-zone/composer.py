"""Carte de la zone de recherche de stage : fond CARTO (OpenStreetMap) + zone « amibe » à bord diffus."""
import json, math, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

DOSSIER = sys.argv[1]
SORTIE = sys.argv[2]
Z = 11
NORD, OUEST, SUD, EST = 50.775, 2.60, 50.235, 3.34
LARGEUR_FINALE = 640                   # affichée à 320 px CSS (écrans 2x)

def merc(lat, lon):
    n = 2 ** Z
    x = (lon + 180) / 360 * n
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
    return x * 256, y * 256            # pixels des tuiles OpenStreetMap (256 px)

villes = json.load(open(f"{DOSSIER}/villes.json"))

# Cercles (rayon en km) : la zone est l'union adoucie de ces disques
ZONE = [
    ("Lens", 5.5), ("Liévin", 4.0), ("Hénin-Beaumont", 3.5),          # agglomération Lens-Liévin (CALL)
    ("Arras", 3.5),                                                   # réseau Artis, au plus près
    ("Libercourt", 10.0), ("Carvin", 4.0),                            # grand cercle autour de Libercourt
    ("Moncheaux", 2.6), ("Avelin", 2.6), ("Leforest", 2.6), ("Douai", 3.2),
    ("Lille", 6.0), ("Lomme", 3.2), ("Marcq-en-Barœul", 3.0),         # métropole lilloise : métro, tram, bus Ilévia
    ("Roubaix", 4.0), ("Tourcoing", 3.6), ("Villeneuve-d'Ascq", 4.0),
    ("Lesquin", 3.0), ("Seclin", 3.2), ("La Chapelle-d'Armentières", 2.8),
]

Z_TUILE = 512                          # remplacé plus bas pour les tuiles OSM (256 px)
px0, py0 = merc(NORD, OUEST)
px1, py1 = merc(SUD, EST)
tx0, ty0, tx1, ty1 = int(px0 // 256), int(py0 // 256), int(px1 // 256), int(py1 // 256)

def fond(theme):
    img = Image.new("RGB", ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256))
    for x in range(tx0, tx1 + 1):
        for y in range(ty0, ty1 + 1):
            img.paste(Image.open(f"{DOSSIER}/osm/{x}_{y}.png").convert("RGB"), ((x - tx0) * 256, (y - ty0) * 256))
    img = img.crop((int(px0 - tx0 * 256), int(py0 - ty0 * 256), int(px1 - tx0 * 256), int(py1 - ty0 * 256)))
    a = np.asarray(img).astype(np.float32) / 255
    lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])[..., None]
    if theme == "clair":                                   # fond pastel : couleurs très atténuées, éclaircies
        douce = 0.35 * a + 0.65 * lum
        papier = np.array([252, 250, 245], np.float32) / 255
        out = 0.5 * douce + 0.5 * papier
    else:                                                  # fond sombre : luminance inversée, teinte bleu nuit
        nuit = np.array([35, 38, 47], np.float32) / 255
        out = nuit + (1 - lum) * 0.22 + (a - lum) * 0.15
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))

def champ(w, h):
    """Somme de gaussiennes : les disques proches fusionnent en une forme d'amibe."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    f = np.zeros((h, w), np.float32)
    km_par_px = 40075.016686 * math.cos(math.radians(50.5)) / (2 ** Z * 256)
    for nom, r_km in ZONE:
        lat, lon = villes[nom]
        cx, cy = merc(lat, lon)
        cx -= px0; cy -= py0
        r = r_km / km_par_px
        f += np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * (r * 0.72) ** 2))
    return f

def lisse(f, bas, haut):
    t = np.clip((f - bas) / (haut - bas), 0, 1)
    return t * t * (3 - 2 * t)

ETIQUETTES = ["Lille", "Roubaix", "Tourcoing", "Villeneuve-d'Ascq", "Seclin", "Libercourt", "Lens", "Liévin",
              "Douai", "Arras", "Orchies", "Armentières"]
POLICE = ImageFont.truetype(f"{DOSSIER}/Atkinson-Bold.ttf", 21)

def etiqueter(carte, ratio, theme):
    d = ImageDraw.Draw(carte)
    encre, halo = ((40, 52, 64), (252, 250, 245)) if theme == "clair" else ((228, 232, 240), (35, 38, 47))
    for nom in ETIQUETTES:
        lat, lon = villes[nom]
        x, y = merc(lat, lon)
        x, y = (x - px0) * ratio, (y - py0) * ratio
        d.ellipse((x - 4, y - 4, x + 4, y + 4), fill=encre, outline=halo, width=2)
        nom_aff = nom.replace("Villeneuve-d'Ascq", "Villeneuve-d’Ascq")
        tx, ty = x + 8, y - 12
        l = d.textlength(nom_aff, font=POLICE)
        if nom in ("Liévin", "Armentières"):
            tx = x - 8 - l
        if tx + l > carte.width - 6:                            # trop près du bord droit : sous le point
            tx, ty = carte.width - 6 - l, y + 7
        d.text((tx, ty), nom_aff, font=POLICE, fill=encre, stroke_width=4, stroke_fill=halo)
    pied = "© contributeurs OpenStreetMap"
    l = d.textlength(pied, font=ImageFont.truetype(f"{DOSSIER}/Atkinson-Bold.ttf", 15))
    d.text((carte.width - l - 8, carte.height - 22), pied, font=ImageFont.truetype(f"{DOSSIER}/Atkinson-Bold.ttf", 15), fill=encre, stroke_width=3, stroke_fill=halo)

def composer(style, couleur, opacite, sortie):
    theme = "clair" if style == "light_all" else "sombre"
    carte = fond(theme)
    w, h = carte.size
    f = champ(w, h)
    alpha = lisse(f, 0.06, 0.75) * opacite                    # bord diffus : la frontière est souple
    voile = Image.new("RGBA", (w, h), couleur + (0,))
    voile.putalpha(Image.fromarray((alpha * 255).astype(np.uint8)))
    carte = Image.alpha_composite(carte.convert("RGBA"), voile)
    ratio = LARGEUR_FINALE / w
    carte = carte.resize((LARGEUR_FINALE, round(h * ratio)), Image.LANCZOS).convert("RGB")
    etiqueter(carte, ratio, theme)
    carte.save(sortie, quality=82, method=6)
    return carte.size

print(composer("light_all", (24, 150, 136), 0.42, f"{SORTIE}/zone-recherche-clair.webp"))
print(composer("dark_all", (95, 220, 200), 0.36, f"{SORTIE}/zone-recherche-sombre.webp"))
