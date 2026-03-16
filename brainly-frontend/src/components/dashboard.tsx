import axios from "axios";
import { useAuth, useUser } from "@clerk/react";
import { Button } from "./button";
import { Sidebar } from "./sidebar";
import { Card } from "./card";
import { PlusIcon } from "../icons/plus";
import { ShareIcon } from "../icons/shareIcon";
import { CreateModal } from "../components/createModal";
import { ShareModal } from "../components/shareModal";
import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../config";

export const Dashboard = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const { getToken } = useAuth();
  const { user } = useUser();

  const getData = useCallback(async () => {
    try {
      const token = await getToken();
      const posts = await axios.get(`${API_URL}/notes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNotes(posts.data.post || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  }, [getToken]);

  useEffect(() => {
    getData();
  }, [getData]);

  const createNote = async (data: any) => {
    try {
      const token = await getToken();
      await axios.post(`${API_URL}/notes/create-note`, {
        title: data.title,
        link: data.link
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      getData();
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const token = await getToken();
      await axios.delete(`${API_URL}/notes/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      getData();
    } catch (error) {
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
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
      <div className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">All Notes</h2>
          <div className="flex gap-3">
            <Button
              varient="secondary"
              size="md"
              text="Share Brain"
              startIcon={<ShareIcon size="sm" />}
              onClick={() => setShareModalOpen(true)}
            />
            <Button
              varient="primary"
              size="md"
              text="Add Content"
              startIcon={<PlusIcon size="sm" />}
              onClick={() => setModalOpen(true)}
            />
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <Card
              key={note._id}
              title={note.title}
              type={note.content?.includes("youtube") ? "video" : note.content?.includes("twitter") || note.content?.includes("x.com") ? "tweet" : "document"}
              content={note.content}
              tags={["content"]}
              addedDate={new Date(note.createdAt).toLocaleDateString()}
              onDelete={() => deleteNote(note._id)}
              onShare={() => navigator.clipboard.writeText(note.content)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
