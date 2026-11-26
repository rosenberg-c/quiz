#!/usr/bin/env bash
# Render .typ sources to sibling, page-numbered SVG and PNG images.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOCS_DIR="${DOCS_DIR:-docs}"
IMAGE="${TYPST_IMAGE:-pandoc/typst:latest}"
FORMAT="${TYPST_FORMAT:-both}"
PPI="${TYPST_PPI:-144}"
case "$FORMAT" in
  both) formats=(svg png) ;;
  svg|png) formats=("$FORMAT") ;;
  *) echo "typst-render: invalid TYPST_FORMAT: $FORMAT (expected both, svg, or png)" >&2; exit 1 ;;
esac

cd "$ROOT"
[ -d "$DOCS_DIR" ] || { echo "typst-render: input dir not found: $DOCS_DIR" >&2; exit 1; }
DOCS_DIR="$(cd "$DOCS_DIR" && pwd -P)"
mount_root="$ROOT"
if [[ "$DOCS_DIR" != "$ROOT" && "$DOCS_DIR" != "$ROOT/"* ]]; then
  mount_root="$DOCS_DIR"
fi

list="$(mktemp)"
trap 'rm -f "$list"' EXIT
find "$DOCS_DIR" -type f -name '*.typ' -print0 | LC_ALL=C sort -z > "$list"

status=0
count=0
while IFS= read -r -d '' file; do
  rel="${file#"$mount_root"/}"
  count=$((count + 1))
  for ext in "${formats[@]}"; do
    out="${rel}.generated-{0p}.$ext"
    echo "typst-render: $rel -> $out"
    args=(compile)
    if [ "$ext" = png ]; then args+=(--ppi "$PPI"); fi
    if ! docker run --rm --pull=always -u "$(id -u):$(id -g)" \
      --entrypoint typst -v "$mount_root:/work" -w /work \
      "$IMAGE" "${args[@]}" "$rel" "$out"; then
      echo "typst-render: FAILED $rel -> $out" >&2
      status=1
    fi
  done
done < "$list"

if [ "$count" -eq 0 ]; then
  echo "typst-render: no .typ files under $DOCS_DIR (nothing to do)" >&2
fi
exit "$status"
