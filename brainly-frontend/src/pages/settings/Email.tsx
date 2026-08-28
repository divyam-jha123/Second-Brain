import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import {
  fetchEmailPrefs,
  patchEmailPrefs,
  sendDigestNow,
} from "../../lib/api";
import type { EmailPrefs, EmailPrefsPatch } from "../../lib/api";
import {
  SettingsHeader,
  SettingsRow,
} from "../../components/settings/primitives";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const SECTIONS: {
  key: keyof EmailPrefs["digestSections"];
  label: string;
}[] = [
  { key: "savedThisWeek", label: "What you saved this week" },
  { key: "untaggedNudge", label: "Untagged inbox nudge" },
  { key: "recallQuestions", label: "Recall questions" },
];

const browserTimezone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const relativeTime = (iso: string | null) => {
  if (!iso) return "Never sent";
  const days = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days <= 0) return "Last sent today";
  if (days === 1) return "Last sent yesterday";
  if (days < 30) return `Last sent ${days} days ago`;
  return `Last sent on ${new Date(iso).toLocaleDateString()}`;
};

const hourLabel = (hour: number) => {
  const suffix = hour < 12 ? "am" : "pm";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:00 ${suffix}`;
};

export function EmailSettings() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [prefs, setPrefs] = useState<EmailPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      setPrefs(await fetchEmailPrefs(token, browserTimezone()));
    } catch (err) {
      console.error("Failed to load email preferences:", err);
      setError("Couldn't load your email settings.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  const flashSaved = () => {
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1800);
  };

  /** Autosave: apply locally, then reconcile. On failure, put it back. */
  const save = async (patch: EmailPrefsPatch, optimistic: EmailPrefs) => {
    const previous = prefs;
    setPrefs(optimistic);
    setError("");

    try {
      const token = await getToken();
      const email =
        user?.primaryEmailAddress?.emailAddress ??
        user?.emailAddresses?.[0]?.emailAddress;
      const next = await patchEmailPrefs(token, { ...patch, ...(email && { email }) });
      setPrefs(next);
      flashSaved();
    } catch (err) {
      console.error("Failed to save email preferences:", err);
      setPrefs(previous);
      setError("Couldn't save that. Try again.");
    }
  };

  const preview = async () => {
    setSending(true);
    setError("");
    try {
      const token = await getToken();
      await sendDigestNow(token);
      flashSaved();
    } catch {
      // The route answers 501 until the digest job is built.
      setError("Preview sending isn't available yet.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <>
        <SettingsHeader
          title="Weekly email"
          description="A summary of your week, sent when you want it."
        />
        <p className="text-sm text-fg-muted">Loading...</p>
      </>
    );
  }

  if (!prefs) {
    return (
      <>
        <SettingsHeader
          title="Weekly email"
          description="A summary of your week, sent when you want it."
        />
        <p className="text-sm text-danger">{error || "Settings unavailable."}</p>
      </>
    );
  }

  const off = !prefs.weeklyDigest;
  const address =
    prefs.email ??
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress;

  return (
    <>
      <SettingsHeader
        title="Weekly email"
        description="A summary of your week, sent when you want it."
      />

      <div className="mb-2 flex h-4 items-center justify-end">
        <span
          className={`text-xs text-fg-subtle transition-opacity duration-500 ${
            saved ? "opacity-100" : "opacity-0"
          }`}
        >
          Saved
        </span>
      </div>

      <SettingsRow
        label="Send weekly email"
        description={address ?? undefined}
      >
        <label className="inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            aria-label="Send weekly email"
            checked={prefs.weeklyDigest}
            onChange={(event) =>
              save(
                { weeklyDigest: event.target.checked },
                { ...prefs, weeklyDigest: event.target.checked },
              )
            }
          />
          <span className="relative h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-accent after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-card after:transition-transform peer-checked:after:translate-x-5" />
        </label>
      </SettingsRow>

      <SettingsRow
        label="Include"
        description="Sections skip themselves when empty"
        disabled={off}
      >
        {SECTIONS.map((section) => (
          <label
            key={section.key}
            className={`flex items-center gap-2 text-sm text-fg-muted ${
              off ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <input
              type="checkbox"
              disabled={off}
              checked={prefs.digestSections[section.key]}
              aria-label={section.label}
              onChange={(event) =>
                save(
                  { digestSections: { [section.key]: event.target.checked } },
                  {
                    ...prefs,
                    digestSections: {
                      ...prefs.digestSections,
                      [section.key]: event.target.checked,
                    },
                  },
                )
              }
              className="accent-[var(--color-accent)]"
            />
            {section.label}
          </label>
        ))}
      </SettingsRow>

      <SettingsRow label="Delivery" disabled={off}>
        <div className="flex items-center gap-2">
          <select
            aria-label="Delivery day"
            disabled={off}
            value={prefs.digestDay}
            onChange={(event) =>
              save(
                { digestDay: Number(event.target.value) },
                { ...prefs, digestDay: Number(event.target.value) },
              )
            }
            className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-fg"
          >
            {DAYS.map((day, index) => (
              <option key={day} value={index}>
                {day}
              </option>
            ))}
          </select>

          <select
            aria-label="Delivery hour"
            disabled={off}
            value={prefs.digestHour}
            onChange={(event) =>
              save(
                { digestHour: Number(event.target.value) },
                { ...prefs, digestHour: Number(event.target.value) },
              )
            }
            className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-fg"
          >
            {Array.from({ length: 24 }, (_, hour) => (
              <option key={hour} value={hour}>
                {hourLabel(hour)}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-fg-subtle">{prefs.timezone}</span>
      </SettingsRow>

      <SettingsRow label="Preview">
        <button
          type="button"
          onClick={preview}
          disabled={sending}
          className="rounded-lg border border-line px-3 py-1.5 text-sm text-fg-muted transition-colors hover:text-fg disabled:opacity-60 cursor-pointer"
        >
          {sending ? "Sending..." : "Send me one now"}
        </button>
        <span className="text-xs text-fg-subtle">
          {relativeTime(prefs.lastDigestSentAt)}
        </span>
      </SettingsRow>

      {error && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
