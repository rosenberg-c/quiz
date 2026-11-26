import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";

import {
  applyTheme,
  readStoredPreference,
  readSystemPrefersDark,
  resolveTheme,
  STORAGE_KEY,
  subscribeToSystemTheme,
  writeStoredPreference,
} from "./theme-core";
import { ThemeProvider } from "./ThemeContext";
import { ThemeSelector } from "./ThemeSelector";
import {
  expectTheme,
  resetThemeDom,
  runInlineThemeScript,
} from "./theme-test-utils";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type Listener = (event: MediaQueryListEvent) => void;

function storage(initial?: string): void {
  const values = new Map<string, string>();
  if (initial !== undefined) {
    values.set(STORAGE_KEY, initial);
  }
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  });
}

function matchMedia(initial = false) {
  let matches = initial;
  const listeners = new Set<Listener>();
  const query = {
    get matches() {
      return matches;
    },
    addEventListener: (_type: string, listener: Listener) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: Listener) => {
      listeners.delete(listener);
    },
  } as unknown as MediaQueryList;

  vi.stubGlobal("matchMedia", () => query);

  return {
    emit(next: boolean) {
      matches = next;
      listeners.forEach((listener) =>
        listener({ matches: next } as MediaQueryListEvent),
      );
    },
    count: () => listeners.size,
  };
}

let root: Root | undefined;

function mount(): HTMLElement {
  const host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root?.render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>,
    ),
  );
  return host;
}

function select(host: HTMLElement): HTMLSelectElement {
  return host.querySelector("select")!;
}

function choose(host: HTMLElement, value: string): void {
  const element = select(host);
  act(() => {
    element.value = value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

beforeEach(() => {
  resetThemeDom();
});

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  resetThemeDom();
});

describe("theme core", () => {
  it("reads validated preferences and survives storage failures", () => {
    const fail = (): never => {
      throw new Error("denied");
    };
    const values = new Map([[STORAGE_KEY, "light"]]);
    const store = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };

    expect(readStoredPreference(store)).toBe("light");
    values.set(STORAGE_KEY, "sepia");
    expect(readStoredPreference(store)).toBe("system");
    expect(readStoredPreference({ ...store, getItem: fail })).toBe("system");
    expect(() =>
      writeStoredPreference("dark", { ...store, setItem: fail }),
    ).not.toThrow();
  });

  it("falls back when system detection fails", () => {
    const fail = (): never => {
      throw new Error("unavailable");
    };

    expect(readSystemPrefersDark(fail)).toBe(false);
    expect(readSystemPrefersDark(() => null)).toBe(false);
    expect(subscribeToSystemTheme(vi.fn(), fail)).toBeUndefined();
  });
});

describe("prepaint parity", () => {
  it("matches the shipped inline script before React mounts", () => {
    const cases = [
      [undefined, false, "light"],
      [undefined, true, "dark"],
      ["dark", false, "dark"],
      ["light", true, "light"],
      ["system", true, "dark"],
      ["sepia", false, "light"],
    ] as const;

    for (const [stored, dark, expected] of cases) {
      storage(stored);
      vi.stubGlobal("matchMedia", () => ({ matches: dark }));
      resetThemeDom();

      runInlineThemeScript();
      expectTheme(expected);
      resetThemeDom();
      applyTheme(resolveTheme(readStoredPreference(), readSystemPrefersDark()));
      expectTheme(expected);
      vi.unstubAllGlobals();
    }
  });
});

describe("ThemeProvider", () => {
  it("starts from the OS and persists selector changes", () => {
    storage("system");
    matchMedia(true);
    const host = mount();
    const element = select(host);

    expect(element.value).toBe("system");
    expect(host.querySelector("label")?.htmlFor).toBe(element.id);
    expectTheme("dark");

    choose(host, "light");
    expect(readStoredPreference()).toBe("light");
    expectTheme("light");
  });

  it("follows OS changes and unsubscribes on unmount", () => {
    storage("system");
    const media = matchMedia(false);
    mount();
    expectTheme("light");

    act(() => media.emit(true));
    expectTheme("dark");
    expect(media.count()).toBe(1);

    act(() => root?.unmount());
    root = undefined;
    expect(media.count()).toBe(0);
  });

  it("survives storage and matchMedia failures", () => {
    const fail = (): never => {
      throw new Error("denied");
    };
    vi.stubGlobal("localStorage", { getItem: fail, setItem: fail });
    vi.stubGlobal("matchMedia", fail);

    expect(select(mount()).value).toBe("system");
    expectTheme("light");
  });
});
