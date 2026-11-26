SCREENSHOT_URL ?= http://localhost:5173/
SCREENSHOT_SIZE ?= 900,980

.PHONY: screenshot screenshot-light screenshot-dark
screenshot: screenshot-light screenshot-dark

screenshot-light:
	./.screenshot/screenshot.sh "$(SCREENSHOT_URL)" light "$(SCREENSHOT_SIZE)"

screenshot-dark:
	./.screenshot/screenshot.sh "$(SCREENSHOT_URL)" dark "$(SCREENSHOT_SIZE)"
