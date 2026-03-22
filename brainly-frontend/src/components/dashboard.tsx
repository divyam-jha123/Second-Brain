import axios from "axios";
import { useAuth, useUser, UserButton } from "@clerk/react";
import { Button } from "./button";
import { Sidebar } from "./sidebar";
import type { ContentFilter } from "./sidebar";
import { Card } from "./card";
import { PlusIcon } from "../icons/plus";
import { ShareIcon } from "../icons/shareIcon";
import { CreateModal } from "../components/createModal";
import { ShareModal } from "../components/shareModal";
import { TwitterIcon } from "../icons/twitterIcon";
import { VideoIcon } from "../icons/videoIcon";
import { DocumentIcon } from "../icons/documentIcon";
import { TagIcon } from "../icons/tagIcon";
import { BrainIcon } from "../icons/brainIcon";
import { LinkedinIcon } from "../icons/linkedinIcon"; // Added LinkedinIcon import
import { useState, useEffect, useCallback, useMemo } from "react";
import { API_URL } from "../config";
import { ExtensionBanner } from "./ExtensionBanner";
import { useEmailSync } from "../hooks/useEmailSync";

export type Note = {
  _id: string;
  title: string;
  content?: string;
  createdAt: string;
};

type CreateNotePayload = {
  title: string;
  link: string;
};

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
  const [activeFilter, setActiveFilter] = useState<ContentFilter>("all");
  const { getToken } = useAuth();
  const { user } = useUser();

  // Ensure email preferences exist for this user
  useEmailSync();

  const getContentType = (content: string | undefined): "tweet" | "video" | "document" | "linkedin" => {
    if (content?.includes("youtube") || content?.includes("youtu.be")) return "video";
    if (content?.includes("twitter") || content?.includes("x.com")) return "tweet";
    if (content?.includes("linkedin.com")) return "linkedin";
    return "document";
  };

  const filteredNotes = useMemo(() => {
    if (activeFilter === "all") return notes;
    return notes.filter((note) => getContentType(note.content) === activeFilter);
  }, [notes, activeFilter]);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getData();
  }, [getData]);

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

  const SyncUser = async () => {
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
  }

  return (
    <div className="flex min-h-screen bg-gray-50 pb-[80px] md:pb-0 relative">
      <div className="hidden md:block">
        <Sidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </div>
      <CreateModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          console.log(data);
          createNote(data);
          SyncUser();
          setModalOpen(false);
        }}
      />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setShareModalOpen(false)}
        itemCount={notes.length}
      />

      {/* Content */}
      <div className="md:ml-64 flex-1 p-4 md:p-8 w-full max-w-full overflow-x-hidden">
        <ExtensionBanner />
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="flex md:hidden items-center justify-between mb-8 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-purple-600 bg-purple-100 rounded-xl p-1.5 flex items-center justify-center">
              <BrainIcon size="lg" />
            </span>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Brain Expo</h1>
          </div>
          <div className="flex shrink-0 p-1 bg-purple-50 rounded-full">
            <UserButton />
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            All Notes
          </h2>
          <div className="flex gap-2 md:gap-3">
            <div className="bg-purple-50 text-purple-700 hover:bg-purple-100 flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg cursor-pointer transition-colors text-sm font-medium" onClick={() => setShareModalOpen(true)}>
              <ShareIcon size="sm" />
              <span>Share Brain</span>
            </div>
            <div className="hidden md:block">
              <Button
                varient="primary"
                size="md"
                text="Add Content"
                startIcon={<PlusIcon size="sm" />}
                onClick={() => setModalOpen(true)}
              />
            </div>
          </div>
        </div>

        {/* Mobile view headers */}
        <div className="flex md:hidden gap-2 overflow-x-auto pb-4 mb-2 -mx-4 px-4 scrollbar-hide">
          <button 
            onClick={() => setActiveFilter("all")}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${activeFilter === "all" ? "bg-purple-600 text-white border-purple-600 shadow-sm" : "bg-white text-gray-600 border-gray-200"}`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveFilter("tweet")}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${activeFilter === "tweet" ? "bg-purple-600 text-white border-purple-600 shadow-sm" : "bg-white text-gray-600 border-gray-200"}`}
          >
            Tweets
          </button>
          <button 
            onClick={() => setActiveFilter("video")}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${activeFilter === "video" ? "bg-purple-600 text-white border-purple-600 shadow-sm" : "bg-white text-gray-600 border-gray-200"}`}
          >
            Videos
          </button>
          <button 
            onClick={() => setActiveFilter("linkedin")}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${activeFilter === "linkedin" ? "bg-purple-600 text-white border-purple-600 shadow-sm" : "bg-white text-gray-600 border-gray-200"}`}
          >
            LinkedIn
          </button>
          <button 
            onClick={() => setActiveFilter("document")}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${activeFilter === "document" ? "bg-purple-600 text-white border-purple-600 shadow-sm" : "bg-white text-gray-600 border-gray-200"}`}
          >
            Docs
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.length === 0 ? (
            <div className="col-span-full py-10 text-center text-gray-500">
              No notes found in this category.
            </div>
          ) : (
            filteredNotes.map((note) => (
              <Card
                key={note._id}
                title={note.title}
                type={getContentType(note.content)}
                content={note.content}
                tags={["content"]}
                addedDate={new Date(note.createdAt).toLocaleDateString()}
                onDelete={() => deleteNote(note._id)}
                onShare={() => {
                  if (!note.content) return;
                  navigator.clipboard.writeText(note.content);
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button (FAB for Mobile) */}
      <div className="md:hidden fixed bottom-24 right-6 z-40">
        <button 
          onClick={() => setModalOpen(true)}
          className="bg-purple-600 text-white rounded-full p-4 shadow-lg hover:bg-purple-700 active:scale-95 transition-transform flex items-center justify-center h-14 w-14"
        >
          <div className="scale-125">
            <PlusIcon size="md" />
          </div>
        </button>
      </div>

      {/* Mobile Bottom Navigation Component */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 pb-5 z-40 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div 
          onClick={() => setActiveFilter("tweet")}
          className={`flex flex-col items-center gap-1 min-w-[64px] ${activeFilter === "tweet" ? "text-purple-600" : "text-gray-400"} cursor-pointer hover:text-purple-500 transition-colors`}
        >
          <TwitterIcon size="md" />
          <span className="text-[10px] font-medium tracking-wide">Tweets</span>
        </div>
        <div 
          onClick={() => setActiveFilter("video")}
          className={`flex flex-col items-center gap-1 min-w-[64px] ${activeFilter === "video" ? "text-purple-600" : "text-gray-400"} cursor-pointer hover:text-purple-500 transition-colors`}
        >
          <VideoIcon size="md" />
          <span className="text-[10px] font-medium tracking-wide">Videos</span>
        </div>
        <div 
          onClick={() => setActiveFilter("linkedin")}
          className={`flex flex-col items-center gap-1 min-w-[64px] ${activeFilter === "linkedin" ? "text-purple-600" : "text-gray-400"} cursor-pointer hover:text-purple-500 transition-colors`}
        >
          <LinkedinIcon size="md" />
          <span className="text-[10px] font-medium tracking-wide">LinkedIn</span>
        </div>
        <div 
          onClick={() => setActiveFilter("document")}
          className={`flex flex-col items-center gap-1 min-w-[64px] ${activeFilter === "document" ? "text-purple-600" : "text-gray-400"} cursor-pointer hover:text-purple-500 transition-colors`}
        >
          <DocumentIcon size="md" />
          <span className="text-[10px] font-medium tracking-wide">Docs</span>
        </div>
        <div 
          className="flex flex-col items-center gap-1 min-w-[64px] text-gray-400 cursor-pointer hover:text-purple-500 transition-colors"
        >
          <TagIcon size="md" />
          <span className="text-[10px] font-medium tracking-wide">Tags</span>
        </div>
      </div>
    </div>
  );
};
