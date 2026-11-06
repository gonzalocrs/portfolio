"""East 5th "underspecificity / invisible order" diagram, redrawn clean from his sheet 8 (2026-11-06).

Geometry is his, read from the sheet's PDF (points, y down); the redraw only fixes how it is drawn:
nothing clipped by the frame, one hairline for every block, equal gaps between the steps, one shared top line,
a calmer palette that keeps his colour coding, no words, no dashed frame.

    python3 tools/diagrams/east5th_underspecificity.py   ->  public/img/social-sanctuary/underspecificity.svg
"""
import os

# his colour coding, calmed (the bathroom cyan was the loud one)
C = dict(room='#94A8AB', kitchen='#F2F1EC', bath='#A6D6D4', living='#AEB3C6', shared='#DFAA74', meet='#E9D766')
INK, GREY = '#1b1b1b', '#8b8c8e'
HAIR = 'stroke="%s" stroke-width="0.7" vector-effect="non-scaling-stroke" stroke-linejoin="miter"' % INK
LINE = 'stroke="%s" stroke-width="0.7" vector-effect="non-scaling-stroke" fill="none" stroke-linecap="round"' % GREY

def poly(pts, fill, extra=''):
    return '<path d="M%s Z" fill="%s" %s %s/>' % (' L'.join('%.2f %.2f' % p for p in pts), fill, HAIR, extra)

def rect(x0, y0, x1, y1, fill):
    return poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], fill)

def line(*pts):
    return '<path d="M%s" %s/>' % (' L'.join('%.2f %.2f' % p for p in pts), LINE)

def step1():
    """the townhouse: the same rooms as the next step, packed in the house, walls drawn as one clean set of lines
    (outer shell heavier), the stoop in hairline"""
    X0, X1, Y0, Y1 = 741, 797, 551, 755
    out = [poly([(X0, Y0), (769, Y0), (769, 598), (761.5, 598), (761.5, 630.5), (X0, 630.5)], C['room']),
           poly([(769, Y0), (X1, Y0), (X1, 630.5), (778.4, 630.5), (778.4, 598), (769, 598)], C['room']),
           rect(X0, 630.5, 762, 657, C['kitchen']), rect(X0, 657, 762, 684, C['bath']),
           poly([(X0, 684), (762, 684), (762, 698), (776.4, 698), (776.4, Y1), (X0, Y1)], C['living']),
           poly([(762, 630.5), (X1, 630.5), (X1, 732), (776.4, 732), (776.4, 698), (762, 698)], C['shared'])]
    def walls(w, *runs):
        return ''.join('<path d="M%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="square" stroke-linejoin="miter"/>'
                       % (' L'.join('%.2f %.2f' % q for q in r), INK, w) for r in runs)
    out.append(walls(.9,
        [(769, Y0), (769, 598)], [(761.5, 630.5), (761.5, 598), (778.4, 598), (778.4, 630.5)],   # front rooms, little hall
        [(X0, 630.5), (X1, 630.5)],                                                                # across the house
        [(762, 630.5), (762, 698), (776.4, 698), (776.4, Y1)],                                     # rooms | hall and stair
        [(X0, 657), (762, 657)], [(X0, 684), (762, 684)],                                          # kitchen | bath | living
        [(776.4, 732), (X1, 732)]))                                                                # vestibule
    out.append(walls(1.8, [(X0, Y0), (X1, Y0), (X1, Y1), (X0, Y1), (X0, Y0)]))
    # the stoop: steps down from the door, the landing, steps on to the street
    out.append(rect(776.4, Y1 + 1.2, X1, 776.4, 'none'))
    out += [line((776.4, y), (X1, y)) for y in (760.6, 764.6, 768.5, 772.5)]
    out.append(rect(X0, 776.4, X1, 797.8, 'none'))
    out += [line((x, 776.4), (x, 797.8)) for x in (759.4, 763.5, 767.6, 771.6)]
    out.append(rect(X0, 797.8, 759.4, 803.4, 'none'))
    return out, (740.1, 550.1, 797.9, 803.4)

def step0():
    """the co-op tenement it starts from: his elevation from the same sheet (words taken off), set to the diagram's
    height on the same top line"""
    import base64
    src = os.path.join(os.path.dirname(__file__), 'tenement-elevation.jpg')
    w, h = 1100, 1124                                   # the jpg's size
    H = 803.4 - 551; W = H * w / h
    data = base64.b64encode(open(src, 'rb').read()).decode()
    return ['<image x="0" y="551" width="%.2f" height="%.2f" href="data:image/jpeg;base64,%s"/>' % (W, H, data)], (0, 551, W, 803.4)

def step2():
    """pulled apart: the rooms keep their outline, the hall empties, the stoop takes the colour"""
    return [poly([(886.2, 551.3), (911.7, 551.3), (911.7, 598), (906.1, 598), (906.1, 629.1), (886.2, 629.1)], C['room']),
            poly([(913.9, 551.3), (940.1, 551.3), (940.1, 629.1), (920.2, 629.1), (920.2, 598), (913.9, 598)], C['room']),
            rect(886.2, 631.3, 906.1, 655.8, C['kitchen']), rect(886.2, 657.8, 906.1, 682.6, C['bath']),
            poly([(886.2, 684.7), (906.1, 684.7), (906.1, 698), (920.2, 698), (920.2, 753.6), (886.2, 753.6)], C['living']),
            poly([(908.5, 631.3), (940.6, 631.3), (940.6, 731.7), (922.5, 731.7), (922.5, 697), (908.5, 697)], 'none'),
            poly([(884.7, 803.4), (903.3, 803.4), (903.3, 795.2), (940.9, 795.2), (940.9, 755.4), (920.5, 755.4), (920.5, 776.5), (884.7, 776.5)], C['shared'])
            ], (884.7, 551.3, 940.9, 803.4)

def step3():
    """reduced to plain blocks, in a column"""
    return [rect(1033.9, 550.6, 1067.7, 618.0, C['room']), rect(1033.9, 631.2, 1067.7, 649.6, C['kitchen']),
            rect(1033.9, 656.5, 1067.7, 672.0, C['bath']), rect(1033.9, 681.4, 1067.7, 753.6, C['living']),
            rect(1030.1, 760.1, 1071.4, 801.7, C['shared'])], (1030.1, 550.6, 1071.4, 801.7)

def step4():
    """set loose, held by their relations (Pask): the lines first, the blocks over them"""
    A, B, Cn, D = (1200.8, 624.1), (1259.9, 626.9), (1234.4, 652.6), (1231.8, 719.9)
    return [line(A, Cn, B), line(A, D), line(B, (1257.6, 684.6)), line(D, (1253.3, 703.0)), line(D, (1231.9, 671.8)),
            poly([(1182.8, 556.5), (1215.6, 615.9), (1186.0, 632.2), (1153.2, 572.8)], C['room']),
            poly([(1277.1, 632.1), (1297.5, 567.3), (1264.5, 556.3), (1244.9, 621.9)], C['room']),
            poly([(1254.4, 667.5), (1251.0, 649.5), (1217.8, 655.7), (1221.2, 673.8)], C['kitchen']),
            poly([(1239.3, 670.4), (1245.7, 704.4), (1260.8, 701.6), (1254.4, 667.5)], C['bath']),
            poly([(1244.6, 727.1), (1181.8, 691.8), (1164.1, 723.2), (1227.0, 758.5)], C['living']),
            poly([(1257.4, 704.0), (1298.0, 713.6), (1288.5, 754.2), (1247.9, 744.6)], C['shared'])
            ], (1153.2, 551, 1298.0, 758.5)

def step5():
    """settled again, each block turned inside the frame it came from; a meeting point, a way through"""
    frames = [line((1388.7, 626.6), (1388.9, 550.8), (1451.4, 551.0), (1451.2, 626.7)),
              line((1451.2, 626.7), (1451.2, 602.4), (1487.8, 602.4), (1487.8, 626.8)),
              line((1469.2, 626.8), (1388.7, 626.6), (1388.6, 693.1), (1469.1, 693.3), (1469.2, 626.8)),
              line((1469.2, 626.8), (1521.7, 626.9), (1521.5, 701.7), (1469.0, 701.6), (1469.2, 626.8)),
              line((1446.9, 693.3), (1446.8, 730.2), (1469.0, 730.2))]
    # his curve, from inside the shared block out past the rooms (stopped where the composition ends)
    c = [(0, 0), (-27.84, 8.69, -36.38, 20.44, -40.99, 28.37), (-45.60, 36.29, -46.28, 40.40, -45.56, 45.24),
         (-44.84, 50.07, -42.72, 55.65, -41.33, 60.84), (-39.94, 66.03, -39.27, 70.85, -41.60, 76.02),
         (-43.92, 81.19, -49.23, 86.72, -57.24, 89.94), (-65.24, 93.14, -75.95, 94.04, -87.03, 97.74),
         (-98.12, 101.44, -109.58, 107.95, -138.0, 126.5)]
    T = lambda x, y: (1512.4 + x, 728.2 - y)
    d = 'M%.2f %.2f' % T(*c[0]) + ''.join(' C%.2f %.2f %.2f %.2f %.2f %.2f' % (T(s[0], s[1]) + T(s[2], s[3]) + T(s[4], s[5])) for s in c[1:])
    curve = '<path d="%s" %s/>' % (d, LINE)
    return frames + [
        poly([(1421.7, 626.7), (1451.2, 610.4), (1418.4, 551.0), (1388.9, 567.3)], C['room']),
        poly([(1487.8, 620.5), (1484.4, 602.4), (1451.2, 608.7), (1454.6, 626.7)], C['kitchen']),
        poly([(1469.1, 661.9), (1406.3, 626.6), (1388.7, 658.0), (1451.5, 693.3)], C['living']),
        poly([(1469.1, 691.5), (1501.2, 701.7), (1521.6, 637.0), (1489.5, 626.8)], C['room']),
        poly([(1453.9, 730.2), (1469.0, 727.3), (1462.6, 693.3), (1447.4, 696.1)], C['bath']),
        rect(1469.0, 701.7, 1539.3, 772.0, C['shared']),
        '<circle cx="1465.4" cy="641.6" r="12.3" fill="%s" fill-opacity=".55"/>' % C['meet'],
        curve], (1374.4, 550.8, 1539.3, 772.0)

def build(steps, path, gap=58, pad=14):
    groups, x = [], pad
    top = min(b[1] for _, b in steps)
    bottom = max(b[3] for _, b in steps)
    for items, (x0, y0, x1, y1) in steps:
        groups.append('<g transform="translate(%.2f %.2f)">%s</g>' % (x - x0, pad - top, ''.join(items)))
        x += (x1 - x0) + gap
    W, H = x - gap + pad, bottom - top + 2 * pad
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %.1f %.1f" width="%d" height="%d">'
           '<rect width="100%%" height="100%%" fill="#fff"/>%s</svg>\n') % (W, H, round(W * 4), round(H * 4), ''.join(groups))
    open(path, 'w').write(svg)
    print(path, round(W), 'x', round(H))

if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'img', 'social-sanctuary')
    import sys
    # on the site without the townhouse step (his call, 2026-11-06: "the iteration with the townhouse is not working");
    # --townhouse writes the five-step version beside it
    # his diagram is all five steps, the townhouse's plan first; "with the townhouse" puts his tenement elevation in
    # front of it in the same image (his note, 2026-11-06: "do one image with the townhouse elevation, then my diagram")
    s = [step1(), step2(), step3(), step4(), step5()]
    build([step0()] + s, os.path.join(out, 'underspecificity-townhouse.svg'))   # the one on the site (his pick)
    if '--alone' in sys.argv: build(s, os.path.join(out, 'underspecificity.svg'))
