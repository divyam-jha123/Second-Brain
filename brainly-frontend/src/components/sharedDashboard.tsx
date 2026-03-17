import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Card } from "./card";
import { API_URL } from "../config";
import { BrainIcon } from "../icons/brainIcon";
import { Loader } from "../icons/loader";
import {type Note} from "./dashboard";

export const SharedDashboard = () => {
  const { hash } = useParams<{ hash: string }>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSharedContent = async () => {
      try {
        const response = await axios.get(`${API_URL}/notes/api/share/${hash}`);
        setNotes(response.data.content || []);
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError("This shared brain link is invalid or has been removed.");
        } else {
          setError("Something went wrong. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSharedContent();
  }, [hash]);

  if (loading) {
    return (
      <Loader message="Loading shared brain..." />
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <div className="text-5xl">🧠</div>
          <h1 className="text-2xl font-bold text-gray-900">Oops!</h1>
          <p className="text-gray-600">{error}</p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Second Brain
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl"><BrainIcon size="lg" /></span>
            <h1 className="text-xl font-bold text-gray-900">Shared Brain</h1>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            {notes.length} {notes.length === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {notes.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-lg font-medium">No content shared yet</p>
            <p className="text-sm mt-1">This brain is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {notes.map((note) => (
              <Card
                key={note._id}
                title={note.title}
                type={
                  note.content?.includes("youtube")
                    ? "video"
                    : note.content?.includes("twitter") ||
                        note.content?.includes("x.com")
                      ? "tweet"
                      : "document"
                }
                content={note.content}
                tags={["shared"]}
                addedDate={new Date(note.createdAt).toLocaleDateString()}
                readOnly
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
