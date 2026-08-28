import { Link, NavLink, Outlet } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";

const ACCOUNT = [
  { to: "/settings/profile", label: "Profile" },
  { to: "/settings/security", label: "Security" },
];

const BRAIN_EXPO = [
  { to: "/settings/email", label: "Weekly email" },
  { to: "/settings/capture", label: "Capture" },
  { to: "/settings/sharing", label: "Sharing" },
  { to: "/settings/tags", label: "Tags" },
  { to: "/settings/appearance", label: "Appearance" },
  { to: "/settings/extension", label: "Extension" },
  { to: "/settings/data", label: "Data" },
];

const itemClass = (isActive: boolean) =>
  `block rounded-md px-2 py-1.5 text-sm transition-colors ${
    isActive
      ? "bg-surface-hover text-fg"
      : "text-fg-muted hover:bg-surface-hover hover:text-fg"
  }`;

const GroupLabel = ({ children }: { children: string }) => (
  <p className="px-2 pb-1 pt-4 text-[11px] font-medium tracking-wider text-fg-subtle">
    {children}
  </p>
);

/**
 * The nav renders here, once. Section changes swap only the content pane, and
 * every link is a router <Link> — a plain anchor would reload the document and
 * throw away the mounted nav on every click.
 */
export function SettingsLayout() {
  return (
    <div className="flex min-h-screen bg-bg">
      <nav className="w-[180px] shrink-0 border-r border-line px-3 py-6">
        <Link
          to="/dashboard"
          className="mb-5 flex items-center gap-1.5 px-2 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          <LuArrowLeft size={14} />
          Back to brain
        </Link>

        <h1 className="px-2 py-2 text-xl font-semibold text-fg">Settings</h1>

        {/* <GroupLabel>ACCOUNT</GroupLabel> */}
        {ACCOUNT.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => itemClass(isActive)}
          >
            {item.label}
          </NavLink>
        ))}

        <div className="my-4 border-t border-line" />

        {/* <GroupLabel>BRAIN EXPO</GroupLabel> */}
        {BRAIN_EXPO.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => itemClass(isActive)}
          >
            {item.label}
          </NavLink>
        ))}

        <div className="my-4 border-t border-line" />

        <NavLink
          to="/settings/danger"
          className={({ isActive }) =>
            `block rounded-md px-2 py-1.5 text-sm text-danger transition-colors ${
              isActive ? "bg-danger-soft" : "hover:bg-danger-soft"
            }`
          }
        >
          Danger zone
        </NavLink>
      </nav>

      <main className="flex-1 px-8 py-6 md:px-12">
        <div className="max-w-[560px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
