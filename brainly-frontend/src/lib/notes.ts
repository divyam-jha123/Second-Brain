export type ContentType = "tweet" | "video" | "document" | "linkedin" | "podcast";

/**
 * The backend stores a note as { title, content } where `content` is the saved
 * URL. Everything richer the dashboard shows — kind, source, age — is derived
 * from those two fields until the model grows real metadata.
 */
export const getContentType = (content: string | undefined): ContentType => {
  if (content?.includes("youtube") || content?.includes("youtu.be")) return "video";
  if (content?.includes("twitter") || content?.includes("x.com")) return "tweet";
  if (content?.includes("linkedin.com")) return "linkedin";
  if (
    content?.includes("open.spotify.com/episode") ||
    content?.includes("open.spotify.com/show") ||
    content?.includes("podcasts.apple.com") ||
    content?.includes("anchor.fm") ||
    content?.includes("pca.st")
  )
    return "podcast";
  return "document";
};

/** "https://www.youtube.com/watch?v=x" -> "youtube.com". Non-URLs return null. */
export const getSourceDomain = (content: string | undefined): string | null => {
  if (!content) return null;
  try {
    return new URL(content).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
};

const UNITS: [limit: number, seconds: number, label: string][] = [
  [60, 1, "s"],
  [3600, 60, "m"],
  [86400, 3600, "h"],
  [2592000, 86400, "d"],
  [31536000, 2592000, "mo"],
  [Infinity, 31536000, "y"],
];

/** Compact age for the card footer: "4mo ago", "3d ago", "just now". */
export const getRelativeTime = (iso: string, now: Date = new Date()): string => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const seconds = Math.max(0, Math.floor((now.getTime() - then) / 1000));
  if (seconds < 45) return "just now";

  for (const [limit, divisor, label] of UNITS) {
    if (seconds < limit) return `${Math.floor(seconds / divisor)}${label} ago`;
  }
  return "";
};
