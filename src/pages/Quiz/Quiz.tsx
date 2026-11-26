import { useNavigate } from "react-router";
import { QuizPhase } from "../../features/quiz-session/quiz-session-types";
import { useQuizSession } from "../../features/quiz-session/useQuizSession";
import { paths } from "../../routes";
import { quizContent } from "./Quiz.content";

export const Quiz = () => {
  const { session, cancel } = useQuizSession();
  const navigate = useNavigate();
  const goHome = () => {
    cancel();
    void navigate(paths.home);
  };

  return (
    <section aria-live="polite">
      <h1>{quizContent.title}</h1>
      {session.phase === QuizPhase.idle && <p>{quizContent.noSession}</p>}
      {session.phase === QuizPhase.loading && <p>{quizContent.loading}</p>}
      {session.phase === QuizPhase.error && (
        <p>
          {quizContent.error} ({session.error})
        </p>
      )}
      {session.phase === QuizPhase.ready && (
        <p>
          {quizContent.ready} {session.questions.length} {quizContent.questions}
          , {session.duration} {quizContent.seconds}.
        </p>
      )}
      {session.phase === QuizPhase.results && (
        <p>
          {quizContent.score} {session.score} / {session.questions.length}
        </p>
      )}
      <button type="button" onClick={goHome}>
        {quizContent.homeLink}
      </button>
    </section>
  );
};
