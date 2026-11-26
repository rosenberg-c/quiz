/** OpenTDB's category IDs currently offered on the home page. */
export const QUIZ_CATEGORY_IDS = [9, 12, 22, 11, 21, 18] as const;
export type QuizCategoryId = (typeof QUIZ_CATEGORY_IDS)[number];

export type QuizQuestion = {
  id: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  type: "multiple" | "boolean";
  prompt: string;
  answers: { id: string; text: string }[];
  correctAnswerId: string;
};

export const QuizDataErrorCode = {
  aborted: "aborted",
  network: "network",
  http: "http",
  invalidJson: "invalid-json",
  invalidResponse: "invalid-response",
  invalidEncoding: "invalid-encoding",
  apiResponse: "api-response",
} as const;

export type QuizDataErrorCode =
  (typeof QuizDataErrorCode)[keyof typeof QuizDataErrorCode];

export class QuizDataError extends Error {
  readonly code: QuizDataErrorCode;
  readonly responseCode?: number;

  constructor(code: QuizDataErrorCode, message: string, responseCode?: number) {
    super(message);
    this.name = "QuizDataError";
    this.code = code;
    this.responseCode = responseCode;
  }
}

type OpenTdbQuestion = {
  category: string;
  type: QuizQuestion["type"];
  difficulty: QuizQuestion["difficulty"];
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
};

function invalidResponse(): never {
  throw new QuizDataError(
    QuizDataErrorCode.invalidResponse,
    "Invalid OpenTDB response",
  );
}

function decode(value: string): string {
  try {
    const decoded = decodeURIComponent(value);
    if (!decoded.trim()) {
      invalidResponse();
    }
    return decoded;
  } catch (error) {
    if (error instanceof QuizDataError) {
      throw error;
    }
    throw new QuizDataError(
      QuizDataErrorCode.invalidEncoding,
      "Invalid OpenTDB URL encoding",
    );
  }
}

function isQuestion(value: unknown): value is OpenTdbQuestion {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const item = value as Record<string, unknown>;
  const incorrectCount =
    item.type === "multiple" ? 3 : item.type === "boolean" ? 1 : -1;
  return (
    typeof item.category === "string" &&
    (item.difficulty === "easy" ||
      item.difficulty === "medium" ||
      item.difficulty === "hard") &&
    typeof item.question === "string" &&
    typeof item.correct_answer === "string" &&
    Array.isArray(item.incorrect_answers) &&
    item.incorrect_answers.length === incorrectCount &&
    item.incorrect_answers.every(
      (answer: unknown) => typeof answer === "string",
    )
  );
}

function shuffle<T>(items: T[], random: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new RangeError("Random source must return a number in [0, 1)");
    }
    const j = Math.floor(value * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function normalize(
  value: unknown,
  index: number,
  random: () => number,
): QuizQuestion {
  if (!isQuestion(value)) {
    invalidResponse();
  }
  const category = decode(value.category);
  const prompt = decode(value.question);
  const correct = decode(value.correct_answer);
  const incorrect = value.incorrect_answers.map(decode);
  const answerTexts = [correct, ...incorrect];
  if (new Set(answerTexts).size !== answerTexts.length) {
    invalidResponse();
  }
  if (
    value.type === "boolean" &&
    !(correct === "True" && incorrect[0] === "False") &&
    !(correct === "False" && incorrect[0] === "True")
  ) {
    invalidResponse();
  }
  return {
    id: String(index),
    category,
    type: value.type,
    difficulty: value.difficulty,
    prompt,
    correctAnswerId: "correct",
    answers: shuffle(
      answerTexts.map((text, answerIndex) => ({
        id: answerIndex === 0 ? "correct" : `incorrect-${answerIndex - 1}`,
        text,
      })),
      random,
    ),
  };
}

function isAbort(error: unknown, signal?: AbortSignal): boolean {
  return (
    signal?.aborted === true ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AbortError")
  );
}

/** Fetch one full category round; no token, retries, or fallback questions. */
export async function fetchQuizQuestions(
  categoryId: QuizCategoryId,
  options: {
    signal?: AbortSignal;
    fetch?: typeof fetch;
    random?: () => number;
  } = {},
): Promise<QuizQuestion[]> {
  if (!QUIZ_CATEGORY_IDS.includes(categoryId)) {
    invalidResponse();
  }
  const { signal, fetch: fetcher = fetch, random = Math.random } = options;
  if (signal?.aborted) {
    throw new QuizDataError(
      QuizDataErrorCode.aborted,
      "OpenTDB request aborted",
    );
  }
  let response: Response;
  try {
    response = await fetcher(
      `https://opentdb.com/api.php?amount=10&category=${categoryId}&encode=url3986`,
      { signal },
    );
  } catch (error) {
    throw new QuizDataError(
      isAbort(error, signal)
        ? QuizDataErrorCode.aborted
        : QuizDataErrorCode.network,
      isAbort(error, signal)
        ? "OpenTDB request aborted"
        : "OpenTDB network failure",
    );
  }
  if (signal?.aborted) {
    throw new QuizDataError(
      QuizDataErrorCode.aborted,
      "OpenTDB request aborted",
    );
  }
  if (!response.ok) {
    throw new QuizDataError(
      QuizDataErrorCode.http,
      `OpenTDB HTTP ${response.status}`,
    );
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    throw new QuizDataError(
      isAbort(error, signal)
        ? QuizDataErrorCode.aborted
        : QuizDataErrorCode.invalidJson,
      isAbort(error, signal)
        ? "OpenTDB request aborted"
        : "Invalid OpenTDB JSON",
    );
  }
  if (signal?.aborted) {
    throw new QuizDataError(
      QuizDataErrorCode.aborted,
      "OpenTDB request aborted",
    );
  }
  if (typeof payload !== "object" || payload === null) {
    invalidResponse();
  }
  const data = payload as Record<string, unknown>;
  if (
    !Number.isInteger(data.response_code) ||
    typeof data.response_code !== "number" ||
    data.response_code < 0 ||
    data.response_code > 5
  ) {
    invalidResponse();
  }
  if (data.response_code !== 0) {
    throw new QuizDataError(
      QuizDataErrorCode.apiResponse,
      `OpenTDB response ${data.response_code}`,
      data.response_code,
    );
  }
  if (!Array.isArray(data.results) || data.results.length !== 10) {
    invalidResponse();
  }
  return data.results.map((item: unknown, index: number) =>
    normalize(item, index, random),
  );
}
