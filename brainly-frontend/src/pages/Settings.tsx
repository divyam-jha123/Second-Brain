import { useExtensionBridge } from "../hooks/useExtensionBridge";
import type { ExtensionStatus } from "../hooks/useExtensionBridge";
import { Sidebar } from "../components/sidebar";
import { useState, useEffect, useCallback } from "react";
import { useAuth, useUser } from "@clerk/react";
import axios from "axios";
import { API_URL } from "../config";

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

          <section className="settings-section">
            <h2>Email Notifications</h2>
            <p className="settings-section__desc">
              Choose which emails you'd like to receive from BrainExpo.
            </p>
            <EmailPreferencesCard />
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

function EmailPreferencesCard() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [featureAnnouncements, setFeatureAnnouncements] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/email/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const prefs = res.data.preferences;
      setFeatureAnnouncements(prefs.featureAnnouncements);
      setWeeklyDigest(prefs.weeklyDigest);
    } catch (err) {
      console.error("Failed to fetch email preferences:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = async (
    key: "featureAnnouncements" | "weeklyDigest",
    value: boolean,
  ) => {
    setSaving(true);
    try {
      const token = await getToken();
      const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;

      await axios.put(
        `${API_URL}/email/preferences`,
        { [key]: value, email },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (key === "featureAnnouncements") setFeatureAnnouncements(value);
      if (key === "weeklyDigest") setWeeklyDigest(value);
    } catch (err) {
      console.error("Failed to update preference:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ext-card">
        <div className="ext-card__body">
          <p className="ext-card__desc">Loading email preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ext-card">
      <div className="ext-card__body" style={{ padding: "16px 20px" }}>
        {/* Feature Announcements Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 0",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontWeight: 600,
                fontSize: "14px",
                color: "#1f2937",
              }}
            >
              Feature Announcements
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              Get notified about new features and updates
            </p>
          </div>
          <label className="email-toggle">
            <input
              type="checkbox"
              checked={featureAnnouncements}
              disabled={saving}
              onChange={(e) =>
                updatePreference("featureAnnouncements", e.target.checked)
              }
            />
            <span className="email-toggle__slider" />
          </label>
        </div>

        {/* Weekly Digest Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 0",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontWeight: 600,
                fontSize: "14px",
                color: "#1f2937",
              }}
            >
              Weekly Digest
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              Receive a summary of your saved notes every Monday
            </p>
          </div>
          <label className="email-toggle">
            <input
              type="checkbox"
              checked={weeklyDigest}
              disabled={saving}
              onChange={(e) =>
                updatePreference("weeklyDigest", e.target.checked)
              }
            />
            <span className="email-toggle__slider" />
          </label>
        </div>
      </div>
    </div>
  );
}
