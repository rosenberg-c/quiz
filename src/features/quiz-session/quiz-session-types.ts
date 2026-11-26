import type {
  QuizCategoryId,
  QuizQuestion,
  QuizDataErrorCode,
} from "../quiz-data/opentdb";
import type { TimerDuration } from "../timer/timer-preference";

export const QuizPhase = {
  idle: "idle",
  loading: "loading",
  ready: "ready",
  error: "error",
  results: "results",
} as const;

type Round = {
  category: QuizCategoryId;
  duration: TimerDuration;
  questions: QuizQuestion[];
  index: number;
  score: number;
  resolution: { answerId: string | null; correct: boolean } | null;
};

export type QuizSession =
  | { phase: typeof QuizPhase.idle }
  | {
      phase: typeof QuizPhase.loading;
      category: QuizCategoryId;
      duration: TimerDuration;
    }
  | {
      phase: typeof QuizPhase.error;
      category: QuizCategoryId;
      duration: TimerDuration;
      error: QuizDataErrorCode;
    }
  | (Round & { phase: typeof QuizPhase.ready | typeof QuizPhase.results });

export type SessionContext = {
  session: QuizSession;
  start: (category: QuizCategoryId) => void;
  answer: (answerId: string | null) => void;
  advance: () => void;
  cancel: () => void;
};
