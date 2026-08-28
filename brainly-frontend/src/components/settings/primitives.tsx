import type { ReactNode } from "react";

/** Top of every settings page. */
export const SettingsHeader = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <header className="mb-6">
    <h1 className="text-lg font-semibold text-fg">{title}</h1>
    <p className="mt-1 text-sm text-fg-muted">{description}</p>
  </header>
);

/**
 * Every control in every section sits in one of these: label and description in
 * a fixed left column, control on the right, hairline between rows.
 */
export const SettingsRow = ({
  label,
  description,
  disabled = false,
  children,
}: {
  label: string;
  description?: string;
  disabled?: boolean;
  children: ReactNode;
}) => (
  <div
    className={`flex items-start justify-between gap-6 border-b border-line py-4 last:border-b-0 ${
      disabled ? "opacity-50" : ""
    }`}
  >
    <div className="w-[150px] shrink-0">
      <p className="text-sm font-medium text-fg">{label}</p>
      {description && (
        <p className="mt-0.5 text-xs text-fg-muted">{description}</p>
      )}
    </div>
    <div className="flex min-w-0 flex-1 flex-col items-end gap-2 text-right">
      {children}
    </div>
  </div>
);

/** Placeholder body for sections whose internals are a separate task. */
export const ComingSoon = () => (
  <p className="text-sm text-fg-muted">Coming soon.</p>
);
