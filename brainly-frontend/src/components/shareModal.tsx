import { useState } from "react";
import { CrossIcon } from "../icons/crossicon";
import axios from "axios";
import { useAuth } from "@clerk/react";
import { API_URL } from "../config";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemCount: number;
}

export const ShareModal = ({ isOpen, onClose, itemCount }: ShareModalProps) => {
  const [shareLink, setShareLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { getToken } = useAuth();

  if (!isOpen) return null;

  const handleShare = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await axios.post(
        `${API_URL}/notes/share`,
        { share: true },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const hash = response.data.hash;
      const link = `${window.location.origin}/share/${hash}`;
      setShareLink(link);
    } catch (error) {
      console.error("Error generating share link:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setShareLink("");
    setCopied(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeIn"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="text-xl font-bold text-gray-900">
            Share Your Second Brain
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          >
            <CrossIcon />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          <p className="text-gray-600 text-sm leading-relaxed">
            Share your entire collection of notes, documents, tweets, and videos
            with others. They'll be able to import your content into their own
            Second Brain.
          </p>

          {!shareLink ? (
            <>
              <button
                onClick={handleShare}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-3 px-4 rounded-lg transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                {isLoading ? "Generating..." : "Share Brain"}
              </button>
              <p className="text-center text-sm text-gray-500">
                {itemCount} {itemCount === 1 ? "Item" : "Items"} will be shared
              </p>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 select-all"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
              <p className="text-center text-sm text-green-600 font-medium">
                ✓ Link generated! Share it with anyone.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
