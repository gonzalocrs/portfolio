# Drawings from CAD

Turns CAD plans and elevations (DWG or DXF) into SVG drawings in the portfolio's drawing language. The output is
vector, so it stays sharp at any size. Line widths are screen pixels (non-scaling strokes), so even the finest
line stays at least half a pixel at the small size the site shows the drawings at.
Because of that, a drawing shown smaller would crowd its lines and read heavier; the SVG's own media queries
(`THIN` in style.py) step every line thinner below set shown widths, so it keeps the same light tone at any size.

```
python tools/drawings/build.py sierra-hotel            # every drawing of a project
python tools/drawings/build.py sierra-hotel --only plans
```

Output goes to `public/img/<slug>/` (for example `floor-plans.svg`, `elevation.svg`); reference it from
`public/projects.js` or the page like any image.

Needs: Python with `ezdxf`, `shapely`, `numpy`, `pillow`. DWG files are converted with AutoCAD's console
(`accoreconsole.exe`, found automatically under `C:\Program Files\Autodesk\AutoCAD *`). The conversion works on a
copy and is cached in `tools/drawings/.cache/` (not committed), so it only runs again when the DWG changes.
Without AutoCAD, save the DWG as DXF by hand and point the project at the `.dxf`.

## The drawing language

Set in `style.py`, after Gonzalo's reference (pen weights in pt). Widths are screen pixels and do not scale
with the drawing: shown at about 0.4 of the sheet on the site, lines that scaled came out a fraction of a pixel and
looked uneven. So the finest line is 0.5 px (one device pixel on a high-density screen), and the weight hierarchy
is carried by grey value and width.

| weight | what | how it is drawn |
|---|---|---|
| 1 3/8 | section cuts: structure (or all walls without `poche`) | solid black |
| | other walls (`poche: structure`) | `wall`, 0.5 px, grey 168, white inside |
| 7/8 | low walls, parapets | `perimeter`, 0.6 px, grey 51 |
| | stairs, steps, pool | `line`, 0.5 px, grey 85 |
| 5/8 | windows, curtain walls: the middle (glass) lines | `glass`, 0.5 px, grey 119 |
| 3/8 | windows, curtain walls: the outer (frame) lines | `frame`, 0.5 px, grey 170 |
| 1/8 | bathroom fixtures, kitchen counters, islands | `fixture`, 0.5 px, grey 196 |
| thinnest | closets | `closet`, 0.5 px, grey 218 |
| 1/16 | hatches (pool water) | light grey fill (240) |

Elevations: the silhouette (the one line that wraps the building, found from the outline, line and ground layers,
bridging CAD gaps under 20 cm) and the ground line 1 px black; inside it, lighter by importance: volume edges
(`outline`) 0.6 px grey 51, slab edges and openings (`line`) 0.5 px grey 102, window and door frames 0.5 px grey
138, cladding and railings 0.5 px grey 208.

With `'poche': 'structure'` in the plans config, only the structure is solid black: columns (the `column`
layers), any wall layers listed in `structure_layers`, and any boxes in `structure_boxes` (per floor, e.g. a
concrete core drawn on the same layer as the partitions). Every other wall is a thin grey outline (`wall`,
0.8, grey 154), white inside. Without it, all cut walls are solid black.

With `'align': 'model'` the floors keep their model y instead of being top-aligned, so columns and walls that
stack line up across the sheet (the CAD draws the floors side by side on one grid). `y_shift` (per floor, in
metres) moves a floor that is drawn out of register. `scale` (sheet units per metre, or `plan_height` for the tallest floor) and `gap` set the
size and spacing.

Rules in plans: no furniture, no bought-in appliances (cookers, fridges, sink bowls: the kitchen is its counters,
island and the spaces between), no door swings (the gap in the wall is the door), no stair walk lines, arrows or
dots, no grid axes, labels, plants or void crosses, no ventilation grilles.

Elevations cut nothing, so nothing is solid black: black outlines, cladding and railings in grey, glass very light
grey, shadows as a translucent black that darkens what it falls on (darker than the glass hatch).

## Feeding in a new drawing

1. **Look at the file.** `python tools/drawings/survey.py "<file.dwg>" --out <folder>` prints every layer and writes
   `overview.png` (the whole drawing, one colour per layer, coordinates marked). Read the box around the plan or
   elevation you want off it, in model units (usually metres).
2. **See what each layer is.** `python tools/drawings/survey.py "<file.dwg>" x0 y0 x1 y1 --out <folder>` writes
   `layers.png`: one tile per layer inside that box, the layer in red. Decide each layer's role from it.
3. **Write the project file** `tools/drawings/projects/<slug_with_underscores>.py`, copying
   `sierra_hotel.py`. For plans: `regions` (one box per floor, left to right on the sheet) and `layers` (`wall`,
   `column`, `window`, `door`, `stair`, `fixture`). For each elevation: `region` and `layers` (`outline`,
   `line`, `grey`, `frame`, `glass`, `pattern`, `shadow`, `ground`). Any layer not named is left out.
4. **Build, look, adjust.** Run `build.py`, open the SVG, and fix what reads wrong with the hand edits below.

## Hand edits (all in the project file, in model coordinates)

Plans:
- `drop`: remove everything inside these boxes on a floor (things no longer in the project).
- `structure_boxes`: with `'poche': 'structure'`, walls inside these boxes on a floor are drawn black too.
- `cut_solids`: carve these boxes out of the solid walls (e.g. trim a column).
- `small_on_layer`: drop items smaller than this on a layer (grilles, light fittings).
- `layers_by_plan`: extra layers for one floor only (e.g. counters on the top floor).
- `extra_lines`: thin lines from another layer inside a box (e.g. entrance steps).
- `pool`: a pool's outline and steps; its smallest ring over 4 m² gets the water fill.
- `splices`: replace a zone of a floor with the same zone from another drawing (shifted into place), e.g. an
  approved entrance. `keep_side_walls` keeps the main plan's side walls; `extra_solids` adds solid boxes.
- `imports`: bring elements from another file into a floor (e.g. closets drawn only in a partial plan).

Elevations:
- `drop_in_box`: remove a layer's elements inside a box (e.g. railings no longer in the project).
- `axis_only`: on these layers keep only horizontal and vertical pieces (drops window-opening diagonals).
- `drop_short_diagonals`: drop diagonal pieces shorter than this (door-opening arrows).
- `extra_shadows`: shadow polygons not in the CAD (e.g. a volume's cast shadow).

## Files

- `build.py`: the command; reads a project, converts its sources, writes the SVGs.
- `survey.py`: looks inside a CAD file (layers, overview, layer tiles).
- `cadio.py`: DWG to DXF, and DXF to plain geometry (blocks exploded, hatches and arcs kept).
- `plan.py`, `elevation.py`: the two kinds of drawing.
- `style.py`: line weights and greys. `svgout.py`: the SVG writer.
- `projects/`: one file per project.
