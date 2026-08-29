import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { SettingsDialogContext } from "./settingsDialogContext";
import type { SettingsSection } from "./settingsDialogContext";
import { SettingsDialog } from "./SettingsDialog";

const SECTIONS: SettingsSection[] = [
  "account",
  "appearance",
  "notifications",
  "shared",
  "tags",
  "extension",
  "data",
  "plan",
];

/**
 * Settings has no route of its own — it is an overlay over whatever you were
 * doing. This owns the one instance and hands every caller a way to open it.
 */
export const SettingsDialogProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  // ?settings=<section> opens straight into a section — how an email or a link
  // from outside the app points at one, now that there is no /settings route.
  const [section, setSection] = useState<SettingsSection | null>(() => {
    const requested = new URLSearchParams(window.location.search).get(
      "settings",
    );
    return SECTIONS.includes(requested as SettingsSection)
      ? (requested as SettingsSection)
      : null;
  });
  const [searchParams, setSearchParams] = useSearchParams();

  const open = useCallback(
    (next: SettingsSection = "account") => setSection(next),
    [],
  );
  const close = useCallback(() => setSection(null), []);

  // The param has done its job at mount; keep it out of the shareable URL.
  useEffect(() => {
    if (!searchParams.has("settings")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("settings");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const value = useMemo(
    () => ({ section, open, close }),
    [section, open, close],
  );

  return (
    <SettingsDialogContext.Provider value={value}>
      {children}
      <SettingsDialog
        open={section !== null}
        section={section ?? "account"}
        onSectionChange={setSection}
        onClose={close}
      />
    </SettingsDialogContext.Provider>
  );
};
