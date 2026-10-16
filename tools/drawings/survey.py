"""Look inside a CAD file before mapping it: python tools/drawings/survey.py <file.dwg|dxf> [x0 y0 x1 y1] [--out DIR]

Without a box: prints the drawing's extents and every layer with its entity count, and writes overview.png
(the whole model space, one colour per layer, coordinates marked) so the plans and elevations can be found.
With a box (model coordinates, read off the overview): prints the layers inside it and writes layers.png,
one tile per layer with that layer in red over the rest in grey, which is how each layer's role is decided.
"""
import argparse
import collections
import colorsys
import os
import sys
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from PIL import Image, ImageDraw   # noqa: E402

import cadio                       # noqa: E402


def colour(layer):
    h = (zlib.crc32(layer.encode()) % 1000) / 1000
    r, g, b = colorsys.hsv_to_rgb(h, 0.85, 0.7)
    return int(r * 255), int(g * 255), int(b * 255)


def draw(items, b, px_per_m, highlight=None):
    x0, y0, x1, y1 = b
    W, H = max(1, int((x1 - x0) * px_per_m)), max(1, int((y1 - y0) * px_per_m))
    im = Image.new('RGB', (W, H), 'white')
    d = ImageDraw.Draw(im)

    def f(p):
        return [((x - x0) * px_per_m, (y1 - y) * px_per_m) for x, y in p]
    for it in items:
        c = colour(it['layer']) if highlight is None else ((210, 0, 0) if it['layer'] == highlight else (215, 215, 215))
        for p in it.get('paths', [it['pts']]):
            if it['kind'] == 'fill' and len(p) >= 3:
                d.polygon(f(p), fill=c)
            elif len(p) >= 2:
                d.line(f(p), fill=c, width=2 if highlight and it['layer'] == highlight else 1)
    return im


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('file')
    ap.add_argument('box', nargs='*', type=float)
    ap.add_argument('--out', default='.')
    a = ap.parse_args()
    items = cadio.load(cadio.to_dxf(a.file, os.path.join(HERE, '.cache')))
    os.makedirs(a.out, exist_ok=True)
    if len(a.box) == 4:
        b = tuple(a.box)
        sel = [it for it in items if cadio.inside(it, b)]
        cnt = collections.Counter(it['layer'] for it in sel)
        for lay, n in cnt.most_common():
            print(f'{n:6d}  {lay}')
        k = 600 / max(b[2] - b[0], b[3] - b[1])
        tiles = []
        for lay, _ in cnt.most_common():
            t = draw(sel, b, k, highlight=lay)
            c = Image.new('RGB', (t.width, t.height + 22), 'white')
            c.paste(t, (0, 0))
            ImageDraw.Draw(c).text((4, t.height + 4), lay, fill=(0, 0, 200))
            tiles.append(c)
        cols = 4
        tw, th = tiles[0].size
        sheet = Image.new('RGB', (cols * tw, ((len(tiles) + cols - 1) // cols) * th), 'white')
        for i, t in enumerate(tiles):
            sheet.paste(t, ((i % cols) * tw, (i // cols) * th))
        sheet.save(os.path.join(a.out, 'layers.png'))
        print('wrote', os.path.join(a.out, 'layers.png'))
    else:
        b = cadio.bbox([q for it in items for q in it['pts']])
        print('extents', [round(v, 2) for v in b])
        for lay, n in collections.Counter(it['layer'] for it in items).most_common():
            print(f'{n:6d}  {lay}')
        k = 3000 / (b[2] - b[0])
        im = draw(items, b, k)
        d = ImageDraw.Draw(im)
        step = 10 ** int(round(__import__('math').log10((b[2] - b[0]) / 10)))
        x = (int(b[0] / step) + 1) * step
        while x < b[2]:
            d.text(((x - b[0]) * k + 2, 2), f'x {x:g}', fill=(120, 120, 120))
            x += step
        y = (int(b[1] / step) + 1) * step
        while y < b[3]:
            d.text((2, (b[3] - y) * k + 2), f'y {y:g}', fill=(120, 120, 120))
            y += step
        im.save(os.path.join(a.out, 'overview.png'))
        print('wrote', os.path.join(a.out, 'overview.png'))


if __name__ == '__main__':
    main()
