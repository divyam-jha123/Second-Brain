import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/react";
import { API_URL } from "../config";
import axios from "axios";

/**
 * Ensures the current user has an EmailPreference doc on the backend.
 * Called once on Dashboard mount — creates default preferences if none exist.
 */
export function useEmailSync() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !user || hasSynced.current) return;

    const syncEmailPrefs = async () => {
      try {
        const token = await getToken();

        const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;

        // PUT with email — the server will upsert with defaults
        await axios.put(
          `${API_URL}/email/preferences`,
          { email },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        hasSynced.current = true;
      } catch (error) {
        console.error("Email preference sync failed:", error);
      }
    };

    syncEmailPrefs();
  }, [isSignedIn, user, getToken]);
}
