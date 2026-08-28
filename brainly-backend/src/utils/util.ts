

export const generateRandom = (len: number = 10) => {
    let options = "estrdtfygkhjlkdohnouqjlco345768798gibxib908uh";
    let ans = "";

    for (let i = 0; i < len; i++) {
        ans += options[Math.floor(Math.random() * options.length)];
    }

    return ans;
}
/**
 * "https://www.youtube.com/watch?v=x" -> "youtube.com".
 * Stored on the note at write time; returns undefined for non-URL content.
 */
export function getSourceDomain(content: string): string | undefined {
  try {
    return new URL(content).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

/** Trim, drop blanks, lowercase, de-duplicate. Tags are matched exactly. */
export function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const cleaned = input
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 25);
  return [...new Set(cleaned)];
}
