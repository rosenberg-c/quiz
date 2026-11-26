import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
  DEFAULT_TIMER_DURATION,
  readTimerDuration,
  TIMER_DURATIONS,
  TIMER_STORAGE_KEY,
  writeTimerDuration,
} from "../../features/timer/timer-preference";
import { Settings } from "./Settings";
import { settingsContent } from "./Settings.content";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;

function mount(): HTMLElement {
  const host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root?.render(<Settings />));
  return host;
}

function radios(host: HTMLElement): HTMLInputElement[] {
  return [...host.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
}

function select(host: HTMLElement, value: number): void {
  const radio = radios(host).find((input) => input.value === String(value))!;
  act(() => radio.click());
}

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("timer preference", () => {
  it("defaults for missing or invalid saved values", () => {
    expect(readTimerDuration()).toBe(DEFAULT_TIMER_DURATION);
    for (const invalid of ["0", "25", "03", "3.0", "abc", "", "null"]) {
      localStorage.setItem(TIMER_STORAGE_KEY, invalid);
      expect(readTimerDuration()).toBe(DEFAULT_TIMER_DURATION);
    }
    for (const allowed of TIMER_DURATIONS) {
      localStorage.setItem(TIMER_STORAGE_KEY, String(allowed));
      expect(readTimerDuration()).toBe(allowed);
    }
  });

  it("does not crash when storage access fails", () => {
    const fail = (): never => {
      throw new Error("denied");
    };
    vi.stubGlobal("localStorage", { getItem: fail, setItem: fail });
    expect(readTimerDuration()).toBe(DEFAULT_TIMER_DURATION);
    expect(() => writeTimerDuration(3)).not.toThrow();
    const host = mount();
    select(host, 7);
    expect(radios(host).find((radio) => radio.value === "7")?.checked).toBe(
      true,
    );
  });
});

describe("Settings", () => {
  it("offers one labelled radio group, persists changes and reloads the saved choice", () => {
    const host = mount();
    const options = radios(host);
    expect(host.querySelector("legend")?.textContent).toBe(
      settingsContent.timerHeading,
    );
    expect(options.map((option) => Number(option.value))).toEqual([
      ...TIMER_DURATIONS,
    ]);
    expect(
      options.every(
        (option) =>
          option.name === "timer-duration" && option.labels?.length === 1,
      ),
    ).toBe(true);
    expect(options.find((option) => option.checked)?.value).toBe("15");

    select(host, 5);
    expect(readTimerDuration()).toBe(5);
    expect(options.find((option) => option.checked)?.value).toBe("5");

    act(() => root?.unmount());
    root = undefined;
    const reloaded = mount();
    expect(radios(reloaded).find((option) => option.checked)?.value).toBe("5");
  });
});
