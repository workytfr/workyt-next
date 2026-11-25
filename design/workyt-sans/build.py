"""Workyt Sans : base Montserrat, « a » d'écolier de Poppins, points carrés de Funnel Display.
Les trois polices sont sous licence SIL OFL 1.1 (sans nom réservé).
Usage : python build.py  -> out/WorkytSans-<style>.ttf / .woff2
"""
import math
import os

from fontTools.pens.areaPen import AreaPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "sources")
OUT = os.path.join(HERE, "out")
WEIGHTS = {400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold"}
# Graisses Poppins compatibles entre elles (même nombre de points sur le « a »)
POPPINS_GROUPS = [["Light", "Regular", "Medium", "SemiBold"], ["Bold", "ExtraBold", "Black"]]
FROM_POPPINS = ["a"]


def bounds(gs, name):
    p = BoundsPen(gs)
    gs[name].draw(p)
    return p.bounds


def stem(font):
    b = bounds(font.getGlyphSet(), "l")
    return b[2] - b[0]


def draw_tt_contour(pen, pts, on):
    """Dessine un contour TrueType quadratique en partant d'un point sur la courbe."""
    k = on.index(1)
    pts = pts[k:] + pts[:k]
    on = on[k:] + on[:k]
    pen.moveTo(pts[0])
    offs = []
    for p, o in zip(pts[1:] + [pts[0]], on[1:] + [1]):
        if o:
            if offs:
                pen.qCurveTo(*offs, p)
                offs = []
            elif p != pts[0] or len(pts) > 1:
                pen.lineTo(p)
        else:
            offs.append(p)
    pen.closePath()


def poppins_glyphs(target_stem, target_xh):
    """Interpole deux graisses Poppins pour retrouver l'épaisseur de Montserrat après mise à l'échelle."""
    fonts = {w: TTFont(f"{SRC}/Poppins-{w}.ttf") for g in POPPINS_GROUPS for w in g}
    best = None
    for group in POPPINS_GROUPS:
        for a, b in zip(group, group[1:]):
            fa, fb = fonts[a], fonts[b]
            sa = stem(fa) * target_xh / fa["OS/2"].sxHeight
            sb = stem(fb) * target_xh / fb["OS/2"].sxHeight
            t = (target_stem - sa) / (sb - sa)
            score = max(0, -t, t - 1)  # 0 = interpolation pure, > 0 = extrapolation
            if best is None or score < best[0]:
                best = (score, fa, fb, t)
    _, fa, fb, t = best
    out = {}
    for name in FROM_POPPINS:
        ga, gb = fa["glyf"][name], fb["glyf"][name]
        ca = ga.getCoordinates(fa["glyf"])[0]
        cb = gb.getCoordinates(fb["glyf"])[0]
        assert len(ca) == len(cb), name
        xh = fa["OS/2"].sxHeight + (fb["OS/2"].sxHeight - fa["OS/2"].sxHeight) * t
        adv = fa["hmtx"][name][0] + (fb["hmtx"][name][0] - fa["hmtx"][name][0]) * t
        s = target_xh / xh
        coords = [((xa + (xb - xa) * t) * s, (ya + (yb - ya) * t) * s) for (xa, ya), (xb, yb) in zip(ca, cb)]
        pen = TTGlyphPen(None)
        start = 0
        for end in ga.endPtsOfContours:
            pts = [(round(x), round(y)) for x, y in coords[start:end + 1]]
            draw_tt_contour(pen, pts, [f & 1 for f in ga.flags[start:end + 1]])
            start = end + 1
        out[name] = (pen.glyph(), round(adv * s))
    return out


def split_contours(rec):
    cur = []
    for op, args in rec.value:
        cur.append((op, args))
        if op in ("closePath", "endPath"):
            yield cur
            cur = []


def square_dots(font, st):
    """Remplace les points ronds (i, j, ponctuation, trémas...) par des carrés de même surface."""
    gs = font.getGlyphSet()
    glyf = font["glyf"]
    changed = []
    for name in font.getGlyphOrder():
        g = glyf[name]
        if g.isComposite() or g.numberOfContours <= 0:
            continue
        rec = RecordingPen()
        gs[name].draw(rec)
        cs = list(split_contours(rec))
        info = []
        for c in cs:
            r = RecordingPen()
            r.value = c
            bp = BoundsPen(None)
            r.replay(bp)
            ap = AreaPen()
            r.replay(ap)
            info.append((bp.bounds, ap.value))
        new, hit = [], False
        for i, (c, (b, area)) in enumerate(zip(cs, info)):
            w, h = b[2] - b[0], b[3] - b[1]
            # Un point est isolé : il ne contient aucun contour et n'est pas un trou dans un autre
            inside = any(
                j != i and (
                    (ob[0] >= b[0] and ob[2] <= b[2] and ob[1] >= b[1] and ob[3] <= b[3])
                    or (b[0] >= ob[0] and b[2] <= ob[2] and b[1] >= ob[1] and b[3] <= ob[3])
                )
                for j, (ob, _) in enumerate(info)
            )
            is_dot = (
                h > 0
                and 0.6 * st <= w <= 2.2 * st
                and 0.8 <= w / h <= 1.25
                and 0.74 <= abs(area) / (w * h) <= 0.84
                and not inside
                and not any(op == "lineTo" for op, _ in c)
            )
            if is_dot:
                side = math.sqrt(abs(area))
                cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
                x0, y0 = round(cx - side / 2), round(cy - side / 2)
                x1, y1 = round(cx + side / 2), round(cy + side / 2)
                new.append([("moveTo", ((x0, y0),)), ("lineTo", ((x0, y1),)), ("lineTo", ((x1, y1),)),
                            ("lineTo", ((x1, y0),)), ("closePath", ())])
                hit = True
            else:
                new.append(c)
        if hit:
            pen = TTGlyphPen(None)
            r = RecordingPen()
            r.value = [x for c in new for x in c]
            r.replay(pen)
            glyf[name] = pen.glyph()
            changed.append(name)
    return changed


def rename(font, weight, style):
    ribbi = style in ("Regular", "Bold")
    full = "Workyt Sans" if style == "Regular" else f"Workyt Sans {style}"
    ps = f"WorkytSans-{style}"
    names = {
        0: "Copyright 2026 Workyt. Derived from Montserrat (Copyright 2024 The Montserrat.Git Project Authors), "
           "Poppins (Copyright 2020 The Poppins Project Authors) and Funnel Display "
           "(Copyright 2024 The Funnel Project Authors).",
        1: "Workyt Sans" if ribbi else full,
        2: style if ribbi else "Regular",
        3: f"1.000;WRKT;{ps}",
        4: full,
        5: "Version 1.000",
        6: ps,
        13: "This Font Software is licensed under the SIL Open Font License, Version 1.1.",
        14: "https://openfontlicense.org",
    }
    if not ribbi:
        names.update({16: "Workyt Sans", 17: style})
    table = font["name"]
    table.names = [n for n in table.names if n.nameID >= 256]
    for nid, val in names.items():
        table.setName(val, nid, 3, 1, 0x409)
    os2 = font["OS/2"]
    os2.usWeightClass = weight
    os2.fsSelection &= ~0b1100001
    if style == "Bold":
        os2.fsSelection |= 0b100000
    elif style == "Regular":
        os2.fsSelection |= 0b1000000
    font["head"].macStyle = 1 if style == "Bold" else 0
    for t in ("STAT", "DSIG"):
        if t in font:
            del font[t]


def build(weight, style):
    f = TTFont(f"{SRC}/Montserrat.ttf")
    instantiateVariableFont(f, {"wght": weight}, inplace=True)
    st, xh = stem(f), f["OS/2"].sxHeight
    glyf = f["glyf"]
    for name, (glyph, adv) in poppins_glyphs(st, xh).items():
        glyf[name] = glyph
        glyph.recalcBounds(glyf)
        f["hmtx"][name] = (adv, glyph.xMin)
    changed = square_dots(f, st)
    for name in changed:
        g = glyf[name]
        g.recalcBounds(glyf)
        f["hmtx"][name] = (f["hmtx"][name][0], g.xMin)
    rename(f, weight, style)
    os.makedirs(OUT, exist_ok=True)
    f.save(f"{OUT}/WorkytSans-{style}.ttf")
    f.flavor = "woff2"
    f.save(f"{OUT}/WorkytSans-{style}.woff2")
    return changed


if __name__ == "__main__":
    for w, s in WEIGHTS.items():
        ch = build(w, s)
        print(s, len(ch), "glyphes à points carrés :", " ".join(ch))
