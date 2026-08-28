import {
  ComingSoon,
  SettingsHeader,
} from "../../components/settings/primitives";

export const CaptureSettings = () => (
  <>
    <SettingsHeader
      title="Capture"
      description="How links you save are titled, tagged and filed."
    />
    <ComingSoon
      summary="Right now every save lands in your Inbox with the title you give it. This section will let you set what happens automatically instead."
      planned={[
        "Pull the title, author and description from the page itself",
        "Suggest tags based on what you've tagged before",
        "File saves from a domain straight into a collection",
        "Choose a default collection for the browser extension",
      ]}
    />
  </>
);

export const DataSettings = () => (
  <>
    <SettingsHeader
      title="Data"
      description="Export everything you've saved, or take it elsewhere."
    />
    <ComingSoon
      summary="Your saves are yours. This section will let you get all of them out, in a format something else can read."
      planned={[
        "Export every save as JSON or CSV, tags and collections included",
        "Import from Pocket, Raindrop and browser bookmarks",
        "Download a one-off archive of everything",
      ]}
    />
  </>
);

export const PlanSettings = () => (
  <>
    <SettingsHeader title="Plan" description="Your plan, usage and billing." />
    <ComingSoon
      summary="BrainExpo is free while it's being built, with no limit on what you save."
      planned={[
        "See how much you've saved and how it's growing",
        "Paid plans, if and when there are any",
        "Invoices and payment method",
      ]}
      eta="Nothing to do here yet — you won't be charged for anything you're using today."
    />
  </>
);

export const DangerSettings = () => (
  <>
    <SettingsHeader
      title="Danger zone"
      description="Irreversible actions. Deleting your account removes every save."
    />
    <ComingSoon
      summary="Account deletion isn't wired up yet. Until it is, email us and we'll remove your account and everything in it by hand."
      planned={[
        "Delete every save while keeping your account",
        "Delete your account and all of its data permanently",
        "Download an export before you go",
      ]}
      // Nobody wants an email announcing that account deletion has arrived.
      notify={false}
    />
  </>
);
