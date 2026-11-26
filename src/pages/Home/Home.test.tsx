import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { Home } from "./Home";
import { homeContent } from "./Home.content";

const expectedCategories = [
  [9, "General Knowledge"],
  [12, "Music"],
  [22, "Geography"],
  [11, "Film"],
  [21, "Sports"],
  [18, "Computers"],
];

describe("Home", () => {
  it("shows only the six v1 categories and their availability without fake actions", () => {
    expect(homeContent.categories.map(({ id, name }) => [id, name])).toEqual(
      expectedCategories,
    );

    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(<Home />);
    const titles = [...container.querySelectorAll("article h3")];

    expect(container.querySelector("h1")?.textContent).toBe(homeContent.title);
    expect(titles.map((title) => title.textContent)).toEqual(
      expectedCategories.map(([, name]) => name),
    );
    expect(container.querySelectorAll("li")).toHaveLength(6);
    expect(container.querySelectorAll("article p")).toHaveLength(6);
    expect(
      [...container.querySelectorAll("article p")].every(
        (status) => status.textContent === homeContent.availability,
      ),
    ).toBe(true);
    expect(container.querySelector("button, article a")).toBeNull();
  });
});
