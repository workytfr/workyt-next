"""Workyt Sans v3 — police dessinée from scratch, à partir des règles du logo Workyt.

Règles du système :
  1. Ronds = cercles/ellipses parfaits (compas).
  2. Hampes montantes taillées en biais (mine de crayon, comme le « t » du logo).
  3. Fûts qui démarrent à la hauteur d'x : drapeau carré décalé à gauche (« r » et « k » du logo).
  4. Descendantes g, j, y : pied plat horizontal vers la gauche, angle arrondi (« y » du logo).
  5. Diagonales coupées net à l'horizontale (« w » du logo).
  6. Points carrés.
Toutes les graisses sortent du même dessin : seul l'épaisseur du fût (S) change.
Usage : python build_v3.py -> out/v3/WorkytSans-<style>.ttf / .woff2
"""
import math
import os

import pathops
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.reverseContourPen import ReverseContourPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.areaPen import AreaPen

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out", "v3")
WEIGHTS = {400: ("Regular", 84), 500: ("Medium", 106), 600: ("SemiBold", 128), 700: ("Bold", 150), 800: ("ExtraBold", 174)}

X, C, A, DESC, OV = 520, 700, 760, -215, 10
UNION, DIFF, INTER = pathops.PathOp.UNION, pathops.PathOp.DIFFERENCE, pathops.PathOp.INTERSECTION
K = 0.5522847498


# ---------------------------------------------------------------- primitives
def P():
    return pathops.Path()


def rect(x0, y0, x1, y1):
    if x0 > x1: x0, x1 = x1, x0
    if y0 > y1: y0, y1 = y1, y0
    p = P(); pen = p.getPen()
    pen.moveTo((x0, y0)); pen.lineTo((x0, y1)); pen.lineTo((x1, y1)); pen.lineTo((x1, y0)); pen.closePath()
    return p


def poly(pts):
    p = P(); pen = p.getPen()
    pen.moveTo(pts[0])
    for q in pts[1:]:
        pen.lineTo(q)
    pen.closePath()
    return p


def ellipse(cx, cy, rx, ry):
    p = P(); pen = p.getPen()
    kx, ky = rx * K, ry * K
    pen.moveTo((cx + rx, cy))
    pen.curveTo((cx + rx, cy + ky), (cx + kx, cy + ry), (cx, cy + ry))
    pen.curveTo((cx - kx, cy + ry), (cx - rx, cy + ky), (cx - rx, cy))
    pen.curveTo((cx - rx, cy - ky), (cx - kx, cy - ry), (cx, cy - ry))
    pen.curveTo((cx + kx, cy - ry), (cx + rx, cy - ky), (cx + rx, cy))
    pen.closePath()
    return p


def uni(*ps):
    ps = [p for p in ps if p is not None]
    r = ps[0]
    for p in ps[1:]:
        r = pathops.op(r, p, UNION)
    return r


def diff(a, *bs):
    for b in bs:
        a = pathops.op(a, b, DIFF)
    return a


def inter(a, b):
    return pathops.op(a, b, INTER)


def tf(path, m):
    rec = RecordingPen(); path.draw(rec)
    out = P()
    rec.replay(TransformPen(out.getPen(), m))
    return pathops.simplify(out)


def move(path, dx, dy=0):
    return tf(path, (1, 0, 0, 1, dx, dy))


def bounds(path):
    return path.bounds  # (xMin, yMin, xMax, yMax)


BIG = 5000


class G:
    """Toutes les formes, paramétrées par l'épaisseur du fût S."""

    def __init__(self, S):
        self.S = S
        self.SV = S * 0.86            # épaisseur des parties horizontales des ronds
        self.T = S * 0.84             # barres horizontales
        self.Sd = S * 0.98            # épaisseur des diagonales
        self.fh = max(S * 0.95, 78)   # hauteur du drapeau
        self.fs = max(S * 0.45, 38)   # décalage du drapeau
        self.rx = (X * 0.9 + S * 0.62) / 2   # demi-largeur d'un rond de bas de casse
        self.dot = S * 1.08
        self.gap = S * 0.38 + 48

    # -- briques
    def ring(self, cx, cy, rx, ry, s=None, sv=None):
        s = self.S if s is None else s
        sv = self.SV if sv is None else sv
        return diff(ellipse(cx, cy, rx, ry), ellipse(cx, cy, rx - s, ry - sv))

    def bowl(self, cx=None):
        cx = self.rx if cx is None else cx
        return self.ring(cx, X / 2, self.rx, X / 2 + OV)

    def asc(self, x, y0=0, top=A):
        """Fût montant taillé en biais (pente du logo : 0,8)."""
        S = self.S
        st = rect(x, y0, x + S, top)
        cut = poly([(x - 1, top), (x + S + 40, top - 0.8 * (S + 41)), (x + S + 40, top + 40), (x - 1, top + 40)])
        return diff(st, cut)

    def flag(self, x, y0, top=X, shift=None):
        """Fût avec drapeau carré décalé à gauche en haut."""
        S, fh = self.S, self.fh
        fs = self.fs if shift is None else shift
        return uni(rect(x, y0, x + S, top - fh + 1), rect(x - fs, top - fh, x - fs + S, top))

    def foot_flag(self, x, top=X):
        """Fût avec drapeau carré décalé à droite en bas (pendant du drapeau, par rotation)."""
        S, fh, fs = self.S, self.fh, self.fs
        return uni(rect(x, fh - 1, x + S, top), rect(x + fs, 0, x + fs + S, fh))

    def sq(self, cx, y0, size=None):
        d = self.dot if size is None else size
        return rect(cx - d / 2, y0, cx + d / 2, y0 + d)

    def diag(self, xb, yb, xt, yt, t=None):
        """Diagonale coupée à l'horizontale ; (xb,yb) et (xt,yt) = bords gauches bas/haut."""
        t = self.Sd if t is None else t
        L = math.hypot(xt - xb, yt - yb)
        w = t * L / abs(yt - yb)
        return poly([(xb, yb), (xb + w, yb), (xt + w, yt), (xt, yt)])

    def dw(self, dx, dy, t=None):
        t = self.Sd if t is None else t
        return t * math.hypot(dx, dy) / abs(dy)

    def round_corner_br(self, path, x1, y0, r):
        """Arrondit l'angle extérieur bas-droit (x1, y0) d'un pied."""
        corner = diff(rect(x1 - r, y0, x1 + 1, y0 + r), ellipse(x1 - r, y0 + r, r, r))
        return diff(path, corner)

    def foot(self, x_left, x_right, y0=DESC):
        """Pied plat (y du logo) : barre vers la gauche, angle bas-droit arrondi."""
        return rect(x_left, y0, x_right, y0 + self.T)


# ---------------------------------------------------------------- glyphes
def lowercase(g):
    S, T, SV, rx = g.S, g.T, g.SV, g.rx
    W = 2 * rx
    gl = {}
    gl["o"] = (g.bowl(), "RR")
    gl["b"] = (uni(g.asc(0), g.bowl()), "SR")
    gl["d"] = (uni(g.bowl(), g.asc(W - S)), "RS")
    gl["p"] = (uni(g.flag(0, DESC), g.bowl()), "FR")
    gl["q"] = (tf(gl["p"][0], (-1, 0, 0, 1, W, 0)), "RF")
    gl["a"] = (uni(g.bowl(), g.foot_flag(W - S)), "RF")
    # g : rond + fût qui descend + pied plat
    gx = uni(g.bowl(), rect(W - S, DESC + T * 0.5, W, X), g.foot(rx * 0.25, W))
    gl["g"] = (g.round_corner_br(gx, W, DESC, S * 1.1), "RS")
    # c, e
    cy, ry = X / 2, X / 2 + OV
    gl["c"] = (diff(g.bowl(), rect(rx, cy - ry * 0.34, BIG, cy + ry * 0.34)), "RD")
    by = cy + 6
    e = uni(g.bowl(), rect(S * 0.5, by - T / 2, W, by + T / 2))
    gl["e"] = (diff(e, rect(rx + S * 0.2, cy - ry * 0.42, BIG, by - T / 2)), "RD")
    # n, h, m, u, r
    rn = rx * 0.9
    ryn = rn * 0.98
    cyn = X + OV - ryn

    def arch(x0, r, ry=ryn):
        cyy = X + OV - ry
        return uni(inter(g.ring(x0 + r, cyy, r, ry), rect(x0 - 1, cyy, x0 + 2 * r + 1, BIG)),
                   rect(x0 + 2 * r - S, 0, x0 + 2 * r, cyy + 1))

    n = uni(g.flag(0, 0), arch(0, rn))
    gl["n"] = (n, "FS")
    gl["h"] = (uni(g.asc(0), arch(0, rn)), "SS")
    rm = rx * 0.9
    gl["m"] = (uni(g.flag(0, 0), arch(0, rm, rm * 1.0), arch(2 * rm - S, rm, rm * 1.0)), "FS")
    gl["u"] = (tf(n, (-1, 0, 0, -1, 2 * rn, X)), "SF")
    rr = rx * 0.62
    cyr = X + OV - ryn
    r = uni(g.flag(0, 0), inter(g.ring(rr, cyr, rr, ryn), rect(-1, cyr, rr, BIG)),
            rect(rr - 1, X + OV - SV, rr + S * 0.62, X + OV))
    gl["r"] = (r, "FD")
    # i, j, l
    gl["dotlessi"] = (g.flag(0, 0), "FS")
    gl["i"] = (uni(g.flag(0, 0), g.sq(S / 2, X + g.gap)), "FS")
    jj = uni(g.flag(0, DESC + T * 0.5), g.foot(-S * 1.25, S, DESC))
    jj = g.round_corner_br(jj, S, DESC, S * 1.1)
    gl["dotlessj"] = (jj, "DS")
    gl["j"] = (uni(jj, g.sq(S / 2, X + g.gap)), "DS")
    gl["l"] = (g.asc(0), "SS")
    # k : construit comme le K, bras coupé net en haut, jambe coupée net en bas
    wk = rx * 1.72
    dk = g.dw(wk - S, X * 0.72)
    yk = X * 0.26
    xk = S - dk * 0.55
    arm = poly([(xk, yk), (xk + dk, yk), (wk, X), (wk - dk, X)])
    ylk = X * 0.55
    xak = xk + (wk - dk - xk) * ((ylk - yk) / (X - yk))
    dlk = g.dw(wk + 12 - xak, ylk)
    leg = poly([(wk + 12 - dlk, 0), (wk + 12, 0), (xak + dlk, ylk), (xak, ylk)])
    gl["k"] = (uni(g.asc(0), arm, leg), "SD")
    # v, w, x, y, z
    wv = rx * 1.9

    def vee(x0, w, h=X, y0=0):
        d = g.dw(w / 2, h)
        lft = poly([(x0 + w / 2 - d / 2, y0), (x0 + w / 2 + d / 2, y0), (x0 + d, y0 + h), (x0, y0 + h)])
        rgt = poly([(x0 + w / 2 - d / 2, y0), (x0 + w / 2 + d / 2, y0), (x0 + w, y0 + h), (x0 + w - d, y0 + h)])
        return uni(lft, rgt)

    gl["v"] = (vee(0, wv), "DD")
    ww = rx * 2.75
    half = (ww + g.dw(ww / 4, X)) / 2
    gl["w"] = (uni(vee(0, half), vee(ww - half, half)), "DD")
    wx = rx * 1.8
    d = g.dw(wx, X)
    gl["x"] = (uni(poly([(0, 0), (d, 0), (wx, X), (wx - d, X)]), poly([(wx - d, 0), (wx, 0), (d, X), (0, X)])), "DD")
    wy = rx * 1.95
    dy_ = g.dw(wy / 2, X)
    left = poly([(wy / 2 - dy_ / 2, 0), (wy / 2 + dy_ / 2, 0), (dy_, X), (0, X)])
    slope = (wy - dy_ / 2 - wy / 2) / X  # dx par unité de y du bras droit (axe)
    yb = DESC
    xb = wy / 2 - dy_ / 2 + (yb) * slope
    right = poly([(xb, yb), (xb + dy_, yb), (wy, X), (wy - dy_, X)])
    yfoot = uni(left, right, rect(wy * 0.02, DESC, xb + dy_ * 0.5, DESC + T))
    yfoot = diff(yfoot, rect(-BIG, -BIG, BIG, DESC))
    gl["y"] = (yfoot, "DD")
    wz = rx * 1.65
    dz = g.dw(wz, X - 2 * T)
    gl["z"] = (uni(rect(0, X - T, wz, X), rect(0, 0, wz, T), poly([(0, T - 1), (dz, T - 1), (wz, X - T + 1), (wz - dz, X - T + 1)])), "DD")
    # f, t
    rf = rx * 0.66
    ryf = rf
    cyf = A + OV - ryf
    f = uni(rect(0, 0, S, cyf + 1), inter(g.ring(rf, cyf, rf, ryf), rect(-1, cyf, rf, BIG)),
            rect(rf - 1, A + OV - SV, rf + S * 0.6, A + OV), rect(-S * 0.55, X - T, rf + S * 0.35, X))
    gl["f"] = (f, "DD")
    tt = A - 70
    rh = S * 0.95 + 45
    t = uni(g.asc(0, rh * 0.9, tt), inter(g.ring(rh, rh - OV, rh, rh), rect(-1, -BIG, rh, rh - OV)),
            rect(rh - 1, -OV, rh + S * 0.75, -OV + SV), rect(-S * 0.75, X - T, S + S * 1.0, X))
    gl["t"] = (t, "DD")
    # s : deux demi-anneaux superposés qui partagent la barre du milieu
    svs = SV * 0.74  # le s a des horizontales plus fines, sinon ses contreformes se ferment
    ryS = (X / 2 + OV + svs / 2) / 2
    rxS = rx * 0.84
    cy1, cy2 = X + OV - ryS, -OV + ryS
    sx = rxS
    top = diff(g.ring(sx, cy1, rxS, ryS, sv=svs), rect(sx, -BIG, BIG, cy1 + ryS * 0.12))
    bot = diff(g.ring(sx, cy2, rxS, ryS, sv=svs), rect(-BIG, cy2 - ryS * 0.12, sx, BIG))
    gl["s"] = (uni(top, bot), "RR")
    return gl


def uppercase(g):
    S, T, SV = g.S, g.T, g.SV
    gl = {}
    H = C
    gl["I"] = (rect(0, 0, S, H), "SS")
    wh = H * 0.78
    gl["H"] = (uni(rect(0, 0, S, H), rect(wh - S, 0, wh, H), rect(0, H / 2 - T / 2 + 10, wh, H / 2 + T / 2 + 10)), "SS")
    we = H * 0.58
    gl["E"] = (uni(rect(0, 0, S, H), rect(0, H - T, we, H), rect(0, H / 2 - T / 2 + 10, we * 0.92, H / 2 + T / 2 + 10), rect(0, 0, we, T)), "SD")
    gl["F"] = (uni(rect(0, 0, S, H), rect(0, H - T, we, H), rect(0, H / 2 - T / 2 + 10, we * 0.9, H / 2 + T / 2 + 10)), "SD")
    gl["L"] = (uni(rect(0, 0, S, H), rect(0, 0, we * 0.95, T)), "SD")
    gl["T"] = (uni(rect(0, H - T, H * 0.68, H), rect(H * 0.34 - S / 2, 0, H * 0.34 + S / 2, H)), "DD")
    ro = H / 2 + OV
    rxo = ro * 1.02
    O = g.ring(rxo, H / 2, rxo, ro)
    gl["O"] = (O, "RR")
    gl["C"] = (diff(O, rect(rxo, H / 2 - ro * 0.3, BIG, H / 2 + ro * 0.3)), "RD")
    Gc = diff(O, rect(rxo, H / 2, BIG, H / 2 + ro * 0.3))
    gl["G"] = (uni(Gc, rect(rxo, H / 2 - T, 2 * rxo, H / 2), rect(2 * rxo - S, 0 + 120, 2 * rxo, H / 2)), "RS")
    dq = g.dw(1, 1.15)
    dq = g.dw(rxo * 0.5, H * 0.38)
    gl["Q"] = (uni(O, poly([(rxo * 1.62, -OV - 60), (rxo * 1.62 + dq, -OV - 60), (rxo * 1.12 + dq, H * 0.3), (rxo * 1.12, H * 0.3)])), "RR")
    # D
    wd = H * 0.8
    rD = H / 2
    rxD = rD * 0.95
    gl["D"] = (uni(rect(0, 0, S, H), rect(0, H - SV, wd - rxD, H), rect(0, 0, wd - rxD, SV),
                   inter(g.ring(wd - rxD, H / 2, rxD, rD), rect(wd - rxD, -BIG, BIG, BIG))), "SR")
    # P, B, R
    bp = H * 0.54  # hauteur du bas de la panse
    rP = (H - bp) / 2
    wp = H * 0.66

    def bowlR(y0, y1, w):
        r = (y1 - y0) / 2
        rxx = min(r * 1.05, w - S)
        cx = w - rxx
        return uni(rect(0, y1 - SV, cx, y1), rect(0, y0, cx, y0 + SV),
                   inter(g.ring(cx, (y0 + y1) / 2, rxx, r), rect(cx, -BIG, BIG, BIG)))

    P_ = uni(rect(0, 0, S, H), bowlR(bp - SV / 2, H, wp))
    gl["P"] = (P_, "SR")
    gl["B"] = (uni(rect(0, 0, S, H), bowlR(H * 0.47, H, wp * 0.92), bowlR(0, H * 0.47 + SV, wp * 1.02)), "SR")
    dl = g.dw(wp * 0.45, bp)
    gl["R"] = (uni(P_, poly([(wp + 10 - dl, 0), (wp + 10, 0), (wp * 0.55 + dl, bp), (wp * 0.55, bp)])), "SD")
    # U, J
    wu = H * 0.78
    ru = wu / 2
    cyu = ru - OV
    gl["U"] = (uni(rect(0, cyu, S, H), rect(wu - S, cyu, wu, H), inter(g.ring(ru, cyu, ru, ru), rect(-1, -BIG, BIG, cyu + 1))), "SS")
    wj = H * 0.56
    rj = wj / 2
    gl["J"] = (uni(rect(wj - S, rj - OV, wj, H), inter(g.ring(rj, rj - OV, rj, rj), rect(-1, -BIG, BIG, rj - OV + 1)),
                   rect(0, rj - OV - 1, S, rj * 1.25)), "DS")
    # A, V, W, X, Y, Z, K, M, N
    wa = H * 0.86
    da = g.dw(wa / 2, H)

    def peak(x0, w, h, y0=0):
        lft = poly([(x0, y0), (x0 + da, y0), (x0 + w / 2 + da / 2, y0 + h), (x0 + w / 2 - da / 2, y0 + h)])
        rgt = poly([(x0 + w - da, y0), (x0 + w, y0), (x0 + w / 2 + da / 2, y0 + h), (x0 + w / 2 - da / 2, y0 + h)])
        return uni(lft, rgt)

    yb = H * 0.26
    xbl = (wa / 2 - da / 2) * (yb / H)
    gl["A"] = (uni(peak(0, wa, H), rect(xbl + da * 0.5, yb, wa - xbl - da * 0.5, yb + T)), "DD")
    gl["V"] = (tf(peak(0, wa, H), (1, 0, 0, -1, 0, H)), "DD")
    wW = H * 1.25
    hw = (wW + da) / 2
    vv = uni(peak(0, hw, H), peak(wW - hw, hw, H))
    gl["W"] = (tf(vv, (1, 0, 0, -1, 0, H)), "DD")
    wxx = H * 0.8
    dx_ = g.dw(wxx, H)
    gl["X"] = (uni(poly([(0, 0), (dx_, 0), (wxx, H), (wxx - dx_, H)]), poly([(wxx - dx_, 0), (wxx, 0), (dx_, H), (0, H)])), "DD")
    wY = H * 0.82
    dY = g.dw(wY / 2, H * 0.52)
    ym = H * 0.46
    gl["Y"] = (uni(poly([(wY / 2 - S / 2, ym), (wY / 2 + S / 2, ym), (dY, H), (0, H)]),
                   poly([(wY / 2 - S / 2, ym), (wY / 2 + S / 2, ym), (wY, H), (wY - dY, H)]),
                   rect(wY / 2 - S / 2, 0, wY / 2 + S / 2, ym + 1)), "DD")
    wz = H * 0.72
    dz = g.dw(wz, H - 2 * T)
    gl["Z"] = (uni(rect(0, H - T, wz, H), rect(0, 0, wz, T), poly([(0, T - 1), (dz, T - 1), (wz, H - T + 1), (wz - dz, H - T + 1)])), "DD")
    wK = H * 0.72
    dk = g.dw(wK - S, H * 0.62)
    yk = H * 0.36
    xk = S - dk * 0.6
    armK = poly([(xk, yk), (xk + dk, yk), (wK, H), (wK - dk, H)])
    ylk = H * 0.58
    xak = xk + (wK - dk - xk) * ((ylk - yk) / (H - yk))
    dlk = g.dw(wK + 10 - xak, ylk)
    gl["K"] = (uni(rect(0, 0, S, H), armK, poly([(wK + 10 - dlk, 0), (wK + 10, 0), (xak + dlk, ylk), (xak, ylk)])), "SD")
    wm = H * 0.95
    dm = g.dw(wm / 2 - S, H * 0.8)
    gl["M"] = (uni(rect(0, 0, S, H), rect(wm - S, 0, wm, H),
                   poly([(wm / 2 - dm / 2, H * 0.18), (wm / 2 + dm / 2, H * 0.18), (S, H), (S - dm, H)]),
                   poly([(wm / 2 - dm / 2, H * 0.18), (wm / 2 + dm / 2, H * 0.18), (wm - S + dm, H), (wm - S, H)])), "SS")
    wn = H * 0.8
    dn = g.dw(wn - 2 * S, H)
    dn = g.dw(wn - S, H)
    gl["N"] = (uni(rect(0, 0, S, H), rect(wn - S, 0, wn, H), poly([(wn - dn, 0), (wn, 0), (dn, H), (0, H)])), "SS")
    # S majuscule
    svS = SV * 0.8
    ryS = (H / 2 + OV + svS / 2) / 2
    rxS = ryS * 1.2
    cy1, cy2 = H + OV - ryS, -OV + ryS
    top = diff(g.ring(rxS, cy1, rxS, ryS, sv=svS), rect(rxS, -BIG, BIG, cy1 + ryS * 0.12))
    bot = diff(g.ring(rxS, cy2, rxS, ryS, sv=svS), rect(-BIG, cy2 - ryS * 0.12, rxS, BIG))
    gl["S"] = (uni(top, bot), "RR")
    return gl


def figures(g):
    S, T, SV = g.S, g.T, g.SV
    H = C
    gl = {}
    w0 = H * 0.62
    gl["zero"] = (g.ring(w0 / 2, H / 2, w0 / 2, H / 2 + OV), "RR")
    fl = S * 0.9 + 60
    gl["one"] = (uni(rect(0, 0, S, H), poly([(-fl, H - fl * 0.8 - S * 0.75), (0, H - S * 0.75), (0, H), (-fl, H - fl * 0.8)]),
                     poly([(-fl, H - fl * 0.8 - S * 0.75), (1, H - S * 0.75), (1, H), (-fl, H - fl * 0.8)])), "DS")
    r2 = w0 / 2
    cy2 = H + OV - r2
    two_top = inter(g.ring(r2, cy2, r2, r2), rect(-BIG, cy2 - r2 * 0.25, BIG, BIG))
    two_top = diff(two_top, rect(-BIG, -BIG, r2 * 0.9, cy2 - 1))
    d2 = g.dw(w0 - S, cy2 - T)
    xr = w0 - S
    two = uni(two_top, poly([(0, T - 1), (d2, T - 1), (w0, cy2 - r2 * 0.25 + 1), (w0 - d2, cy2 - r2 * 0.25 + 1)]), rect(0, 0, w0, T))
    gl["two"] = (two, "DD")
    # trois : deux demi-anneaux ouverts à gauche
    ry3 = (H / 2 + OV + SV / 2) / 2
    rx3 = ry3 * 1.08
    c1, c2 = H + OV - ry3, -OV + ry3
    cx3 = w0 - rx3
    t1 = uni(inter(g.ring(cx3, c1, rx3, ry3), rect(cx3, -BIG, BIG, BIG)), rect(0, H + OV - SV, cx3 + 1, H + OV), rect(w0 * 0.3, c1 - ry3, cx3 + 1, c1 - ry3 + SV))
    t2 = uni(inter(g.ring(cx3, c2, rx3, ry3), rect(cx3, -BIG, BIG, BIG)), rect(0, -OV, cx3 + 1, -OV + SV))
    gl["three"] = (uni(t1, t2), "DR")
    # quatre
    w4 = H * 0.7
    yb4 = H * 0.24
    d4 = g.dw(w4 - S, H - yb4)
    gl["four"] = (uni(rect(w4 - S * 1.6, 0, w4 - S * 0.6, H), rect(0, yb4, w4, yb4 + T),
                      poly([(0, yb4), (d4, yb4), (w4 - S * 0.6, H), (w4 - S * 0.6 - d4, H)])), "DD")
    # cinq
    r5 = H * 0.34
    c5 = r5 - OV
    b5 = diff(g.ring(w0 - r5, c5, r5, r5), rect(-BIG, -BIG, w0 - r5, c5 + r5 * 0.1))
    b5 = uni(b5, rect(w0 - r5 * 1.75, -OV, w0 - r5 + 1, -OV + SV))
    xs5 = w0 - 2 * r5 + 0
    five = uni(b5, rect(xs5, c5 + r5 * 0.2, xs5 + S, H), rect(xs5, H - T, w0, H))
    gl["five"] = (five, "DR")
    # six / neuf
    r6 = H * 0.32
    c6 = r6 - OV
    ring6 = g.ring(w0 / 2, c6, w0 / 2, r6)
    d6 = g.dw(w0 * 0.5, H - c6)
    six = uni(ring6, poly([(0, c6), (d6, c6), (w0 * 0.58 + d6, H), (w0 * 0.58, H)]))
    six = diff(six, rect(-BIG, H, BIG, BIG))
    gl["six"] = (six, "RR")
    gl["nine"] = (tf(six, (-1, 0, 0, -1, w0, H)), "RR")
    # sept
    w7 = H * 0.62
    d7 = g.dw(w7 * 0.7, H - T)
    gl["seven"] = (uni(rect(0, H - T, w7, H), poly([(w7 * 0.2, 0), (w7 * 0.2 + d7, 0), (w7, H - T + 1), (w7 - d7, H - T + 1)])), "DD")
    # huit
    r8b = H * 0.27 + OV / 2
    r8t = H * 0.235
    w8 = w0
    eight = uni(g.ring(w8 / 2, r8b - OV, w8 / 2, r8b), g.ring(w8 / 2, H + OV - r8t, w8 * 0.44, r8t))
    gl["eight"] = (eight, "RR")
    return gl


def punctuation(g):
    S, T, SV = g.S, g.T, g.SV
    d = g.dot
    gl = {}
    gl["period"] = (g.sq(d / 2, 0), "DD")
    comma = uni(g.sq(d / 2, 0), poly([(d - d * 0.55, 1), (d, 1), (d * 0.45, -d * 1.05), (d * 0.45 - d * 0.55, -d * 1.05)]))
    gl["comma"] = (comma, "DD")
    gl["colon"] = (uni(g.sq(d / 2, 0), g.sq(d / 2, X - d)), "DD")
    gl["semicolon"] = (uni(comma, g.sq(d / 2, X - d)), "DD")
    gl["exclam"] = (uni(g.sq(d / 2, 0), rect(d / 2 - S / 2, d + g.gap * 0.7, d / 2 + S / 2, C)), "DD")
    rq = C * 0.27
    cq = C + OV - rq
    q = diff(g.ring(rq, cq, rq, rq), rect(-BIG, -BIG, rq, cq + rq * 0.1))
    gl["question"] = (uni(q, rect(rq - S / 2, d + g.gap * 0.7, rq + S / 2, cq - rq + SV), g.sq(rq, 0)), "DD")
    gl["hyphen"] = (rect(0, X * 0.5 - T / 2 + 10, X * 0.52, X * 0.5 + T / 2 + 10), "DD")
    gl["endash"] = (rect(0, X * 0.5 - T / 2 + 10, 500, X * 0.5 + T / 2 + 10), "DD")
    gl["emdash"] = (rect(0, X * 0.5 - T / 2 + 10, 1000 - 2 * (12 + 0.08 * S), X * 0.5 + T / 2 + 10), "DD")
    ap = poly([(d * 0.3, C), (d * 0.3 + d * 0.62, C), (d * 0.62, C - d * 1.5), (0, C - d * 1.5)])
    gl["quotesingle"] = (rect(0, C - d * 1.6, S * 0.9, C), "DD")
    gl["quoteright"] = (ap, "DD")
    gl["quoteleft"] = (tf(ap, (-1, 0, 0, -1, d * 0.92, 2 * C - d * 1.5)), "DD")
    gl["quotedbl"] = (uni(rect(0, C - d * 1.6, S * 0.9, C), rect(S * 0.9 + S * 0.7, C - d * 1.6, S * 1.8 + S * 0.7, C)), "DD")
    gl["quotedblright"] = (uni(ap, move(ap, d * 1.25)), "DD")
    gl["quotedblleft"] = (uni(gl["quoteleft"][0], move(gl["quoteleft"][0], d * 1.25)), "DD")
    gl["quotesinglbase"] = (move(ap, 0, -C + d * 1.0), "DD")
    # chevrons
    hc = X * 0.6
    wc = hc * 0.4
    dc = g.dw(wc, hc / 2, g.Sd * 0.72)
    ch = uni(poly([(0, X * 0.5 + 10), (dc, X * 0.5 + 10), (wc + dc, X * 0.5 + 10 + hc / 2), (wc, X * 0.5 + 10 + hc / 2)]),
             poly([(wc, X * 0.5 + 10 - hc / 2), (wc + dc, X * 0.5 + 10 - hc / 2), (dc, X * 0.5 + 10), (0, X * 0.5 + 10)]))
    ch = diff(ch, rect(-BIG, -BIG, 0, BIG))
    gl["guilsinglleft"] = (ch, "DD")
    gl["guilsinglright"] = (tf(ch, (-1, 0, 0, 1, 0, 0)), "DD")
    gl["guillemotleft"] = (uni(ch, move(ch, wc + dc * 0.9)), "DD")
    gl["guillemotright"] = (tf(gl["guillemotleft"][0], (-1, 0, 0, 1, 0, 0)), "DD")
    # parenthèses, crochets, barre
    rp = C * 0.62
    par = inter(g.ring(rp, C * 0.4, rp, C * 0.66), rect(-BIG, -BIG, rp * 0.32, BIG))
    gl["parenleft"] = (par, "RD")
    gl["parenright"] = (tf(par, (-1, 0, 0, 1, 0, 0)), "DR")
    gl["bracketleft"] = (uni(rect(0, DESC + 40, S, C + 60), rect(0, C + 60 - T, S * 2.2, C + 60), rect(0, DESC + 40, S * 2.2, DESC + 40 + T)), "SD")
    gl["bracketright"] = (tf(gl["bracketleft"][0], (-1, 0, 0, 1, 0, 0)), "DS")
    ds = g.dw(C * 0.45, C + 100, g.Sd * 0.9)
    gl["slash"] = (poly([(0, -60), (ds, -60), (C * 0.45 + ds, C + 40), (C * 0.45, C + 40)]), "DD")
    gl["underscore"] = (rect(0, -120, X, -120 + T), "DD")
    # opérateurs
    wpz = X * 0.95
    my = X * 0.5 + 10
    gl["plus"] = (uni(rect(0, my - T / 2, wpz, my + T / 2), rect(wpz / 2 - S / 2, my - wpz / 2, wpz / 2 + S / 2, my + wpz / 2)), "DD")
    gl["minus"] = (rect(0, my - T / 2, wpz, my + T / 2), "DD")
    gl["equal"] = (uni(rect(0, my + T * 0.35, wpz, my + T * 1.35), rect(0, my - T * 1.35, wpz, my - T * 0.35)), "DD")
    gl["multiply"] = (tf(gl["plus"][0], (math.cos(math.pi / 4), math.sin(math.pi / 4), -math.sin(math.pi / 4), math.cos(math.pi / 4), 0, 0)), "DD")
    gl["divide"] = (uni(rect(0, my - T / 2, wpz, my + T / 2), g.sq(wpz / 2, my + T / 2 + g.gap * 0.5), g.sq(wpz / 2, my - T / 2 - g.gap * 0.5 - d)), "DD")
    gl["periodcentered"] = (g.sq(d / 2, my - d / 2), "DD")
    gl["bullet"] = (g.sq(d * 0.75, my - d * 0.75, d * 1.5), "DD")
    gl["ellipsis"] = (uni(g.sq(d / 2, 0), g.sq(d / 2 + d * 1.9, 0), g.sq(d / 2 + d * 3.8, 0)), "DD")
    # degré, pourcent, euro, astérisque, dièse, arobase, esperluette
    rdg = C * 0.17
    gl["degree"] = (g.ring(rdg, C - rdg, rdg, rdg, S * 0.7, S * 0.62), "RR")
    rpc = C * 0.17
    pc = uni(g.ring(rpc, C - rpc, rpc, rpc, S * 0.75, S * 0.65), g.ring(C * 0.82 - rpc, rpc, rpc, rpc, S * 0.75, S * 0.65))
    dpc = g.dw(C * 0.82, C, g.Sd * 0.85)
    pc = uni(pc, poly([(C * 0.02, 0), (C * 0.02 + dpc, 0), (C * 0.82 - C * 0.02, C), (C * 0.82 - C * 0.02 - dpc, C)]))
    gl["percent"] = (pc, "RR")
    reu = C / 2 + OV
    eu = diff(g.ring(reu * 1.0 + S * 0.6, C / 2, reu, reu), rect(reu + S * 0.6, C / 2 - reu * 0.32, BIG, C / 2 + reu * 0.32))
    eu = uni(eu, rect(0, C * 0.56, reu * 1.3, C * 0.56 + T * 0.8), rect(0, C * 0.36, reu * 1.2, C * 0.36 + T * 0.8))
    gl["Euro"] = (eu, "DD")
    star = rect(-S * 0.42, 0, S * 0.42, X * 0.5)
    st = uni(*[tf(star, (math.cos(a), math.sin(a), -math.sin(a), math.cos(a), 0, 0)) for a in [i * 2 * math.pi / 5 for i in range(5)]])
    gl["asterisk"] = (move(st, 0, C - X * 0.5), "DD")
    wsh = C * 0.72
    gl["numbersign"] = (uni(rect(0, C * 0.3, wsh, C * 0.3 + T * 0.85), rect(0, C * 0.62, wsh, C * 0.62 + T * 0.85),
                            rect(wsh * 0.3 - S * 0.45, 0, wsh * 0.3 + S * 0.45, C), rect(wsh * 0.7 - S * 0.45, 0, wsh * 0.7 + S * 0.45, C)), "DD")
    return gl


def accents(g):
    S, d = g.S, g.dot
    base = X + g.gap
    h = S * 0.85 + 70
    wa = S * 0.95 + 50
    acute = poly([(0, base), (S * 1.05, base), (wa + S * 1.05 * 0.4, base + h), (wa - S * 0.6, base + h)])
    grave = tf(acute, (-1, 0, 0, 1, 0, 0))
    dc = g.dw(S * 1.1, h * 0.8, g.Sd * 0.82)
    hcf = h * 0.95
    wcf = S * 1.25 + 60
    circ = uni(poly([(-wcf, base), (-wcf + dc, base), (dc / 2, base + hcf), (-dc / 2, base + hcf)]),
               poly([(wcf - dc, base), (wcf, base), (dc / 2, base + hcf), (-dc / 2, base + hcf)]))
    sp = d * 0.85
    diaer = uni(g.sq(-sp, base), g.sq(sp, base))
    ced = uni(rect(-S * 0.45, -OV - g.T * 0.2 - S * 0.9, S * 0.45, 0), rect(-S * 1.2, -OV - S * 0.9 - g.T * 0.8, S * 0.45, -OV - S * 0.9))
    return {"acute": acute, "grave": grave, "circumflex": circ, "dieresis": diaer, "cedilla": ced}


ACCENTED = {
    "agrave": ("a", "grave"), "acircumflex": ("a", "circumflex"), "adieresis": ("a", "dieresis"),
    "eacute": ("e", "acute"), "egrave": ("e", "grave"), "ecircumflex": ("e", "circumflex"), "edieresis": ("e", "dieresis"),
    "icircumflex": ("dotlessi", "circumflex"), "idieresis": ("dotlessi", "dieresis"),
    "ocircumflex": ("o", "circumflex"), "odieresis": ("o", "dieresis"),
    "ugrave": ("u", "grave"), "ucircumflex": ("u", "circumflex"), "udieresis": ("u", "dieresis"),
    "ydieresis": ("y", "dieresis"), "ccedilla": ("c", "cedilla"),
    "Agrave": ("A", "grave"), "Acircumflex": ("A", "circumflex"), "Adieresis": ("A", "dieresis"),
    "Eacute": ("E", "acute"), "Egrave": ("E", "grave"), "Ecircumflex": ("E", "circumflex"), "Edieresis": ("E", "dieresis"),
    "Icircumflex": ("I", "circumflex"), "Idieresis": ("I", "dieresis"),
    "Ocircumflex": ("O", "circumflex"), "Odieresis": ("O", "dieresis"),
    "Ugrave": ("U", "grave"), "Ucircumflex": ("U", "circumflex"), "Udieresis": ("U", "dieresis"),
    "Ydieresis": ("Y", "dieresis"), "Ccedilla": ("C", "cedilla"),
}

UNI = {
    "space": 0x20, "exclam": 0x21, "quotedbl": 0x22, "numbersign": 0x23, "percent": 0x25, "quotesingle": 0x27,
    "parenleft": 0x28, "parenright": 0x29, "asterisk": 0x2A, "plus": 0x2B, "comma": 0x2C, "hyphen": 0x2D,
    "period": 0x2E, "slash": 0x2F, "zero": 0x30, "one": 0x31, "two": 0x32, "three": 0x33, "four": 0x34,
    "five": 0x35, "six": 0x36, "seven": 0x37, "eight": 0x38, "nine": 0x39, "colon": 0x3A, "semicolon": 0x3B,
    "equal": 0x3D, "question": 0x3F, "bracketleft": 0x5B, "bracketright": 0x5D, "underscore": 0x5F,
    "guillemotleft": 0xAB, "guillemotright": 0xBB, "degree": 0xB0, "periodcentered": 0xB7, "multiply": 0xD7,
    "divide": 0xF7, "dotlessi": 0x131, "dotlessj": 0x237, "oe": 0x153, "OE": 0x152, "endash": 0x2013, "emdash": 0x2014,
    "quoteleft": 0x2018, "quoteright": 0x2019, "quotesinglbase": 0x201A, "quotedblleft": 0x201C,
    "quotedblright": 0x201D, "bullet": 0x2022, "ellipsis": 0x2026, "guilsinglleft": 0x2039,
    "guilsinglright": 0x203A, "Euro": 0x20AC, "minus": 0x2212, "nbspace": 0xA0, "uni202F": 0x202F,
    "agrave": 0xE0, "acircumflex": 0xE2, "adieresis": 0xE4, "ccedilla": 0xE7, "egrave": 0xE8, "eacute": 0xE9,
    "ecircumflex": 0xEA, "edieresis": 0xEB, "icircumflex": 0xEE, "idieresis": 0xEF, "ocircumflex": 0xF4,
    "odieresis": 0xF6, "ugrave": 0xF9, "ucircumflex": 0xFB, "udieresis": 0xFC, "ydieresis": 0xFF,
    "Agrave": 0xC0, "Acircumflex": 0xC2, "Adieresis": 0xC4, "Ccedilla": 0xC7, "Egrave": 0xC8, "Eacute": 0xC9,
    "Ecircumflex": 0xCA, "Edieresis": 0xCB, "Icircumflex": 0xCE, "Idieresis": 0xCF, "Ocircumflex": 0xD4,
    "Odieresis": 0xD6, "Ugrave": 0xD9, "Ucircumflex": 0xDB, "Udieresis": 0xDC, "Ydieresis": 0x178,
}
for c in "abcdefghijklmnopqrstuvwxyz":
    UNI[c] = ord(c)
for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
    UNI[c] = ord(c)


def sb(kind, S):
    return {"S": 40 + 0.16 * S, "R": 26 + 0.08 * S, "D": 8 + 0.02 * S, "F": 14 + 0.04 * S}[kind]


def to_ttglyph(path):
    path = pathops.simplify(path)
    rec = RecordingPen(); path.draw(rec)
    # sens des contours : TrueType veut les contours extérieurs dans le sens horaire (aire négative)
    ap = AreaPen(); rec.replay(ap)
    tt = TTGlyphPen(None)
    pen = Cu2QuPen(tt, max_err=0.8, reverse_direction=False)
    if ap.value > 0:
        rec.replay(ReverseContourPen(pen))
    else:
        rec.replay(pen)
    return tt.glyph()


def build(weight, style, S):
    g = G(S)
    shapes = {}
    shapes.update(lowercase(g)); shapes.update(uppercase(g)); shapes.update(figures(g)); shapes.update(punctuation(g))
    acc = accents(g)
    # œ et Œ
    o, e = shapes["o"][0], shapes["e"][0]
    shapes["oe"] = (uni(o, move(e, 2 * g.rx - g.S)), "RD")
    O, E = shapes["O"][0], shapes["E"][0]
    rO = bounds(O)[2]
    shapes["OE"] = (uni(O, move(E, rO - g.S)), "RD")
    # placement : on recale chaque forme à x=0 puis on ajoute les approches
    glyphs, metrics = {}, {}
    for name, (path, kinds) in shapes.items():
        b = bounds(path)
        l, r = sb(kinds[0], S), sb(kinds[1], S)
        path = move(path, l - b[0])
        shapes[name] = (path, kinds)
        glyphs[name] = path
        metrics[name] = (round(b[2] - b[0] + l + r), round(l))
    for name, (base, mark) in ACCENTED.items():
        bp = glyphs[base]
        b = bounds(bp)
        cx = (b[0] + b[2]) / 2
        if base in ("dotlessi", "I"):
            cx = b[2] - S / 2
        m = acc[mark]
        if mark == "cedilla":
            path = uni(bp, move(m, cx))
        else:
            dy = (C - X) if base[0].isupper() else 0
            path = uni(bp, move(m, cx, dy))
        glyphs[name] = path
        pb = bounds(path)
        adv, lsb0 = metrics[base]
        rsb = adv - (b[2])
        extra_l = max(0, b[0] - pb[0])
        extra_r = max(0, pb[2] - b[2])
        if extra_l:
            path = move(path, extra_l)
            glyphs[name] = path
        metrics[name] = (round(adv + extra_l + extra_r), round(bounds(path)[0]))
    order = [".notdef", "space", "nbspace", "uni202F"] + [n for n in glyphs]
    tt = {".notdef": to_ttglyph(rect(50, 0, 450, C) if False else diff(rect(50, 0, 450, C), rect(50 + S * 0.5, S * 0.5, 450 - S * 0.5, C - S * 0.5)))}
    for n in ("space", "nbspace", "uni202F"):
        tt[n] = TTGlyphPen(None).glyph()
    for n, p in glyphs.items():
        tt[n] = to_ttglyph(p)
    hm = {".notdef": (500, 50), "space": (round(250 + S * 0.25), 0), "nbspace": (round(250 + S * 0.25), 0), "uni202F": (round(140 + S * 0.15), 0)}
    for n, (adv, lsb) in metrics.items():
        hm[n] = (adv, tt[n].xMin if hasattr(tt[n], "xMin") else lsb)
    cmap = {UNI[n]: n for n in order if n in UNI}

    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(tt)
    for n in order:
        g_ = fb.font["glyf"][n]
        g_.recalcBounds(fb.font["glyf"])
        if g_.numberOfContours:
            hm[n] = (hm[n][0], g_.xMin)
    fb.setupHorizontalMetrics(hm)
    fb.setupHorizontalHeader(ascent=950, descent=-260)
    ribbi = style in ("Regular", "Bold")
    full = "Workyt Sans" if style == "Regular" else f"Workyt Sans {style}"
    fb.setupNameTable({
        "copyright": "Copyright 2026 Workyt",
        "familyName": "Workyt Sans" if ribbi else full,
        "styleName": style if ribbi else "Regular",
        "uniqueFontIdentifier": f"1.000;WRKT;WorkytSans-{style}",
        "fullName": full,
        "version": "Version 0.300",
        "psName": f"WorkytSans-{style}",
        **({} if ribbi else {"typographicFamily": "Workyt Sans", "typographicSubfamily": style}),
    })
    fsSel = 0x20 if style == "Bold" else (0x40 if style == "Regular" else 0)
    fb.setupOS2(sTypoAscender=950, sTypoDescender=-260, sTypoLineGap=0, usWinAscent=1000, usWinDescent=300,
                sxHeight=X, sCapHeight=C, usWeightClass=weight, fsSelection=fsSel | 0x80,
                achVendID="WRKT", version=4)
    fb.setupPost()
    fb.font["head"].macStyle = 1 if style == "Bold" else 0
    os.makedirs(OUT, exist_ok=True)
    fb.save(f"{OUT}/WorkytSans-{style}.ttf")
    fb.font.flavor = "woff2"
    fb.save(f"{OUT}/WorkytSans-{style}.woff2")
    return len(order)


if __name__ == "__main__":
    for w, (s, S) in WEIGHTS.items():
        print(s, build(w, s, S), "glyphes")
