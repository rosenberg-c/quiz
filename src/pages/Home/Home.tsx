import { homeContent } from "./Home.content";

export const Home = () => {
  return (
    <section>
      <h1>{homeContent.title}</h1>
      <p>{homeContent.description}</p>
      <h2>{homeContent.categoriesHeading}</h2>
      <ul>
        {homeContent.categories.map((category) => (
          <li key={category}>{category}</li>
        ))}
      </ul>
    </section>
  );
};
