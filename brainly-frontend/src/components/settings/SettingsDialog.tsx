import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import {
  LuBell,
  LuCreditCard,
  LuDatabase,
  LuPalette,
  LuPuzzle,
  LuShare,
  LuUser,
  LuX,
} from "react-icons/lu";
import { AccountPane } from "./AccountPane";
import { AppearanceSettings } from "./appearance";
import { ExtensionSettings } from "./extension";
import { SharingSettings } from "./sharing";
import { EmailSettings } from "../../pages/settings/Email";
import { DataSettings, PlanSettings } from "../../pages/settings/Stubs";
import { SettingsErrorBoundary } from "../../pages/settings/SettingsErrorBoundary";

export type SettingsSection =
  | "account"
  | "appearance"
  | "notifications"
  | "shared"
  | "extension"
  | "data"
  | "plan";

const SECTIONS: {
  id: SettingsSection;
  label: string;
  icon: ReactNode;
}[] = [
  { id: "account", label: "Account", icon: <LuUser size={16} /> },
  { id: "appearance", label: "Appearance", icon: <LuPalette size={16} /> },
  { id: "notifications", label: "Notifications", icon: <LuBell size={16} /> },
  { id: "shared", label: "Shared brain", icon: <LuShare size={16} /> },
  { id: "extension", label: "Extension", icon: <LuPuzzle size={16} /> },
  { id: "data", label: "Data", icon: <LuDatabase size={16} /> },
  { id: "plan", label: "Plan", icon: <LuCreditCard size={16} /> },
];

const PANES: Record<SettingsSection, () => ReactNode> = {
  account: () => <AccountPane />,
  appearance: () => <AppearanceSettings />,
  notifications: () => <EmailSettings />,
  shared: () => <SharingSettings />,
  extension: () => <ExtensionSettings />,
  data: () => <DataSettings />,
  plan: () => <PlanSettings />,
};

interface SettingsDialogProps {
  open: boolean;
  section: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  onClose: () => void;
}

/**
 * Settings as an overlay: the dashboard stays mounted behind it, so closing
 * returns you to exactly the scroll position and filter you left.
 */
export const SettingsDialog = ({
  open,
  section,
  onSectionChange,
  onClose,
}: SettingsDialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape closes; the page behind must not scroll while the overlay is up.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  // Portalled to <body>: the trigger lives inside the fixed sidebar, which is
  // its own stacking context, so an in-place overlay renders *under* dashboard
  // content that sits later in the document.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-overlay animate-fadeIn"
        onClick={onClose}
        aria-hidden
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        tabIndex={-1}
        className="relative flex h-[min(680px,88vh)] w-full max-w-[900px] flex-col overflow-hidden rounded-2xl border border-line bg-bg shadow-[0_24px_64px_-16px_rgb(0_0_0/0.5)] outline-none animate-scaleIn md:flex-row"
      >
        <nav className="shrink-0 border-b border-line px-3 py-4 md:w-[210px] md:border-b-0 md:border-r md:py-6">
          <h2 className="hidden px-2 pb-3 text-lg font-semibold text-fg md:block">
            Settings
          </h2>
          <div className="flex gap-1 overflow-x-auto scrollbar-hide md:flex-col">
            {SECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSectionChange(item.id)}
                aria-current={section === item.id ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors cursor-pointer ${
                  section === item.id
                    ? "bg-surface-hover text-fg"
                    : "text-fg-muted hover:bg-surface-hover hover:text-fg"
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="min-w-0 flex-1 overflow-y-auto px-6 py-6 md:px-8">
          <div className="mx-auto max-w-[560px]">
            <SettingsErrorBoundary key={section}>
              {PANES[section]()}
            </SettingsErrorBoundary>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className="absolute right-3 top-3 rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg cursor-pointer"
        >
          <LuX size={16} />
        </button>
      </div>
    </div>,
    document.body,
  );
};
