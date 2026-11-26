import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
  QuizDataError,
  QuizDataErrorCode,
  type QuizQuestion,
  type fetchQuizQuestions,
} from "../quiz-data/opentdb";
import { QuizSessionProvider } from "./QuizSessionContext";
import { QuizPhase } from "./quiz-session-types";
import { useQuizSession } from "./useQuizSession";

type Session = ReturnType<typeof useQuizSession>;
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined;
let api!: Session;
const questions: QuizQuestion[] = Array.from({ length: 10 }, (_, index) => ({
  id: String(index),
  category: "Music",
  difficulty: "easy",
  type: "boolean",
  prompt: "Prompt",
  answers: [
    { id: "correct", text: "True" },
    { id: "incorrect-0", text: "False" },
  ],
  correctAnswerId: "correct",
}));
const Probe = () => {
  const sessionApi = useQuizSession();
  useEffect(() => {
    api = sessionApi;
  }, [sessionApi]);
  return <div>{sessionApi.session.phase}</div>;
};
const mount = async (load: typeof fetchQuizQuestions) => {
  root = createRoot(document.createElement("div"));
  await act(async () =>
    root?.render(
      <MemoryRouter>
        <QuizSessionProvider load={load}>
          <Probe />
        </QuizSessionProvider>
      </MemoryRouter>,
    ),
  );
};
const deferred = () => {
  let resolve!: (questions: QuizQuestion[]) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<QuizQuestion[]>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  vi.useRealTimers();
});

describe("quiz session", () => {
  it("loads ten questions, captures duration and scores each question only once through results", async () => {
    const load = vi
      .fn<typeof fetchQuizQuestions>()
      .mockResolvedValue(questions);
    await mount(load);
    await act(async () => api.start(12));
    expect(api.session).toMatchObject({
      phase: QuizPhase.ready,
      index: 0,
      score: 0,
      duration: 15,
    });
    act(() => {
      api.answer("invalid");
      api.advance();
    });
    expect(api.session).toMatchObject({ index: 0, score: 0, resolution: null });
    for (let i = 0; i < 10; i++) {
      act(() => {
        api.answer(i === 0 ? null : "correct");
        api.answer("correct");
        api.advance();
      });
    }
    expect(api.session).toMatchObject({ phase: QuizPhase.results, score: 9 });
    act(() => {
      api.answer("correct");
      api.advance();
    });
    expect(api.session).toMatchObject({ phase: QuizPhase.results, score: 9 });
    expect(load).toHaveBeenCalledOnce();
  });

  it("reports typed errors and cancels an in-flight fetch without accepting late data", async () => {
    const pending = deferred();
    const load = vi
      .fn<typeof fetchQuizQuestions>()
      .mockReturnValue(pending.promise);
    await mount(load);
    act(() => {
      api.start(9);
      api.start(9);
    });
    expect(load).toHaveBeenCalledOnce();
    expect(api.session.phase).toBe(QuizPhase.loading);
    const signal = load.mock.calls[0]?.[1]?.signal;
    act(() => api.cancel());
    expect(signal?.aborted).toBe(true);
    await act(async () => pending.resolve(questions));
    expect(api.session.phase).toBe(QuizPhase.idle);
  });

  it("ignores a stale request on restart and respects the five-second API interval", async () => {
    vi.useFakeTimers();
    const first = deferred();
    const load = vi
      .fn<typeof fetchQuizQuestions>()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue(questions);
    await mount(load);
    act(() => {
      api.start(9);
      api.start(12);
    });
    expect(load).toHaveBeenCalledOnce();
    await act(async () =>
      first.reject(new QuizDataError(QuizDataErrorCode.aborted, "aborted")),
    );
    expect(api.session.phase).toBe(QuizPhase.loading);
    await act(async () => vi.advanceTimersByTimeAsync(5000));
    expect(load).toHaveBeenCalledTimes(2);
    expect(api.session).toMatchObject({ phase: QuizPhase.ready, category: 12 });
  });

  it("exposes adapter errors without a fallback round", async () => {
    await mount(
      vi
        .fn<typeof fetchQuizQuestions>()
        .mockRejectedValue(
          new QuizDataError(QuizDataErrorCode.apiResponse, "no questions"),
        ),
    );
    await act(async () => api.start(9));
    expect(api.session).toMatchObject({
      phase: QuizPhase.error,
      error: QuizDataErrorCode.apiResponse,
    });
  });
});
