import styles from "./CategoryCard.module.css";

export type Category = {
  readonly id: number;
  readonly name: string;
};

type CategoryCardProps = {
  category: Category;
  availability: string;
};

export const CategoryCard = ({ category, availability }: CategoryCardProps) => (
  <article className={styles.card}>
    <h3 className={styles.title}>{category.name}</h3>
    <p className={styles.availability}>{availability}</p>
  </article>
);
