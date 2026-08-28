import { useTheme } from "../../theme/useTheme";
import type { ThemePreference } from "../../theme/themeContext";
import { SettingsHeader } from "./primitives";

const OPTIONS: { value: ThemePreference; label: string; hint: string }[] = [
  { value: "system", label: "System", hint: "Follows your OS setting" },
  { value: "light", label: "Light", hint: "Always light" },
  { value: "dark", label: "Dark", hint: "Always dark" },
];

export const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <SettingsHeader
        title="Appearance"
        description="Choose how Brain Expo looks on this device."
      />
      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            aria-pressed={theme === option.value}
            className={`rounded-lg border px-3 py-3 text-left transition-colors cursor-pointer ${
              theme === option.value
                ? "border-accent bg-accent-soft"
                : "border-line hover:bg-surface-hover"
            }`}
          >
            <span className="block text-sm font-medium text-fg">
              {option.label}
            </span>
            <span className="block text-xs text-fg-subtle">{option.hint}</span>
          </button>
        ))}
      </div>
    </>
  );
};
