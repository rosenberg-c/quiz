import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { expect, it } from "vite-plus/test";
import { ThemeContext } from "../../../theme/useTheme";
import { SiteHeader } from "./SiteHeader";

it("keeps Home on the left and groups Theme before Settings in primary navigation", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    <MemoryRouter initialEntries={["/"]}>
      <ThemeContext.Provider
        value={{
          preference: "system",
          resolvedTheme: "light",
          setPreference: () => {},
        }}
      >
        <SiteHeader />
      </ThemeContext.Provider>
    </MemoryRouter>,
  );

  const header = container.querySelector("header")!;
  const nav = header.querySelector('nav[aria-label="Primary navigation"]')!;
  const links = [...nav.querySelectorAll("a")];
  const theme = nav.querySelector("select")!;

  expect(header.querySelector("a")?.textContent).toBe("Quiz");
  expect(links.map((link) => link.textContent)).toEqual(["Home", "Settings"]);
  expect(links[0].getAttribute("href")).toBe("/");
  expect(links[1].getAttribute("href")).toBe("/settings");
  expect(theme.closest("label")?.textContent).toContain("Theme");
  expect(links[1].parentElement).toBe(theme.closest("label")?.parentElement);
  expect(
    links[1].compareDocumentPosition(theme) & Node.DOCUMENT_POSITION_PRECEDING,
  ).toBeTruthy();
});
