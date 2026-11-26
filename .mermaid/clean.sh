#!/usr/bin/env bash
# Remove only images belonging to .mmd sources under DOCS_DIR.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOCS_DIR="${DOCS_DIR:-docs}"
cd "$ROOT"
[ -d "$DOCS_DIR" ] || { echo "mermaid-clean: input dir not found: $DOCS_DIR" >&2; exit 1; }

while IFS= read -r -d '' file; do
  base="${file%.mmd}"
  rm -f "$base.generated.png" "$base.generated.svg"
done < <(find "$DOCS_DIR" -type f -name '*.mmd' -print0)
