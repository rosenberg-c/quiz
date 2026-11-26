import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import {
  QuizDataError,
  QuizDataErrorCode,
  type QuizQuestion,
  type fetchQuizQuestions,
} from "../../features/quiz-data/opentdb";
import { QuizSessionProvider } from "../../features/quiz-session/QuizSessionContext";
import { useQuizSession } from "../../features/quiz-session/useQuizSession";
import { TIMER_STORAGE_KEY } from "../../features/timer/timer-preference";
import { paths } from "../../routes";
import { Quiz } from "./Quiz";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const questions: QuizQuestion[] = Array.from({ length: 10 }, (_, index) => ({
  id: String(index),
  category: "Music",
  difficulty: "easy",
  type: index === 0 ? "multiple" : "boolean",
  prompt: `Question ${index + 1}?`,
  answers:
    index === 0
      ? [
          { id: "wrong-1", text: "Wrong" },
          { id: "correct", text: "Right" },
          { id: "wrong-2", text: "Another" },
          { id: "wrong-3", text: "Other" },
        ]
      : [
          { id: "wrong", text: "False" },
          { id: "correct", text: "True" },
        ],
  correctAnswerId: "correct",
}));
let root: Root | undefined;
let host: HTMLElement;
const Controls = () => {
  const { start } = useQuizSession();
  return (
    <button type="button" onClick={() => start(12)}>
      Start
    </button>
  );
};
const mount = async (
  load: typeof fetchQuizQuestions,
  path: string = paths.home,
) => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () =>
    root?.render(
      <MemoryRouter initialEntries={[path]}>
        <QuizSessionProvider load={load}>
          <Routes>
            <Route path={paths.home} element={<Controls />} />
            <Route path={paths.quiz} element={<Quiz />} />
          </Routes>
        </QuizSessionProvider>
      </MemoryRouter>,
    ),
  );
};
const button = (text: string) =>
  [...host.querySelectorAll<HTMLButtonElement>("button")].find(
    (item) => item.textContent === text,
  )!;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(TIMER_STORAGE_KEY, "3");
});
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.body.replaceChildren();
  localStorage.clear();
  vi.useRealTimers();
});

// Start the round from inside the quiz route while retaining the mounted provider.
const Starter = () => {
  const { start } = useQuizSession();
  return (
    <button type="button" onClick={() => start(12)}>
      Start
    </button>
  );
};
const startQuiz = async (load: typeof fetchQuizQuestions) => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () =>
    root?.render(
      <MemoryRouter initialEntries={[paths.quiz]}>
        <QuizSessionProvider load={load}>
          <Starter />
          <Routes>
            <Route path={paths.home} element={<p>Home page</p>} />
            <Route path={paths.quiz} element={<Quiz />} />
          </Routes>
        </QuizSessionProvider>
      </MemoryRouter>,
    ),
  );
  await act(async () => button("Start").click());
};

describe("Quiz screen", () => {
  it("focuses Next on resolution and the next prompt after keyboard activation without taking focus on loading", async () => {
    let finish!: (items: QuizQuestion[]) => void;
    const load = vi.fn<typeof fetchQuizQuestions>().mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await startQuiz(load);
    const home = button("Back to Home");
    home.focus();
    expect(host.textContent).toContain("Loading questions");
    expect(document.activeElement).toBe(home);
    await act(async () => finish(questions));
    expect(document.activeElement).toBe(home);

    const answer = button("Wrong");
    answer.focus();
    // happy-dom does not perform the browser's default Enter-to-click action.
    act(() => {
      answer.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
      answer.click();
    });
    const next = button("Next");
    expect(answer.disabled).toBe(true);
    expect(document.activeElement).toBe(next);
    // happy-dom does not perform the browser's default Enter-to-click action.
    act(() => {
      next.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
      next.click();
    });
    const prompt = host.querySelector<HTMLHeadingElement>("h2")!;
    expect(prompt.textContent).toBe("Question 2?");
    expect(prompt.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(prompt);
    const answers = [
      ...host.querySelectorAll<HTMLButtonElement>("button"),
    ].filter(
      (item) => item.textContent === "False" || item.textContent === "True",
    );
    expect(answers).toHaveLength(2);
    expect(answers.every((item) => !item.disabled && item.tabIndex === 0)).toBe(
      true,
    );
    expect(
      prompt.compareDocumentPosition(answers[0]!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    answers[0]!.focus();
    expect(document.activeElement).toBe(answers[0]);
  });

  it("focuses Next after a timeout", async () => {
    vi.useFakeTimers();
    await startQuiz(
      vi.fn<typeof fetchQuizQuestions>().mockResolvedValue(questions),
    );
    const home = button("Back to Home");
    home.focus();
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(document.activeElement).toBe(home);
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(host.textContent).toContain("Time is up");
    expect(document.activeElement).toBe(button("Next"));
  });

  it("renders shuffled answer order by id, freezes correct and wrong selections and advances", async () => {
    await startQuiz(
      vi.fn<typeof fetchQuizQuestions>().mockResolvedValue(questions),
    );
    expect(host.textContent).toContain("Music · Question 1 of 10");
    expect(host.textContent).toContain("3 seconds remaining");
    expect(host.textContent).toContain("Question 1?");
    expect(button("Right")).toBeTruthy();
    expect(button("Wrong")).toBeTruthy();
    expect(button("Next")).toBeUndefined();
    await act(async () => button("Wrong").click());
    expect(button("Wrong").dataset.state).toBe("incorrect");
    expect(button("Right").dataset.state).toBe("correct");
    expect(button("Wrong").disabled).toBe(true);
    expect(button("Another").disabled).toBe(true);
    expect(host.textContent).toContain("Incorrect");
    act(() => button("Next").click());
    expect(host.textContent).toContain("Question 2 of 10");
    expect(button("True").disabled).toBe(false);
    act(() => button("True").click());
    expect(button("True").dataset.state).toBe("correct");
    expect(host.textContent).toContain("Correct!");
  });

  it("times out, reveals correct answer, and ignores a selection at the deadline", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01"));
    await startQuiz(
      vi.fn<typeof fetchQuizQuestions>().mockResolvedValue(questions),
    );
    vi.setSystemTime(new Date("2026-01-01T00:00:03Z"));
    act(() => button("Wrong").click());
    expect(host.textContent).toContain("Time is up");
    expect(button("Right").dataset.state).toBe("correct");
    expect(button("Wrong").dataset.state).toBeUndefined();
    expect(button("Wrong").disabled).toBe(true);
    expect(host.textContent).toContain("0 seconds remaining");
  });

  it("expires automatically and keeps the score unchanged after a wrong answer", async () => {
    vi.useFakeTimers();
    await startQuiz(
      vi.fn<typeof fetchQuizQuestions>().mockResolvedValue(questions),
    );
    act(() => button("Wrong").click());
    await act(async () => vi.advanceTimersByTimeAsync(3000));
    expect(host.textContent).toContain("Incorrect");
    act(() => button("Next").click());
    await act(async () => vi.advanceTimersByTimeAsync(3000));
    expect(host.textContent).toContain("Time is up");
    expect(button("True").dataset.state).toBe("correct");
    expect(button("False").disabled).toBe(true);
  });

  it("finishes ten questions and replays with a fresh rate-limited request", async () => {
    vi.useFakeTimers();
    const load = vi
      .fn<typeof fetchQuizQuestions>()
      .mockResolvedValue(questions);
    await startQuiz(load);
    for (let index = 0; index < 10; index++) {
      act(() => button(index === 0 ? "Right" : "True").click());
      const next = button("Next");
      expect(document.activeElement).toBe(next);
      act(() => {
        if (index === 9) {
          next.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
          );
        }
        next.click();
      });
    }
    const results = host.querySelector<HTMLHeadingElement>("h1")!;
    expect(results.textContent).toBe("Results");
    expect(results.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(results);
    expect(host.textContent).toContain("Score: 10 / 10");
    act(() => button("Play Again").click());
    expect(host.textContent).toContain("Loading questions");
    expect(load).toHaveBeenCalledOnce();
    await act(async () => vi.advanceTimersByTimeAsync(5000));
    expect(load).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain("Question 1 of 10");
    expect(button("Right").disabled).toBe(false);
  });

  it("handles request failures with retry, and cancels to Home", async () => {
    const load = vi
      .fn<typeof fetchQuizQuestions>()
      .mockRejectedValueOnce(
        new QuizDataError(QuizDataErrorCode.network, "offline"),
      )
      .mockResolvedValue(questions);
    await startQuiz(load);
    expect(host.textContent).toContain("Could not load questions");
    await act(async () => button("Retry").click());
    expect(host.textContent).toContain("Loading questions");
    act(() => button("Back to Home").click());
    expect(host.textContent).toContain("Home page");
  });

  it("retries a failed request after the API interval", async () => {
    vi.useFakeTimers();
    const load = vi
      .fn<typeof fetchQuizQuestions>()
      .mockRejectedValueOnce(
        new QuizDataError(QuizDataErrorCode.network, "offline"),
      )
      .mockResolvedValue(questions);
    await startQuiz(load);
    act(() => button("Retry").click());
    expect(load).toHaveBeenCalledOnce();
    await act(async () => vi.advanceTimersByTimeAsync(5000));
    expect(load).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain("Question 1 of 10");
  });

  it("keeps a direct idle visit safe", async () => {
    const load = vi.fn<typeof fetchQuizQuestions>();
    await mount(load, paths.quiz);
    expect(host.textContent).toContain("Choose a category on Home");
    expect(load).not.toHaveBeenCalled();
    act(() => button("Back to Home").click());
    expect(host.textContent).toContain("Start");
  });
});
