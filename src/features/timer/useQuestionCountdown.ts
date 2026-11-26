import { useCallback, useEffect, useRef, useState } from "react";
import { readTimerDuration, type TimerDuration } from "./timer-preference";

type Countdown = {
  questionKey: string | number | null;
  remainingSeconds: number | null;
  expired: boolean;
};

type ActiveCountdown = {
  deadline: number;
  interval: ReturnType<typeof setInterval>;
};

// Use a distinct key for each question occurrence, even when a question is repeated.
export function useQuestionCountdown(
  questionKey: string | number | null,
  onExpire: () => void,
  duration?: TimerDuration,
): { remainingSeconds: number | null; expired: boolean; stop: () => boolean } {
  const [countdown, setCountdown] = useState<Countdown>({
    questionKey: null,
    remainingSeconds: null,
    expired: false,
  });
  const active = useRef<ActiveCountdown | null>(null);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const expire = useCallback(() => {
    const current = active.current;
    if (current === null) {
      return;
    }
    clearInterval(current.interval);
    active.current = null;
    setCountdown((previous) => ({
      ...previous,
      remainingSeconds: 0,
      expired: true,
    }));
    onExpireRef.current();
  }, []);

  const stop = useCallback((): boolean => {
    const current = active.current;
    if (current === null) {
      return false;
    }
    if (Date.now() >= current.deadline) {
      expire();
      return false;
    }
    clearInterval(current.interval);
    active.current = null;
    return true;
  }, [expire]);

  useEffect(() => {
    if (questionKey === null) {
      return;
    }

    const seconds = duration ?? readTimerDuration();
    const deadline = Date.now() + seconds * 1000;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (remaining === 0) {
        expire();
      } else {
        setCountdown((previous) =>
          previous.remainingSeconds === remaining
            ? previous
            : { ...previous, remainingSeconds: remaining },
        );
      }
    };
    const interval = setInterval(tick, 100);
    active.current = { deadline, interval };
    setCountdown({ questionKey, remainingSeconds: seconds, expired: false });

    return () => {
      clearInterval(interval);
      active.current = null;
    };
  }, [questionKey, duration, expire]);

  return {
    remainingSeconds:
      countdown.questionKey === questionKey ? countdown.remainingSeconds : null,
    expired: countdown.questionKey === questionKey && countdown.expired,
    stop,
  };
}
