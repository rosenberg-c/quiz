import { useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router";
import type { QuizQuestion } from "../../features/quiz-data/opentdb";
import {
  QuizPhase,
  type QuizSession,
} from "../../features/quiz-session/quiz-session-types";
import { useQuizSession } from "../../features/quiz-session/useQuizSession";
import { useQuestionCountdown } from "../../features/timer/useQuestionCountdown";
import { paths } from "../../routes";
import { quizContent } from "./Quiz.content";
import styles from "./Quiz.module.css";

type ReadyRound = Extract<
  QuizSession,
  { phase: typeof QuizPhase.ready | typeof QuizPhase.results }
>;

const Question = ({
  round,
  answer,
  advance,
}: {
  round: ReadyRound;
  answer: (id: string | null) => void;
  advance: () => void;
}) => {
  const question: QuizQuestion = round.questions[round.index]!;
  const promptRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const previousIndex = useRef(round.index);
  const previousResolution = useRef(round.resolution);
  useLayoutEffect(() => {
    if (previousIndex.current !== round.index) {
      previousIndex.current = round.index;
      promptRef.current?.focus();
    }
  }, [round.index]);
  useLayoutEffect(() => {
    if (previousResolution.current === null && round.resolution !== null) {
      nextRef.current?.focus();
    }
    previousResolution.current = round.resolution;
  }, [round.resolution]);
  const { remainingSeconds, stop } = useQuestionCountdown(
    round.index,
    () => answer(null),
    round.duration,
  );
  const resolve = (id: string) => {
    if (round.resolution === null && stop()) {
      answer(id);
    }
  };
  const feedback =
    round.resolution === null
      ? null
      : round.resolution.answerId === null
        ? quizContent.timeout
        : round.resolution.correct
          ? quizContent.correct
          : quizContent.incorrect;

  return (
    <div className={styles.round}>
      <p className={styles.meta}>
        {question.category} ·{" "}
        {quizContent.progress(round.index + 1, round.questions.length)}
      </p>
      <p className={styles.timer} aria-live="off">
        {quizContent.remaining(remainingSeconds ?? round.duration)}
      </p>
      <h2 className={styles.prompt} ref={promptRef} tabIndex={-1}>
        {question.prompt}
      </h2>
      <div
        className={styles.answers}
        role="group"
        aria-label={quizContent.answers}
      >
        {question.answers.map((choice) => {
          const state =
            round.resolution === null
              ? undefined
              : choice.id === question.correctAnswerId
                ? "correct"
                : choice.id === round.resolution.answerId
                  ? "incorrect"
                  : undefined;
          return (
            <button
              key={choice.id}
              type="button"
              className={styles.answer}
              data-state={state}
              aria-label={
                state === "correct"
                  ? quizContent.correctAnswer(choice.text)
                  : state === "incorrect"
                    ? quizContent.incorrectSelection(choice.text)
                    : choice.text
              }
              disabled={round.resolution !== null}
              onClick={() => resolve(choice.id)}
            >
              {choice.text}
            </button>
          );
        })}
      </div>
      <p className={styles.feedback} role="status">
        {feedback}
      </p>
      {round.resolution !== null && (
        <button
          type="button"
          ref={nextRef}
          className={styles.action}
          onClick={advance}
        >
          {quizContent.next}
        </button>
      )}
    </div>
  );
};

export const Quiz = () => {
  const { session, start, answer, advance, cancel } = useQuizSession();
  const resultsRef = useRef<HTMLHeadingElement>(null);
  const previousPhase = useRef(session.phase);
  useLayoutEffect(() => {
    if (
      previousPhase.current === QuizPhase.ready &&
      session.phase === QuizPhase.results
    ) {
      resultsRef.current?.focus();
    }
    previousPhase.current = session.phase;
  }, [session.phase]);
  const navigate = useNavigate();
  const goHome = () => {
    cancel();
    void navigate(paths.home);
  };

  return (
    <section className={styles.quiz} aria-labelledby="quiz-title">
      <h1
        id="quiz-title"
        ref={resultsRef}
        tabIndex={session.phase === QuizPhase.results ? -1 : undefined}
      >
        {session.phase === QuizPhase.results
          ? quizContent.results
          : quizContent.title}
      </h1>
      {session.phase === QuizPhase.idle && <p>{quizContent.noSession}</p>}
      {session.phase === QuizPhase.loading && (
        <p role="status">{quizContent.loading}</p>
      )}
      {session.phase === QuizPhase.error && (
        <div role="alert">
          <p>{quizContent.error}</p>
          <button
            type="button"
            className={styles.action}
            onClick={() => start(session.category)}
          >
            {quizContent.retry}
          </button>
        </div>
      )}
      {session.phase === QuizPhase.ready && (
        <Question round={session} answer={answer} advance={advance} />
      )}
      {session.phase === QuizPhase.results && (
        <div role="status">
          <p>{quizContent.score(session.score, session.questions.length)}</p>
          <button
            type="button"
            className={styles.action}
            onClick={() => start(session.category)}
          >
            {quizContent.playAgain}
          </button>
        </div>
      )}
      <button type="button" className={styles.home} onClick={goHome}>
        {quizContent.homeLink}
      </button>
    </section>
  );
};
