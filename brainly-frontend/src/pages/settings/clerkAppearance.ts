import { useMemo } from "react";
import { useTheme } from "../../theme/useTheme";

const token = (name: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
};

/**
 * Clerk's panels are matched to our rows, not the other way round. The values
 * come from the same CSS custom properties the rest of the app paints with, so
 * there is one source of truth for the palette.
 */
export const useClerkAppearance = () => {
  const { resolvedTheme } = useTheme();

  return useMemo(
    () => ({
      variables: {
        colorPrimary: token("--accent", "#2f6fed"),
        colorPrimaryForeground: token("--accent-fg", "#ffffff"),
        colorBackground: token("--card", "#ffffff"),
        colorForeground: token("--fg", "#12110f"),
        colorMutedForeground: token("--fg-muted", "#57534e"),
        colorInput: token("--surface", "#ffffff"),
        colorInputForeground: token("--fg", "#12110f"),
        colorBorder: token("--line", "#e7e5e4"),
        colorDanger: token("--danger", "#dc2626"),
        fontFamily: "'Inter', sans-serif",
        borderRadius: "0.5rem",
        spacingUnit: "1rem",
      },
      elements: {
        rootBox: "w-full",
        cardBox: "w-full shadow-none border-0",
      },
    }),
    // The token values themselves change when the painted theme flips, so this
    // dependency is what makes the panel repaint even though it looks unused.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolvedTheme],
  );
};
