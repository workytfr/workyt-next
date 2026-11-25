"""Logo Workyt — renard géométrique + wordmark Funnel Display.

Génère dans ./out :
  workyt-mark.svg        le symbole seul
  workyt-logo.svg        symbole + « workyt » (texte vectorisé)
  workyt-logo-dark.svg   variante sur fond sombre
  workyt-board.svg       planche de construction (symbole, tracés, grille, palette)

Lancer : python design/logo-renard/build.py
"""
import math
import os

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)

# ---------------------------------------------------------------- palette
PLUM = "#24103A"     # fond du symbole, texte
PURPLE = "#970CE3"   # reprise du dégradé animé actuel
BLUE = "#7091F5"     # idem
RED = "#E32C0C"      # corps
ORANGE = "#F5610C"   # tête
AMBER = "#FF9A3C"    # intérieur d'oreille
CREAM = "#FFE7CF"    # joue, plastron, œil
PALETTE = [PLUM, PURPLE, BLUE, RED, ORANGE, AMBER, CREAM]
GUIDE = "#E5177B"    # tracés de construction (magenta, comme la planche de réf.)

# ---------------------------------------------------------------- géométrie
# Tout part d'un cercle de rayon 90 centré en (100,100) ; l'axe horizontal
# y = 100 porte la truffe, la ligne de partage tête/corps et le centre du cercle.
C, R = (100.0, 100.0), 90.0


def on_circle_x(x, top=True):
    dy = math.sqrt(R * R - (x - C[0]) ** 2)
    return (x, C[1] - dy if top else C[1] + dy)


def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def y_on(p, q, x):
    return p[1] + (q[1] - p[1]) * (x - p[0]) / (q[0] - p[0])


N = (190.0, 100.0)            # truffe : sur le cercle, sur l'axe
A = on_circle_x(86)           # pointe d'oreille : sur le cercle
B = (60.0, 64.0)              # base arrière de l'oreille
F = (114.0, 52.0)             # base avant de l'oreille / front
J = (146.0, 136.0)            # angle de la mâchoire
L = (10.0, 100.0)             # bord gauche du cercle sur l'axe
EYE = (128.0, 80.0)
EYE_R, PUPIL_R = 11.0, 5.5
CHEEK0 = (112.0, 100.0)       # début de la joue sur l'axe

# oreille intérieure : triangle A-B-F réduit vers son centre
G = ((A[0] + B[0] + F[0]) / 3, (A[1] + B[1] + F[1]) / 3)
EAR_IN = [lerp(G, p, 0.52) for p in (A, B, F)]

# truffe : coupe verticale à x = 174 entre les deux arêtes du museau
NX = 164.0
NOSE = [(NX, y_on(F, N, NX)), N, (NX, y_on(N, J, NX))]


def pts(ps):
    return " ".join(f"{x:.2f},{y:.2f}" for x, y in ps)


def mark_shapes(prefix="m", disc=PLUM):
    """Formes du symbole dans le repère 0..200."""
    cid = f"{prefix}-clip"
    return f"""
  <defs><clipPath id="{cid}"><circle cx="{C[0]}" cy="{C[1]}" r="{R}"/></clipPath></defs>
  <circle cx="{C[0]}" cy="{C[1]}" r="{R}" fill="{disc}"/>
  <g clip-path="url(#{cid})">
    <polygon points="{pts([(0, 100), (0, 200), (J[0], 200), J, N])}" fill="{RED}"/>
    <polygon points="{pts([L, B, A, F, N])}" fill="{ORANGE}"/>
    <polygon points="{pts(EAR_IN)}" fill="{AMBER}"/>
    <polygon points="{pts([CHEEK0, N, J])}" fill="{CREAM}"/>
    <polygon points="{pts([J, (J[0], 200), (J[0] - 40, 200)])}" fill="{CREAM}"/>
    <polygon points="{pts(NOSE)}" fill="{PLUM}"/>
  </g>
  <circle cx="{EYE[0]}" cy="{EYE[1]}" r="{EYE_R}" fill="{CREAM}"/>
  <circle cx="{EYE[0]}" cy="{EYE[1]}" r="{PUPIL_R}" fill="{PLUM}"/>"""


def mark_outline(stroke=PLUM, sw=1.2):
    s = f'fill="none" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"'
    # contour du profil = arêtes visibles, coupées au cercle
    return f"""
  <circle cx="{C[0]}" cy="{C[1]}" r="{R}" {s}/>
  <polyline points="{pts([L, B, A, F, N])}" {s}/>
  <polyline points="{pts([CHEEK0, N, J, (J[0], on_circle_x(J[0], top=False)[1])])}" {s}/>
  <line x1="{L[0]}" y1="100" x2="{N[0]}" y2="100" {s}/>
  <polygon points="{pts(EAR_IN)}" {s}/>
  <circle cx="{EYE[0]}" cy="{EYE[1]}" r="{EYE_R}" {s}/>
  <circle cx="{EYE[0]}" cy="{EYE[1]}" r="{PUPIL_R}" {s}/>"""


def extend(p, q, t0=-0.6, t1=1.6):
    a, b = lerp(p, q, t0), lerp(p, q, t1)
    return a, b


def guides():
    g = f'stroke="{GUIDE}" stroke-width="0.9" stroke-dasharray="2.2 2.2" fill="none"'
    out = []

    def line(p, q):
        out.append(f'<line x1="{p[0]:.2f}" y1="{p[1]:.2f}" x2="{q[0]:.2f}" y2="{q[1]:.2f}" {g}/>')

    line((-25, 100), (225, 100))                 # axe : truffe / partage / centre
    line((EYE[0], -20), (EYE[0], 220))            # verticale de l'œil
    line((J[0], -20), (J[0], 220))                # verticale de la mâchoire
    line((-25, EYE[1]), (225, EYE[1]))            # horizontale de l'œil
    line(*extend(F, N, -0.9, 1.25))               # arête du front
    line(*extend(B, A, -0.6, 1.35))               # dos de l'oreille
    line(*extend(A, F, -0.5, 2.6))                # avant de l'oreille
    line(*extend(N, J, -0.3, 2.0))                # dessous du museau
    for r in (EYE_R * 2, 33):                     # cercles concentriques de l'œil
        out.append(f'<circle cx="{EYE[0]}" cy="{EYE[1]}" r="{r}" {g}/>')
    out.append(f'<circle cx="{C[0]}" cy="{C[1]}" r="{R / 2}" {g}/>')
    return "\n  ".join(out)


# ---------------------------------------------------------------- wordmark
font = TTFont(os.path.join(ROOT, "public", "fonts", "FunnelDisplay-Bold.ttf"))
gs = font.getGlyphSet()
cmap = font.getBestCmap()
UPM = font["head"].unitsPerEm
XH = font["OS/2"].sxHeight          # 600
TRACK = -14                          # léger resserrage, en unités de fonte


def glyph_bounds(ch):
    p = BoundsPen(gs)
    gs[cmap[ord(ch)]].draw(p)
    return p.bounds


def wordmark(text="workyt"):
    """Renvoie (path d, largeur, infos o) en unités de fonte, y vers le bas, baseline 0."""
    pen = SVGPathPen(gs)
    x = 0.0
    o_info = None
    for ch in text:
        name = cmap[ord(ch)]
        tp = TransformPen(pen, (1, 0, 0, -1, x, 0))
        gs[name].draw(tp)
        if ch == "o" and o_info is None:
            b = glyph_bounds("o")
            o_info = (x + b[0], -b[3], x + b[2], -b[1])   # x0, top, x1, bottom
        x += gs[name].width + TRACK
    return pen.getCommands(), x - TRACK, o_info


WORD_D, WORD_W, O_BOX = wordmark()


def o_ears():
    """Deux oreilles sur le « o », même inclinaison que l'oreille du symbole."""
    x0, top, x1, bot = O_BOX
    w = x1 - x0
    cx = (x0 + x1) / 2
    # triangle gauche : base posée dans l'épaisseur du bol, pointe vers l'extérieur
    left = [(cx - 0.47 * w, top + 0.34 * w), (cx - 0.40 * w, top - 0.20 * w), (cx - 0.06 * w, top + 0.07 * w)]
    right = [(2 * cx - x, y) for x, y in left]
    return left, right


EARS = o_ears()


def word_group(fill):
    l, r = EARS
    return (f'<path d="{WORD_D}" fill="{fill}"/>'
            f'<polygon points="{pts(l)}" fill="{fill}"/><polygon points="{pts(r)}" fill="{fill}"/>')


# ---------------------------------------------------------------- lockup
# Le symbole fait la hauteur baseline → ascendante du « k » (840) ;
# son axe (y=100) tombe donc à mi-hauteur de l'ascendante.
ASC = 840.0
S_MARK = ASC / (2 * R)              # unités fonte par unité symbole
GAP = 2 * EYE_R * S_MARK * 2.2      # espace symbole/texte = 2,2 diamètres d'œil


def lockup(word_fill, x_off=0.0, y_off=0.0, scale=1.0, mark_prefix="l", disc=PLUM):
    # repère local : baseline à y=0, symbole posé de y=-840 à 0
    mx = 0.0
    tx = 2 * R * S_MARK + GAP
    inner = (
        f'<g transform="translate({mx},{-ASC}) scale({S_MARK})">{mark_shapes(mark_prefix, disc)}</g>'
        f'<g transform="translate({tx},0)">{word_group(word_fill)}</g>'
    )
    width = tx + WORD_W
    return f'<g transform="translate({x_off},{y_off}) scale({scale})">{inner}</g>', width, tx


def svg(w, h, body, bg=None):
    bgr = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" '
            f'width="{w:.0f}" height="{h:.0f}">{bgr}{body}</svg>\n')


def write(name, content):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as fh:
        fh.write(content)


# symbole seul
write("workyt-mark.svg", svg(200, 200, mark_shapes("mark")))

# logos horizontaux (marge = 0,5 × hauteur de x)
pad = XH * 0.5
_, LW, _ = lockup(PLUM)
H = ASC + 240 + 2 * pad   # descendante du y
for name, fill, bg, disc in (("workyt-logo.svg", PLUM, None, PLUM), ("workyt-logo-dark.svg", CREAM, PLUM, "#3B1D5E")):
    g, _, _ = lockup(fill, pad, pad + ASC, 1.0, mark_prefix=name.split(".")[0], disc=disc)
    write(name, svg(LW + 2 * pad, H, g, bg))

# ---------------------------------------------------------------- planche
BW, BH = 1600, 1240
parts = []

# 1. symbole couleur
s1 = 1.9
parts.append(f'<g transform="translate({330 - 100 * s1},{300 - 100 * s1}) scale({s1})">{mark_shapes("board")}</g>')

# 2. construction
parts.append(
    f'<g transform="translate({920 - 100 * s1},{300 - 100 * s1}) scale({s1})">'
    f'<g opacity="0.95">{guides()}</g>{mark_outline()}'
    # cercles gris : division du rayon (R/2) reportée à droite, comme les modules de la réf.
    + "".join(f'<circle cx="{200 + 45}" cy="{cy}" r="45" fill="none" stroke="#B9B4C2" stroke-width="0.9" stroke-dasharray="2.5 2.5"/>'
              for cy in (55, 145))
    + f'<circle cx="{245 + 60}" cy="100" r="45" fill="none" stroke="#B9B4C2" stroke-width="0.9" stroke-dasharray="2.5 2.5"/>'
    + "</g>"
)

# 3. lockup + grille
ls = None
lg, lw, tx = lockup(PLUM, 0, 0, 1.0, mark_prefix="boardlock")
ls = 1100 / (lw + 2 * pad)
LX = (BW - lw * ls) / 2
LY = 880                       # baseline
grid = []
gx0, gx1 = -pad, lw + pad
gy0, gy1 = -ASC - pad * 0.6, 240 + pad * 0.6
grey = 'stroke="#C9C6CF" stroke-width="2.2"'
for yy in (-ASC, -XH, 0, 240):
    grid.append(f'<line x1="{gx0}" y1="{yy}" x2="{gx1}" y2="{yy}" {grey}/>')
for xx in (0, 2 * R * S_MARK):
    grid.append(f'<line x1="{xx}" y1="{gy0}" x2="{xx}" y2="{gy1}" {grey}/>')
# fûts verticaux en gris clair derrière les lettres (comme la réf.)
stem_w = 175
for gx in (tx + 1742 + 111, tx + 2242 + 65, tx + 3606 + 140):
    grid.append(f'<rect x="{gx}" y="{gy0 + 40}" width="{stem_w}" height="{gy1 - gy0 - 80}" fill="#ECEAEE"/>')
# espace symbole/texte (magenta) : 2,2 diamètres d'œil
mag = f'stroke="{GUIDE}" stroke-width="5"'
mark_r = 2 * R * S_MARK
grid.append(f'<line x1="{mark_r}" y1="{gy0}" x2="{mark_r}" y2="{gy1}" {mag}/>')
grid.append(f'<line x1="{tx}" y1="{gy0}" x2="{tx}" y2="{gy1}" stroke="{PLUM}" stroke-width="5"/>')
eye_d = 2 * EYE_R * S_MARK
for i in range(1, 3):
    xx = mark_r + eye_d * i
    grid.append(f'<line x1="{xx}" y1="{gy0}" x2="{xx}" y2="{gy1}" {mag} opacity="0.55"/>')
# axe : truffe ↔ milieu de l'ascendante
grid.append(f'<line x1="{gx0}" y1="{-ASC / 2}" x2="{gx1}" y2="{-ASC / 2}" stroke="{GUIDE}" stroke-width="4" stroke-dasharray="10 10"/>')
box = f'<rect x="{gx0}" y="{gy0}" width="{gx1 - gx0}" height="{gy1 - gy0}" fill="none" stroke="#22C55E" stroke-width="6"/>'
parts.append(f'<g transform="translate({LX},{LY}) scale({ls})">'
             f'<rect x="{gx0}" y="{gy0}" width="{gx1 - gx0}" height="{gy1 - gy0}" fill="#fff"/>'
             f'{"".join(grid[:6])}{lg}{"".join(grid[6:])}{box}</g>')
# fûts derrière : on les veut sous le texte → réordonner : rects d'abord
parts[-1] = (f'<g transform="translate({LX},{LY}) scale({ls})">'
             f'<rect x="{gx0}" y="{gy0}" width="{gx1 - gx0}" height="{gy1 - gy0}" fill="#fff"/>'
             + "".join(x for x in grid if x.startswith("<rect"))
             + "".join(x for x in grid if x.startswith("<line") and GUIDE not in x and PLUM not in x)
             + lg
             + "".join(x for x in grid if x.startswith("<line") and (GUIDE in x or PLUM in x))
             + box + "</g>")

# 4. palette
sw_w = 1000 / len(PALETTE)
px0 = (BW - 1000) / 2
for i, col in enumerate(PALETTE):
    parts.append(f'<rect x="{px0 + i * sw_w:.1f}" y="1150" width="{sw_w:.1f}" height="14" fill="{col}"/>')

write("workyt-board.svg", svg(BW, BH, "".join(parts), "#FFFFFF"))
print("ok ->", OUT)
