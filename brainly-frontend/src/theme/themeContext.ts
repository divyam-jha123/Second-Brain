import { createContext } from "react";

/** What the user picks. "system" follows the OS preference live. */
export type ThemePreference = "light" | "dark" | "system";

/** What actually gets painted. */
export type ResolvedTheme = "light" | "dark";

export interface ThemeContextValue {
  /** The stored preference — this is what a Settings radio group binds to. */
  theme: ThemePreference;
  /** The theme currently on screen, with "system" already resolved. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  /** Convenience for a single toggle control: flips light <-> dark. */
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = "brain-expo-theme";

export const isThemePreference = (value: unknown): value is ThemePreference =>
  value === "light" || value === "dark" || value === "system";
