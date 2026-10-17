"""Sierra Hotel (Cusco, 2023): floor plans and front elevation.

Coordinates are CAD model space, in metres. Every hand edit says why it is there.
"""
DRAWINGS = r'D:\Google Drive\Personal\Career\Architecture Career\Portfolio\Projects\1. BUILT\Sierra Hotel\Drawings\Unedited'

PROJECT = {
    'slug': 'sierra-hotel',
    'sources': {
        'main': DRAWINGS + r'\ARQUITECTURA DEFINITIVA PARQUE 2024.dwg',
        'facade': DRAWINGS + r'\Hotel Cusco -Fachada aprobada.dwg',
    },

    'plans': {
        'output': 'floor-plans.svg',
        'title': 'Sierra Hotel: ground, typical and top floor plans',
        'source': 'main',
        'poche': 'structure',          # only the structure solid black; the other walls outlined, white inside
        'align': 'model',              # floors on one grid: the columns line up across the sheet
        'scale': 45,                   # sheet units per metre: each floor about 500 wide on the 3000 x 1500 sheet
        'gap': 250,                    # (as in floor-plans-3.webp, Gonzalo's own export)
        # ground floor, typical floor, top floor with the pool (left to right on the sheet)
        'regions': [(33.5, 15.5, 46.5, 43.0), (58.5, 17.5, 71.5, 43.5), (76.0, 17.5, 88.5, 43.5)],
        'layers': {
            'wall': ['ARQ MURO 470', '470', '01MURO', '08MURO'],
            'column': ['ARQ- COLUMNAS'],
            'window': ['ARQ ventanas', '01VENT'],
            'door': ['ARQ PUERTA', 'ARQ-PUERTAS'],
            'stair': ['arq gradas'],
            # bathroom fixtures only: the kitchen's bought-in appliances (Z-sanitarios, Z-FURN) are left out
            'fixture': ['ARQ SANITARIOS'],
        },
        'layers_by_plan': {2: {'fixture': ['ARQ- MUEBLES']}},       # top floor: kitchen counters, island, bench
        'extra_lines': {0: (['3'], (33.5, 15.5, 46.5, 19.5))},      # ground floor: entrance steps (layer 3)
        'pool': {2: (['ARQ SANITARIOS'], (79.5, 37.75, 85.4, 42.3))},   # the pool and the L of steps up to it
        'small_on_layer': {'01VENT': 0.3},                           # ventilation grilles
        'drop': {2: [(80.15, 22.2, 81.1, 23.32),                      # skylight curb and line on the terrace: gone
                     (81.35, 28.2, 83.25, 28.32),                     # threshold at the foot of the corridor
                     (85.2, 25.40, 87.2, 27.9)]},                     # lounge kitchenette lines: incomplete, say nothing
        'cut_solids': {2: [(80.2, 28.2, 80.5, 28.6)]},               # column trimmed to align with the one above
        # the ground-floor entrance as approved: the facade file's entrance plan, 11.0 m wide like the main
        # plan, placed by the side walls' outer faces and the street line
        'splices': [{
            'plan': 0, 'source': 'facade',
            'shift': (34.49 - 1219.111, 16.388 - (-33.17)),
            'zone': (34.55, 15.3, 45.43, 20.3),                      # main plan: street to storefront
            'source_zone': (1219.0, -33.4, 1230.25, -29.2),
            'keep_side_walls': (34.85, 45.15),
            'extra_solids': [(34.488, 16.388, 34.734, 20.4), (45.238, 16.388, 45.496, 20.4)],
            'small_on_layer': {'a_lineas': 0.3},                     # light fittings
            'map': {'470': 'wall', 'estructura': 'col', 'a_muros': 'col', 'ARQ- COLUMNAS': 'col',
                    'a_ventana': 'win', 'HD_0.05': 'win', 'a_lineas': 'win', 'a_pisos': 'win', '01VENT': 'win',
                    'arq gradas': 'stair', 'a-railing': 'stair', 'a_proyec_puertas': 'door'},
        }],
        # typical floor closets: only the facade file's partial typical plan has them (the three front rooms);
        # its bathroom fixtures match the main typical floor's exactly (10.515 x 1.54 m), which places it
        'imports': [{
            'plan': 1, 'source': 'facade', 'layers': ['ARQ-MUEBLES'], 'category': 'closet',
            'shift': (59.86 - 1247.323, 22.378 - (-29.098)),
            'select': lambda it: (len(it['pts']) == 2 and abs(it['pts'][0][1] - it['pts'][1][1]) < 0.01
                                  and abs(it['pts'][1][0] - it['pts'][0][0]) > 2.0
                                  and -29.85 < it['pts'][0][1] < -29.65
                                  and 1246.9 < min(it['pts'][0][0], it['pts'][1][0]) < 1258.2),
        }],
    },

    'elevations': [{
        'output': 'elevation.svg',
        'title': 'Sierra Hotel: front elevation',
        'source': 'facade',
        'region': (1218.0, -62.2, 1231.4, -40.3),
        'size': (2000, 2800),
        'layers': {
            'outline': ['a_muros', '0'],
            'line': ['WINDOW', 'LL2', 'LL3', 'LL5', 'MURO', '01MURO', 'ARQ-TECHOS', '1'],
            'grey': ['Fachada Hunter Douglas', 'RAILING', 'a-railing'],
            'frame': ['a-puerta-ventana'],
            'glass': ['WINDOW'],
            'pattern': ['ARQ-TECHOS'],                               # the rooftop slats
            'shadow': ['SHADOW'],
            'ground': ['1'],
        },
        'axis_only': ['WINDOW'],                                     # no window-opening diagonals
        'drop_short_diagonals': 0.3,                                 # door-opening arrows
        'drop_in_box': [('RAILING', (1219.0, -44.8, 1230.2, -42.6))],   # top-floor railings: no longer in the project
        # the central volume's shadow down its left side (sun from the upper right, 45 degrees), 0.35 m wide
        'extra_shadows': [[(1221.766, -44.761), (1221.416, -45.111), (1221.416, -57.962), (1221.766, -57.962)]],
    }],
}
