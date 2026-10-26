# Portfolio site: working notes

Gonzalo Cáceres's architecture portfolio. Plain static HTML/CSS/JS, no framework and no build step.
Hosted as the Cloudflare Worker `portfolio` (static assets from `public/`), live at
https://portfolio.gonzalo-crs.workers.dev. GitHub: `gonzalocrs/portfolio`, branch `main`.

## Layout

- `public/index.html` + `public/project.html` (`?p=<slug>`, optional `&i=<n>`): since 2026-10-26 both run `public/quiet.js` +
  `public/quiet.css` (the "quiet" design: a column of short marks as the index, one picture at a time, the words behind a
  "+"). Since the evening of 2026-10-26 the home shows one or two pictures per project, one at a time: a scroll fades
  one out and the next opens elsewhere (`buildRollOne`). Earlier homes stay reachable: `?home=stage` (with the line intro,
  `?intro` replays it) and `?home=flow` (a scrolling page). Project pages stop at their first and last picture. `project.js`, `museum.js/css` and `embed.js` belong to the
  previous design (branch `backup/live-2026-10-26`) and are no longer loaded by these two pages.
- `public/projects.js`: **all project content** (one entry per project). This is the file you edit most.
- `public/about.html`, `contact.html`, `contact.js`, `signature.js`: other pages.
- `public/img/<slug>/`: images for each project.
- `public/_headers`: `no-cache` on the HTML and JS files, so edits show up right away.
- `wrangler.toml`: Worker config. `.wrangler/` is local cache and is not committed.

Project slugs: sierra-hotel, edificio-murano, urba-branding, the-outermost-dock, social-sanctuary,
permanent-impermanence, intra-urban-forestation, anticlastic-roof-structure, vaulted-shell-structure,
modular-living-architecture. The doc comment at the top of `public/projects.js` explains every field.

## How a project page works

- `hero`: main image (landscape frame). `heroPosition` / `heroZoom` can adjust the crop.
- `lede` / `text`: `text` can be one string or an array of paragraphs.
- `diagram: {src, caption}`: the large image next to the text (used for hand drawings and, on Sierra, the
  exploded axonometric). `diagram: {}` reserves the slot with a placeholder.
- `gallery`: `{ drawings: [...], physical: [...], photos: [...] }`, each item `{src, caption}`. Order in the array is
  the order on the page. The layout sizes drawings by their proportions.
- `ready: true` switches a project from "roadmap" mode (placeholders such as "A short description goes here" and
  "To be added" credit rows) to the clean real page. Only Sierra Hotel is `ready` so far.

## Adding or replacing images (the usual job)

Source files are in Google Drive, under
`~/Library/CloudStorage/GoogleDrive-gonzalo.crs@gmail.com/My Drive/Personal/Career/Architecture Career/Portfolio/Projects/<group>/<project>/{Drawings,Photos}`.
(A Columbia portfolio folder under `My Drive/Education/Columbia M.Arch/...` also has some images.)

1. Inspect the file first (`ls -l`, `sips -g pixelWidth -g pixelHeight`). If a file name was uploaded before, `cmp` it
   against the copy in `public/img/` to see whether it is actually a new export.
2. Copy it into `public/img/<slug>/` with a short lowercase name and update `public/projects.js`.
3. Size targets:
   - Hero: about 3000 x 1500 px (roughly 2:1), JPG, 300 to 800 KB. Keep the subject in the central 60% because the frame
     crops differently on desktop and phone. Resize with
     `ffmpeg -i in.jpg -vf scale=3000:-1:flags=lanczos -q:v 3 out.jpg`. Film grain makes files heavy.
   - Drawings: WebP or PNG, up to about 3000 px wide. Over about 4500 px is far too heavy (the first Sierra PNGs were
     7200 x 10800 and loaded very slowly).
   - Use files that are already small as they are; do not recompress them twice.
4. For a JPG, run `sh tools/thumbs.sh`: the home page wall uses the small copies in `thumbs/` next to each photo
   (the full-size photos made it very slow). It falls back to the original if a thumbnail is missing.
5. Preview locally, then deploy (below).

Tool notes: `sips -c` ignores the crop offset and always crops from the centre. Use
`ffmpeg -vf crop=W:H:X:Y` for a crop anchored somewhere else. There is no ImageMagick or Pillow.
ffmpeg and cwebp are at `/opt/homebrew/bin`.

## Drawings from CAD

Plans and elevations are generated from the CAD files as SVG by `tools/drawings/` (not deployed): one project
file per building in `tools/drawings/projects/` says which layer is what and holds any hand edits, then
`python tools/drawings/build.py sierra-hotel` writes `public/img/<slug>/*.svg`. The line-weight language and
how to feed in a new DWG are in `tools/drawings/README.md`. Edit the project file and rebuild rather than
editing the SVGs.

## Preview locally

```bash
python3 -m http.server 8765 --directory public
# open http://localhost:8765/project.html?p=sierra-hotel
```

The dev server lets the browser cache. After swapping a file, force a fresh load (for example run
`fetch('img/...',{cache:'reload'})` in the page and reload), or the old image can still show.
Add `?intro` to the home page URL to replay the intro animation.

## Publish

```bash
git add -A public
git commit -m "..."
git push origin main
wrangler deploy
```

`wrangler` is logged in via OAuth (run `wrangler login` again if a deploy fails on permissions). Afterwards, check the
live site, for example `curl -s -o /dev/null -w "%{http_code} %{size_download}\n" "https://portfolio.gonzalo-crs.workers.dev/img/<slug>/<file>?x=$RANDOM"`.
Deleted images return 404 once deployed. If an image keeps the same file name, a hard refresh may be needed in the
browser. Run multi-step shell commands with `set -e` so one failure cannot leave a half-applied change (a past command
removed a file but not its entry in `projects.js`).

## State and open items

- Sierra Hotel is finished except for placeholders: it has a hero, text, diagram and three drawings (facade, floor plans,
  facade details). Order matters and was set deliberately.
- Branch `mouse-parallax-collage` (not deployed, not pushed) adds a cursor-following drift to the home collage. The
  reference site, adamjakubowski.pl (Framer), has a scattered always-moving image collage that this does not copy.
  Not requested to merge. The home collage tiles are still colour swatches, not project images.
- All other projects are still in roadmap mode (no `ready`), apart from content already filled in for
  Anticlastic Surfaces and East 5th's diagram.
