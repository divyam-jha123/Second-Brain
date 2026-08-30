import { useState } from "react";
import { useExtensionBridge } from "../hooks/useExtensionBridge";
import { useSettingsDialog } from "./settings/useSettingsDialog";

const DISMISSED_KEY = "brain-expo-extension-banner-dismissed";

const readDismissed = (): boolean => {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    // Private mode / blocked storage — banner just won't stay dismissed.
    return false;
  }
};

export function ExtensionBanner() {
  const { status } = useExtensionBridge();
  const { open } = useSettingsDialog();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (dismissed || status === "connected" || status === "checking") {
    return null;
  }

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Preference just won't survive a reload; the session still works.
    }
  }

  return (
    <div className="extension-banner">
      <div className="extension-banner__left">
        <span className="extension-banner__icon">⚡</span>
        <div>
          <p className="extension-banner__title">
            Save pages faster with the BrainExpo extension
          </p>
          <p className="extension-banner__subtitle">
            Capture any webpage to your Brain in one click — without leaving the tab.
          </p>
        </div>
      </div>

      <div className="extension-banner__actions">
        <button className="btn-banner-primary" onClick={() => open("extension")}>
          Set up extension →
        </button>
        <button className="btn-banner-dismiss" onClick={dismiss} aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}

