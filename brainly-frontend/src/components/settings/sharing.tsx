import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { fetchShareLinks, revokeShareLink } from "../../lib/api";
import type { ShareLink } from "../../lib/api";
import { SettingsCard } from "./section";
import { SettingsHeader } from "./primitives";

/** What a link exposes, in the owner's words. */
const describe = (link: ShareLink) => {
  switch (link.scope) {
    case "collection":
      return `Collection · ${link.label ?? "Untitled"}`;
    case "tag":
      return `Tag · ${link.label ?? link.tag}`;
    case "items":
      return `${link.noteIds?.length ?? 0} hand-picked items`;
    default:
      return "Everything you've saved";
  }
};

export const SharingSettings = () => {
  const { getToken } = useAuth();
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      setLinks(await fetchShareLinks(token));
    } catch (err) {
      console.error("Failed to fetch share links:", err);
      setError("Couldn't load your share links.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  const revoke = async (hash: string) => {
    setLinks((current) => current.filter((link) => link.hash !== hash));
    try {
      const token = await getToken();
      await revokeShareLink(token, hash);
    } catch (err) {
      console.error("Failed to revoke share link:", err);
      setError("Couldn't revoke that link.");
      await load();
    }
  };

  const copy = (hash: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${hash}`);
    setCopied(hash);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      <SettingsHeader
        title="Sharing"
        description="Every link you've handed out, and what it exposes. Revoking one takes effect immediately."
      />
      <SettingsCard>
        {loading ? (
          <p className="text-sm text-fg-muted">Loading share links...</p>
        ) : links.length === 0 ? (
          <p className="text-sm text-fg-muted">
            You haven&apos;t shared anything yet. Use Share on your dashboard to
            create a link.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {links.map((link) => (
              <li
                key={link.hash}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">
                    {describe(link)}
                  </p>
                  <p className="truncate text-xs text-fg-subtle">
                    /share/{link.hash}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => copy(link.hash)}
                    className="text-xs text-fg-muted hover:text-fg transition-colors cursor-pointer"
                  >
                    {copied === link.hash ? "Copied!" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => revoke(link.hash)}
                    className="text-xs text-fg-subtle hover:text-danger transition-colors cursor-pointer"
                  >
                    Revoke
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </SettingsCard>
    </>
  );
};
