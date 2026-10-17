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

Widths are in screen pixels and do not scale with the drawing (vector-effect: non-scaling-stroke). The drawings
are shown at about 0.4 of their sheet size on the site, where lines that scaled with the sheet came out thinner
than a pixel and rendered uneven (some faded, slanted ones dashed). Now every line is at least one pixel wherever
it is shown, and the hierarchy is carried by grey value: the more important a line, the darker (and the
heaviest ones wider).

Elevations: nothing is cut, so nothing is solid black. The silhouette (the line that wraps the building) and the
ground line are heaviest; inside it the lines get thinner by importance: volume edges, then slab edges and openings,
then window frames, then cladding and railings in grey,
glass a very light grey, shadows darken what they fall on (a translucent black, like a multiply).
"""

PLAN = {
    'cut':       {'fill': '#000'},
    'wall':      {'fill': '#fff', 'stroke': '#8c8c8c', 'width': 1},   # non-structural walls ('poche': 'structure')
    'perimeter': {'stroke': '#222', 'width': 1},            # low walls, parapets
    'line':      {'stroke': '#555', 'width': 1},            # stairs, steps, pool
    'glass':     {'stroke': '#8c8c8c', 'width': 1},         # windows, curtain walls: the middle lines
    'frame':     {'stroke': '#ababab', 'width': 1},         # windows, curtain walls: the outer edges
    'fixture':   {'stroke': '#c8c8c8', 'width': 1},         # bathroom fixtures, counters
    'closet':    {'stroke': '#dcdcdc', 'width': 1},         # closets: faintest
    'fixfill':   {'fill': '#e4e4e4'},
    'water':     {'fill': '#f0f0f0'},
}
# drawing order, back to front
PLAN_ORDER = ['water', 'fixfill', 'fixture', 'closet', 'frame', 'glass', 'line', 'perimeter', 'wall', 'cut']

ELEVATION = {
    'glass':     {'fill': '#f9f9f9'},
    'frame':     {'fill': '#d8d8d8'},
    'greyfill':  {'fill': '#969696'},
    'grey':      {'stroke': '#c4c4c4', 'width': 1},         # cladding slats, railings: faintest
    'shadow':    {'fill': '#000', 'opacity': 0.2},
    'frameline': {'stroke': '#888', 'width': 1},            # window and door frames
    'line':      {'stroke': '#555', 'width': 1},            # slab edges, bays, openings
    'outline':   {'stroke': '#222', 'width': 1},            # volume edges inside the building
    'bound':     {'stroke': '#000', 'width': 2},            # the silhouette: the one line that wraps the building
    'ground':    {'stroke': '#000', 'width': 2},
}
ELEVATION_ORDER = ['glass', 'frame', 'greyfill', 'grey', 'shadow', 'frameline', 'line', 'outline', 'ground', 'bound']


def css(style):
    rules = ['path{fill:none;stroke:none;stroke-linecap:round;stroke-linejoin:round;fill-rule:evenodd;'
             'vector-effect:non-scaling-stroke}']
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
