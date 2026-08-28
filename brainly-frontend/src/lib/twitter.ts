export interface TwitterWidgets {
  load: (element?: HTMLElement) => void;
}

declare global {
  interface Window {
    twttr?: {
      /** Present only once the widget factory has finished initialising. */
      ready?: (callback: () => void) => void;
      widgets?: TwitterWidgets;
    };
  }
}

const POLL_INTERVAL_MS = 100;
const GIVE_UP_AFTER_MS = 10_000;

/**
 * widgets.js is loaded with `async`, and it publishes `window.twttr` in two
 * stages — the object exists before `twttr.widgets` does. So a bare
 * `if (window.twttr)` check can pass while `.widgets` is still undefined, and
 * calling `.load()` there throws. Poll until the documented `ready()` hook is
 * available, then hand off to it.
 *
 * Returns a cancel function; call it on unmount so a pending poll can't fire
 * against a torn-down tree.
 */
export const whenTwitterReady = (
  callback: (widgets: TwitterWidgets) => void,
): (() => void) => {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const startedAt = Date.now();

  const attempt = () => {
    if (cancelled) return;

    const twttr = window.twttr;
    if (twttr?.ready) {
      twttr.ready(() => {
        if (!cancelled && twttr.widgets) callback(twttr.widgets);
      });
      return;
    }

    // Script blocked by an extension, offline, or simply never arrived.
    if (Date.now() - startedAt > GIVE_UP_AFTER_MS) return;
    timer = setTimeout(attempt, POLL_INTERVAL_MS);
  };

  attempt();

  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
};
