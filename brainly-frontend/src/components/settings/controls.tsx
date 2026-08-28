import type { ReactNode } from "react";
import { LuChevronDown } from "react-icons/lu";

/** Bordered container that hosts a stack of <PrefRow>s. */
export const Panel = ({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "danger";
}) => (
  <div
    className={`overflow-hidden rounded-xl border bg-surface ${
      tone === "danger" ? "border-danger/40" : "border-line"
    }`}
  >
    {children}
  </div>
);

/** Small muted caption above a panel ("Preferences", "Danger zone"). */
export const GroupLabel = ({ children }: { children: ReactNode }) => (
  <p className="mb-2 mt-7 text-[13px] text-fg-muted">{children}</p>
);

/** Label and description on the left, one control on the right. */
export const PrefRow = ({
  label,
  description,
  children,
}: {
  label: string;
  description?: ReactNode;
  children?: ReactNode;
}) => (
  <div className="flex items-center justify-between gap-6 border-b border-line px-4 py-3.5 last:border-b-0">
    <div className="min-w-0">
      <p className="text-sm font-medium text-fg">{label}</p>
      {description && (
        <div className="mt-0.5 truncate text-[13px] text-fg-muted">
          {description}
        </div>
      )}
    </div>
    {children && <div className="shrink-0">{children}</div>}
  </div>
);

/** Two or three mutually exclusive values, shown side by side. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex overflow-hidden rounded-lg border border-line"
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 text-[13px] transition-colors cursor-pointer ${
            index > 0 ? "border-l border-line" : ""
          } ${
            value === option.value
              ? "bg-surface-hover font-medium text-fg"
              : "text-fg-muted hover:bg-surface-hover hover:text-fg"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Native select, restyled. Keyboard and screen-reader behaviour comes free. */
export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <span className="relative inline-flex items-center">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="appearance-none rounded-lg border border-line bg-surface py-1.5 pl-3 pr-8 text-[13px] text-fg outline-none transition-colors hover:bg-surface-hover focus:border-accent cursor-pointer"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <LuChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 text-fg-muted"
      />
    </span>
  );
}

export const Switch = ({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors ${
      checked ? "bg-brand" : "bg-line-strong"
    } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
  >
    <span
      className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform ${
        checked ? "translate-x-[23px]" : "translate-x-[3px]"
      }`}
    />
  </button>
);

/** Neutral bordered button — "Edit profile" and friends. */
export const QuietButton = ({
  children,
  onClick,
  tone = "default",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "default" | "danger";
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`shrink-0 rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors cursor-pointer ${
      tone === "danger"
        ? "border-danger/50 text-danger hover:bg-danger-soft"
        : "border-line text-fg hover:bg-surface-hover"
    }`}
  >
    {children}
  </button>
);
