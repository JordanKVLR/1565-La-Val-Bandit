#!/usr/bin/env bash
# Concatenate rendered segments, mux the song, encode the final MP4 (H.264 + AAC, ~3.2 Mbps).
# usage: assemble.sh <build_dir> <output.mp4>
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
build="${1:-$here/build}"
out="${2:-$here/armatura-1565-trailer.mp4}"
ffmpeg -v error -y -f concat -safe 0 -i "$build/segments.txt" -i "$here/under-the-red-sun.m4a" \
  -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -b:v 3200k -maxrate 5000k -bufsize 10000k \
  -pix_fmt yuv420p -profile:v high -movflags +faststart -c:a aac -b:a 192k -shortest "$out"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$out"
