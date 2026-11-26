import { useTheme, type ThemePreference } from "./useTheme";

const OPTIONS: ReadonlyArray<{ value: ThemePreference; label: string }> = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
];

export const ThemeSelector = () => {
  const { preference, setPreference } = useTheme();

  return (
    <label className="theme-selector" htmlFor="theme-preference">
      <span className="theme-selector__label">Theme</span>
      <select
        id="theme-preference"
        className="theme-selector__control"
        value={preference}
        onChange={(event) =>
          setPreference(event.target.value as ThemePreference)
        }
      >
        {OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
};
