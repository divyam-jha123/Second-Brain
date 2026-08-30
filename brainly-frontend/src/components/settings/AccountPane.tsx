import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/react";
import { LuCheck, LuCopy, LuShieldCheck } from "react-icons/lu";
import {
  createShareLink,
  fetchEmailPrefs,
  fetchShareLinks,
  patchEmailPrefs,
  revokeShareLink,
} from "../../lib/api";
import { readDefaultView, writeDefaultView } from "../../lib/prefs";
import type { ViewMode } from "../../lib/prefs";
import { useTheme } from "../../theme/useTheme";
import type { ThemePreference } from "../../theme/themeContext";
import { SettingsHeader } from "./primitives";
import {
  GroupLabel,
  Panel,
  PrefRow,
  QuietButton,
  Segmented,
  Select,
  Switch,
} from "./controls";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "grid", label: "Grid" },
  { value: "list", label: "List" },
];

const initialsOf = (name: string) =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

const browserTimezone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

/**
 * Profile, the four preferences people actually change, and the danger zone.
 *
 * "Public brain" is the app's one share-everything link: on creates a
 * `scope: "all"` link, off revokes every link with that scope.
 */
export const AccountPane = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const { theme, setTheme } = useTheme();

  const [defaultView, setDefaultView] = useState<ViewMode>(readDefaultView);
  const [weeklyEmail, setWeeklyEmail] = useState<boolean | null>(null);
  const [publicHash, setPublicHash] = useState<string | null>(null);
  const [publicLoaded, setPublicLoaded] = useState(false);
  const hasLoaded = useRef(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");

  const name = user?.fullName ?? user?.username ?? "Account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const publicUrl = publicHash
    ? `${window.location.host}/share/${publicHash}`
    : null;

  // Once per mount, and never again: `getToken` is a fresh function on every
  // render, so an unguarded effect re-runs after each setState and overwrites
  // a toggle the reader just flipped with the value the server had before it.
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    (async () => {
      const token = await getToken();

      // Settled separately: a failure to read share links must not leave the
      // weekly-email switch stuck in its disabled loading state, or vice versa.
      const [prefs, links] = await Promise.allSettled([
        fetchEmailPrefs(token, browserTimezone()),
        fetchShareLinks(token),
      ]);

      if (prefs.status === "fulfilled") {
        setWeeklyEmail(
          prefs.value.weeklyDigest && !prefs.value.unsubscribedAll,
        );
      } else {
        console.error("Failed to load email preferences:", prefs.reason);
      }

      if (links.status === "fulfilled") {
        setPublicHash(
          links.value.find((link) => link.scope === "all")?.hash ?? null,
        );
        setPublicLoaded(true);
      } else {
        console.error("Failed to load share links:", links.reason);
      }

      if (prefs.status === "rejected" || links.status === "rejected") {
        setError("Couldn't load some of your settings.");
      }
    })();
  }, [getToken]);

  const toggleWeeklyEmail = useCallback(
    async (next: boolean) => {
      setWeeklyEmail(next);
      try {
        const token = await getToken();
        await patchEmailPrefs(token, { weeklyDigest: next });
      } catch (err) {
        console.error("Failed to update weekly email:", err);
        setWeeklyEmail(!next);
        setError("Couldn't save that change.");
      }
    },
    [getToken],
  );

  const togglePublicBrain = useCallback(
    async (next: boolean) => {
      setBusy(true);
      setError("");
      try {
        const token = await getToken();
        if (next) {
          const { hash } = await createShareLink(token, { scope: "all" });
          setPublicHash(hash);
        } else {
          // Every share-everything link goes, not just the one on screen.
          const links = await fetchShareLinks(token);
          await Promise.all(
            links
              .filter((link) => link.scope === "all")
              .map((link) => revokeShareLink(token, link.hash)),
          );
          setPublicHash(null);
        }
      } catch (err) {
        console.error("Failed to update public brain:", err);
        setError("Couldn't update your public link.");
      } finally {
        setBusy(false);
      }
    },
    [getToken],
  );

  const copyPublicUrl = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(`${window.location.origin}/share/${publicHash}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteAccount = async () => {
    setBusy(true);
    setError("");
    try {
      await user?.delete();
      await signOut({ redirectUrl: "/" });
    } catch (err) {
      console.error("Failed to delete account:", err);
      setError("Couldn't delete your account. Contact support and we'll do it.");
      setBusy(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <>
      <SettingsHeader
        title="Account"
        description="Your profile, email, and sign-in methods."
      />

      {/* Profile */}
      <Panel>
        <div className="flex items-center gap-4 px-4 py-4">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt=""
              className="h-14 w-14 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-tag text-base font-semibold text-tag-fg"
            >
              {initialsOf(name)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-fg">{name}</p>
            {email && <p className="truncate text-sm text-fg-muted">{email}</p>}
          </div>
          <QuietButton onClick={() => openUserProfile()}>
            Edit profile
          </QuietButton>
        </div>
      </Panel>

      <GroupLabel>Preferences</GroupLabel>
      <Panel>
        <PrefRow label="Theme" description="Light, dark, or match your system">
          <Segmented
            label="Theme"
            value={theme}
            options={THEME_OPTIONS}
            onChange={setTheme}
          />
        </PrefRow>

        <PrefRow label="Default view" description="How All notes opens">
          <Select
            label="Default view"
            value={defaultView}
            options={VIEW_OPTIONS}
            onChange={(next) => {
              setDefaultView(next);
              writeDefaultView(next);
            }}
          />
        </PrefRow>

        <PrefRow
          label="Weekly email"
          description="Digest, untagged nudge, and recall questions"
        >
          <Switch
            label="Weekly email"
            checked={weeklyEmail ?? false}
            disabled={weeklyEmail === null}
            onChange={toggleWeeklyEmail}
          />
        </PrefRow>

        <PrefRow
          label="Public brain"
          description={
            publicUrl ? (
              <button
                type="button"
                onClick={copyPublicUrl}
                className="flex items-center gap-1.5 text-fg-muted transition-colors hover:text-fg cursor-pointer"
              >
                <span className="truncate">{publicUrl}</span>
                {copied ? <LuCheck size={13} /> : <LuCopy size={13} />}
              </button>
            ) : (
              "Publish everything you've saved as one link"
            )
          }
        >
          <Switch
            label="Public brain"
            checked={Boolean(publicHash)}
            disabled={!publicLoaded || busy}
            onChange={togglePublicBrain}
          />
        </PrefRow>
      </Panel>

      <GroupLabel>Danger zone</GroupLabel>
      <Panel tone="danger">
        <PrefRow
          label="Delete account"
          description="Removes every saved item permanently"
        >
          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <QuietButton onClick={() => setConfirmingDelete(false)}>
                Cancel
              </QuietButton>
              <QuietButton tone="danger" onClick={deleteAccount}>
                {busy ? "Deleting…" : "Yes, delete"}
              </QuietButton>
            </div>
          ) : (
            <QuietButton tone="danger" onClick={() => setConfirmingDelete(true)}>
              Delete
            </QuietButton>
          )}
        </PrefRow>
      </Panel>

      {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}
    </>
  );
};
