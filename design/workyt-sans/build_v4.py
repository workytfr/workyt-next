"""Workyt Sans v4 : Funnel Display + une seule règle forte tirée du logo.

  - Toutes les hampes (b, d, h, k, l, t) sont taillées en biais, comme le « t » du logo
    (une mine de crayon taillée).
  - Points carrés (i, j, ponctuation, trémas).
Le reste du dessin de Funnel Display est conservé tel quel.
Funnel Display est sous licence SIL OFL 1.1, sans nom réservé.
Usage : python build_v4.py -> out/v4/WorkytSans-<style>.ttf / .woff2
"""
import os

import pathops
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

from build import rename, square_dots, stem
from build_v2 import _rec, glyph_path, poly, store

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "sources", "FunnelDisplay.ttf")
OUT = os.path.join(HERE, "out", "v4")
WEIGHTS = {400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold"}
SLANTED = ["b", "d", "h", "k", "l", "t"]
SLOPE = 0.75  # descente de la coupe par unité de largeur du fût (logo : 0,8)


def top_stems(font, name):
    """Fûts qui touchent le haut du glyphe : liste de (x gauche, x droite, y haut)."""
    pts = [a[-1] for _, a in _rec(font, name) if a]
    top = max(y for _, y in pts)
    xs = sorted({round(x) for x, y in pts if abs(y - top) < 1})
    return [(xs[i], xs[i + 1], top) for i in range(0, len(xs) - 1, 2)]


def slant(font, name):
    path = glyph_path(font, name)
    for x0, x1, top in top_stems(font, name):
        w = x1 - x0
        cut = poly([(x0, top), (x1 + 60, top - SLOPE * (w + 60)), (x1 + 60, top + 60), (x0 - 1, top + 60)])
        path = pathops.op(path, cut, pathops.PathOp.DIFFERENCE)
    store(font, name, path)


def build(weight, style):
    f = TTFont(SRC)
    instantiateVariableFont(f, {"wght": weight}, inplace=True)
    for name in SLANTED:
        slant(f, name)
    for name in square_dots(f, stem(f)):
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


if __name__ == "__main__":
    for w, s in WEIGHTS.items():
        build(w, s)
        print(s, "ok")
