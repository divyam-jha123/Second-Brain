import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { completeTour, fetchMe } from "../lib/api";

type Status = "loading" | "needed" | "complete";

/**
 * Whether the onboarding card should float over the dashboard, and whether
 * the guided tour that follows it has already been shown. Both ride the same
 * /user/me fetch, since the tour is the second half of the same flow.
 * A user with no backend document yet has never onboarded, and /user/me
 * reports that as null rather than 404.
 */
export function useOnboardingStatus() {
  const { getToken, isSignedIn } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [tourStatus, setTourStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!isSignedIn) return;

    let cancelled = false;

    const check = async () => {
      try {
        const token = await getToken();
        const me = await fetchMe(token);
        if (!cancelled) {
          setStatus(me.onboardingCompletedAt ? "complete" : "needed");
          setTourStatus(me.tourCompletedAt ? "complete" : "needed");
        }
      } catch (error) {
        // Never block someone's dashboard because a check failed.
        console.error("Onboarding check failed:", error);
        if (!cancelled) {
          setStatus("complete");
          setTourStatus("complete");
        }
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [getToken, isSignedIn]);

  // Dismisses the card straight away, without waiting for a refetch.
  const markComplete = useCallback(() => setStatus("complete"), []);

  // Dismisses the tour straight away, and persists it (finished or skipped).
  const markTourComplete = useCallback(() => {
    setTourStatus("complete");
    getToken()
      .then((token) => completeTour(token))
      .catch((error) => console.error("Tour completion failed:", error));
  }, [getToken]);

  return { status, markComplete, tourStatus, markTourComplete };
}
