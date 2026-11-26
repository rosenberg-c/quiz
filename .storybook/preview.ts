/// <reference types="vite/client" />
import type { Preview } from "@storybook/react-vite";
import "../src/styles/theme.css";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Preview theme",
      toolbar: {
        icon: "circlehollow",
        items: ["dark", "light"],
      },
    },
  },
  initialGlobals: { theme: "dark" },
  decorators: [
    (Story, context) => {
      document.documentElement.dataset.theme = context.globals.theme;
      return Story();
    },
  ],
};

export default preview;
