#!/usr/bin/env bash
set -euo pipefail
SRC="public/Scroll-Animation-Video.mp4"

if [[ ! -f "$SRC" ]]; then
  echo "Source video not found at $SRC" >&2
  exit 1
fi

mkdir -p public/frames/desktop public/frames/mobile

echo "Extracting desktop frames…"
ffmpeg -y -i "$SRC" -vf "fps=30,scale='min(1920,iw)':-2:flags=lanczos" \
  -c:v libwebp -quality 80 \
  public/frames/desktop/%04d.webp

echo "Extracting mobile frames…"
ffmpeg -y -i "$SRC" -vf "fps=24,scale='min(828,iw)':-2:flags=lanczos" \
  -c:v libwebp -quality 75 \
  public/frames/mobile/%04d.webp

echo "Done. Counts:"
echo "  desktop: $(ls public/frames/desktop | wc -l)"
echo "  mobile:  $(ls public/frames/mobile | wc -l)"
