import { useMemo } from "react";
import { UserProfileProvider, UserProfileAccountPanel } from "@clerk/ui/experimental";
import { SettingsHeader } from "../../components/settings/primitives";
import { useClerkAppearance } from "./clerkAppearance";

export function ProfileSettings() {
  const appearance = useClerkAppearance();

  // Clerk supplies the panel content; the nav and layout around it are ours.
  const panel = useMemo(
    () => (
      <UserProfileProvider appearance={appearance}>
        <UserProfileAccountPanel />
      </UserProfileProvider>
    ),
    [appearance],
  );

  return (
    <>
      <SettingsHeader
        title="Profile"
        description="Your name, email addresses and connected accounts."
      />
      {panel}
    </>
  );
}
