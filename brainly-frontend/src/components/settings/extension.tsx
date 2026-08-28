import { useExtensionBridge } from "../../hooks/useExtensionBridge";
import { SettingsCard } from "./section";
import { SettingsHeader } from "./primitives";

const DOT = {
  connected: "bg-accent",
  checking: "bg-fg-muted",
  not_installed: "bg-fg-subtle",
} as const;

const LABEL = {
  connected: "Extension connected",
  checking: "Checking...",
  not_installed: "Extension not installed",
} as const;

export const ExtensionSettings = () => {
  const { status } = useExtensionBridge();

  return (
    <>
      <SettingsHeader
        title="Browser extension"
        description="Save any page to your Brain without opening the app."
      />
      <SettingsCard>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${DOT[status]}`} />
          <span className="text-sm font-medium text-fg">{LABEL[status]}</span>
        </div>

        {status === "connected" && (
          <div className="mt-3 space-y-2 text-sm text-fg-muted">
            <p>
              You&apos;re all set — click the Brain Expo icon in your toolbar to
              save the page you&apos;re on.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-xs">
              <li>Add tags while saving to keep things sorted</li>
              <li>YouTube, Twitter and articles are detected automatically</li>
            </ul>
          </div>
        )}

        {status === "not_installed" && (
          <div className="mt-3 space-y-3 text-sm text-fg-muted">
            <p>
              Install the extension, then come back here — it connects on its
              own.
            </p>
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Coming soon"
              className="rounded-lg border border-line px-3 py-2 text-sm text-fg-subtle cursor-not-allowed"
            >
              Coming soon to the Chrome Web Store
            </button>
            <p className="text-xs text-fg-subtle">
              Works on Chrome, Edge and Brave. Firefox support is coming.
            </p>
          </div>
        )}

        {status === "checking" && (
          <p className="mt-3 text-sm text-fg-muted">
            Detecting extension status...
          </p>
        )}
      </SettingsCard>
    </>
  );
};
