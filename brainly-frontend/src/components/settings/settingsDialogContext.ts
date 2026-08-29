import { createContext } from "react";

export type SettingsSection =
  | "account"
  | "appearance"
  | "notifications"
  | "shared"
  | "tags"
  | "extension"
  | "data"
  | "plan";

export interface SettingsDialogValue {
  /** The section on screen, or null while the dialog is closed. */
  section: SettingsSection | null;
  open: (section?: SettingsSection) => void;
  close: () => void;
}

export const SettingsDialogContext =
  createContext<SettingsDialogValue | null>(null);
