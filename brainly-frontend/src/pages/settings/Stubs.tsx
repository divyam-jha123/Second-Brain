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
    <ComingSoon />
  </>
);

export const DataSettings = () => (
  <>
    <SettingsHeader
      title="Data"
      description="Export everything you've saved, or take it elsewhere."
    />
    <ComingSoon />
  </>
);

export const DangerSettings = () => (
  <>
    <SettingsHeader
      title="Danger zone"
      description="Irreversible actions. Deleting your account removes every save."
    />
    <ComingSoon />
  </>
);
