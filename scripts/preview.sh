#!/usr/bin/env bash
# Run Clean Hub in a desktop browser with fake apps and inputs (preview/mock.js).
# Open http://localhost:8765 and use the arrow keys and Enter; R adds favourites
# the way the red button does on the TV.
set -euo pipefail

repo="$(cd "$(dirname "$0")/.." && pwd)"
out="$(mktemp -d /tmp/cleanhub-preview.XXXXXX)"
trap 'rm -rf "$out"' EXIT

cp -R "$repo/app/." "$out/"
cp "$repo/preview/mock.js" "$out/"
sed -i.bak 's#<script src="js/main.js">#<script src="mock.js"></script><script src="js/main.js">#' "$out/index.html"

echo "Preview on http://localhost:8765 (Ctrl+C to stop)"
python3 -m http.server 8765 --directory "$out"
