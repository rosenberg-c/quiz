import type { Meta, StoryObj } from "@storybook/react-vite";
import { homeContent } from "../../Home.content";
import { CategoryCard } from "./CategoryCard";

const meta = {
  component: CategoryCard,
  tags: ["ai-generated", "needs-work"],
  args: {
    category: homeContent.categories[0],
    startLabel: homeContent.startLabel,
    onStart: () => {},
  },
} satisfies Meta<typeof CategoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GeneralKnowledge: Story = {};

export const Music: Story = { args: { category: homeContent.categories[1] } };
export const Geography: Story = {
  args: { category: homeContent.categories[2] },
};
export const Film: Story = { args: { category: homeContent.categories[3] } };
export const Sports: Story = { args: { category: homeContent.categories[4] } };
export const Computers: Story = {
  args: { category: homeContent.categories[5] },
};
