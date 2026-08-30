import { useEffect, useState } from "react";
import { LuGlobe, LuLink, LuPlay, LuTrash2, LuShare2, LuX, LuPlus } from "react-icons/lu";
import { DocumentIcon } from "../icons/documentIcon";
import { TwitterIcon } from "../icons/twitterIcon";
import { VideoIcon } from "../icons/videoIcon";
import { LinkedinIcon } from "../icons/linkedinIcon";
import { PodcastIcon } from "../icons/podcastIcon";
import { getRelativeTime, getSourceDomain } from "../lib/notes";
import { whenTwitterReady } from "../lib/twitter";
import type { Collection } from "../lib/api";
import type { ContentType } from "../lib/notes";

type CardType = ContentType;

interface CardProps {
  title: string;
  type: CardType;
  content?: string;
  contentList?: string[];
  tags: string[];
  addedDate: string;
  /** ISO timestamp, when available, for the compact "4mo ago" footer. */
  createdAt?: string;
  /** Free-text the user attached to the save. */
  note?: string;
  onDelete?: () => void;
  onShare?: () => void;
  readOnly?: boolean; // hide action buttons on shared dashboard
  /** Collections the note can be filed under; omit to hide the picker. */
  collections?: Collection[];
  collectionId?: string | null;
  onTagsChange?: (tags: string[]) => void;
  onCollectionChange?: (collectionId: string | null) => void;
}

const typeIcons: Record<CardType, React.ReactElement> = {
  document: <DocumentIcon size="sm" />,
  tweet: <TwitterIcon size="sm" />,
  video: <VideoIcon size="sm" />,
  linkedin: <LinkedinIcon size="sm" />,
  podcast: <PodcastIcon size="sm" />,
};

/** Glyph shown on the preview tile when there is no real thumbnail. */
const previewGlyphs: Record<CardType, React.ReactElement> = {
  video: <LuPlay size={30} />,
  tweet: <LuLink size={30} />,
  linkedin: <LuLink size={30} />,
  document: <LuLink size={30} />,
  podcast: <LuPlay size={30} />,
};

const YOUTUBE_ID = /(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/;

const youtubeThumbnail = (content: string | undefined): string | null => {
  const match = content?.match(YOUTUBE_ID);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
};

export const Card = (props: CardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [tagDraft, setTagDraft] = useState("");

  const domain = getSourceDomain(props.content);
  const age = props.createdAt ? getRelativeTime(props.createdAt) : "";
  const thumbnail =
    props.type === "video" && !thumbFailed ? youtubeThumbnail(props.content) : null;
  // Only these two render their real embed in the grid; without content there
  // is nothing to embed, so fall back to the glyph tile.
  const isLiveEmbed =
    (props.type === "tweet" || props.type === "linkedin" || props.type === "podcast") &&
    !!props.content;

  useEffect(() => {
    if (props.type !== "tweet") return;
    return whenTwitterReady((widgets) => widgets.load());
  }, [props.content, props.type, isExpanded]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
    };
    if (isExpanded) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

  const addTag = () => {
    const tag = tagDraft.trim().toLowerCase();
    setTagDraft("");
    if (!tag || props.tags.includes(tag)) return;
    props.onTagsChange?.([...props.tags, tag]);
  };

  const removeTag = (tag: string) => {
    props.onTagsChange?.(props.tags.filter((t) => t !== tag));
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!props.onDelete) return;
    setIsDeleting(true);
    await props.onDelete();
    setIsDeleting(false);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (props.content) {
      navigator.clipboard.writeText(props.content);
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
    props.onShare?.();
  };

  const renderMedia = () => (
    <>
      {props.type === "video" && (
        <iframe
          className="w-full rounded-lg aspect-video"
          src={props.content?.replace("watch?v=", "embed/")}
          title={props.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        ></iframe>
      )}

      {props.type === "tweet" && props.content && (
        <blockquote className="twitter-tweet">
          <a href={props.content.replace("x.com", "twitter.com")}></a>
        </blockquote>
      )}

      {props.type === "linkedin" && props.content && (() => {
        let embedUrl = props.content;

        // 1. If user pasted a full iframe snippet, extract the src URL
        const iframeMatch = props.content.match(/src="([^"]+)"/);
        if (iframeMatch) {
          embedUrl = iframeMatch[1];
        } else {
          // 2. Identify an explicit URN like urn:li:activity:1234
          const urnMatch = props.content.match(/(urn:li:[\w]+:\d+)/);
          if (urnMatch) {
            embedUrl = `https://www.linkedin.com/embed/feed/update/${urnMatch[0]}`;
          } else {
            // 3. Just a regular linkedin.com/posts/ url, extract the ID
            const idMatch = props.content.match(/\d{18,20}/);
            if (idMatch) {
              const type = props.content.includes('-ugcPost-')
                ? 'ugcPost'
                : props.content.includes('-activity-') ? 'activity' : 'share';
              embedUrl = `https://www.linkedin.com/embed/feed/update/urn:li:${type}:${idMatch[0]}`;
            }
          }
        }

        return (
          <iframe
            src={embedUrl}
            className="w-full rounded-lg min-h-[400px] bg-white"
            frameBorder="0"
            allowFullScreen={true}
            title={props.title}
          ></iframe>
        );
      })()}

      {props.type === "podcast" && props.content && (() => {
        const spotifyMatch = props.content.match(
          /open\.spotify\.com\/(episode|show)\/([\w]+)/,
        );
        if (spotifyMatch) {
          return (
            <iframe
              src={`https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}`}
              className="w-full rounded-lg"
              height="152"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              title={props.title}
            ></iframe>
          );
        }
        return (
          <a
            href={props.content}
            target="_blank"
            rel="noreferrer"
            className="text-sm leading-relaxed text-accent break-words hover:underline"
          >
            {props.content}
          </a>
        );
      })()}

      {props.type === "document" && props.content && (
        <p className="text-sm leading-relaxed text-fg-muted break-words">
          {props.content}
        </p>
      )}
    </>
  );

  return (
    <>
      {/* Copied toast */}
      {shareCopied && (
        <div className="fixed bottom-6 left-1/2 z-60 -translate-x-1/2 rounded-full bg-fg px-4 py-2.5 text-sm text-bg shadow-lg animate-scaleIn">
          ✓ Link copied to clipboard
        </div>
      )}

      {/* Preview Card */}
      <article
        onClick={() => setIsExpanded(true)}
        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-line bg-card transition-colors hover:border-line-strong hover:bg-card-hover"
      >
        {/* Preview tile — social posts embed live, everything else gets a tile. */}
        <div
          className={`relative overflow-hidden bg-surface ${
            isLiveEmbed ? "max-h-64" : "flex h-40 items-center justify-center"
          }`}
        >
          {isLiveEmbed ? (
            <>
              {/* Decorative here: clicks belong to the card, not the iframe. */}
              <div className="pointer-events-none p-3">{renderMedia()}</div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
            </>
          ) : thumbnail ? (
            <img
              src={thumbnail}
              alt=""
              loading="lazy"
              onError={() => setThumbFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-fg-subtle">{previewGlyphs[props.type]}</span>
          )}

          {!props.readOnly && (
            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <button
                title="Copy link"
                onClick={handleShare}
                className="rounded-lg bg-card/90 p-1.5 text-fg-muted backdrop-blur transition-colors hover:text-accent cursor-pointer"
              >
                <LuShare2 size={15} />
              </button>
              <button
                title="Delete"
                disabled={isDeleting}
                onClick={handleDelete}
                className="rounded-lg bg-card/90 p-1.5 text-fg-muted backdrop-blur transition-colors hover:text-danger disabled:opacity-50 cursor-pointer"
              >
                <LuTrash2 size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-fg">
            {props.title}
          </h3>

          <p className="line-clamp-2 text-sm leading-snug text-fg-muted">
            {props.note ?? "—"}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {props.tags.length === 0 ? (
              <span className="rounded-full border border-line px-2 py-0.5 text-xs text-fg-subtle">
                untagged
              </span>
            ) : (
              props.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-tag px-2 py-0.5 text-xs font-medium text-tag-fg"
                >
                  {tag}
                </span>
              ))
            )}
          </div>

          <div className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-fg-subtle">
            <span className="shrink-0">
              {props.type === "document" ? <LuGlobe size={13} /> : typeIcons[props.type]}
            </span>
            <span className="truncate">{domain ?? "note"}</span>
            {age && <span aria-hidden>·</span>}
            {age && <span className="shrink-0">{age}</span>}
          </div>
        </div>
      </article>

      {/* Expanded Modal Overlay */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsExpanded(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-overlay backdrop-blur-sm" />

          {/* Expanded Card */}
          <div
            className="relative flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-2xl border border-line bg-card p-6 shadow-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsExpanded(false)}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg cursor-pointer"
            >
              <LuX size={18} />
            </button>

            {/* Header with action buttons */}
            <div className="flex items-start gap-2 pr-8">
              <span className="mt-0.5 shrink-0 text-fg-muted">{typeIcons[props.type]}</span>
              <h3 className="flex-1 text-lg font-bold text-fg">{props.title}</h3>
              {!props.readOnly && (
                <div className="mr-6 flex shrink-0 items-center gap-2">
                  <button
                    title="Copy link"
                    onClick={handleShare}
                    className="rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-surface-hover hover:text-accent cursor-pointer"
                  >
                    <LuShare2 size={16} />
                  </button>
                  <button
                    title="Delete"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-surface-hover hover:text-danger disabled:opacity-50 cursor-pointer"
                  >
                    <LuTrash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Tags — editable unless the card is read-only */}
            <div className="flex flex-wrap items-center gap-2">
              {props.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-tag px-2.5 py-1 text-xs font-medium text-tag-fg"
                >
                  #{tag}
                  {!props.readOnly && props.onTagsChange && (
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      title={`Remove ${tag}`}
                      aria-label={`Remove tag ${tag}`}
                      className="opacity-60 transition-opacity hover:opacity-100 cursor-pointer"
                    >
                      <LuX size={11} />
                    </button>
                  )}
                </span>
              ))}

              {!props.readOnly && props.onTagsChange && (
                <div className="flex items-center gap-1">
                  <input
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                      // Backspace on an empty field peels off the last tag.
                      if (e.key === "Backspace" && !tagDraft && props.tags.length) {
                        removeTag(props.tags[props.tags.length - 1]);
                      }
                    }}
                    onBlur={addTag}
                    placeholder="Add tag"
                    aria-label="Add tag"
                    className="w-24 rounded-full border border-dashed border-line bg-transparent px-2.5 py-1 text-xs text-fg placeholder:text-fg-subtle outline-none focus:border-accent"
                  />
                  <LuPlus size={12} className="text-fg-subtle" />
                </div>
              )}
            </div>

            {/* Collection */}
            {!props.readOnly && props.collections && props.onCollectionChange && (
              <label className="flex items-center gap-2 text-xs text-fg-muted">
                Collection
                <select
                  value={props.collectionId ?? ""}
                  onChange={(e) =>
                    props.onCollectionChange?.(e.target.value || null)
                  }
                  className="rounded-lg border border-line bg-card px-2 py-1 text-xs text-fg outline-none focus:border-accent cursor-pointer"
                >
                  <option value="">Inbox (none)</option>
                  {props.collections.map((collection) => (
                    <option key={collection._id} value={collection._id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* Full Content */}
            <div className="flex-1">{renderMedia()}</div>

            {/* Date */}
            <p className="border-t border-line pt-2 text-xs text-fg-subtle">
              Added on {props.addedDate}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
