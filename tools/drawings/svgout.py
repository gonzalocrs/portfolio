"""A small SVG writer: everything of one class goes into a single <path>, which keeps the files small."""


def _n(v):
    s = f'{v:.2f}'.rstrip('0').rstrip('.')
    return '0' if s == '-0' else s


class Sheet:
    def __init__(self, width, height, title=''):
        self.w, self.h, self.title = width, height, title
        self.d = {}                                    # class -> list of path data strings

    def lines(self, cls, polylines):
        """Open or closed polylines, already in sheet coordinates."""
        out = self.d.setdefault(cls, [])
        for pts in polylines:
            if len(pts) >= 2:
                out.append('M' + 'L'.join(f'{_n(x)} {_n(y)}' for x, y in pts))

    def rings(self, cls, rings_list):
        """Filled shapes: each entry is a list of rings (outer, then holes); filled even-odd."""
        out = self.d.setdefault(cls, [])
        for rings in rings_list:
            for pts in rings:
                if len(pts) >= 3:
                    out.append('M' + 'L'.join(f'{_n(x)} {_n(y)}' for x, y in pts) + 'Z')

    def render(self, css, order):
        parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" '
                 f'width="{self.w}" height="{self.h}">']
        if self.title:
            parts.append(f'<title>{self.title}</title>')
        parts.append(f'<style>{css}</style>')
        parts.append(f'<rect width="{self.w}" height="{self.h}" fill="#fff"/>')
        for cls in order:
            if self.d.get(cls):
                parts.append(f'<path class="{cls}" d="{"".join(self.d[cls])}"/>')
        parts.append('</svg>')
        return '\n'.join(parts)
