# Typst wireframe rendering (Docker / pandoc/typst).
TYPST_RENDER ?= .typst/render.sh
TYPST_CLEAN ?= .typst/clean.sh
TYPST_IMAGE ?= pandoc/typst:latest
TYPST_FORMAT ?= both
TYPST_PPI ?= 144
DOCS_DIR ?= docs

.PHONY: typst-render typst-render-svg typst-render-png typst-clean
typst-render-svg: TYPST_FORMAT = svg
typst-render-png: TYPST_FORMAT = png
typst-render typst-render-svg typst-render-png: typst-clean
	DOCS_DIR="$(DOCS_DIR)" TYPST_IMAGE="$(TYPST_IMAGE)" TYPST_FORMAT="$(TYPST_FORMAT)" TYPST_PPI="$(TYPST_PPI)" bash "$(TYPST_RENDER)"

typst-clean:
	DOCS_DIR="$(DOCS_DIR)" bash "$(TYPST_CLEAN)"
