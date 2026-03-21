import { useExtensionBridge } from "../hooks/useExtensionBridge";
import type { ExtensionStatus } from "../hooks/useExtensionBridge";
import { Sidebar } from "../components/sidebar";

// const CHROME_STORE_URL =
//   "https://chromewebstore.google.com/detail/brainexpo/YOUR_EXTENSION_ID";

export function Settings() {
  const { status } = useExtensionBridge();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="md:ml-64 flex-1 w-full">
        <div className="settings-page">
          <div className="settings-header">
            <h1>Settings</h1>
            <p>Manage your BrainExpo preferences</p>
          </div>

          <section className="settings-section">
            <h2>Browser Extension</h2>
            <p className="settings-section__desc">
              Install the Chrome extension to save any page to your Brain without
              opening the app.
            </p>
            <ExtensionCard status={status} />
          </section>
        </div>
      </div>
    </div>
  );
}

function ExtensionCard({ status }: { status: ExtensionStatus }) {
  return (
    <div className="ext-card">
      <div className="ext-card__status-row">
        <span
          className={`ext-dot ${
            status === "connected"
              ? "ext-dot--green"
              : status === "checking"
                ? "ext-dot--yellow"
                : "ext-dot--gray"
          }`}
        />
        <span className="ext-card__status-label">
          {status === "connected"
            ? "Extension connected"
            : status === "checking"
              ? "Checking..."
              : "Extension not installed"}
        </span>
      </div>

      {status === "connected" && (
        <div className="ext-card__body">
          <p className="ext-card__desc">
            You&apos;re all set! Click the BrainExpo icon in your Chrome toolbar
            to save any page instantly.
          </p>
          <div className="ext-card__tips">
            <p className="ext-card__tip-title">Tips:</p>
            <ul>
              <li>Click the extension icon on any webpage to save it</li>
              <li>Add tags while saving to keep things organized</li>
              <li>The extension auto-detects YouTube, Twitter, and articles</li>
            </ul>
          </div>
        </div>
      )}

      {status === "not_installed" && (
        <div className="ext-card__body">
          <p className="ext-card__desc">
            Install the extension, then come back here — it will connect
            automatically.
          </p>
          <ol className="ext-card__steps">
            <li>
              <span className="step-num">1</span>
              <span >
                <span style={{ cursor: "not-allowed" , fontWeight: "bold" , textDecoration: "underline"}}>
                  Add to Chrome
                </span>
               
                &nbsp;on the Chrome Web Store
              </span>
            </li>
            <li>
              <span className="step-num">2</span>
              <span>Click &quot;Add extension&quot; in the Chrome popup</span>
            </li>
            <li>
              <span className="step-num">3</span>
              <span>Come back to this page — it connects automatically</span>
            </li>
          </ol>

          <button
            type="button"
            className="btn-install"
            disabled
            aria-disabled="true"
            title="Coming soon"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 12h8M12 8l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Coming Soon
          </button>

          <p className="ext-card__note">
            Works on Chrome, Edge, and Brave. Firefox support coming soon.
          </p>
        </div>
      )}

      {status === "checking" && (
        <div className="ext-card__body">
          <p className="ext-card__desc">Detecting extension status...</p>
        </div>
      )}
    </div>
  );
}

