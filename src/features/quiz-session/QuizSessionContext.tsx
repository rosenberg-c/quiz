import { useLocation } from "react-router";
import { paths } from "../../routes";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  fetchQuizQuestions,
  QuizDataError,
  QuizDataErrorCode,
  type QuizCategoryId,
} from "../quiz-data/opentdb";
import { readTimerDuration } from "../timer/timer-preference";
import { QuizPhase, type QuizSession } from "./quiz-session-types";
import { QuizSessionContext } from "./useQuizSession";
const REQUEST_INTERVAL_MS = 5000;

export const QuizSessionProvider = ({
  children,
  load = fetchQuizQuestions,
}: {
  children: ReactNode;
  load?: typeof fetchQuizQuestions;
}) => {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  const [session, setSession] = useState<QuizSession>({
    phase: QuizPhase.idle,
  });
  const current = useRef<QuizSession>(session);
  const pending = useRef<AbortController | null>(null);
  const delay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const lastRequest = useRef(-Infinity);

  const update = useCallback((next: QuizSession) => {
    current.current = next;
    setSession(next);
  }, []);

  const stopPending = useCallback(() => {
    generation.current += 1;
    pending.current?.abort();
    pending.current = null;
    if (delay.current !== null) {
      clearTimeout(delay.current);
      delay.current = null;
    }
  }, []);

  useEffect(() => () => stopPending(), [stopPending]);

  const cancel = useCallback(() => {
    stopPending();
    update({ phase: QuizPhase.idle });
  }, [stopPending, update]);

  useEffect(() => {
    if (
      previousPath.current === paths.quiz &&
      pathname !== paths.quiz &&
      current.current.phase !== QuizPhase.idle
    ) {
      cancel();
    }
    previousPath.current = pathname;
  }, [pathname, cancel]);

  const start = useCallback(
    (category: QuizCategoryId) => {
      if (
        current.current.phase === QuizPhase.loading &&
        current.current.category === category
      ) {
        return;
      }
      stopPending();
      const requestId = generation.current;
      const duration = readTimerDuration();
      update({ phase: QuizPhase.loading, category, duration });

      const request = async () => {
        delay.current = null;
        const controller = new AbortController();
        pending.current = controller;
        lastRequest.current = Date.now();
        try {
          const questions = await load(category, { signal: controller.signal });
          if (generation.current !== requestId || controller.signal.aborted) {
            return;
          }
          if (questions.length !== 10) {
            throw new QuizDataError(
              QuizDataErrorCode.invalidResponse,
              "Expected ten questions",
            );
          }
          update({
            phase: QuizPhase.ready,
            category,
            duration,
            questions,
            index: 0,
            score: 0,
            resolution: null,
          });
        } catch (error) {
          if (generation.current !== requestId || controller.signal.aborted) {
            return;
          }
          update({
            phase: QuizPhase.error,
            category,
            duration,
            error:
              error instanceof QuizDataError
                ? error.code
                : QuizDataErrorCode.network,
          });
        } finally {
          if (generation.current === requestId) {
            pending.current = null;
          }
        }
      };
      const wait = Math.max(
        0,
        REQUEST_INTERVAL_MS - (Date.now() - lastRequest.current),
      );
      if (wait > 0) {
        delay.current = setTimeout(request, wait);
      } else {
        void request();
      }
    },
    [load, stopPending, update],
  );

  const answer = useCallback(
    (answerId: string | null) => {
      const state = current.current;
      if (state.phase !== QuizPhase.ready || state.resolution !== null) {
        return;
      }
      const question = state.questions[state.index];
      if (
        !question ||
        (answerId !== null &&
          !question.answers.some((choice) => choice.id === answerId))
      ) {
        return;
      }
      const correct = answerId === question.correctAnswerId;
      update({
        ...state,
        resolution: { answerId, correct },
        score: state.score + (correct ? 1 : 0),
      });
    },
    [update],
  );

  const advance = useCallback(() => {
    const state = current.current;
    if (state.phase !== QuizPhase.ready || state.resolution === null) {
      return;
    }
    if (state.index === state.questions.length - 1) {
      update({ ...state, phase: QuizPhase.results });
    } else {
      update({ ...state, index: state.index + 1, resolution: null });
    }
  }, [update]);

  return (
    <QuizSessionContext.Provider
      value={{ session, start, answer, advance, cancel }}
    >
      {children}
    </QuizSessionContext.Provider>
  );
};
