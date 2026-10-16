"""Build a project's drawings: python tools/drawings/build.py <project> [--only plans|elevations]

<project> is a file in tools/drawings/projects/ (without .py). It names the CAD sources, says what each layer
is, and holds any hand edits. Output SVGs go to public/img/<slug>/.
"""
import argparse
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import cadio          # noqa: E402
import elevation      # noqa: E402
import plan           # noqa: E402

REPO = os.path.dirname(os.path.dirname(HERE))


def load_project(name):
    path = os.path.join(HERE, 'projects', name.replace('-', '_') + '.py')
    if not os.path.exists(path):
        raise SystemExit(f'No project file {path}')
    spec = importlib.util.spec_from_file_location('project', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.PROJECT


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('project')
    ap.add_argument('--only', choices=['plans', 'elevations'])
    args = ap.parse_args()
    P = load_project(args.project)
    out_dir = os.path.join(REPO, 'public', 'img', P['slug'])
    os.makedirs(out_dir, exist_ok=True)
    cache = os.path.join(HERE, '.cache')

    # every CAD source, as flattened geometry (pattern lines only for the layers that ask for them)
    patterns = set()
    for e in P.get('elevations', []):
        patterns |= set(e['layers'].get('pattern', ()))
    sources = {}
    for name, path in P['sources'].items():
        print(f'reading {name}: {os.path.basename(path)}')
        sources[name] = cadio.load(cadio.to_dxf(path, cache), pattern_layers=patterns)

    jobs = []
    if args.only in (None, 'plans') and P.get('plans'):
        jobs.append(('plans', P['plans'], plan.build))
    if args.only in (None, 'elevations'):
        jobs += [('elevation', e, elevation.build) for e in P.get('elevations', [])]
    for kind, cfg, fn in jobs:
        print(f"building {cfg['output']}")
        svg = fn(cfg, sources)
        dst = os.path.join(out_dir, cfg['output'])
        with open(dst, 'w', encoding='utf-8') as f:
            f.write(svg)
        print(f'  wrote {os.path.relpath(dst, REPO)} ({os.path.getsize(dst) // 1024} KB)')


if __name__ == '__main__':
    main()
