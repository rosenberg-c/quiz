import type { ResolvedTheme, ThemePreference } from "./useTheme";

export const STORAGE_KEY = "quiz-theme-preference";
export const THEME_COLORS = {
  dark: "#0b1a2a",
  light: "#e8eef3",
} as const;

const DARK_QUERY = "(prefers-color-scheme: dark)";

type StorageLike = Pick<Storage, "getItem" | "setItem">;
type MediaQueryLike = {
  matches: boolean;
  addEventListener?: MediaQueryList["addEventListener"];
  removeEventListener?: MediaQueryList["removeEventListener"];
  addListener?: MediaQueryList["addListener"];
  removeListener?: MediaQueryList["removeListener"];
};
type MatchMedia = (query: string) => MediaQueryLike | null;

function defaultStorage(): StorageLike | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

function defaultMatchMedia(): MatchMedia | undefined {
  try {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return undefined;
    }
    return (query) => window.matchMedia(query);
  } catch {
    return undefined;
  }
}

export function parseThemePreference(value: unknown): ThemePreference {
  return value === "dark" || value === "light" || value === "system"
    ? value
    : "system";
}

export function readStoredPreference(
  storage: StorageLike | undefined = defaultStorage(),
): ThemePreference {
  if (!storage) {
    return "system";
  }
  try {
    return parseThemePreference(storage.getItem(STORAGE_KEY));
  } catch {
    return "system";
  }
}

export function writeStoredPreference(
  preference: ThemePreference,
  storage: StorageLike | undefined = defaultStorage(),
): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(STORAGE_KEY, preference);
  } catch {
    // Ignore storage access failures.
  }
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === "system") {
    return systemPrefersDark ? "dark" : "light";
  }
  return preference;
}

export function applyTheme(
  theme: ResolvedTheme,
  doc: Document = document,
): void {
  doc.documentElement.dataset.theme = theme;
  doc.documentElement.style.colorScheme = theme;
  doc
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[theme]);
}

export function readSystemPrefersDark(
  matchMedia: MatchMedia | undefined = defaultMatchMedia(),
): boolean {
  if (!matchMedia) {
    return false;
  }
  try {
    return Boolean(matchMedia(DARK_QUERY)?.matches);
  } catch {
    return false;
  }
}

export function subscribeToSystemTheme(
  onChange: (systemPrefersDark: boolean) => void,
  matchMedia: MatchMedia | undefined = defaultMatchMedia(),
): (() => void) | undefined {
  if (!matchMedia) {
    return undefined;
  }

  let media: MediaQueryLike | null;
  try {
    media = matchMedia(DARK_QUERY);
  } catch {
    return undefined;
  }
  if (!media) {
    return undefined;
  }

  const query = media;
  const handleChange = (event: MediaQueryListEvent) => onChange(event.matches);

  if (
    typeof query.addEventListener === "function" &&
    typeof query.removeEventListener === "function"
  ) {
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener?.("change", handleChange);
  }

  if (
    typeof query.addListener === "function" &&
    typeof query.removeListener === "function"
  ) {
    query.addListener(handleChange);
    return () => query.removeListener?.(handleChange);
  }

  return undefined;
}
