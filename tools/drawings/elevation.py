"""Elevations from CAD layers, drawn in the portfolio's language (see style.py), as one SVG.

Layer roles (named in the project config):
  outline   volume edges inside the building: medium black
  (the silhouette, the one line that wraps the whole building, is found from the outline, line and ground
  layers and drawn heaviest; everything inside it is thinner, by importance: see style.py)
  line      frames, slab edges, bays: thin black (on 'axis_only' layers only horizontal/vertical pieces are kept,
            which drops window-opening diagonals)
  grey      cladding, railings: thin grey (their solid fills become grey fills)
  frame     elements drawn as solid fills in CAD that are not cut here: light grey with an outline
  glass     the window glass hatch: very light grey
  pattern   pattern hatches drawn as their lines in grey (e.g. roof slats)
  shadow    the CAD's shadow hatches: a translucent black that darkens what it falls on
  ground    the ground line (the longest horizontal on that layer): heaviest
Nothing is solid black: an elevation cuts nothing.
"""
import functools
import math

from shapely.geometry import LineString, Polygon, box
from shapely.ops import unary_union

import cadio
import style
from svgout import Sheet


def _hatch_shape(it):
    rings = [Polygon(p).buffer(0) for p in it['paths'] if len(p) >= 3]
    rings = [r for r in rings if not r.is_empty]
    if not rings:
        return None
    return functools.reduce(lambda a, b: a.symmetric_difference(b), rings)   # islands cut out


def _rings(g):
    out = []
    for p in getattr(g, 'geoms', [g]):
        if p.geom_type == 'Polygon' and p.area > 0:
            out.append([list(p.exterior.coords)] + [list(r.coords) for r in p.interiors])
    return out


def silhouette(segs, ground_y=None, gap=0.2):
    """The line that wraps the building: the outer edge of all its lines, taken as one shape.
    CAD lines often stop short of each other (a side wall not closed to the bays beside it, a roof screen
    standing just clear of the parapet), so gaps up to 'gap' (metres) are bridged: every line is thickened
    by half the gap, the outer ring of the result taken, and that ring brought back in by the same amount."""
    r = gap / 2
    lines = unary_union([LineString(q) for q in segs if LineString(q).length > 0])
    if lines.is_empty:
        return None
    blob = lines.buffer(r, join_style=2)
    parts = [g for g in getattr(blob, 'geoms', [blob]) if g.geom_type == 'Polygon']
    u = unary_union([Polygon(g.exterior).buffer(-r, join_style=2) for g in parts])
    if ground_y is not None:                              # nothing below the ground line
        u = u.intersection(box(-1e9, ground_y, 1e9, 1e9))
    parts = [g for g in getattr(u, 'geoms', [u]) if g.geom_type == 'Polygon' and g.area > 0]
    return max(parts, key=lambda g: g.area) if parts else None


def build(cfg, sources):
    L = {k: set(v) if not isinstance(v, str) else {v} for k, v in cfg['layers'].items()}
    for k in ('outline', 'line', 'grey', 'frame', 'glass', 'pattern', 'shadow', 'ground'):
        L.setdefault(k, set())
    used_layers = set().union(*L.values())
    items = [it for it in sources[cfg['source']] if it['layer'] in used_layers and cadio.inside(it, cfg['region'])]
    for lay, b in cfg.get('drop_in_box', []):
        items = [it for it in items if not (it['layer'] == lay and cadio.inside(it, b))]
    short = cfg.get('drop_short_diagonals', 0)

    def segments(it, axis_only=False):
        out = []
        for (ax, ay), (bx, by) in zip(it['pts'], it['pts'][1:]):
            diag = abs(ax - bx) > 0.01 and abs(ay - by) > 0.01
            if diag and (axis_only or math.hypot(bx - ax, by - ay) < short):
                continue
            out.append([(ax, ay), (bx, by)])
        return out

    # fit the drawing on the sheet
    W, H = cfg.get('size', (2000, 2800))
    x0, y0, x1, y1 = cadio.bbox([q for it in items for q in it['pts']])
    S = min(W * 0.86 / (x1 - x0), H * 0.9 / (y1 - y0))
    ox = (W - (x1 - x0) * S) / 2 - x0 * S
    oy = (H - (y1 - y0) * S) / 2 + y1 * S

    def T(x, y):
        return ox + x * S, oy - y * S

    def tp(pts):
        return [T(x, y) for x, y in pts]

    sheet = Sheet(W, H, cfg.get('title', 'Elevation'))
    glass = [s for s in (_hatch_shape(it) for it in items if it['kind'] == 'hatch' and it['layer'] in L['glass']) if s]
    if glass:
        sheet.rings('glass', [[tp(r) for r in rings] for rings in _rings(unary_union(glass))])
    frames = [it for it in items if it['kind'] == 'fill' and it['layer'] in L['frame']]
    sheet.rings('frame', [[tp(p) for p in it['paths']] for it in frames])
    sheet.rings('greyfill', [[tp(p) for p in it['paths']] for it in items if it['kind'] == 'fill' and it['layer'] in L['grey']])
    sheet.lines('grey', [tp(it['pts']) for it in items if it['kind'] == 'line' and it['layer'] in L['grey']])
    sheet.lines('grey', [tp(it['pts']) for it in items if it['kind'] == 'pattern' and it['layer'] in L['pattern']])
    shadows = [s for s in (_hatch_shape(it) for it in items if it['kind'] == 'fill' and it['layer'] in L['shadow']) if s]
    shadows += [Polygon(p) for p in cfg.get('extra_shadows', [])]
    if shadows:
        sheet.rings('shadow', [[tp(r) for r in rings] for rings in _rings(unary_union(shadows))])
    axis_only = set(cfg.get('axis_only', ()))
    for it in items:
        if it['kind'] != 'line':
            continue
        if it['layer'] in L['line']:
            sheet.lines('line', [tp(s) for s in segments(it, it['layer'] in axis_only)])
        elif it['layer'] in L['outline']:
            sheet.lines('outline', [tp(s) for s in segments(it)])
    sheet.lines('frameline', [tp(p + [p[0]]) for it in frames for p in it['paths']])
    ground = None
    for it in items:
        if it['kind'] == 'line' and it['layer'] in L['ground']:
            for (ax, ay), (bx, by) in zip(it['pts'], it['pts'][1:]):
                if abs(ay - by) < 0.01 and (ground is None or abs(bx - ax) > abs(ground[1][0] - ground[0][0])):
                    ground = ((ax, ay), (bx, by))
    if ground:
        sheet.lines('ground', [tp(ground)])
    segs = [s for it in items if it['kind'] == 'line' and it['layer'] in L['outline'] | L['line']
            for s in segments(it, it['layer'] in axis_only)]
    sil = silhouette(segs + ([list(ground)] if ground else []), ground[0][1] if ground else None)
    if sil is not None:
        sheet.lines('bound', [tp(list(sil.exterior.coords))])
    print(f"  elevation: {len(items)} elements, scale {S:.1f} units/m")
    return sheet.render(style.css(style.ELEVATION), style.ELEVATION_ORDER)
