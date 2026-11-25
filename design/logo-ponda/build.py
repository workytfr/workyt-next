"""Logo Ponda Podcast — panda géométrique + « ponda podcast » en Funnel Display.

Génère dans ./out : ponda-mark.svg, ponda-logo.svg, ponda-logo-dark.svg, ponda-board.svg
Lancer : python design/logo-ponda/build.py
"""
import math
import os

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)

# ---------------------------------------------------------------- palette
INK = "#17151F"      # noir panda, texte
PLUM = "#24103A"     # passerelle avec Workyt
BAMBOO = "#2FBF71"   # bambou
TEAL = "#0EA5A4"
ORANGE = "#F5610C"   # micro (rappel Workyt)
AMBER = "#FF9A3C"
CREAM = "#FFF4E6"    # blanc panda
DISC = "#2FBF71"
PALETTE = [INK, PLUM, TEAL, BAMBOO, ORANGE, AMBER, CREAM]
GUIDE = "#E5177B"

# ---------------------------------------------------------------- géométrie
# Cercle de base R=90 en (100,100). La tête est un cercle R/√3 ≈ 52 posé sur
# l'axe vertical ; les oreilles sont centrées sur la tête à ±45° ; les taches
# des yeux sont des ellipses inclinées à ±30° sur l'horizontale des yeux.
C, R = (100.0, 100.0), 90.0
HC, HR = (100.0, 94.0), 52.0
EAR_A = math.radians(45)
EAR_R = 19.0
EARS = [(HC[0] + s * HR * math.cos(EAR_A), HC[1] - HR * math.sin(EAR_A)) for s in (-1, 1)]
EAR_IN_R = 9.5
EYE_Y = 96.0
EYE_DX = 21.0
PATCH_RX, PATCH_RY, PATCH_ROT = 12.0, 17.0, 32.0
PUPIL_R = 4.6
BODY_C, BODY_R = (100.0, 222.0), 84.0          # épaules : grand cercle sous la tête
# micro : gélule centrée sous le nez, à cheval sur le menton
MIC_C, MIC_W, MIC_H = (100.0, 140.0), 20.0, 32.0
NOSE = [(93.0, 113.0), (107.0, 113.0), (100.0, 121.0)]


def pts(ps):
    return " ".join(f"{x:.2f},{y:.2f}" for x, y in ps)


def mic(fill_body, fill_slot):
    x, y = MIC_C[0] - MIC_W / 2, MIC_C[1] - MIC_H / 2
    out = [f'<rect x="{x}" y="{y}" width="{MIC_W}" height="{MIC_H}" rx="{MIC_W / 2}" fill="{fill_body}"/>']
    # grille : fentes alternées gauche / droite, comme le micro d'origine
    for i, yy in enumerate((MIC_C[1] - 6, MIC_C[1], MIC_C[1] + 6)):
        out.append(f'<rect x="{x - 1}" y="{yy - 1.3}" width="{MIC_W * 0.42}" height="2.6" rx="1.3" fill="{fill_slot}"/>')
        out.append(f'<rect x="{x + MIC_W * 0.58 + 1}" y="{yy - 1.3}" width="{MIC_W * 0.42}" height="2.6" rx="1.3" fill="{fill_slot}"/>')
    return "".join(out)


def mark_shapes(prefix="m", disc=DISC):
    cid = f"{prefix}-clip"
    eyes = []
    for s in (-1, 1):
        ex = HC[0] + s * EYE_DX
        eyes.append(f'<ellipse cx="{ex}" cy="{EYE_Y}" rx="{PATCH_RX}" ry="{PATCH_RY}" '
                    f'transform="rotate({s * PATCH_ROT} {ex} {EYE_Y})" fill="{INK}"/>')
        eyes.append(f'<circle cx="{ex + s * 1.5}" cy="{EYE_Y - 3}" r="{PUPIL_R}" fill="{CREAM}"/>')
    ears = "".join(
        f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{EAR_R}" fill="{INK}"/>'
        f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{EAR_IN_R}" fill="{ORANGE}"/>' for x, y in EARS)
    return f"""
  <defs><clipPath id="{cid}"><circle cx="{C[0]}" cy="{C[1]}" r="{R}"/></clipPath></defs>
  <circle cx="{C[0]}" cy="{C[1]}" r="{R}" fill="{disc}"/>
  <g clip-path="url(#{cid})">
    <circle cx="{BODY_C[0]}" cy="{BODY_C[1]}" r="{BODY_R}" fill="{INK}"/>
    <polygon points="{pts([(100, 150), (60, 200), (140, 200)])}" fill="{CREAM}"/>
    {ears}
    <circle cx="{HC[0]}" cy="{HC[1]}" r="{HR}" fill="{CREAM}"/>
    {''.join(eyes)}
    <polygon points="{pts(NOSE)}" fill="{INK}"/>
    {mic(ORANGE, CREAM)}
  </g>"""


def mark_outline(stroke=INK, sw=1.2):
    s = f'fill="none" stroke="{stroke}" stroke-width="{sw}"'
    out = [f'<circle cx="{C[0]}" cy="{C[1]}" r="{R}" {s}/>',
           f'<circle cx="{HC[0]}" cy="{HC[1]}" r="{HR}" {s}/>',
           f'<circle cx="{BODY_C[0]}" cy="{BODY_C[1]}" r="{BODY_R}" {s} clip-path="url(#o-clip)"/>',
           f'<polygon points="{pts(NOSE)}" {s}/>',
           f'<rect x="{MIC_C[0] - MIC_W / 2}" y="{MIC_C[1] - MIC_H / 2}" width="{MIC_W}" height="{MIC_H}" rx="{MIC_W / 2}" {s}/>']
    for x, y in EARS:
        out += [f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{EAR_R}" {s}/>', f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{EAR_IN_R}" {s}/>']
    for sg in (-1, 1):
        ex = HC[0] + sg * EYE_DX
        out += [f'<ellipse cx="{ex}" cy="{EYE_Y}" rx="{PATCH_RX}" ry="{PATCH_RY}" transform="rotate({sg * PATCH_ROT} {ex} {EYE_Y})" {s}/>',
                f'<circle cx="{ex + sg * 1.5}" cy="{EYE_Y - 3}" r="{PUPIL_R}" {s}/>']
    return (f'<defs><clipPath id="o-clip"><circle cx="{C[0]}" cy="{C[1]}" r="{R}"/></clipPath></defs>' + "".join(out))


def guides():
    g = f'stroke="{GUIDE}" stroke-width="0.9" stroke-dasharray="2.2 2.2" fill="none"'
    out = []

    def line(p, q):
        out.append(f'<line x1="{p[0]:.2f}" y1="{p[1]:.2f}" x2="{q[0]:.2f}" y2="{q[1]:.2f}" {g}/>')

    line((100, -20), (100, 220))                       # axe vertical
    line((-25, EYE_Y), (225, EYE_Y))                   # horizontale des yeux
    line((-25, HC[1]), (225, HC[1]))                   # centre de la tête
    line((-25, MIC_C[1]), (225, MIC_C[1]))             # centre du micro
    for sg in (-1, 1):                                 # diagonales à 45° → oreilles
        d = 120
        line(HC, (HC[0] + sg * d * math.cos(EAR_A), HC[1] - d * math.sin(EAR_A)))
        ex = HC[0] + sg * EYE_DX                       # grand axe des taches (±32°)
        a = math.radians(90 + sg * PATCH_ROT)
        line((ex - 34 * math.cos(a), EYE_Y - 34 * math.sin(a)), (ex + 34 * math.cos(a), EYE_Y + 34 * math.sin(a)))
        line((ex, -20), (ex, 220))
    out.append(f'<circle cx="{HC[0]}" cy="{HC[1]}" r="{HR + EAR_R}" {g}/>')   # enveloppe des oreilles
    out.append(f'<circle cx="{C[0]}" cy="{C[1]}" r="{R / 2}" {g}/>')
    return "\n  ".join(out)


# ---------------------------------------------------------------- wordmark
font = TTFont(os.path.join(ROOT, "public", "fonts", "FunnelDisplay-Bold.ttf"))
gs = font.getGlyphSet()
cmap = font.getBestCmap()
ASC, XH, DESC = 840.0, 600.0, 240.0


def word(text, track):
    pen = SVGPathPen(gs)
    x = 0.0
    for ch in text:
        name = cmap[ord(ch)]
        gs[name].draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))
        x += gs[name].width + track
    return pen.getCommands(), x - track


P1_D, P1_W = word("ponda", -18)
P2_D, P2_W = word("podcast", 10)
S2 = 0.5                                  # « podcast » à la moitié du corps
BASE2 = S2 * ASC + 110                    # baseline de « podcast »
MARK_H = ASC + BASE2                      # symbole : ascendante de « ponda » → baseline de « podcast »
S_MARK = MARK_H / (2 * R)
EYE_MOD = 2 * PATCH_RX * S_MARK           # module = largeur d'une tache
GAP = EYE_MOD * 1.6


def lockup(fill, disc=DISC, prefix="l"):
    tx = MARK_H + GAP
    body = (f'<g transform="translate(0,{-ASC}) scale({S_MARK})">{mark_shapes(prefix, disc)}</g>'
            f'<g transform="translate({tx},0)"><path d="{P1_D}" fill="{fill}"/>'
            f'<g transform="translate({P1_W - P2_W * S2},{BASE2}) scale({S2})"><path d="{P2_D}" fill="{fill}"/></g></g>')
    return body, tx + P1_W, tx


def svg(w, h, body, bg=None, x0=0, y0=0):
    bgr = f'<rect x="{x0}" y="{y0}" width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.0f} {y0:.0f} {w:.0f} {h:.0f}" '
            f'width="{w:.0f}" height="{h:.0f}">{bgr}{body}</svg>\n')


def write(name, content):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as fh:
        fh.write(content)


write("ponda-mark.svg", svg(200, 200, mark_shapes("mark")))

pad = XH * 0.5
_, LW, _ = lockup(INK)
for name, fill, bg, disc in (("ponda-logo.svg", INK, None, DISC), ("ponda-logo-dark.svg", CREAM, INK, DISC)):
    body, _, _ = lockup(fill, disc, name.split(".")[0])
    write(name, svg(LW + 2 * pad, MARK_H + 2 * pad, body, bg, -pad, -ASC - pad))

# ---------------------------------------------------------------- planche
BW, BH = 1600, 1240
parts = []
s1 = 1.9
parts.append(f'<g transform="translate({330 - 100 * s1},{300 - 100 * s1}) scale({s1})">{mark_shapes("board")}</g>')
grey_c = "".join(f'<circle cx="{cx}" cy="{cy}" r="45" fill="none" stroke="#B9B4C2" stroke-width="0.9" stroke-dasharray="2.5 2.5"/>'
                 for cx, cy in ((245, 55), (245, 145), (305, 100)))
parts.append(f'<g transform="translate({920 - 100 * s1},{300 - 100 * s1}) scale({s1})">{guides()}{mark_outline()}{grey_c}</g>')

lg, lw, tx = lockup(INK, DISC, "boardlock")
ls = 1100 / (lw + 2 * pad)
LX = (BW - lw * ls) / 2
LY = 840
gx0, gx1 = -pad, lw + pad
gy0, gy1 = -ASC - pad * 0.5, BASE2 + pad * 0.5
grey = 'stroke="#C9C6CF" stroke-width="2.2"'
under, over = [], []
for yy in (-ASC, -XH, 0, BASE2 - S2 * XH, BASE2):
    under.append(f'<line x1="{gx0}" y1="{yy}" x2="{gx1}" y2="{yy}" {grey}/>')
for xx in (0, MARK_H):
    under.append(f'<line x1="{xx}" y1="{gy0}" x2="{xx}" y2="{gy1}" {grey}/>')
# fûts de « p », « n », « d » de ponda
for off, w in ((27, 170), (772 + 710 - 36 + 27, 170), (772 + 710 + 780 - 54 + 575, 170)):
    under.append(f'<rect x="{tx + off}" y="{gy0 + 30}" width="{w}" height="{gy1 - gy0 - 60}" fill="#ECEAEE"/>')
mag = f'stroke="{GUIDE}" stroke-width="5"'
for i in range(0, 2):
    xx = MARK_H + EYE_MOD * i
    over.append(f'<line x1="{xx}" y1="{gy0}" x2="{xx}" y2="{gy1}" {mag}/>')
over.append(f'<line x1="{tx}" y1="{gy0}" x2="{tx}" y2="{gy1}" stroke="{INK}" stroke-width="5"/>')
eye_y = -ASC + EYE_Y * S_MARK
over.append(f'<line x1="{gx0}" y1="{eye_y}" x2="{gx1}" y2="{eye_y}" stroke="{GUIDE}" stroke-width="4" stroke-dasharray="10 10"/>')
box = f'<rect x="{gx0}" y="{gy0}" width="{gx1 - gx0}" height="{gy1 - gy0}" fill="none" stroke="#22C55E" stroke-width="6"/>'
parts.append(f'<g transform="translate({LX},{LY}) scale({ls})">'
             f'<rect x="{gx0}" y="{gy0}" width="{gx1 - gx0}" height="{gy1 - gy0}" fill="#fff"/>'
             + "".join(under) + lg + "".join(over) + box + "</g>")

sw_w = 1000 / len(PALETTE)
for i, col in enumerate(PALETTE):
    parts.append(f'<rect x="{300 + i * sw_w:.1f}" y="1150" width="{sw_w:.1f}" height="14" fill="{col}"/>')
write("ponda-board.svg", svg(BW, BH, "".join(parts), "#FFFFFF"))
print("ok ->", OUT)
