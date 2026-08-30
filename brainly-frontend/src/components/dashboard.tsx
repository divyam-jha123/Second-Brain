import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import {
  LuArrowUpDown,
  LuInbox,
  LuLayoutGrid,
  LuList,
  LuPlus,
  LuSearch,
  LuSettings,
  LuShare2,
} from "react-icons/lu";
import { BrainExpoLogo } from "../assets/brand/BrainExpoLogo";
import { Sidebar } from "./sidebar";
import type { ContentFilter } from "./sidebar";
import { Card } from "./card";
import { CreateModal } from "../components/createModal";
import { ShareModal } from "../components/shareModal";
import { ExtensionBanner } from "./ExtensionBanner";
import { OnboardingModal } from "./OnboardingModal";
import { useEmailSync } from "../hooks/useEmailSync";
import { useOnboardingStatus } from "../hooks/useOnboardingStatus";
import { getContentType } from "../lib/notes";
import { readDefaultView } from "../lib/prefs";
import { useSettingsDialog } from "./settings/useSettingsDialog";
import { TourProvider } from "../tour/TourProvider";
import type { ViewMode } from "../lib/prefs";
import {
  createCollection,
  deleteCollection as deleteCollectionRequest,
  fetchCollections,
  fetchTags,
  patchNote,
} from "../lib/api";
import type { Collection, NotePatch, Tag } from "../lib/api";
import { API_URL } from "../config";

export type Note = {
  _id: string;
  title: string;
  content?: string;
  createdAt: string;
  tags?: string[];
  note?: string;
  collectionId?: string | null;
};

type CreateNotePayload = {
  title: string;
  link: string;
};

type SortOrder = "recent" | "oldest" | "title";

const SORT_LABELS: Record<SortOrder, string> = {
  recent: "Recent",
  oldest: "Oldest",
  title: "A–Z",
};

const SORT_CYCLE: SortOrder[] = ["recent", "oldest", "title"];

const CHIPS: { value: ContentFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "video", label: "Videos" },
  { value: "tweet", label: "Tweets" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "podcast", label: "Podcasts" },
  { value: "document", label: "Docs" },
];

const makeOptimisticNote = (data: CreateNotePayload): Note => ({
  _id: `temp-${crypto.randomUUID()}`,
  title: data.title,
  content: data.link,
  createdAt: new Date().toISOString(),
});

export const Dashboard = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeFilter, setActiveFilter] = useState<ContentFilter>("all");
  // The sidebar links here from other screens (Settings) with a filter in the
  // query string, so the first render already honours it.
  const initialFilter = () => new URLSearchParams(window.location.search);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    () => initialFilter().get("collection"),
  );
  const [activeTag, setActiveTag] = useState<string | null>(() =>
    initialFilter().get("tag"),
  );
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>(readDefaultView);
  const searchRef = useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();
  const { user } = useUser();
  const { open: openSettings } = useSettingsDialog();

  // Ensure email preferences exist for this user
  useEmailSync();

  // Floats the onboarding card over the dashboard until it's done or skipped.
  const {
    status: onboardingStatus,
    markComplete: markOnboarded,
    tourStatus,
    markTourComplete,
  } = useOnboardingStatus();
  const [tourTrigger, setTourTrigger] = useState(false);

  // Tags aren't stored yet, so every note counts as unsorted.
  const inboxCount = useMemo(
    () => notes.filter((note) => !note.tags?.length).length,
    [notes],
  );

  const visibleNotes = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const matched = notes.filter((note) => {
      if (activeFilter === "inbox" && note.tags?.length) return false;
      if (activeCollectionId && note.collectionId !== activeCollectionId) return false;
      if (activeTag && !note.tags?.includes(activeTag)) return false;
      if (
        activeFilter !== "all" &&
        activeFilter !== "inbox" &&
        getContentType(note.content) !== activeFilter
      ) {
        return false;
      }
      if (!needle) return true;
      return (
        note.title.toLowerCase().includes(needle) ||
        note.content?.toLowerCase().includes(needle) ||
        note.tags?.some((tag) => tag.toLowerCase().includes(needle))
      );
    });

    return matched.sort((a, b) => {
      if (sortOrder === "title") return a.title.localeCompare(b.title);
      const delta =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === "oldest" ? delta : -delta;
    });
  }, [notes, activeFilter, activeCollectionId, activeTag, query, sortOrder]);

  // ⌘K / Ctrl-K jumps to search.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const getData = useCallback(async () => {
    try {
      const token = await getToken();
      const posts = await axios.get(`${API_URL}/notes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      setNotes(posts.data.post || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  }, [getToken]);

  // Collections and tags are derived server-side, so they refresh together
  // whenever a note's tags or filing change.
  const getSidebarData = useCallback(async () => {
    try {
      const token = await getToken();
      const [nextCollections, nextTags] = await Promise.all([
        fetchCollections(token),
        fetchTags(token),
      ]);
      setCollections(nextCollections);
      setTags(nextTags);
    } catch (error) {
      console.error("Error fetching collections and tags:", error);
    }
  }, [getToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getData();
  }, [getData]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getSidebarData();
  }, [getSidebarData]);

  const createNote = async (data: CreateNotePayload) => {
    const optimisticNote = makeOptimisticNote(data);
    setNotes((prev) => [optimisticNote, ...prev]);

    try {
      const token = await getToken();
      await axios.post(`${API_URL}/notes/create-note`, {
        title: data.title,
        link: data.link,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
    } catch (error) {
      setNotes((prev) => prev.filter((note) => note._id !== optimisticNote._id));
      console.error("Error creating note:", error);
    }
  };

  const deleteNote = async (id: string) => {
    const previousNotes = notes;
    setNotes((prev) => prev.filter((note) => note._id !== id));

    try {
      const token = await getToken();
      await axios.delete(`${API_URL}/notes/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
    } catch (error) {
      setNotes(previousNotes);
      console.error("Error deleting note:", error);
    }
  };

  /** Optimistic note update, rolled back and re-synced if the request fails. */
  const updateNote = async (id: string, patch: NotePatch) => {
    const previousNotes = notes;
    setNotes((prev) =>
      prev.map((note) => (note._id === id ? { ...note, ...patch } : note)),
    );

    try {
      const token = await getToken();
      await patchNote(token, id, patch);
      await getSidebarData();
    } catch (error) {
      setNotes(previousNotes);
      console.error("Error updating note:", error);
    }
  };

  const addCollection = async (name: string) => {
    try {
      const token = await getToken();
      await createCollection(token, name);
      await getSidebarData();
    } catch (error) {
      console.error("Error creating collection:", error);
    }
  };

  const removeCollection = async (id: string) => {
    const previousNotes = notes;
    // Deleting a collection never deletes its notes; they fall back to Inbox.
    setNotes((prev) =>
      prev.map((note) =>
        note.collectionId === id ? { ...note, collectionId: null } : note,
      ),
    );
    if (activeCollectionId === id) setActiveCollectionId(null);

    try {
      const token = await getToken();
      await deleteCollectionRequest(token, id);
      await getSidebarData();
    } catch (error) {
      setNotes(previousNotes);
      console.error("Error deleting collection:", error);
    }
  };

  const SyncUser = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getToken();
      await axios.post(`${API_URL}/user/sync`, {
        username: user?.username || user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || "User",
        email: user?.emailAddresses[0]?.emailAddress,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error syncing user:", error);
    }
  }, [user, getToken]);

  useEffect(() => {
    SyncUser();
  }, [SyncUser]);

  const cycleSort = () =>
    setSortOrder(
      (prev) => SORT_CYCLE[(SORT_CYCLE.indexOf(prev) + 1) % SORT_CYCLE.length],
    );

  return (
    <TourProvider autoStart={tourTrigger} onComplete={markTourComplete}>
    <div className="relative flex min-h-screen bg-bg pb-24 md:pb-0">
      <div className="hidden md:block">
        <Sidebar
          activeFilter={activeFilter}
          onFilterChange={(filter) => {
            setActiveFilter(filter);
            setActiveCollectionId(null);
            setActiveTag(null);
          }}
          inboxCount={inboxCount}
          savedCount={notes.length}
          collections={collections}
          tags={tags}
          activeCollectionId={activeCollectionId}
          activeTag={activeTag}
          onSelectCollection={(id) => {
            setActiveCollectionId(id);
            setActiveFilter("all");
          }}
          onSelectTag={(tag) => {
            setActiveTag(tag);
            setActiveFilter("all");
          }}
          onCreateCollection={addCollection}
          onDeleteCollection={removeCollection}
        />
      </div>

      <CreateModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          createNote(data);
          SyncUser();
          setModalOpen(false);
        }}
      />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setShareModalOpen(false)}
        itemCount={notes.length}
        notes={notes}
        collections={collections}
        tags={tags}
        activeCollectionId={activeCollectionId}
        activeTag={activeTag}
      />

      {onboardingStatus === "needed" && (
        <OnboardingModal
          onDone={() => {
            markOnboarded();
            // Topics become collections, so the sidebar needs a refresh.
            getSidebarData();
            if (tourStatus === "needed") setTourTrigger(true);
          }}
        />
      )}

      {/* Content */}
      <div className="w-full max-w-full flex-1 overflow-x-hidden p-4 md:ml-64 md:p-8">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="mb-5 flex items-center justify-between border-b border-line pb-4 md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-brand">
              <BrainExpoLogo size="md" />
            </span>
            <h1 className="text-lg font-bold tracking-tight text-fg">Brain Expo</h1>
          </div>
          <button
            type="button"
            data-tour-id="dashboard-settings-mobile"
            onClick={() => openSettings("account")}
            title="Settings"
            aria-label="Settings"
            className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg cursor-pointer"
          >
            <LuSettings size={18} />
          </button>
        </div>

        <ExtensionBanner />

        {/* Search + primary action */}
        <div className="mb-5 flex items-center gap-3">
          <div className="relative flex-1" data-tour-id="dashboard-search">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-subtle">
              <LuSearch size={17} />
            </span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, notes, tags"
              aria-label="Search titles, notes, tags"
              className="w-full rounded-xl border border-line bg-surface py-3 pl-12 pr-16 text-sm text-fg placeholder:text-fg-subtle outline-none transition-colors focus:border-accent"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-line px-1.5 py-0.5 text-[11px] font-medium text-fg-subtle sm:block">
              ⌘K
            </kbd>
          </div>

          <button
            type="button"
            data-tour-id="dashboard-add"
            onClick={() => setModalOpen(true)}
            className="hidden shrink-0 items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover md:flex cursor-pointer"
          >
            <LuPlus size={17} />
            Add
          </button>
          <button
            type="button"
            data-tour-id="dashboard-share"
            onClick={() => setShareModalOpen(true)}
            title="Share brain"
            aria-label="Share brain"
            className="hidden shrink-0 rounded-xl border border-line bg-surface p-3 text-fg-muted transition-colors hover:text-fg md:block cursor-pointer"
          >
            <LuShare2 size={17} />
          </button>
        </div>

        {/* Filter chips + sort / view */}
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-line pb-4">
          <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1" data-tour-id="dashboard-filters">
            {CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => setActiveFilter(chip.value)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  activeFilter === chip.value
                    ? "border-fg bg-fg text-bg"
                    : "border-line text-fg-muted hover:border-line-strong hover:text-fg"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1" data-tour-id="dashboard-view-toggle">
            <button
              type="button"
              onClick={cycleSort}
              title="Change sort order"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg cursor-pointer"
            >
              <LuArrowUpDown size={15} />
              <span className="hidden sm:inline">{SORT_LABELS[sortOrder]}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              title={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
              aria-label={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
              className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg cursor-pointer"
            >
              {viewMode === "grid" ? <LuLayoutGrid size={16} /> : <LuList size={16} />}
            </button>
          </div>
        </div>

        {/* Active collection / tag filter */}
        {(activeCollectionId || activeTag) && (
          <div className="mb-4 flex items-center gap-2 text-sm">
            <span className="text-fg-muted">Filtered by</span>
            <span className="rounded-full bg-tag px-2.5 py-1 text-xs font-medium text-tag-fg">
              {activeCollectionId
                ? collections.find((c) => c._id === activeCollectionId)?.name
                : `#${activeTag}`}
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveCollectionId(null);
                setActiveTag(null);
              }}
              className="text-xs text-fg-subtle underline-offset-2 hover:underline cursor-pointer"
            >
              clear
            </button>
          </div>
        )}

        {/* Cards */}
        {visibleNotes.length === 0 ? (
          <div
            data-tour-id="dashboard-cards"
            className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line py-20 text-center"
          >
            <span className="text-fg-subtle">
              <LuInbox size={26} />
            </span>
            <p className="text-sm font-medium text-fg">
              {query ? `No matches for “${query}”` : "Nothing here yet"}
            </p>
            <p className="text-sm text-fg-muted">
              {query
                ? "Try a different search or clear the filter."
                : "Save a link and it will show up here."}
            </p>
          </div>
        ) : (
          <div
            data-tour-id="dashboard-cards"
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
                : "flex flex-col gap-4"
            }
          >
            {visibleNotes.map((note) => (
              <Card
                key={note._id}
                title={note.title}
                type={getContentType(note.content)}
                content={note.content}
                note={note.note}
                tags={note.tags ?? []}
                createdAt={note.createdAt}
                addedDate={new Date(note.createdAt).toLocaleDateString()}
                collections={collections}
                collectionId={note.collectionId ?? null}
                onTagsChange={(next) => updateNote(note._id, { tags: next })}
                onCollectionChange={(next) =>
                  updateNote(note._id, { collectionId: next })
                }
                onDelete={() => deleteNote(note._id)}
                onShare={() => {
                  if (!note.content) return;
                  navigator.clipboard.writeText(note.content);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB for Mobile) */}
      <button
        data-tour-id="dashboard-fab"
        onClick={() => setModalOpen(true)}
        aria-label="Add content"
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg transition-transform hover:bg-accent-hover active:scale-95 md:hidden cursor-pointer"
      >
        <LuPlus size={24} />
      </button>

      {/* Mobile Bottom Navigation */}
      <nav
        data-tour-id="dashboard-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-line bg-surface px-4 pb-5 pt-2 md:hidden"
      >
        {[
          { value: "all" as const, label: "All", icon: <LuLayoutGrid size={19} /> },
          { value: "inbox" as const, label: "Inbox", icon: <LuInbox size={19} /> },
          { value: "video" as const, label: "Videos", icon: <LuLayoutGrid size={19} /> },
          { value: "document" as const, label: "Docs", icon: <LuList size={19} /> },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setActiveFilter(item.value)}
            className={`flex min-w-[64px] flex-col items-center gap-1 transition-colors cursor-pointer ${
              activeFilter === item.value ? "text-accent" : "text-fg-subtle"
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShareModalOpen(true)}
          className="flex min-w-[64px] flex-col items-center gap-1 text-fg-subtle transition-colors cursor-pointer"
        >
          <LuShare2 size={19} />
          <span className="text-[10px] font-medium tracking-wide">Share</span>
        </button>
      </nav>
    </div>
    </TourProvider>
  );
};
