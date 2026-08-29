import { useContext } from "react";
import { SettingsDialogContext } from "./settingsDialogContext";

/** Opens settings from anywhere inside <SettingsDialogProvider>. */
export const useSettingsDialog = () => {
  const ctx = useContext(SettingsDialogContext);
  if (!ctx) {
    throw new Error(
      "useSettingsDialog must be used inside a <SettingsDialogProvider>",
    );
  }
  return ctx;
};
