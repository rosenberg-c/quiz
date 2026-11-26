#!/usr/bin/env bash
# Remove page images belonging to existing .typ sources under DOCS_DIR.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOCS_DIR="${DOCS_DIR:-docs}"
cd "$ROOT"
[ -d "$DOCS_DIR" ] || { echo "typst-clean: input dir not found: $DOCS_DIR" >&2; exit 1; }

list="$(mktemp)"
trap 'rm -f "$list"' EXIT
find "$DOCS_DIR" -type f -name '*.typ' -print0 > "$list"

while IFS= read -r -d '' file; do
  rm -f "$file".generated-*.svg "$file".generated-*.png
done < "$list"
