const normalize = (value: string | undefined, fallback: string): string =>
  (value && value.trim()) || fallback;

export const FRONTEND_URL = normalize(
  import.meta.env.VITE_FRONTEND_URL,
  "http://localhost:5173",
);

export const API_URL = normalize(
  import.meta.env.VITE_API_URL,
  "http://localhost:8000",
);

