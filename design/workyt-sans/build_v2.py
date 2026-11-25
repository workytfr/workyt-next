"""Workyt Sans v2 : la géométrie de Funnel Display, poussée vers le logo Workyt.

Ce qu'on garde de Funnel Display : tout le dessin (drapeaux carrés du n, r, m, p, b ;
« a » à un étage ; décrochés carrés au pied des lettres).
Ce qu'on ajoute, tiré du logo (public/workyt-logo-26.svg) :
  - le drapeau carré en haut des hampes du k et du h, comme le « k » du logo ;
  - la coupe en biais en haut du « t » ;
  - des points carrés (i, j, ponctuation, trémas).
Funnel Display est sous licence SIL OFL 1.1, sans nom réservé.
Usage : python build_v2.py  -> out/v2/WorkytSans-<style>.ttf / .woff2
"""
import os

import pathops
from fontTools.pens.recordingPen import DecomposingRecordingPen, RecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

from build import rename, square_dots, stem

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "sources", "FunnelDisplay.ttf")
OUT = os.path.join(HERE, "out", "v2")
WEIGHTS = {400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold"}
FLAG_TOP = ["k", "h"]  # hampes qui reçoivent le drapeau du logo (pas le « l » : il ressemblerait au « 1 »)
T_SLANT = 0.8                       # pente de la coupe du « t » (identique au logo : 40/50)


def glyph_path(font, name):
    gs = font.getGlyphSet()
    rec = DecomposingRecordingPen(gs)
    gs[name].draw(rec)
    path = pathops.Path()
    rec.replay(path.getPen())
    return path


def rect(x0, y0, x1, y1):
    p = pathops.Path()
    pen = p.getPen()
    pen.moveTo((x0, y0)); pen.lineTo((x0, y1)); pen.lineTo((x1, y1)); pen.lineTo((x1, y0)); pen.closePath()
    return p


def poly(pts):
    p = pathops.Path()
    pen = p.getPen()
    pen.moveTo(pts[0])
    for pt in pts[1:]:
        pen.lineTo(pt)
    pen.closePath()
    return p


def store(font, name, path, dx=0, adv_delta=0):
    path = pathops.simplify(path, clockwise=True)
    rec = RecordingPen()
    path.draw(rec)
    tt = TTGlyphPen(None)
    pen = Cu2QuPen(tt, max_err=1, reverse_direction=False)
    from fontTools.pens.transformPen import TransformPen
    rec.replay(TransformPen(pen, (1, 0, 0, 1, dx, 0)))
    g = tt.glyph()
    font["glyf"][name] = g
    g.recalcBounds(font["glyf"])
    adv = font["hmtx"][name][0] + adv_delta
    font["hmtx"][name] = (adv, g.xMin)


def flag_metrics(font):
    """Le drapeau du « n » de Funnel : largeur, hauteur et position du fût."""
    rec = DecomposingRecordingPen(font.getGlyphSet())
    font.getGlyphSet()["n"].draw(rec)
    pts = [a[-1] for _, a in rec.value if a]
    stem_left, flag_left = pts[0][0], pts[2][0]
    flag_h = pts[3][1] - pts[1][1]
    return stem_left, stem_left - flag_left, flag_h


def stem_left_x(font, name, top):
    """Abscisse gauche du fût qui monte jusqu'à `top`."""
    rec = DecomposingRecordingPen(font.getGlyphSet())
    font.getGlyphSet()[name].draw(rec)
    xs = [a[-1][0] for _, a in rec.value if a and abs(a[-1][1] - top) < 1]
    return min(xs), max(xs)


def add_top_flags(font):
    n_stem_left, flag_w, flag_h = flag_metrics(font)
    for name in FLAG_TOP:
        top = max(a[-1][1] for _, a in _rec(font, name) if a)
        sl, _ = stem_left_x(font, name, top)
        dx = n_stem_left - sl                     # on aligne le fût sur celui du « n »
        path = pathops.op(glyph_path(font, name), rect(sl - flag_w, top - flag_h, sl + 2, top),
                          pathops.PathOp.UNION)
        store(font, name, path, dx=dx, adv_delta=dx)


def _rec(font, name):
    rec = DecomposingRecordingPen(font.getGlyphSet())
    font.getGlyphSet()[name].draw(rec)
    return rec.value


def slant_t(font):
    top = max(a[-1][1] for _, a in _rec(font, "t") if a)
    x0, x1 = stem_left_x(font, "t", top)
    drop = (x1 - x0) * T_SLANT
    cut = poly([(x0 - 1, top + 1), (x1 + 50, top - drop - 50 * T_SLANT), (x1 + 50, top + 50)])
    store(font, "t", pathops.op(glyph_path(font, "t"), cut, pathops.PathOp.DIFFERENCE))


def build(weight, style):
    f = TTFont(SRC)
    instantiateVariableFont(f, {"wght": weight}, inplace=True)
    add_top_flags(f)
    slant_t(f)
    changed = square_dots(f, stem(f))
    for name in changed:
        g = f["glyf"][name]
        g.recalcBounds(f["glyf"])
        f["hmtx"][name] = (f["hmtx"][name][0], g.xMin)
    rename(f, weight, style)
    f["name"].setName(
        "Copyright 2026 Workyt. Derived from Funnel Display (Copyright 2024 The Funnel Project Authors).", 0, 3, 1, 0x409)
    os.makedirs(OUT, exist_ok=True)
    f.save(f"{OUT}/WorkytSans-{style}.ttf")
    f.flavor = "woff2"
    f.save(f"{OUT}/WorkytSans-{style}.woff2")
    return changed


if __name__ == "__main__":
    for w, s in WEIGHTS.items():
        print(s, "points carrés :", " ".join(build(w, s)))
