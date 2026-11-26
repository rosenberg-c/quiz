import { Link } from "react-router";
import { paths } from "../../routes";
import { notFoundContent } from "./NotFound.content";

export const NotFound = () => {
  return (
    <section>
      <h1>{notFoundContent.title}</h1>
      <Link to={paths.home}>{notFoundContent.homeLink}</Link>
    </section>
  );
};
