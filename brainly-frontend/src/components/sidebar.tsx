import { useState } from "react";
import { useUser } from "@clerk/react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LuFolder,
  LuInbox,
  LuLayers,
  LuPlus,
  LuSettings,
  LuTrash2,
} from "react-icons/lu";
import { BrainExpoLogo } from "../assets/brand/BrainExpoLogo";
import type { Collection, Tag } from "../lib/api";

export type ContentFilter =
  | "all"
  | "inbox"
  | "tweet"
  | "video"
  | "document"
  | "linkedin"
  | "settings";

interface SidebarProps {
  activeFilter?: ContentFilter;
  onFilterChange?: (filter: ContentFilter) => void;
  /** Notes with no tags yet — the number shown on the Inbox badge. */
  inboxCount?: number;
  collections?: Collection[];
  tags?: Tag[];
  activeCollectionId?: string | null;
  activeTag?: string | null;
  onSelectCollection?: (id: string | null) => void;
  onSelectTag?: (tag: string | null) => void;
  onCreateCollection?: (name: string) => void;
  onDeleteCollection?: (id: string) => void;
}

const NavItem = ({
  icon,
  label,
  isActive,
  badge,
  onClick,
  onDelete,
}: {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  badge?: number;
  onClick?: () => void;
  onDelete?: () => void;
}) => (
  <div className="group/item relative flex items-center">
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer ${
        isActive
          ? "bg-surface-hover text-fg"
          : "text-fg-muted hover:bg-surface-hover hover:text-fg"
      }`}
    >
      <span className="shrink-0 text-base">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
            onDelete
              ? "text-fg-subtle group-hover/item:opacity-0"
              : "bg-accent-soft text-accent-soft-fg"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
    {onDelete && (
      <button
        type="button"
        onClick={onDelete}
        title={`Delete ${label}`}
        aria-label={`Delete ${label}`}
        className="absolute right-2 rounded p-1 text-fg-subtle opacity-0 transition-opacity hover:text-danger group-hover/item:opacity-100 cursor-pointer"
      >
        <LuTrash2 size={13} />
      </button>
    )}
  </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="px-3 pb-1 pt-5 text-xs font-medium tracking-wide text-fg-subtle">
    {children}
  </p>
);

export const Sidebar = ({
  activeFilter = "all",
  onFilterChange,
  inboxCount = 0,
  collections = [],
  tags = [],
  activeCollectionId = null,
  activeTag = null,
  onSelectCollection,
  onSelectTag,
  onCreateCollection,
  onDeleteCollection,
}: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [isAdding, setIsAdding] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);

  const handleClick = (filter: ContentFilter) => {
    if (location.pathname !== "/dashboard") navigate("/dashboard");
    onFilterChange?.(filter);
  };

  const submitNewCollection = () => {
    const name = draftName.trim();
    if (name) onCreateCollection?.(name);
    setDraftName("");
    setIsAdding(false);
  };

  const visibleTags = showAllTags ? tags : tags.slice(0, 6);

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-line bg-surface">
      <button
        type="button"
        className="flex items-center gap-2.5 px-5 py-5 text-left cursor-pointer"
        onClick={() => handleClick("all")}
      >
        <span className="text-brand">
          <BrainExpoLogo size="md" />
        </span>
        <h1 className="text-lg font-bold tracking-tight text-fg">Brain Expo</h1>
      </button>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <nav className="flex flex-col gap-0.5">
          <NavItem
            icon={<LuLayers />}
            label="All"
            isActive={activeFilter === "all" && !activeCollectionId && !activeTag}
            onClick={() => handleClick("all")}
          />
          <NavItem
            icon={<LuInbox />}
            label="Inbox"
            badge={inboxCount}
            isActive={activeFilter === "inbox"}
            onClick={() => handleClick("inbox")}
          />
        </nav>

        <SectionLabel>Collections</SectionLabel>
        <div className="flex flex-col gap-0.5">
          {collections.map((collection) => (
            <NavItem
              key={collection._id}
              icon={<LuFolder />}
              label={collection.name}
              badge={collection.count}
              isActive={activeCollectionId === collection._id}
              onClick={() =>
                onSelectCollection?.(
                  activeCollectionId === collection._id ? null : collection._id,
                )
              }
              onDelete={() => onDeleteCollection?.(collection._id)}
            />
          ))}

          {isAdding ? (
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={submitNewCollection}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitNewCollection();
                if (e.key === "Escape") {
                  setDraftName("");
                  setIsAdding(false);
                }
              }}
              placeholder="Collection name"
              aria-label="New collection name"
              className="mx-1 rounded-lg border border-line bg-card px-2.5 py-2 text-sm text-fg placeholder:text-fg-subtle outline-none focus:border-accent"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg cursor-pointer"
            >
              <span className="shrink-0 text-base">
                <LuPlus />
              </span>
              <span>New collection</span>
            </button>
          )}
        </div>

        <SectionLabel>Tags</SectionLabel>
        <div className="flex flex-wrap gap-1.5 px-3">
          {tags.length === 0 ? (
            <p className="text-xs text-fg-subtle">No tags yet</p>
          ) : (
            <>
              {visibleTags.map((tag) => (
                <button
                  key={tag.name}
                  type="button"
                  onClick={() =>
                    onSelectTag?.(activeTag === tag.name ? null : tag.name)
                  }
                  title={`${tag.count} ${tag.count === 1 ? "note" : "notes"}`}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    activeTag === tag.name
                      ? "border-accent bg-accent-soft text-accent-soft-fg"
                      : "border-line text-fg-muted hover:border-line-strong hover:text-fg"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
              {tags.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllTags(!showAllTags)}
                  className="px-1 py-1 text-xs text-fg-subtle underline-offset-2 hover:underline cursor-pointer"
                >
                  {showAllTags ? "show less" : "see all"}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* One way into settings: the account row itself. Sign-out lives there. */}
      <div className="border-t border-line px-3 py-3">
        <button
          type="button"
          onClick={() => navigate("/settings/profile")}
          aria-label="Settings"
          className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-hover cursor-pointer ${
            location.pathname.startsWith("/settings") ? "bg-surface-hover" : ""
          }`}
        >
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt=""
              className="h-7 w-7 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="h-7 w-7 shrink-0 rounded-full bg-surface-hover" />
          )}
          <span className="min-w-0 flex-1 truncate text-sm text-fg">
            {user?.fullName ?? user?.username ?? "Account"}
          </span>
          <LuSettings
            className={`shrink-0 ${
              location.pathname.startsWith("/settings")
                ? "text-fg"
                : "text-fg-muted"
            }`}
          />
        </button>
      </div>
    </aside>
  );
};
