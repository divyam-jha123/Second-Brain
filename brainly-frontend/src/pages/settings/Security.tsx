import { useMemo } from "react";
import { UserProfileProvider, UserProfileSecurityPanel } from "@clerk/ui/experimental";
import { SettingsHeader } from "../../components/settings/primitives";
import { useClerkAppearance } from "./clerkAppearance";

export function SecuritySettings() {
  const appearance = useClerkAppearance();

  const panel = useMemo(
    () => (
      <UserProfileProvider appearance={appearance}>
        <UserProfileSecurityPanel />
      </UserProfileProvider>
    ),
    [appearance],
  );

  return (
    <>
      <SettingsHeader
        title="Security"
        description="Password, two-step verification and active devices."
      />
      {panel}
    </>
  );
}
