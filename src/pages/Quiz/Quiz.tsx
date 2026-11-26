import { Link } from "react-router";
import { paths } from "../../routes";
import { quizContent } from "./Quiz.content";

export const Quiz = () => {
  return (
    <section>
      <h1>{quizContent.title}</h1>
      <p>{quizContent.description}</p>
      <Link to={paths.home}>{quizContent.homeLink}</Link>
    </section>
  );
};
