import {
  ComingSoon,
  SettingsHeader,
} from "./primitives";

/** Every stub can hand the reader to the announcements toggle. */
type StubProps = { onNotify?: () => void };

export const DataSettings = ({ onNotify }: StubProps) => (
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
      onNotify={onNotify}
    />
  </>
);

export const PlanSettings = ({ onNotify }: StubProps) => (
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
      onNotify={onNotify}
    />
  </>
);
