#!/bin/sh
# Small copies of every JPG that projects.js uses, for the home page wall: public/img/<...>/thumbs/<name>.jpg, at most
# 1000px wide. Run after adding or replacing a photo; existing thumbnails are only redone when the photo is newer.
set -e
cd "$(dirname "$0")/.."
grep -oE "img/[^'\"]+\.(jpe?g|JPE?G)" public/projects.js | sort -u | while read -r f; do
  src="public/$f"; [ -f "$src" ] || continue
  dir="$(dirname "$src")/thumbs"; out="$dir/$(basename "${f%.*}").jpg"
  [ -f "$out" ] && [ "$out" -nt "$src" ] && continue
  mkdir -p "$dir"
  ffmpeg -loglevel error -y -i "$src" -vf "scale='min(1000,iw)':-2:flags=lanczos" -q:v 4 "$out"
  echo "$out"
done
