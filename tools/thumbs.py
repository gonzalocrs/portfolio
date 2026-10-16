#!/usr/bin/env python3
"""Small preview copies of every project image, for the sphere gallery (public/work.html).

The sphere shows every picture at once, about 160 to 420 px wide on screen, so loading the originals
(the physical-model photos alone are 60 MB) would make the page crawl. This writes one WebP per raster
image under public/img/, at most 720 px wide:

    public/img/sierra-hotel/photo-1.jpg  ->  public/img/thumbs/sierra-hotel/photo-1.webp

Run it again after adding or replacing images (it skips previews that are already newer than their
source):

    python3 tools/thumbs.py

If a preview is missing, the sphere falls back to the original file, so a new image still shows up,
only heavier, until this is run.
"""
import os
import subprocess
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "img")
OUT = os.path.join(ROOT, "thumbs")
WIDTH = 720
EXTS = (".jpg", ".jpeg", ".png", ".webp")


def main():
    made = skipped = 0
    for dirpath, dirnames, filenames in os.walk(ROOT):
        if os.path.abspath(dirpath).startswith(os.path.abspath(OUT)):
            continue
        for name in sorted(filenames):
            if not name.lower().endswith(EXTS):
                continue
            src = os.path.join(dirpath, name)
            rel = os.path.relpath(src, ROOT)
            dst = os.path.join(OUT, os.path.splitext(rel)[0] + ".webp")
            if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
                skipped += 1
                continue
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            # never enlarge a picture that is already small
            vf = "scale='min(%d,iw)':-2:flags=lanczos" % WIDTH
            subprocess.run(
                ["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", vf, "-c:v", "libwebp", "-quality", "80", dst],
                check=True,
            )
            made += 1
            print("%7d KB  %s" % (os.path.getsize(dst) // 1024, os.path.relpath(dst, ROOT)))
    print("%d made, %d already up to date" % (made, skipped))


if __name__ == "__main__":
    sys.exit(main())
