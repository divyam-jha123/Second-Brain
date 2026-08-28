import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  THEME_STORAGE_KEY,
  ThemeContext,
  isThemePreference,
} from "./themeContext";
import type { ResolvedTheme, ThemePreference } from "./themeContext";

const DARK_QUERY = "(prefers-color-scheme: dark)";

const readStoredTheme = (): ThemePreference => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemePreference(stored)) return stored;
  } catch {
    // Private mode / blocked storage — fall through to the default.
  }
  return "system";
};

const systemTheme = (): ResolvedTheme =>
  typeof window !== "undefined" && window.matchMedia(DARK_QUERY).matches
    ? "dark"
    : "light";

const resolve = (theme: ThemePreference): ResolvedTheme =>
  theme === "system" ? systemTheme() : theme;

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemePreference>(readStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolve(readStoredTheme()),
  );

  // Paint the resolved theme, and keep following the OS while on "system".
  useEffect(() => {
    const apply = () => {
      const next = resolve(theme);
      setResolvedTheme(next);
      document.documentElement.classList.toggle("dark", next === "dark");
      document.documentElement.style.colorScheme = next;
    };

    apply();

    if (theme !== "system") return;
    const media = window.matchMedia(DARK_QUERY);
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Preference just won't survive a reload; the session still works.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolve(readStoredTheme()) === "dark" ? "light" : "dark");
  }, [setTheme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
};
