import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

import {
  applyTheme,
  readStoredPreference,
  readSystemPrefersDark,
  resolveTheme,
  subscribeToSystemTheme,
  writeStoredPreference,
} from "./theme-core";
import { ThemeContext, type ThemePreference } from "./useTheme";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(readStoredPreference);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(
    readSystemPrefersDark,
  );

  const resolvedTheme = resolveTheme(preference, systemPrefersDark);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    writeStoredPreference(next);
  }, []);

  // Keep system preference in sync with OS changes.
  useEffect(() => subscribeToSystemTheme(setSystemPrefersDark), []);

  useLayoutEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider
      value={{
        preference,
        resolvedTheme,
        setPreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
