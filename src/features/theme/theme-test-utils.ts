import { expect } from "vite-plus/test";

import indexHtml from "../../../index.html?raw";
import { THEME_COLORS } from "./theme-core";
import type { ResolvedTheme } from "./useTheme";

const inlineThemeScript =
  new DOMParser()
    .parseFromString(indexHtml, "text/html")
    .querySelector("script:not([src])")?.textContent ?? "";

if (!inlineThemeScript) {
  throw new Error("Inline theme script was not found in index.html");
}

export function resetThemeDom(): void {
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";
  document.head.innerHTML = `<meta name="theme-color" content="${THEME_COLORS.dark}" />`;
}

export function runInlineThemeScript(): void {
  // oxlint-disable-next-line typescript/no-implied-eval -- test-only execution of the shipped prepaint script
  new Function(inlineThemeScript)();
}

export function expectTheme(theme: ResolvedTheme): void {
  expect(document.documentElement.dataset.theme).toBe(theme);
  expect(document.documentElement.style.colorScheme).toBe(theme);
  expect(
    document.querySelector('meta[name="theme-color"]')?.getAttribute("content"),
  ).toBe(THEME_COLORS[theme]);
}
