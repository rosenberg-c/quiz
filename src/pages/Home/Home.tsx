import { CategoryCard } from "./components/CategoryCard/CategoryCard";
import { homeContent } from "./Home.content";
import styles from "./Home.module.css";

export const Home = () => {
  return (
    <div className={styles.home}>
      <section className={styles.hero} aria-labelledby="home-title">
        <h1 id="home-title">{homeContent.title}</h1>
        <p>{homeContent.description}</p>
      </section>
      <section aria-labelledby="categories-title">
        <h2 id="categories-title" className={styles.heading}>
          {homeContent.categoriesHeading}
        </h2>
        <ul className={styles.grid}>
          {homeContent.categories.map((category) => (
            <li key={category.id}>
              <CategoryCard
                category={category}
                availability={homeContent.availability}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
