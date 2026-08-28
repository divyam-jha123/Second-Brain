import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { deleteTag, fetchTags, renameTag } from "../../lib/api";
import type { Tag } from "../../lib/api";
import { SettingsCard } from "./section";
import { SettingsHeader } from "./primitives";

export const TagSettings = () => {
  const { getToken } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      setTags(await fetchTags(token));
    } catch (err) {
      console.error("Failed to fetch tags:", err);
      setError("Couldn't load your tags.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  const commitRename = async (from: string) => {
    const next = draft.trim();
    setEditing(null);
    if (!next || next === from) return;

    try {
      const token = await getToken();
      await renameTag(token, from, next);
      await load();
    } catch (err) {
      console.error("Failed to rename tag:", err);
      setError("Couldn't rename that tag.");
    }
  };

  const remove = async (name: string) => {
    // Optimistic: the tag is only pulled off notes, so nothing is destroyed.
    setTags((current) => current.filter((tag) => tag.name !== name));
    try {
      const token = await getToken();
      await deleteTag(token, name);
    } catch (err) {
      console.error("Failed to delete tag:", err);
      setError("Couldn't delete that tag.");
      await load();
    }
  };

  return (
    <>
      <SettingsHeader
        title="Tags"
        description="Rename a tag everywhere it's used, or remove it from every note."
      />
      <SettingsCard>
        {loading ? (
          <p className="text-sm text-fg-muted">Loading tags...</p>
        ) : tags.length === 0 ? (
          <p className="text-sm text-fg-muted">
            No tags yet — add some from a card on your dashboard.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {tags.map((tag) => (
              <li
                key={tag.name}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                {editing === tag.name ? (
                  <input
                    autoFocus
                    value={draft}
                    aria-label={`Rename ${tag.name}`}
                    onChange={(event) => setDraft(event.target.value)}
                    onBlur={() => commitRename(tag.name)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commitRename(tag.name);
                      if (event.key === "Escape") setEditing(null);
                    }}
                    className="flex-1 rounded-lg border border-line bg-card px-2 py-1 text-sm text-fg"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(tag.name);
                      setDraft(tag.name);
                    }}
                    className="flex-1 text-left text-sm text-fg hover:underline cursor-pointer"
                  >
                    {tag.name}
                  </button>
                )}

                <span className="text-xs text-fg-subtle">
                  {tag.count} {tag.count === 1 ? "note" : "notes"}
                </span>
                <button
                  type="button"
                  onClick={() => remove(tag.name)}
                  className="text-xs text-fg-subtle hover:text-danger transition-colors cursor-pointer"
                >
                  Remove
                </button>
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
