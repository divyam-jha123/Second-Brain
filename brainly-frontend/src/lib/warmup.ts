import { API_URL } from "../config";

/**
 * Cold-start warm-up for the API.
 *
 * The backend sleeps after a period of inactivity, so the first request of a
 * session pays a 30-60s boot. Firing a throwaway `GET /health` the moment the
 * app's bundle executes overlaps that boot with the time a visitor spends
 * reading the landing page, so by the time they sign in and the dashboard
 * makes its real requests, the instance is already up.
 *
 * Deliberately fire-and-forget: nothing awaits it, every failure is swallowed,
 * and it never blocks render or surfaces an error to the user.
 */

/** A booting instance answers 502 fast, so a single ping isn't enough. */
const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 4_000;
/** A cold instance may hold the connection open while it boots - wait it out. */
const ATTEMPT_TIMEOUT_MS = 30_000;
const WARMED_KEY = "brainexpo:api-warmed";

let started = false;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function ping(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}/health`, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Kicks off the warm-up. Safe to call more than once - it runs at most once per
 * tab, and not at all if this tab has already woken the backend.
 */
export async function warmUpApi(): Promise<void> {
  if (started) return;
  started = true;

  try {
    if (sessionStorage.getItem(WARMED_KEY)) return;
  } catch {
    // Storage blocked (private mode, embedded context) - just ping.
  }

  void (async () => {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (await ping()) {
        try {
          sessionStorage.setItem(WARMED_KEY, "1");
        } catch {
          // Nothing to do; the ping already succeeded.
        }
        return;
      }
      await sleep(RETRY_DELAY_MS);
    }
  })();

  console.log("Warming up API...");
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (await ping()) {
      console.log("API is warmed up!");
      return;
    }
    await sleep(RETRY_DELAY_MS);
  }
  console.log("API is not warmed up!");
}
