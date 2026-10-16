"""The drawing language, in one place.

Line weights follow Gonzalo's hierarchy (pen weights in pt in his reference):
    1 3/8   section cuts            -> walls and columns cut by the plan: solid black fill
    7/8     outer perimeter, secondary structure (low walls, parapets) -> 'perimeter'
    5/8-3/8 windows, doors, stairs  -> 'line'
    1/8     islands, counters, bathroom fixtures -> 'fixture' (grey, faint)
            closets: the thinnest line of the set -> 'closet'
    1/16    hatches                 -> 'water' (pool) and other light fills

Strokes are 'non-scaling': their width is in screen pixels whatever size the drawing is shown at, so a thin
line stays thin when the image is enlarged and stays visible when it is small. Sub-pixel widths draw as
lighter lines, which is what carries the hierarchy at small sizes.

Elevations: nothing is cut, so nothing is solid black. Outlines in black, cladding and railings in grey,
glass a very light grey, shadows darken what they fall on (a translucent black, like a multiply).
"""

PLAN = {
    'cut':       {'fill': '#000'},
    'perimeter': {'stroke': '#000', 'width': 1.0},
    'line':      {'stroke': '#000', 'width': 0.7},
    'fixture':   {'stroke': '#8c8c8c', 'width': 0.55},
    'closet':    {'stroke': '#b4b4b4', 'width': 0.45},
    'fixfill':   {'fill': '#e4e4e4'},
    'water':     {'fill': '#f0f0f0'},
}
# drawing order, back to front
PLAN_ORDER = ['water', 'fixfill', 'fixture', 'closet', 'line', 'perimeter', 'cut']

ELEVATION = {
    'glass':     {'fill': '#f9f9f9'},
    'frame':     {'fill': '#d8d8d8'},
    'greyfill':  {'fill': '#969696'},
    'grey':      {'stroke': '#969696', 'width': 0.45},
    'shadow':    {'fill': '#000', 'opacity': 0.2},
    'line':      {'stroke': '#000', 'width': 0.6},
    'frameline': {'stroke': '#000', 'width': 0.6},
    'outline':   {'stroke': '#000', 'width': 1.0},
    'ground':    {'stroke': '#000', 'width': 2.0},
}
ELEVATION_ORDER = ['glass', 'frame', 'greyfill', 'grey', 'shadow', 'line', 'frameline', 'outline', 'ground']


def css(style):
    rules = ['path{fill:none;stroke:none;stroke-linecap:round;stroke-linejoin:round;'
             'vector-effect:non-scaling-stroke;fill-rule:evenodd}']
    for name, s in style.items():
        r = []
        if 'fill' in s:
            r.append(f"fill:{s['fill']}")
        if 'opacity' in s:
            r.append(f"fill-opacity:{s['opacity']}")
        if 'stroke' in s:
            r.append(f"stroke:{s['stroke']};stroke-width:{s['width']}px")
        rules.append(f".{name}{{{';'.join(r)}}}")
    return '\n'.join(rules)
