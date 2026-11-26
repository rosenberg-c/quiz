export const TIMER_DURATIONS = [3, 5, 7, 10, 15, 20] as const;
export type TimerDuration = (typeof TIMER_DURATIONS)[number];
export const DEFAULT_TIMER_DURATION: TimerDuration = 15;
export const TIMER_STORAGE_KEY = "quiz-timer-duration";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): StorageLike | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

export function parseTimerDuration(value: unknown): TimerDuration {
  for (const duration of TIMER_DURATIONS) {
    if (value === String(duration)) {
      return duration;
    }
  }
  return DEFAULT_TIMER_DURATION;
}

export function readTimerDuration(
  storage: StorageLike | undefined = defaultStorage(),
): TimerDuration {
  try {
    return parseTimerDuration(storage?.getItem(TIMER_STORAGE_KEY));
  } catch {
    return DEFAULT_TIMER_DURATION;
  }
}

export function writeTimerDuration(
  duration: TimerDuration,
  storage: StorageLike | undefined = defaultStorage(),
): void {
  try {
    storage?.setItem(TIMER_STORAGE_KEY, String(duration));
  } catch {
    // Keep the selected value in memory when storage is unavailable.
  }
}
