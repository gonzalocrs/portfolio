"""Floor plans from CAD layers, drawn in the portfolio's language (see style.py), as one SVG sheet.

What it does with each kind of layer (named in the project config):
  wall, column   cut: filled solid. Closed outlines, faces between parallel lines, and parallel pairs of lines
                 a wall's thickness apart all become solid; small square pieces where walls meet windows too.
  window         thin black lines (the CAD window blocks).
  stair          thin black lines, with walk lines, their dots, arrows and start marks taken out.
  door           not drawn: the gap in the wall reads as the door.
  fixture        bathroom fixtures, counters and islands: faint grey.
  closet         the faintest line (usually brought in from another file, see 'imports').
  everything else (furniture, appliances, axes, labels, plants, void symbols) is left out.
"""
import math

from shapely.geometry import LineString, Polygon, box, Point
from shapely.ops import unary_union, polygonize

import cadio
import style
from svgout import Sheet

CATS = ('wall', 'col', 'win', 'door', 'stair', 'extra', 'pool', 'fills', 'fix', 'fixfill', 'closet')


def _centre(pts):
    x0, y0, x1, y1 = cadio.bbox(pts)
    return Point((x0 + x1) / 2, (y0 + y1) / 2)


def _size(it):
    x0, y0, x1, y1 = cadio.bbox(it['pts'])
    return max(x1 - x0, y1 - y0)


def _elongation(g):
    xs, ys = g.minimum_rotated_rectangle.exterior.coords.xy
    e = sorted(math.hypot(xs[i + 1] - xs[i], ys[i + 1] - ys[i]) for i in range(2))
    return e[0], e[1]


def classify(items, cfg):
    regions = [box(*r) for r in cfg['regions']]
    L = {k: set(v) for k, v in cfg['layers'].items()}
    for k in ('wall', 'column', 'window', 'door', 'stair', 'fixture'):
        L.setdefault(k, set())
    per = [{k: [] for k in CATS} for _ in regions]
    for it in items:
        c = _centre(it['pts'])
        pi = next((i for i, b in enumerate(regions) if b.contains(c)), None)
        if pi is None:
            continue
        P, lay = per[pi], it['layer']
        fixl = L['fixture'] | set(cfg.get('layers_by_plan', {}).get(pi, {}).get('fixture', ()))
        if it['kind'] == 'fill':
            if lay in L['wall'] | L['column'] | L['stair']:
                P['fills'].append(it)
            elif lay in fixl:
                P['fixfill'].append(it)
            continue
        if it['kind'] != 'line':
            continue
        extra = cfg.get('extra_lines', {}).get(pi)
        pool = cfg.get('pool', {}).get(pi)
        if lay in L['wall']:
            P['wall'].append(it)
        elif lay in L['column']:
            P['col'].append(it)
        elif lay in L['window']:
            P['win'].append(it)
        elif lay in L['door']:
            P['door'].append(it)
        elif lay in L['stair']:
            P['stair'].append(it)
        elif extra and lay in extra[0] and box(*extra[1]).contains(Point(*it['pts'][0])):
            P['extra'].append(it)
        elif pool and lay in pool[0] and cadio.inside(it, pool[1]):
            P['pool'].append(it)
        elif lay in fixl:
            P['fix'].append(it)
    return per


def apply_edits(per, cfg, sources):
    # things no longer in the project
    for pi, boxes in cfg.get('drop', {}).items():
        for k in per[pi]:
            per[pi][k] = [it for it in per[pi][k] if not any(cadio.inside(it, b) for b in boxes)]
    for pi, boxes in cfg.get('cut_solids', {}).items():
        per[pi]['cut_solids'] = [box(*b) for b in boxes]
    # a part of the plan replaced by another drawing of it (e.g. an approved version of the entrance)
    for sp in cfg.get('splices', []):
        P = per[sp['plan']]
        zone = box(*sp['zone'])
        a, b = sp.get('keep_side_walls', (-1e9, 1e9))

        def side_wall(it):
            x0, _, x1, _ = cadio.bbox(it['pts'])
            return x1 < a or x0 > b
        for k in CATS:
            P[k] = [it for it in P[k] if (k in ('col', 'wall', 'fills') and side_wall(it))
                    or not all(zone.contains(Point(*q)) for q in it['pts'])]
        P['door'] = [it for it in P['door'] if not ('center' in it and zone.contains(Point(*it['center'])))]
        P.setdefault('extra_solids', []).extend(box(*e) for e in sp.get('extra_solids', []))
        dx, dy = sp['shift']
        for it in sources[sp['source']]:
            cat = sp['map'].get(it['layer'])
            if cat is None or not cadio.inside(it, sp['source_zone']):
                continue
            if _size(it) < sp.get('small_on_layer', {}).get(it['layer'], 0):
                continue
            it = cadio.shifted(it, dx, dy)
            if it['kind'] == 'fill':
                P['fills'].append(it)
            elif it['kind'] != 'line':
                continue
            elif cat == 'door' and it.get('type') != 'ARC':
                P['win'].append(it)                       # glazing drawn on a door layer
            else:
                P[cat].append(it)
    # elements brought in from another file (e.g. closets drawn only in a partial plan)
    for im in cfg.get('imports', []):
        dx, dy = im['shift']
        for it in sources[im['source']]:
            if it['kind'] == 'line' and it['layer'] in im['layers'] and im['select'](it):
                per[im['plan']][im['category']].append(cadio.shifted(it, dx, dy))


def strip_walklines(P, stair_layers):
    """Stairs keep treads, risers and stringers; the walk line, its dots, arrow and marks go."""
    for key in ('stair', 'extra', 'pool'):
        geoms = [LineString(it['pts']) for it in P[key]]

        def mid_crossings(i):
            # a walk line cuts the treads near their middle; treads, risers, stringers meet at their ends
            g, n = geoms[i], 0
            for j, h in enumerate(geoms):
                if j == i or h.length == 0 or not g.crosses(h):
                    continue
                q = g.intersection(h)
                q = q if q.geom_type == 'Point' else q.centroid
                if 0.15 < h.project(q) / h.length < 0.85:
                    n += 1
            return n
        walk = {i for i, g in enumerate(geoms) if g.length >= 0.5 and mid_crossings(i) >= 4}
        grew = True
        while grew and walk:                              # its first leg, arrowheads, ticks
            grew = False
            wz = unary_union([geoms[i] for i in walk]).buffer(0.03)
            for i, g in enumerate(geoms):
                if i in walk or g.length >= 0.6 or not g.intersects(wz) or mid_crossings(i):
                    continue
                if not any(g.touches(geoms[j]) or g.distance(geoms[j]) < 0.005 for j in range(len(geoms))
                           if j not in walk and j != i and g.hausdorff_distance(geoms[j]) > 0.005):
                    walk.add(i)
                    grew = True
        kept = [i for i in range(len(geoms)) if i not in walk]
        lone = {i for i in kept if geoms[i].length < 0.35       # stray marks touching nothing (CAD has duplicates)
                and all(geoms[i].distance(geoms[j]) > 0.03 for j in kept
                        if j != i and geoms[i].hausdorff_distance(geoms[j]) > 0.005)}
        P[key] = [it for i, it in enumerate(P[key]) if i not in walk and i not in lone]
    P['fills'] = [it for it in P['fills'] if not (it['layer'] in stair_layers and Polygon(it['pts']).area < 0.05)]


def solids(P, cfg):
    wall_layers = set(cfg['layers']['wall'])
    wall_max = cfg.get('wall_max', 0.32)
    lines = P['wall'] + P['col']
    polys = []
    for it in lines:                                      # closed outlines
        if it['closed'] and len(it['pts']) >= 3:
            g = Polygon(it['pts'])
            if not (g.is_valid and g.area > 0):
                continue
            if it['layer'] in wall_layers:
                a, b = _elongation(g)
                if b < 3 * a:
                    continue                              # a closed box on the wall layer: a curb, not a wall
            polys.append(g)
    segs = [LineString(it['pts']) for it in lines if LineString(it['pts']).length > 0]
    for f in polygonize(unary_union(segs)):               # faces as thin as a wall
        if f.area <= 0 or 2 * f.area / f.length > wall_max:
            continue
        a, b = _elongation(f)
        if b >= 2.5 * a or f.area < 0.05:
            polys.append(f)
    csegs = [LineString(it['pts']) for it in P['col'] if LineString(it['pts']).length > 0]
    for f in polygonize(unary_union(csegs)):              # column sections
        if 0 < f.area < 0.6:
            polys.append(f)
    hz, vt = [], []                                       # parallel pairs whose ends are open
    for s in segs:
        cs = list(s.coords)
        for (ax, ay), (bx, by) in zip(cs, cs[1:]):
            if abs(ay - by) < 0.012 and abs(ax - bx) >= 0.08:
                hz.append(((ay + by) / 2, min(ax, bx), max(ax, bx)))
            elif abs(ax - bx) < 0.012 and abs(ay - by) >= 0.08:
                vt.append(((ax + bx) / 2, min(ay, by), max(ay, by)))
    strips = []
    for lines_, horiz in ((hz, True), (vt, False)):
        lines_.sort()
        for i, (c1, a1, b1) in enumerate(lines_):
            for c2, a2, b2 in lines_[i + 1:]:
                if c2 - c1 > wall_max:
                    break
                if c2 - c1 < 0.03:
                    continue
                lo, hi = max(a1, a2), min(b1, b2)
                if hi - lo >= 0.08:
                    strips.append((box(lo, c1, hi, c2) if horiz else box(c1, lo, c2, hi), horiz, c2 - c1))
    polys += [s for s, _, _ in strips]
    polys += P.get('extra_solids', [])
    sol = unary_union([p.buffer(0.004, join_style=2) for p in polys])
    # strips stop short of corners: carry each across its end, by its own thickness, where it runs into
    # another solid (this fills the small notches at outer corners)
    ends = []
    for s, horiz, t in strips:
        x0, y0, x1, y1 = s.bounds
        cand = ([box(x0 - t - 0.01, y0, x0, y1), box(x1, y0, x1 + t + 0.01, y1)] if horiz else
                [box(x0, y0 - t - 0.01, x1, y0), box(x0, y1, x1, y1 + t + 0.01)])
        others = sol.difference(s.buffer(0.005, join_style=2))
        for e in cand:
            if others.intersection(e).area > 0.2 * e.area:
                ends.append(e)
    if ends:
        sol = unary_union([sol] + ends)
    sol = sol.buffer(0.03, join_style=2).buffer(-0.03, join_style=2)   # close slivers under 6 cm
    # small square pieces where walls meet windows or each other (jambs, corner boxes): solid as well
    # (the pieces are often closed partly by drawn lines and partly by the edges of the solid strips)
    allseg = segs + [LineString(it['pts']) for it in P['win'] if LineString(it['pts']).length > 0]
    allseg.append(sol.boundary)
    near = sol.buffer(0.01)
    extra = []
    for f in polygonize(unary_union(allseg)):
        if 0 < f.area < 0.12 and f.intersects(near):
            a, b = _elongation(f)
            if b < 0.35 and b < 3 * a:
                extra.append(f.buffer(0.004, join_style=2))
    if extra:
        sol = unary_union([sol] + extra)
    for c in P.get('cut_solids', []):
        sol = sol.difference(c)
    return sol


def window_weights(items):
    """Split window lines into glass (the middle lines of a window) and frame (its outer edges).
    A window or curtain wall is drawn as several parallel lines a few centimetres apart: the outermost two
    of each group are the frame, the ones between are the glass. Lone or diagonal lines count as glass."""
    segs, seen = [], set()
    for it in items:
        for a, b in zip(it['pts'], it['pts'][1:]):
            k = tuple(sorted(((round(a[0], 3), round(a[1], 3)), (round(b[0], 3), round(b[1], 3)))))
            if k not in seen:                             # the CAD repeats some lines: drawn twice they read heavier
                seen.add(k)
                segs.append((a, b))
    groups = {'h': [], 'v': []}
    other = []
    for (ax, ay), (bx, by) in segs:
        if abs(ay - by) < 0.005 and abs(ax - bx) > 0.05:
            groups['h'].append(((ay + by) / 2, min(ax, bx), max(ax, bx)))
        elif abs(ax - bx) < 0.005 and abs(ay - by) > 0.05:
            groups['v'].append(((ax + bx) / 2, min(ay, by), max(ay, by)))
        else:
            other.append([(ax, ay), (bx, by)])
    glass, frame = list(other), []
    for orient, lines in groups.items():
        lines.sort()
        used = [False] * len(lines)
        for i in range(len(lines)):
            if used[i]:
                continue
            # this line and every parallel line within 30 cm that overlaps it along most of its length
            grp = [i]
            for j in range(i + 1, len(lines)):
                if lines[j][0] - lines[i][0] > 0.30:
                    break
                lo, hi = max(lines[i][1], lines[j][1]), min(lines[i][2], lines[j][2])
                if not used[j] and hi - lo > 0.5 * min(lines[i][2] - lines[i][1], lines[j][2] - lines[j][1]):
                    grp.append(j)
            for j in grp:
                used[j] = True
            grp.sort(key=lambda j: lines[j][0])
            for n, j in enumerate(grp):
                c, a, b = lines[j]
                seg = [(a, c), (b, c)] if orient == 'h' else [(c, a), (c, b)]
                (frame if len(grp) >= 3 and n in (0, len(grp) - 1) else glass).append(seg)
    return glass, frame


def _rings(g):
    out = []
    for p in getattr(g, 'geoms', [g]):
        if p.geom_type == 'Polygon' and p.area > 0:
            out.append([list(p.exterior.coords)] + [list(r.coords) for r in p.interiors])
    return out


def build(cfg, sources):
    items = sources[cfg['source']]
    per = classify(items, cfg)
    apply_edits(per, cfg, sources)
    small = cfg.get('small_on_layer', {})
    for P in per:
        strip_walklines(P, set(cfg['layers']['stair']))
        P['win'] = [it for it in P['win'] if _size(it) >= small.get(it['layer'], 0)]

    # layout: the plans side by side at one scale, tops aligned, centred on the sheet
    W, H = cfg.get('sheet', (3000, 1500))
    bbs = []
    for P in per:
        pts = [q for k in ('wall', 'col', 'win', 'stair', 'extra') for it in P[k] for q in it['pts']]
        bbs.append(cadio.bbox(pts))
    Hm = max(b[3] - b[1] for b in bbs)
    S = cfg.get('plan_height', 1300) / Hm
    gap = cfg.get('gap', 200)
    x_at = (W - (sum((b[2] - b[0]) * S for b in bbs) + gap * (len(bbs) - 1))) / 2
    top = (H - Hm * S) / 2
    sheet = Sheet(W, H, cfg.get('title', 'Floor plans'))
    for pi, P in enumerate(per):
        b = bbs[pi]
        ox = x_at - b[0] * S
        x_at += (b[2] - b[0]) * S + gap

        def T(x, y, ox=ox, b=b):
            return ox + x * S, top + (b[3] - y) * S

        def tl(items_):
            out, seen = [], set()
            for it in items_:
                k = tuple(sorted([tuple(round(v, 3) for v in it['pts'][0]), tuple(round(v, 3) for v in it['pts'][-1])])) + (len(it['pts']),)
                if k in seen:
                    continue                              # duplicate line in the CAD
                seen.add(k)
                out.append([T(x, y) for x, y in it['pts']])
            return out

        if P['pool']:                                     # pool water: the smallest closed ring of the pool
            pl = [Polygon(it['pts']) for it in P['pool'] if it['closed'] and len(it['pts']) >= 3]
            pl = [g for g in pl if g.is_valid and g.area > 0]
            if pl:
                water = min([g for g in pl if g.area > 4] or pl, key=lambda g: g.area)
                sheet.rings('water', [[[T(x, y) for x, y in water.exterior.coords]]])
        sheet.rings('fixfill', [[[T(x, y) for x, y in p] for p in it.get('paths', [it['pts']])] for it in P['fixfill']])
        sheet.lines('fixture', tl(P['fix']))
        sheet.lines('closet', tl(P['closet']))
        glass, frame = window_weights(P['win'])
        sheet.lines('glass', [[T(x, y) for x, y in s] for s in glass])
        sheet.lines('frame', [[T(x, y) for x, y in s] for s in frame])
        sheet.lines('line', tl(P['stair'] + P['extra'] + P['pool']))
        sheet.lines('perimeter', tl(P['wall']))           # wall-layer lines left uncovered: low walls, parapets
        sheet.rings('cut', [[[T(x, y) for x, y in p] for p in it.get('paths', [it['pts']])] for it in P['fills']])
        sol = solids(P, cfg)
        sheet.rings('cut', [[[T(x, y) for x, y in r] for r in rings] for rings in _rings(sol)])
        print(f"  plan {pi + 1}: walls {len(P['wall'])}, columns {len(P['col'])}, windows {len(P['win'])}, "
              f"stairs {len(P['stair'])}, fixtures {len(P['fix'])}, closets {len(P['closet'])}")
    return sheet.render(style.css(style.PLAN), style.PLAN_ORDER)
