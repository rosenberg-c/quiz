# Mermaid diagram rendering (Docker / minlag/mermaid-cli). See .mermaid/render.sh.
MERMAID_RENDER ?= .mermaid/render.sh
DOCS_DIR ?= docs
MERMAID_IMAGE ?= minlag/mermaid-cli:latest
# \# escapes the comment character; override e.g. make mermaid-render MERMAID_BG="#1e1e1e"
MERMAID_BG ?= \#222222
MERMAID_SCALE ?= 10
MERMAID_CSS ?= .mermaid/mermaid.css
MERMAID_CONFIG ?= .mermaid/mermaid.config.json
MERMAID_FORMAT ?= both

.PHONY: mermaid-render mermaid-render-svg mermaid-render-png
mermaid-render-svg: MERMAID_FORMAT = svg
mermaid-render-png: MERMAID_FORMAT = png
mermaid-render mermaid-render-svg mermaid-render-png:
	DOCS_DIR="$(DOCS_DIR)" \
	MERMAID_IMAGE="$(MERMAID_IMAGE)" \
	MERMAID_BG="$(MERMAID_BG)" \
	MERMAID_SCALE="$(MERMAID_SCALE)" \
	MERMAID_CSS="$(MERMAID_CSS)" \
	MERMAID_CONFIG="$(MERMAID_CONFIG)" \
	MERMAID_FORMAT="$(MERMAID_FORMAT)" "$(MERMAID_RENDER)"

.PHONY: mermaid-clean
mermaid-clean:
	DOCS_DIR="$(DOCS_DIR)" bash .mermaid/clean.sh
