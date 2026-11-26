import type { QuizCategoryId } from "../../../../features/quiz-data/opentdb";
import styles from "./CategoryCard.module.css";

export type Category = {
  readonly id: QuizCategoryId;
  readonly name: string;
};

type CategoryCardProps = {
  category: Category;
  startLabel: string;
  onStart: () => void;
};

export const CategoryCard = ({
  category,
  startLabel,
  onStart,
}: CategoryCardProps) => (
  <article className={styles.card}>
    <h3 className={styles.title}>{category.name}</h3>
    <button
      className={styles.action}
      onClick={onStart}
      type="button"
      aria-label={`${startLabel}: ${category.name}`}
    >
      {startLabel}
    </button>
  </article>
);
