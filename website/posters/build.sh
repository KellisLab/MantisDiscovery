#!/bin/sh
# Builds every project poster: the figures (figures/*.py), each PDF with latexmk, and for the site a copy of
# the PDF and a preview image in ../public/media/posters/. Run from posters/: sh build.sh [names...]
set -e
cd "$(dirname "$0")"
out=../public/media/posters
mkdir -p build "$out"
if [ "$#" -eq 0 ]; then
  (cd figures && for f in sidon boundary cofactors repetition logsobolev permanents krvk certified ascent coresets gibbs calibration; do python3 "$f.py"; done)
  set -- $(ls *.tex | sed 's/\.tex$//')
fi
for name in "$@"; do
  latexmk -lualatex -interaction=nonstopmode -halt-on-error -outdir=build "$name.tex" > "build/$name.out" 2>&1 || { tail -30 "build/$name.log"; exit 1; }
  cp "build/$name.pdf" "$out/$name.pdf"
  pdftoppm -r 24 -png -singlefile "build/$name.pdf" "build/$name-preview"
  cwebp -quiet -q 82 "build/$name-preview.png" -o "$out/$name.webp"
  cwebp -quiet -q 80 -resize 576 0 "build/$name-preview.png" -o "$out/$name-sm.webp"
  echo "$name: $(du -k "$out/$name.pdf" | cut -f1) KB pdf, $(du -k "$out/$name.webp" | cut -f1) KB preview"
done
