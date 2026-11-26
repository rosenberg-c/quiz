import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { QuizSessionProvider } from "../../features/quiz-session/QuizSessionContext";
import { Home } from "./Home";
import { homeContent } from "./Home.content";
import { Quiz } from "../Quiz/Quiz";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined;

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.body.replaceChildren();
});

describe("Home", () => {
  it("starts the selected category once and navigates to the loading view", async () => {
    let finish!: (questions: never[]) => void;
    const load = vi
      .fn<
        typeof import("../../features/quiz-data/opentdb").fetchQuizQuestions
      >()
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
    const host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () =>
      root?.render(
        <MemoryRouter>
          <QuizSessionProvider load={load}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/quiz" element={<Quiz />} />
            </Routes>
          </QuizSessionProvider>
        </MemoryRouter>,
      ),
    );
    expect(host.querySelectorAll("button")).toHaveLength(6);
    expect(homeContent.categories).toHaveLength(6);
    expect(
      [...host.querySelectorAll("button")].map((button) =>
        button.getAttribute("aria-label"),
      ),
    ).toEqual(
      homeContent.categories.map(
        (category) => `${homeContent.startLabel}: ${category.name}`,
      ),
    );
    await act(async () => host.querySelectorAll("button")[1]?.click());
    expect(load).toHaveBeenCalledOnce();
    expect(load.mock.calls[0]?.[0]).toBe(12);
    expect(host.textContent).toContain("Loading questions");
    await act(async () => finish([]));
    expect(host.textContent).toContain("Could not load questions");
    await act(async () => host.querySelector("button")?.click());
    expect(host.textContent).toContain(homeContent.title);
  });
});
