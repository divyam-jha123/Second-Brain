import type { ReactNode } from "react";

/** Bordered container for a section's body. */
export const SettingsCard = ({ children }: { children: ReactNode }) => (
  <div className="rounded-xl border border-line bg-surface p-4">{children}</div>
);
