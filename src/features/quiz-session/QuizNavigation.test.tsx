import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { fetchQuizQuestions, QuizQuestion } from "../quiz-data/opentdb";
import { SiteLayout } from "../site-layout/SiteLayout";
import { ThemeContext } from "../theme/useTheme";
import { Home } from "../../pages/Home/Home";
import { Quiz } from "../../pages/Quiz/Quiz";
import { Settings } from "../../pages/Settings/Settings";
import { paths } from "../../routes";
import { QuizSessionProvider } from "./QuizSessionContext";
import { useQuizSession } from "./useQuizSession";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let navigateHistory!: ReturnType<typeof useNavigate>;
const questions: QuizQuestion[] = Array.from({ length: 10 }, (_, index) => ({
  id: String(index),
  category: "Music",
  difficulty: "easy",
  type: "boolean",
  prompt: "Prompt",
  answers: [
    { id: "correct", text: "True" },
    { id: "incorrect", text: "False" },
  ],
  correctAnswerId: "correct",
}));

const Probe = () => {
  const navigate = useNavigate();
  const { session } = useQuizSession();
  useEffect(() => {
    navigateHistory = navigate;
  }, [navigate]);
  return <output data-testid="phase">{session.phase}</output>;
};

const phase = (host: HTMLElement) =>
  host.querySelector('[data-testid="phase"]')?.textContent;

const mount = async (
  load: typeof fetchQuizQuestions,
  initialPath: string = paths.home,
) => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () =>
    root?.render(
      <MemoryRouter initialEntries={[initialPath]}>
        <ThemeContext.Provider
          value={{
            preference: "system",
            resolvedTheme: "light",
            setPreference: () => {},
          }}
        >
          <QuizSessionProvider load={load}>
            <Probe />
            <Routes>
              <Route element={<SiteLayout />}>
                <Route index element={<Home />} />
                <Route path={paths.quiz} element={<Quiz />} />
                <Route path={paths.settings} element={<Settings />} />
              </Route>
            </Routes>
          </QuizSessionProvider>
        </ThemeContext.Provider>
      </MemoryRouter>,
    ),
  );
  return host;
};

const startMusic = async (host: HTMLElement) => {
  const button = host.querySelector<HTMLButtonElement>(
    'button[aria-label="Start quiz: Music"]',
  )!;
  await act(async () => button.click());
};

const headerLink = (host: HTMLElement, name: string) =>
  [...host.querySelectorAll<HTMLAnchorElement>("nav a")].find(
    (link) => link.textContent === name,
  )!;

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.body.replaceChildren();
});

describe("quiz navigation", () => {
  it("starts from Home without cancellation, then cancels pending work via header Settings and rejects late data", async () => {
    let resolve!: (value: QuizQuestion[]) => void;
    const load = vi.fn<typeof fetchQuizQuestions>().mockImplementation(
      () =>
        new Promise((yes) => {
          resolve = yes;
        }),
    );
    const host = await mount(load);
    await startMusic(host);
    expect(phase(host)).toBe("loading");
    expect(load).toHaveBeenCalledOnce();
    const signal = load.mock.calls[0]?.[1]?.signal;
    expect(signal?.aborted).toBe(false);
    await act(async () => headerLink(host, "Settings").click());
    expect(phase(host)).toBe("idle");
    expect(signal?.aborted).toBe(true);
    await act(async () => resolve(questions));
    expect(phase(host)).toBe("idle");
    act(() => void navigateHistory(-1));
    expect(phase(host)).toBe("idle");
    expect(host.textContent).toContain("Choose a category on Home");
  });

  it("cancels a ready round on header Home and does not restore it on back/forward", async () => {
    const host = await mount(
      vi.fn<typeof fetchQuizQuestions>().mockResolvedValue(questions),
    );
    await startMusic(host);
    expect(phase(host)).toBe("ready");
    act(() => headerLink(host, "Home").click());
    expect(phase(host)).toBe("idle");
    act(() => void navigateHistory(-1));
    expect(phase(host)).toBe("idle");
    expect(host.textContent).toContain("Choose a category on Home");
    act(() => void navigateHistory(1));
    expect(phase(host)).toBe("idle");
  });

  it("opens a direct Quiz visit in a safe idle state", async () => {
    const load = vi.fn<typeof fetchQuizQuestions>();
    const host = await mount(load, paths.quiz);
    expect(phase(host)).toBe("idle");
    expect(host.textContent).toContain("Choose a category on Home");
    expect(load).not.toHaveBeenCalled();
  });

  it("cancels on history navigation away from Quiz and keeps explicit Back safe", async () => {
    const host = await mount(
      vi.fn<typeof fetchQuizQuestions>().mockResolvedValue(questions),
    );
    await startMusic(host);
    act(() => void navigateHistory("/elsewhere"));
    expect(phase(host)).toBe("idle");
    act(() => void navigateHistory(-1));
    expect(phase(host)).toBe("idle");
    act(() => void navigateHistory(-1));
    expect(phase(host)).toBe("idle");
    act(() => void navigateHistory(1));
    expect(phase(host)).toBe("idle");
    act(() => void navigateHistory(-1));
    await startMusic(host);
    act(() => host.querySelector<HTMLButtonElement>("main button")?.click());
    expect(phase(host)).toBe("idle");
  });
});
