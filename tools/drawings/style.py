"""The drawing language, in one place.

Line weights follow Gonzalo's hierarchy (pen weights in pt in his reference):
    1 3/8   section cuts            -> walls and columns cut by the plan: solid black fill
                                       (or, with 'poche': 'structure', only the structure black and the
                                       other walls a heavy outline, white inside -> 'wall')
    7/8     outer perimeter, secondary structure (low walls, parapets) -> 'perimeter'
    5/8-3/8 windows, doors, stairs  -> 'line'
    1/8     islands, counters, bathroom fixtures -> 'fixture' (grey, faint)
            closets: the thinnest line of the set -> 'closet'
    1/16    hatches                 -> 'water' (pool) and other light fills

Widths are in drawing units and scale with the drawing, like ink on a sheet: one unit is one pixel of the
sheet at full size (plans 3000 wide, elevations 2000 wide), which is the weight the earlier PNG drawings had.
Shown smaller on the page, the lines get finer in proportion, so the hierarchy is the ratio between them.

Elevations: nothing is cut, so nothing is solid black. Outlines in black, cladding and railings in grey,
glass a very light grey, shadows darken what they fall on (a translucent black, like a multiply).
"""

PLAN = {
    'cut':       {'fill': '#000'},
    'wall':      {'fill': '#fff', 'stroke': '#9a9a9a', 'width': 0.8},   # non-structural walls ('poche': 'structure')
    'perimeter': {'stroke': '#000', 'width': 1.4},
    'line':      {'stroke': '#000', 'width': 1.0},          # stairs, steps, pool
    'glass':     {'stroke': '#000', 'width': 0.6},          # windows, curtain walls: the middle lines
    'frame':     {'stroke': '#000', 'width': 0.35},         # windows, curtain walls: the outer edges
    'fixture':   {'stroke': '#b2b2b2', 'width': 0.8},      # grey 178
    'closet':    {'stroke': '#cdcdcd', 'width': 0.6},      # grey 205
    'fixfill':   {'fill': '#e4e4e4'},
    'water':     {'fill': '#f0f0f0'},
}
# drawing order, back to front
PLAN_ORDER = ['water', 'fixfill', 'fixture', 'closet', 'frame', 'glass', 'line', 'perimeter', 'wall', 'cut']

ELEVATION = {
    'glass':     {'fill': '#f9f9f9'},
    'frame':     {'fill': '#d8d8d8'},
    'greyfill':  {'fill': '#969696'},
    'grey':      {'stroke': '#969696', 'width': 1.0},      # grey 150
    'shadow':    {'fill': '#000', 'opacity': 0.2},
    'line':      {'stroke': '#000', 'width': 1.0},
    'frameline': {'stroke': '#000', 'width': 1.0},
    'outline':   {'stroke': '#000', 'width': 2.0},
    'ground':    {'stroke': '#000', 'width': 4.0},
}
ELEVATION_ORDER = ['glass', 'frame', 'greyfill', 'grey', 'shadow', 'line', 'frameline', 'outline', 'ground']


def css(style):
    rules = ['path{fill:none;stroke:none;stroke-linecap:round;stroke-linejoin:round;fill-rule:evenodd}']
    for name, s in style.items():
        r = []
        if 'fill' in s:
            r.append(f"fill:{s['fill']}")
        if 'opacity' in s:
            r.append(f"fill-opacity:{s['opacity']}")
        if 'stroke' in s:
            r.append(f"stroke:{s['stroke']};stroke-width:{s['width']}")
        rules.append(f".{name}{{{';'.join(r)}}}")
    return '\n'.join(rules)
