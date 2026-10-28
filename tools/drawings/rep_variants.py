"""Representation-style trials: restyle the built Sierra SVGs without touching the CAD.

    python tools/drawings/rep_variants.py

Reads public/img/sierra-hotel/{elevation,floor-plans}.svg and writes one copy per style to
public/img/sierra-hotel/rep/<style>-<drawing>.svg. Each style appends CSS after the drawing's own (so it
overrides it) and may add a few elements (cast shadows, hatches, a ground band). Preview only.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'public/img/sierra-hotel'
OUT = SRC / 'rep'

# hatches in sheet units (the drawings show at ~0.35-0.5 of the sheet, so 1.2 units is about half a pixel)
DEFS = '''<defs>
<pattern id="h45" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V9" style="stroke:#000;stroke-width:1.3;vector-effect:none"/></pattern>
<pattern id="h45f" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V10" style="stroke:#000;stroke-width:1.6;vector-effect:none"/></pattern>
<pattern id="horiz" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0H8" style="stroke:#8a8a8a;stroke-width:1.2;vector-effect:none"/></pattern>
<pattern id="vert" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 0V7" style="stroke:#9a9a9a;stroke-width:1;vector-effect:none"/></pattern>
<pattern id="earth" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><path d="M0 0V16" style="stroke:#333;stroke-width:1.8;vector-effect:none"/></pattern>
<pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="#8f8f8f"/><circle cx="7" cy="7" r="1.1" fill="#8f8f8f"/></pattern>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0"/></filter>
</defs>'''

STYLES = {
    # flat tones, cast shadows: drawings read as objects in light
    'tone': {
        'elevation': '''
.mass{fill:#efede8}
.glass{fill:#5d6164}
.frame{fill:#f7f6f3}
.greyfill{fill:#b9b6b0}
.shadow{fill:#000;fill-opacity:.24}
.frameline{stroke:#555}
.grey{stroke:#a9a6a0}
.band{fill:#d9d6cf}''',
        'plans': '''
.cut{fill:#111}
.floor{fill:#efede8}
.wall{fill:#8c8c8c;stroke:#6a6a6a}
.drop{fill:#000;fill-opacity:.16}
.water{fill:#c6cbce}
.fixfill{fill:#ececec}''',
        'band': True, 'drop': True, 'floor': True,
    },
    # line only: no fills at all, hierarchy by width alone
    'line': {
        'elevation': '''
.glass,.frame,.greyfill,.shadow{fill:none}
.glass{stroke:#bdbdbd;stroke-width:.5}
.frame{stroke:#9a9a9a;stroke-width:.5}
.greyfill{stroke:#888;stroke-width:.5}
.frameline{stroke:#777}
.grey{stroke:#c4c4c4}
.line{stroke:#444}
.outline{stroke:#111;stroke-width:.7}
.bound{stroke:#000;stroke-width:1.1}''',
        'plans': '''
.cut{fill:#fff;stroke:#000;stroke-width:1}
.wall{fill:#fff;stroke:#555;stroke-width:.5}
.water,.fixfill{fill:none}''',
    },
    # engraving: shadows, glass and cuts carried by hatching instead of grey fills
    'hatch': {
        'elevation': '''
.glass{fill:url(#horiz)}
.frame{fill:#fff}
.greyfill{fill:url(#dots)}
.shadow{fill:url(#h45f);fill-opacity:1}
.grey{stroke:#9d9d9d}
.band{fill:url(#earth)}''',
        'plans': '''
.cut{fill:url(#h45);stroke:#000;stroke-width:.8}
.wall{fill:#fff;stroke:#444}
.water{fill:url(#vert)}
.fixfill{fill:none}''',
        'band': True,
    },
    # muted material colour on a paper ground (no accent colours: stone, clay, slate)
    'material': {
        'elevation': '''
.paper{fill:#f3efe7}
.mass{fill:#e4dccd}
.glass{fill:#8e9a9f}
.frame{fill:#3b3a38}
.greyfill{fill:#b48f72}
.shadow{fill:#3a2a1c;fill-opacity:.22}
.grey{stroke:#9b8e7c}
.frameline{stroke:#3b3a38}
.band{fill:#cbbfa9}''',
        'plans': '''
.paper{fill:#f3efe7}
.cut{fill:#2e2c29}
.floor{fill:#e9e2d4}
.wall{fill:#cfc6b6;stroke:#8f8677}
.drop{fill:#3a2a1c;fill-opacity:.12}
.water{fill:#a9b9bd}
.fixfill{fill:#e7e0d3}''',
        'band': True, 'drop': True, 'grain': True, 'floor': True,
    },
}


def path_d(svg, cls):
    m = re.search(r'<path class="%s" d="([^"]*)"' % cls, svg)
    return m.group(1) if m else None


def footprints(svg):
    """One box per floor: the walls' points, split into floors where the sheet has a gap."""
    nums = [float(n) for c in ('wall', 'cut') for n in re.findall(r'-?[\d.]+', path_d(svg, c) or '')]
    pts = sorted(zip(nums[0::2], nums[1::2]))
    boxes = [[pts[0]]]
    for pt in pts[1:]:
        (boxes[-1] if pt[0] - boxes[-1][-1][0] < 60 else boxes.append([pt]) or boxes[-1]).append(pt)
    return [(min(x for x, _ in b), min(y for _, y in b), max(x for x, _ in b), max(y for _, y in b)) for b in boxes]


def restyle(svg, kind, style, opts):
    svg = svg.replace('</style>', style + '\n</style>\n' + DEFS, 1)
    svg = svg.replace('<rect width=', '<rect class="paper" width=', 1)
    if kind == 'elevation':
        # building mass behind everything (the silhouette, filled); ground band under the ground line
        bound = path_d(svg, 'bound')
        svg = re.sub(r'(<rect class="paper"[^>]*/>)', r'\1\n<path class="mass" d="%s"/>' % bound, svg, count=1)
        if opts.get('band'):
            g = re.search(r'<path class="ground" d="M([\d.]+) ([\d.]+)L([\d.]+)', svg)
            x0, y, x1 = map(float, g.groups())
            svg = svg.replace('<path class="ground"', '<path class="band" d="M%s %sH%sV%sH%sZ" style="stroke:none"/>\n<path class="ground"'
                              % (x0, y, x1, y + 70, x0), 1)
    else:
        if opts.get('drop'):
            # a soft cast shadow, down-right, under the walls and structure
            shadows = ''.join('<path class="drop" transform="translate(9 9)" d="%s"/>\n' % path_d(svg, c)
                              for c in ('wall', 'cut') if path_d(svg, c))
            svg = re.sub(r'(<rect class="paper"[^>]*/>\n)', lambda m: m.group(1) + shadows, svg, count=1)
        if opts.get('floor'):
            # each floor's footprint (inserted last, so it lies under the shadows) as a flat floor tone, so the plan reads as figure on ground
            floors = ''.join('<path class="floor" d="M%.1f %.1fH%.1fV%.1fH%.1fZ"/>\n' % (x0, y0, x1, y1, x0)
                             for x0, y0, x1, y1 in footprints(svg))
            svg = re.sub(r'(<rect class="paper"[^>]*/>\n)', lambda m: m.group(1) + floors, svg, count=1)
    if opts.get('grain'):
        svg = svg.replace('</svg>', '<rect width="100%" height="100%" filter="url(#grain)"/>\n</svg>')
    return svg


def main():
    OUT.mkdir(exist_ok=True)
    for name, opts in STYLES.items():
        for kind, file in (('elevation', 'elevation.svg'), ('plans', 'floor-plans.svg')):
            svg = (SRC / file).read_text()
            out = OUT / ('%s-%s' % (name, file))
            out.write_text(restyle(svg, kind, opts[kind], opts))
            print('wrote', out.relative_to(ROOT))


if __name__ == '__main__':
    main()
