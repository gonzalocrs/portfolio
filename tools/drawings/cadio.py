"""Reading CAD files: DWG -> DXF through AutoCAD's console, then the DXF flattened into plain geometry.

Every drawable entity becomes a dict:
    layer   the layer it is on (an entity inside a block on layer "0" takes the block's layer)
    kind    'line'    a polyline (lines, arcs, circles, splines... flattened to points)
            'fill'    a solid hatch; 'paths' holds its rings (outer and islands, fill even-odd)
            'hatch'   a pattern hatch's outline (same 'paths')
            'pattern' one line of a pattern hatch (only for layers asked for)
    pts     the points (for hatches: all rings run together; use it for position tests)
    closed  for lines: whether it is a closed outline
    type    the DXF entity type; arcs also carry center, r, a0, a1 (degrees)
"""
import glob
import hashlib
import os
import shutil
import subprocess
import tempfile

import ezdxf
from ezdxf import path as ezpath

SKIP = {'TEXT', 'MTEXT', 'DIMENSION', 'MULTILEADER', 'LEADER', 'ATTRIB', 'ATTDEF', 'POINT', 'VIEWPORT'}


def find_accoreconsole():
    hits = sorted(glob.glob(r'C:\Program Files\Autodesk\AutoCAD *\accoreconsole.exe'), reverse=True)
    return hits[0] if hits else None


def to_dxf(path, cache_dir):
    """A DXF for this file: itself if it already is one, else an export of the DWG (cached by size and date)."""
    if path.lower().endswith('.dxf'):
        return path
    os.makedirs(cache_dir, exist_ok=True)
    st = os.stat(path)
    key = hashlib.sha1(f'{os.path.abspath(path)}|{st.st_size}|{st.st_mtime_ns}'.encode()).hexdigest()[:12]
    out = os.path.join(cache_dir, f'{os.path.splitext(os.path.basename(path))[0][:40]}-{key}.dxf')
    if os.path.exists(out):
        return out
    exe = find_accoreconsole()
    if not exe:
        raise SystemExit(f'AutoCAD is not installed here, so {path} cannot be converted. Open it in AutoCAD and '
                         f'Save As > AutoCAD DXF, then point the project file at the .dxf.')
    work = tempfile.mkdtemp(dir=cache_dir)
    src = os.path.join(work, 'in.dwg')
    dst = os.path.join(work, 'out.dxf')
    shutil.copy2(path, src)                                  # work on a copy: the original is never opened
    scr = os.path.join(work, 'export.scr')
    with open(scr, 'w', newline='') as f:
        f.write('FILEDIA\r\n0\r\n_.DXFOUT\r\n"' + dst + '"\r\n16\r\n_.QUIT\r\nY\r\n')
    print(f'converting {os.path.basename(path)} to DXF with AutoCAD...')
    subprocess.run([exe, '/i', src, '/s', scr, '/l', 'en-US'], stdout=subprocess.DEVNULL,
                   stderr=subprocess.DEVNULL, timeout=900)
    if not os.path.exists(dst):
        raise SystemExit(f'AutoCAD did not export {path}.')
    shutil.move(dst, out)
    shutil.rmtree(work, ignore_errors=True)
    return out


def _flatten(e, layer, out, pattern_layers, depth=0):
    t = e.dxftype()
    lay = e.dxf.layer if e.dxf.hasattr('layer') else '0'
    if lay == '0' and layer is not None:
        lay = layer
    if t in SKIP:
        return
    if t == 'INSERT':
        if depth < 8:
            try:
                for v in e.virtual_entities():
                    _flatten(v, lay, out, pattern_layers, depth + 1)
            except Exception:
                pass
        return
    if t == 'HATCH':
        try:
            solid = bool(e.dxf.solid_fill)
            paths = [[(v.x, v.y) for v in p.flattening(0.005)] for p in ezpath.from_hatch(e)]
            paths = [p for p in paths if len(p) >= 3]
            if paths:
                out.append({'layer': lay, 'type': t, 'kind': 'fill' if solid else 'hatch', 'paths': paths,
                            'pts': [q for p in paths for q in p], 'closed': True})
            if not solid and lay in pattern_layers:
                from ezdxf.render import hatching
                for a, b in hatching.hatch_entity(e):
                    out.append({'layer': lay, 'type': t, 'kind': 'pattern', 'pts': [(a.x, a.y), (b.x, b.y)],
                                'closed': False})
        except Exception:
            pass
        return
    rec = {'layer': lay, 'type': t}
    if t == 'ARC':
        c = e.dxf.center
        rec.update(center=(c.x, c.y), r=e.dxf.radius, a0=e.dxf.start_angle, a1=e.dxf.end_angle)
    try:
        p = ezpath.make_path(e)
    except Exception:
        return
    closed = (t == 'LWPOLYLINE' and e.closed) or (t == 'POLYLINE' and e.is_closed) or t in ('CIRCLE', 'ELLIPSE')
    for sub in p.sub_paths():
        pts = [(v.x, v.y) for v in sub.flattening(0.005)]
        if len(pts) >= 2:
            out.append(dict(rec, kind='line', pts=pts, closed=closed))


def load(dxf_path, pattern_layers=()):
    doc = ezdxf.readfile(dxf_path)
    out = []
    for e in doc.modelspace():
        _flatten(e, None, out, set(pattern_layers))
    return out


def bbox(pts):
    xs = [x for x, _ in pts]
    ys = [y for _, y in pts]
    return min(xs), min(ys), max(xs), max(ys)


def inside(it, b):
    """All of the item within the box (x0, y0, x1, y1)."""
    return all(b[0] <= x <= b[2] and b[1] <= y <= b[3] for x, y in it['pts'])


def shifted(it, dx, dy):
    """A copy of the item moved by (dx, dy)."""
    out = dict(it, pts=[(x + dx, y + dy) for x, y in it['pts']])
    if 'paths' in it:
        out['paths'] = [[(x + dx, y + dy) for x, y in p] for p in it['paths']]
    if 'center' in it:
        out['center'] = (it['center'][0] + dx, it['center'][1] + dy)
    return out
