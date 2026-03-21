import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExtensionBridge } from "../hooks/useExtensionBridge";

export function ExtensionBanner() {
  const { status } = useExtensionBridge();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || status === "connected" || status === "checking") {
    return null;
  }

  function dismiss() {
    setDismissed(true);
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
        <button className="btn-banner-primary" onClick={() => navigate("/settings")}>
          Set up extension →
        </button>
        <button className="btn-banner-dismiss" onClick={dismiss} aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}

