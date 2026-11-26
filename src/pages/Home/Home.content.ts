import type { Category } from "./components/CategoryCard/CategoryCard";

export const homeContent = {
  title: "Find your next challenge",
  description: "Explore six quiz categories. Playing is coming soon.",
  categoriesHeading: "Categories",
  availability: "Coming soon",
  categories: [
    { id: 9, name: "General Knowledge" },
    { id: 12, name: "Music" },
    { id: 22, name: "Geography" },
    { id: 11, name: "Film" },
    { id: 21, name: "Sports" },
    { id: 18, name: "Computers" },
  ] satisfies readonly Category[],
} as const;
