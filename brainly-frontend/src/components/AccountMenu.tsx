import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useAuth, useClerk, useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import {
  LuChevronsUpDown,
  LuCircleHelp,
  LuExternalLink,
  LuLogOut,
  LuMail,
  LuMoon,
  LuPuzzle,
  LuSettings,
  LuShare,
  LuUser,
} from "react-icons/lu";
import { fetchEmailPrefs, fetchShareLinks, patchEmailPrefs } from "../lib/api";
import { SettingsDialog } from "./settings/SettingsDialog";
import type { SettingsSection } from "./settings/SettingsDialog";
import { useTheme } from "../theme/useTheme";
import type { ThemePreference } from "../theme/themeContext";

/** Saves included in the free plan — the denominator on the usage band. */
const FREE_PLAN_LIMIT = 100;

const THEME_CYCLE: ThemePreference[] = ["light", "dark", "system"];
const THEME_LABEL: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

/** "Divyam Jha" -> "DJ". Falls back to the first letter of an email. */
const initialsOf = (name: string) =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

const Avatar = ({
  src,
  name,
  size,
}: {
  src?: string;
  name: string;
  size: 28 | 40;
}) =>
  src ? (
    <img
      src={src}
      alt=""
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full object-cover"
    />
  ) : (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-tag text-tag-fg"
      aria-hidden
    >
      <span className={size === 40 ? "text-sm font-semibold" : "text-[11px] font-semibold"}>
        {initialsOf(name)}
      </span>
    </span>
  );

/** Compact switch sized for a 34px menu row. Presentational — the row owns the click. */
const RowSwitch = ({ on }: { on: boolean }) => (
  <span
    aria-hidden
    className={`relative inline-block h-[18px] w-[32px] shrink-0 rounded-full transition-colors ${
      on ? "bg-brand" : "bg-line-strong"
    }`}
  >
    <span
      className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform ${
        on ? "translate-x-[16px]" : "translate-x-[2px]"
      }`}
    />
  </span>
);

const Hairline = () => <div className="-mx-1.5 my-1.5 h-px bg-line" />;

const ROW_CLASS =
  "flex h-[34px] w-full items-center gap-2.5 rounded-md px-2 text-left text-[13px] transition-colors hover:bg-surface-hover cursor-pointer";

const MenuRow = ({
  icon,
  label,
  right,
  onClick,
  href,
  danger = false,
  role = "menuitem",
  checked,
}: {
  icon: ReactNode;
  label: string;
  right?: ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  role?: "menuitem" | "menuitemcheckbox";
  checked?: boolean;
}) => {
  const tone = danger ? "text-danger" : "text-fg";
  const iconTone = danger ? "text-danger" : "text-fg-muted";
  const body = (
    <>
      <span className={`shrink-0 ${iconTone}`}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {right && <span className="flex shrink-0 items-center">{right}</span>}
    </>
  );

  if (href) {
    const external = /^(https?:|mailto:)/.test(href);
    return (
      <a
        role={role}
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        onClick={onClick}
        className={`${ROW_CLASS} ${tone}`}
      >
        {body}
      </a>
    );
  }

  return (
    <button
      type="button"
      role={role}
      aria-checked={role === "menuitemcheckbox" ? checked : undefined}
      onClick={onClick}
      className={`${ROW_CLASS} ${tone}`}
    >
      {body}
    </button>
  );
};

interface AccountMenuProps {
  /** Saves made so far — the numerator on the free-plan usage band. */
  savedCount?: number;
  /** Where the store listing lives. Omitted: the row points at the in-app page. */
  extensionUrl?: string;
  /** Where "Help and feedback" goes. */
  helpUrl?: string;
}

/**
 * The sidebar footer identity row and the menu it opens: plan and usage, the
 * settings people reach for most, the two outbound links, and sign out.
 *
 * Preferences load lazily on first open — a dashboard that never opens the menu
 * pays nothing for it.
 */
export const AccountMenu = ({
  savedCount,
  extensionUrl,
  helpUrl = "mailto:support@brainexpo.me",
}: AccountMenuProps) => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection | null>(
    null,
  );
  const [weeklyEmail, setWeeklyEmail] = useState<boolean | null>(null);
  const [isPublic, setIsPublic] = useState<boolean | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hasLoaded = useRef(false);

  const name = user?.fullName ?? user?.username ?? "Account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  // Close on outside pointer or Escape; Escape hands focus back to the trigger.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || hasLoaded.current) return;
    hasLoaded.current = true;

    (async () => {
      try {
        const token = await getToken();
        const timezone =
          Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        const [prefs, links] = await Promise.all([
          fetchEmailPrefs(token, timezone),
          fetchShareLinks(token),
        ]);
        setWeeklyEmail(prefs.weeklyDigest && !prefs.unsubscribedAll);
        setIsPublic(links.length > 0);
      } catch (error) {
        // A failed read leaves both right slots blank rather than lying about state.
        console.error("Failed to load account menu state:", error);
        hasLoaded.current = false;
      }
    })();
  }, [open, getToken]);

  const toggleWeeklyEmail = useCallback(async () => {
    if (weeklyEmail === null) return;
    const next = !weeklyEmail;
    setWeeklyEmail(next);
    try {
      const token = await getToken();
      await patchEmailPrefs(token, { weeklyDigest: next });
    } catch (error) {
      console.error("Failed to update weekly email preference:", error);
      setWeeklyEmail(!next);
    }
  }, [weeklyEmail, getToken]);

  const openSettings = (section: SettingsSection) => {
    setOpen(false);
    setSettingsSection(section);
  };

  const cycleTheme = () =>
    setTheme(THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length]);

  return (
    <div ref={rootRef} className="relative mt-auto border-t border-line p-2">
      {/* Trigger — the whole row, not just the avatar. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={`flex w-full items-center gap-2.5 rounded-md p-2 text-left transition-colors hover:bg-surface-hover cursor-pointer ${
          open ? "bg-surface-hover" : ""
        }`}
      >
        <Avatar src={user?.imageUrl} name={name} size={28} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-fg">
            {name}
          </span>
          <span className="block truncate text-[11px] text-fg-muted">
            Free plan
          </span>
        </span>
        <LuChevronsUpDown size={14} className="shrink-0 text-fg-subtle" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute bottom-full left-2 z-50 mb-2 w-[260px] rounded-xl border border-line bg-card p-1.5 shadow-[0_12px_32px_-8px_rgb(0_0_0/0.35)]"
        >
          {/* Identity */}
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar src={user?.imageUrl} name={name} size={40} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-fg">{name}</p>
              {email && (
                <p className="truncate text-[12px] text-fg-muted">{email}</p>
              )}
            </div>
          </div>

          {/* Plan and usage */}
          <div className="mx-0.5 mb-0.5 flex items-center justify-between gap-2 rounded-lg bg-accent-soft px-3 py-2">
            <span className="truncate text-[12px] text-accent-soft-fg">
              Free
              {savedCount !== undefined
                ? ` · ${savedCount} of ${FREE_PLAN_LIMIT} saves`
                : ""}
            </span>
            <button
              type="button"
              onClick={() => openSettings("plan")}
              className="shrink-0 text-[12px] font-semibold text-accent-soft-fg hover:underline cursor-pointer"
            >
              Upgrade
            </button>
          </div>

          <Hairline />

          {/* App settings */}
          <MenuRow
            icon={<LuUser size={16} />}
            label="Account"
            onClick={() => openSettings("account")}
          />
          <MenuRow
            icon={<LuSettings size={16} />}
            label="Settings"
            onClick={() => openSettings("appearance")}
          />
          <MenuRow
            icon={<LuShare size={16} />}
            label="Share brain"
            onClick={() => openSettings("shared")}
            right={
              isPublic === null ? null : isPublic ? (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-500">
                  Public
                </span>
              ) : (
                <span className="text-[12px] text-fg-subtle">Private</span>
              )
            }
          />
          <MenuRow
            icon={<LuMail size={16} />}
            label="Weekly email"
            role="menuitemcheckbox"
            checked={weeklyEmail ?? false}
            onClick={toggleWeeklyEmail}
            right={weeklyEmail === null ? null : <RowSwitch on={weeklyEmail} />}
          />
          <MenuRow
            icon={<LuMoon size={16} />}
            label="Theme"
            onClick={cycleTheme}
            right={
              <span className="text-[12px] text-fg-subtle">
                {THEME_LABEL[theme]}
              </span>
            }
          />

          <Hairline />

          {/* Outbound */}
          <MenuRow
            icon={<LuPuzzle size={16} />}
            label="Browser extension"
            href={extensionUrl}
            onClick={
              extensionUrl
                ? () => setOpen(false)
                : () => openSettings("extension")
            }
            right={
              extensionUrl ? (
                <LuExternalLink size={14} className="text-fg-subtle" />
              ) : null
            }
          />
          <MenuRow
            icon={<LuCircleHelp size={16} />}
            label="Help and feedback"
            href={helpUrl}
            onClick={() => setOpen(false)}
            right={<LuExternalLink size={14} className="text-fg-subtle" />}
          />

          <Hairline />

          <MenuRow
            icon={<LuLogOut size={16} />}
            label="Sign out"
            danger
            onClick={() => {
              setOpen(false);
              signOut(() => navigate("/"));
            }}
          />
        </div>
      )}

      <SettingsDialog
        open={settingsSection !== null}
        section={settingsSection ?? "account"}
        onSectionChange={setSettingsSection}
        onClose={() => setSettingsSection(null)}
      />
    </div>
  );
};
