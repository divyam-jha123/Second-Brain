import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { fetchMe } from "../lib/api";

type Status = "loading" | "needed" | "complete";

/**
 * Whether the onboarding card should float over the dashboard.
 * A user with no backend document yet has never onboarded, and /user/me
 * reports that as null rather than 404.
 */
export function useOnboardingStatus() {
  const { getToken, isSignedIn } = useAuth();
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!isSignedIn) return;

    let cancelled = false;

    const check = async () => {
      try {
        const token = await getToken();
        const me = await fetchMe(token);
        if (!cancelled) {
          setStatus(me.onboardingCompletedAt ? "complete" : "needed");
        }
      } catch (error) {
        // Never block someone's dashboard because a check failed.
        console.error("Onboarding check failed:", error);
        if (!cancelled) setStatus("complete");
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [getToken, isSignedIn]);

  // Dismisses the card straight away, without waiting for a refetch.
  const markComplete = useCallback(() => setStatus("complete"), []);

  return { status, markComplete };
}
