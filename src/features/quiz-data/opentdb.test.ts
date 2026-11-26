import { describe, expect, it, vi } from "vite-plus/test";
import {
  fetchQuizQuestions,
  QUIZ_CATEGORY_IDS,
  QuizDataError,
  QuizDataErrorCode,
} from "./opentdb";

const question = () => ({
  category: "General%20Knowledge",
  type: "multiple",
  difficulty: "easy",
  question: "What%20is%201%2B1%3F",
  correct_answer: "2%2520%26%202",
  incorrect_answers: ["1", "3", "4"],
});
const payload = () => ({
  response_code: 0,
  results: Array.from({ length: 10 }, question),
});
const mockFetch = (body: unknown, ok = true) =>
  vi.fn<typeof fetch>().mockResolvedValue({
    ok,
    status: ok ? 200 : 503,
    json: async () => body,
  } as Response);
const request = (fetch: typeof globalThis.fetch, signal?: AbortSignal) =>
  fetchQuizQuestions(9, { fetch, signal, random: () => 0 });
const rejectsCode = async (promise: Promise<unknown>, code: string) => {
  await expect(promise).rejects.toMatchObject({ code });
};

describe("OpenTDB adapter", () => {
  it.each(QUIZ_CATEGORY_IDS)(
    "requests exactly ten for category %i",
    async (id) => {
      const fetch = mockFetch(payload());
      const result = await fetchQuizQuestions(id, { fetch, random: () => 0 });
      expect(fetch).toHaveBeenCalledOnce();
      expect(fetch).toHaveBeenCalledWith(
        `https://opentdb.com/api.php?amount=10&category=${id}&encode=url3986`,
        { signal: undefined },
      );
      expect(result).toHaveLength(10);
      expect(result[0]).toEqual({
        id: "0",
        category: "General Knowledge",
        type: "multiple",
        difficulty: "easy",
        prompt: "What is 1+1?",
        correctAnswerId: "correct",
        answers: [
          { id: "incorrect-0", text: "1" },
          { id: "incorrect-1", text: "3" },
          { id: "incorrect-2", text: "4" },
          { id: "correct", text: "2%20& 2" },
        ],
      });
      expect(result[1]?.id).toBe("1");
    },
  );

  it("supports boolean questions with opposite answers", async () => {
    const data = payload();
    data.results[0] = {
      ...question(),
      type: "boolean",
      correct_answer: "True",
      incorrect_answers: ["False"],
    };
    const questions = await request(mockFetch(data));
    expect(questions[0]?.answers).toEqual([
      { id: "incorrect-0", text: "False" },
      { id: "correct", text: "True" },
    ]);
  });

  it.each([1, 2, 3, 4, 5])("surfaces API code %i", async (responseCode) => {
    await expect(
      request(mockFetch({ response_code: responseCode, results: [] })),
    ).rejects.toMatchObject({
      code: QuizDataErrorCode.apiResponse,
      responseCode,
    });
  });

  it("distinguishes network, HTTP, invalid JSON, and abort", async () => {
    await rejectsCode(
      request(vi.fn<typeof fetch>().mockRejectedValue(new Error("offline"))),
      "network",
    );
    await rejectsCode(request(mockFetch(null, false)), "http");
    await rejectsCode(
      request(
        vi.fn<typeof fetch>().mockResolvedValue({
          ok: true,
          json: () => Promise.reject(new SyntaxError()),
        } as Response),
      ),
      "invalid-json",
    );
    const controller = new AbortController();
    controller.abort();
    const fetch = mockFetch(payload());
    await rejectsCode(request(fetch, controller.signal), "aborted");
    expect(fetch).not.toHaveBeenCalled();
    await rejectsCode(
      request(
        vi
          .fn<typeof fetch>()
          .mockRejectedValue(new DOMException("aborted", "AbortError")),
      ),
      "aborted",
    );
    const pending = new AbortController();
    await rejectsCode(
      request(
        vi.fn<typeof fetch>().mockImplementation(async () => {
          pending.abort();
          return { ok: true, json: async () => payload() } as Response;
        }),
        pending.signal,
      ),
      "aborted",
    );
  });

  it("rejects as aborted when the signal aborts while JSON is pending", async () => {
    let resolveJson!: (value: unknown) => void;
    const pendingJson = new Promise<unknown>((resolve) => {
      resolveJson = resolve;
    });
    let notifyJsonStarted!: () => void;
    const jsonStarted = new Promise<void>((resolve) => {
      notifyJsonStarted = resolve;
    });
    const json = vi.fn(() => {
      notifyJsonStarted();
      return pendingJson;
    });
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue({
      ok: true,
      json,
    } as unknown as Response);
    const controller = new AbortController();
    const result = request(fetch, controller.signal);

    await jsonStarted;
    controller.abort();
    resolveJson(payload());

    await expect(result).rejects.toMatchObject({
      code: QuizDataErrorCode.aborted,
    });
    expect(json).toHaveBeenCalledOnce();
  });

  it.each([
    { response_code: "0", results: Array.from({ length: 10 }, question) },
    { response_code: 6, results: Array.from({ length: 10 }, question) },
    { response_code: 0, results: Array.from({ length: 9 }, question) },
    { response_code: 0, results: null },
    {
      response_code: 0,
      results: Array.from({ length: 10 }, () => ({
        ...question(),
        type: "unknown",
      })),
    },
    {
      response_code: 0,
      results: Array.from({ length: 10 }, () => ({
        ...question(),
        incorrect_answers: ["1"],
      })),
    },
    {
      response_code: 0,
      results: Array.from({ length: 10 }, () => ({
        ...question(),
        incorrect_answers: ["1", "1", "4"],
      })),
    },
    {
      response_code: 0,
      results: Array.from({ length: 10 }, () => ({
        ...question(),
        question: "",
      })),
    },
    {
      response_code: 0,
      results: Array.from({ length: 10 }, () => ({
        ...question(),
        difficulty: null,
      })),
    },
    {
      response_code: 0,
      results: Array.from({ length: 10 }, () => ({
        ...question(),
        type: "boolean",
        incorrect_answers: ["True"],
      })),
    },
  ])("rejects invalid payload %#", async (body) => {
    await rejectsCode(request(mockFetch(body)), "invalid-response");
  });

  it("reports bad percent escapes distinctly", async () => {
    const data = payload();
    data.results[0] = { ...question(), question: "%ZZ" };
    await rejectsCode(request(mockFetch(data)), "invalid-encoding");
  });

  it("rejects an unsupported category before sending a request", async () => {
    const fetch = mockFetch(payload());
    await expect(
      fetchQuizQuestions(999 as 9, { fetch }),
    ).rejects.toBeInstanceOf(QuizDataError);
    expect(fetch).not.toHaveBeenCalled();
  });
});
