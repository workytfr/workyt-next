"""Extrait les lettres du logo (public/workyt-logo-26.svg) en coordonnées absolues."""
import re, json, xml.etree.ElementTree as ET
from fontTools.svgLib.path import parse_path
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.misc.transform import Transform

SVG = "../../public/workyt-logo-26.svg"
ns = "{http://www.w3.org/2000/svg}"

def mat(el):
    t = el.get("transform")
    if not t: return Transform()
    a = [float(v) for v in re.findall(r"[-\d.e]+", t)]
    return Transform(*a)

out = []
def walk(el, T):
    T = T.transform(mat(el)) if False else T
    T2 = T.transform(mat(el))
    for ch in el:
        if ch.tag == ns + "path":
            r = RecordingPen()
            parse_path(ch.get("d"), TransformPen(r, T2.transform(mat(ch))))
            b = BoundsPen(None); r.replay(b)
            out.append({"bounds": b.bounds, "fill": ch.get("style", ""), "rec": r.value})
        else:
            walk(ch, T2)

walk(ET.parse(SVG).getroot(), Transform())
for i, o in enumerate(out):
    print(i, [round(v) for v in o["bounds"]], o["fill"][:30])
json.dump([{"bounds": o["bounds"], "fill": o["fill"], "rec": [[op, [list(p) for p in args]] for op, args in o["rec"]]} for o in out],
          open("logo/paths.json", "w"))
