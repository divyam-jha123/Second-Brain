

export const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

/** Where "Help and feedback" writes to. */
export const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL || "contact@brainexpo.me";
