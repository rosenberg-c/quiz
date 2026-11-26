import { paths } from "../../../routes";

export const navigation = [
  { to: paths.home, label: "Home" },
  { to: paths.settings, label: "Settings" },
] as const;
