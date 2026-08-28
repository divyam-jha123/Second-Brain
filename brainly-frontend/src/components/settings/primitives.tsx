import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LuArrowRight, LuBell, LuWrench } from "react-icons/lu";

/** Top of every settings page. */
export const SettingsHeader = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <header className="mb-6">
    <h1 className="text-lg font-semibold text-fg">{title}</h1>
    <p className="mt-1 text-sm text-fg-muted">{description}</p>
  </header>
);

/**
 * Every control in every section sits in one of these: label and description in
 * a fixed left column, control on the right, hairline between rows.
 */
export const SettingsRow = ({
  label,
  description,
  disabled = false,
  children,
}: {
  label: string;
  description?: string;
  disabled?: boolean;
  children: ReactNode;
}) => (
  <div
    className={`flex items-start justify-between gap-6 border-b border-line py-4 last:border-b-0 ${
      disabled ? "opacity-50" : ""
    }`}
  >
    <div className="w-[150px] shrink-0">
      <p className="text-sm font-medium text-fg">{label}</p>
      {description && (
        <p className="mt-0.5 text-xs text-fg-muted">{description}</p>
      )}
    </div>
    <div className="flex min-w-0 flex-1 flex-col items-end gap-2 text-right">
      {children}
    </div>
  </div>
);

/**
 * Placeholder body for sections whose internals are a separate task.
 *
 * "Coming soon." on its own tells someone nothing about whether to wait or go
 * elsewhere, so each section says what it will actually do. `notify` links to
 * the announcements toggle that already exists rather than inventing a
 * subscribe endpoint — a button that silently does nothing is worse than none.
 */
export const ComingSoon = ({
  summary,
  planned,
  eta,
  notify = true,
}: {
  /** One line on what this section will be for. */
  summary: string;
  /** The specific things it will let you do. */
  planned: string[];
  /** Rough timing, when it's honest to give one. */
  eta?: string;
  notify?: boolean;
}) => (
  <div className="rounded-xl border border-dashed border-line-strong p-6">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-hover text-fg-muted">
        <LuWrench size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">Not built yet</p>
        <p className="mt-1 text-sm leading-relaxed text-fg-muted">{summary}</p>

        <ul className="mt-4 flex flex-col gap-2">
          {planned.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-fg-subtle" />
              <span className="text-sm leading-relaxed text-fg-muted">{item}</span>
            </li>
          ))}
        </ul>

        {eta && (
          <p className="mt-4 text-xs text-fg-subtle">{eta}</p>
        )}

        {notify && (
          <Link
            to="/settings/email"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-fg transition-colors hover:bg-surface-hover"
          >
            <LuBell size={14} />
            Notify me when it ships
            <LuArrowRight size={14} className="text-fg-subtle" />
          </Link>
        )}
      </div>
    </div>
  </div>
);
