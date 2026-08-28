import { useEffect, useMemo, useState } from "react";
import { CrossIcon } from "../icons/crossicon";
import { useAuth } from "@clerk/react";
import { createShareLink, revokeShareLink } from "../lib/api";
import type { Collection, ShareScope, Tag } from "../lib/api";
import type { Note } from "./dashboard";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemCount: number;
  notes: Note[];
  collections: Collection[];
  tags: Tag[];
  /** The dashboard's current filter, so the common case is one click away. */
  activeCollectionId?: string | null;
  activeTag?: string | null;
}

const CHOICES: { value: ShareScope; label: string; hint: string }[] = [
  { value: "all", label: "Everything", hint: "Your whole Brain Expo" },
  { value: "collection", label: "A collection", hint: "One folder of saves" },
  { value: "tag", label: "A tag", hint: "Everything with one tag" },
  { value: "items", label: "Specific items", hint: "Hand-pick what goes out" },
];

export const ShareModal = ({
  isOpen,
  onClose,
  itemCount,
  notes,
  collections,
  tags,
  activeCollectionId = null,
  activeTag = null,
}: ShareModalProps) => {
  const [scope, setScope] = useState<ShareScope>("all");
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shareLink, setShareLink] = useState("");
  const [shareHash, setShareHash] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const { getToken } = useAuth();

  // Opening from a filtered dashboard starts on that filter; otherwise the
  // modal opens on "Everything", which is what Share used to do unasked.
  useEffect(() => {
    if (!isOpen) return;
    setShareLink("");
    setShareHash("");
    setError("");
    setCopied(false);
    setSelectedIds([]);
    setCollectionId(activeCollectionId);
    setTag(activeTag);
    setScope(
      activeCollectionId ? "collection" : activeTag ? "tag" : "all",
    );
  }, [isOpen, activeCollectionId, activeTag]);

  // What the link will actually expose, recomputed as the owner picks.
  const count = useMemo(() => {
    switch (scope) {
      case "collection":
        return collectionId
          ? notes.filter((note) => note.collectionId === collectionId).length
          : 0;
      case "tag":
        return tag ? notes.filter((note) => note.tags?.includes(tag)).length : 0;
      case "items":
        return selectedIds.length;
      default:
        return itemCount;
    }
  }, [scope, collectionId, tag, selectedIds, notes, itemCount]);

  const canGenerate =
    count > 0 &&
    (scope !== "collection" || !!collectionId) &&
    (scope !== "tag" || !!tag);

  const handleShare = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = await getToken();
      const { hash } = await createShareLink(token, {
        scope,
        collectionId: scope === "collection" ? collectionId ?? undefined : undefined,
        tag: scope === "tag" ? tag ?? undefined : undefined,
        noteIds: scope === "items" ? selectedIds : undefined,
      });

      setShareHash(hash);
      setShareLink(`${window.location.origin}/share/${hash}`);
    } catch (err) {
      console.error("Error generating share link:", err);
      setError("Couldn't create that link. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      await revokeShareLink(token, shareHash);
      setShareLink("");
      setShareHash("");
    } catch (err) {
      console.error("Error revoking share link:", err);
      setError("Couldn't revoke that link. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNote = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((noteId) => noteId !== id)
        : [...current, id],
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setShareLink("");
    setShareHash("");
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  // The live-vs-snapshot rule, said at the moment the owner is deciding.
  const helper =
    scope === "items"
      ? `Only these ${count} ${count === 1 ? "item" : "items"}. Saving more later won't change the link.`
      : scope === "all"
        ? "Everything you've saved, including anything you save later."
        : `Anything you later add to this ${scope} will appear here too.`;

  return (
    <div
      className="fixed inset-0 bg-overlay flex items-center justify-center z-50 animate-fadeIn"
      onClick={handleClose}
    >
      <div
        className="bg-card rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="text-xl font-bold text-fg">
            {shareLink ? "Your share link" : "What do you want to share?"}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-surface-hover rounded-lg transition cursor-pointer"
            aria-label="Close"
          >
            <CrossIcon />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {!shareLink ? (
            <>
              {/* Step 1 — pick a scope */}
              <div className="grid grid-cols-2 gap-2">
                {CHOICES.map((choice) => (
                  <button
                    key={choice.value}
                    onClick={() => setScope(choice.value)}
                    aria-pressed={scope === choice.value}
                    className={`text-left px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                      scope === choice.value
                        ? "border-accent bg-accent-soft"
                        : "border-line hover:bg-surface-hover"
                    }`}
                  >
                    <span className="block text-sm font-medium text-fg">
                      {choice.label}
                    </span>
                    <span className="block text-xs text-fg-subtle">
                      {choice.hint}
                    </span>
                  </button>
                ))}
              </div>

              {/* Step 1b — pick which one */}
              {scope === "collection" && (
                <div className="max-h-44 overflow-y-auto space-y-1">
                  {collections.length === 0 ? (
                    <p className="text-sm text-fg-subtle py-2">
                      No collections yet.
                    </p>
                  ) : (
                    collections.map((collection) => (
                      <button
                        key={collection._id}
                        onClick={() => setCollectionId(collection._id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                          collectionId === collection._id
                            ? "bg-accent-soft text-accent-soft-fg"
                            : "text-fg-muted hover:bg-surface-hover"
                        }`}
                      >
                        <span className="truncate">{collection.name}</span>
                        <span className="text-xs text-fg-subtle">
                          {collection.count}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {scope === "tag" && (
                <div className="max-h-44 overflow-y-auto flex flex-wrap gap-2">
                  {tags.length === 0 ? (
                    <p className="text-sm text-fg-subtle py-2">No tags yet.</p>
                  ) : (
                    tags.map((t) => (
                      <button
                        key={t.name}
                        onClick={() => setTag(t.name)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors cursor-pointer ${
                          tag === t.name
                            ? "bg-accent text-accent-fg"
                            : "bg-surface text-fg-muted hover:bg-surface-hover"
                        }`}
                      >
                        {t.name}
                        <span className="ml-1.5 text-xs opacity-70">
                          {t.count}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {scope === "items" && (
                <div className="max-h-44 overflow-y-auto space-y-1">
                  {notes.length === 0 ? (
                    <p className="text-sm text-fg-subtle py-2">
                      Nothing saved yet.
                    </p>
                  ) : (
                    notes.map((note) => (
                      <label
                        key={note._id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-fg-muted hover:bg-surface-hover cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(note._id)}
                          onChange={() => toggleNote(note._id)}
                          className="accent-[var(--color-accent)]"
                        />
                        <span className="truncate">{note.title}</span>
                      </label>
                    ))
                  )}
                </div>
              )}

              <p className="text-sm text-fg-muted leading-relaxed">{helper}</p>

              {error && (
                <p className="text-sm text-danger" role="alert">
                  {error}
                </p>
              )}

              {/* Step 2 — only now is a link minted */}
              <button
                onClick={handleShare}
                disabled={isLoading || !canGenerate}
                className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-accent-fg font-medium py-3 px-4 rounded-lg transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0-12.814a2.25 2.25 0 1 0 0-2.186m0 2.186a2.25 2.25 0 1 0 0 2.186"
                    />
                  </svg>
                )}
                {isLoading ? "Generating..." : "Generate link"}
              </button>
              <p className="text-center text-sm text-fg-subtle">
                {count} {count === 1 ? "item" : "items"} will be shared
              </p>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="flex-1 px-3 py-2.5 bg-surface border border-line rounded-lg text-sm text-fg-muted select-all"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-accent-fg text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
              <p className="text-center text-sm text-accent-soft-fg font-medium">
                ✓ Sharing {count} {count === 1 ? "item" : "items"}.
              </p>
              <button
                onClick={handleRevoke}
                disabled={isLoading}
                className="w-full py-2 text-sm text-fg-subtle hover:text-danger transition-colors cursor-pointer"
              >
                Revoke this link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
