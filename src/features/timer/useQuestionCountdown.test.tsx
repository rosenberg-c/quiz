import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { TIMER_STORAGE_KEY } from "./timer-preference";
import { useQuestionCountdown } from "./useQuestionCountdown";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type Timer = ReturnType<typeof useQuestionCountdown>;
let root: Root | undefined;
let timer: Timer;
let host: HTMLElement;
const onExpire = vi.fn();

function Probe({ id }: { id: string | null }) {
  const value = useQuestionCountdown(id, onExpire);
  useEffect(() => {
    timer = value;
  }, [value]);
  return null;
}

function render(questionKey: string | null): void {
  act(() => root?.render(<Probe id={questionKey} />));
}

function advance(ms: number): void {
  act(() => {
    void vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  localStorage.clear();
  onExpire.mockClear();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.body.replaceChildren();
  localStorage.clear();
  vi.useRealTimers();
});

describe("useQuestionCountdown", () => {
  it("starts from the saved duration and counts elapsed seconds, not renders", () => {
    localStorage.setItem(TIMER_STORAGE_KEY, "5");
    render("first");
    expect(timer.remainingSeconds).toBe(5);
    expect(timer.expired).toBe(false);

    advance(1001);
    expect(timer.remainingSeconds).toBe(4);
    render("first");
    expect(timer.remainingSeconds).toBe(4);
    advance(2999);
    expect(timer.remainingSeconds).toBe(1);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it("stops on selection and never expires after stopping", () => {
    localStorage.setItem(TIMER_STORAGE_KEY, "3");
    render("first");
    advance(1000);
    expect(timer.remainingSeconds).toBe(2);
    expect(timer.stop()).toBe(true);
    expect(timer.stop()).toBe(false);
    advance(10_000);
    expect(timer.remainingSeconds).toBe(2);
    expect(timer.expired).toBe(false);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it("expires exactly once at the deadline", () => {
    localStorage.setItem(TIMER_STORAGE_KEY, "3");
    render("first");
    advance(2999);
    expect(timer.remainingSeconds).toBe(1);
    expect(onExpire).not.toHaveBeenCalled();
    advance(1);
    expect(timer.remainingSeconds).toBe(0);
    expect(timer.expired).toBe(true);
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(timer.stop()).toBe(false);
    advance(10_000);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("rejects a selection at the deadline even before the next timer tick", () => {
    localStorage.setItem(TIMER_STORAGE_KEY, "3");
    render("first");
    // Move the clock independently of the interval to simulate an event at the deadline.
    vi.setSystemTime(new Date("2026-01-01T00:00:03Z"));
    act(() => expect(timer.stop()).toBe(false));
    expect(timer.expired).toBe(true);
    expect(timer.remainingSeconds).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);
    advance(10_000);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("takes a new preference snapshot for each question and cleans up old timers", () => {
    localStorage.setItem(TIMER_STORAGE_KEY, "3");
    render("first");
    advance(1000);
    localStorage.setItem(TIMER_STORAGE_KEY, "7");
    render("first");
    expect(timer.remainingSeconds).toBe(2);
    render("second");
    expect(timer.remainingSeconds).toBe(7);
    advance(3000);
    expect(timer.remainingSeconds).toBe(4);
    expect(onExpire).not.toHaveBeenCalled();
    render(null);
    expect(timer.remainingSeconds).toBeNull();
    advance(10_000);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it("cleans up the interval on unmount", () => {
    render("first");
    act(() => root?.unmount());
    root = undefined;
    advance(20_000);
    expect(onExpire).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
