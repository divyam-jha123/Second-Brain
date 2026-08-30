import { useState } from "react";
import { CrossIcon } from "../icons/crossicon";
import { Button } from "./button";
import { getContentType } from "../lib/notes";
import type { ContentType } from "../lib/notes";

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; link: string }) => void;
}

export const CreateModal = ({ isOpen, onClose, onSubmit }: CreateModalProps) => {
    const [title, setTitle] = useState("");
    const [link, setLink] = useState("");
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = () => {
        // Validation
        if (!title.trim()) {
            setError("Title is required");
            return;
        }
        if (!link.trim()) {
            setError("Link is required");
            return;
        }

        // Clear error and submit
        setError("");
        onSubmit({ title: title.trim(), link: link.trim() })

        setTitle("");
        setLink("");
        onClose();
    };

    const handleClose = () => {
        setTitle("");
        setLink("");
        setError("");
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-overlay flex items-center justify-center z-50"
            onClick={handleClose}
        >
            {/* Modal */}
            <div
                className="bg-card rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4">
                    <h2 className="text-xl font-semibold text-fg">Add New Content</h2>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-surface-hover rounded-lg transition cursor-pointer"
                    >
                        <CrossIcon />
                    </button>
                </div>

                <div className="p-4 space-y-4">

                    {error && (
                        <div className="bg-danger-soft text-danger px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Title Input */}
                    <div>
                        <label className="block text-sm font-medium text-fg-muted mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter title..."
                            className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
                        />
                    </div>

                    {/* Link Input */}
                    <div>
                        <label className="block text-sm font-medium text-fg-muted mb-1">
                            Link
                        </label>
                        <input
                            type="url"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
                        />
                    </div>

                    {/* Content Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-fg-muted mb-2">
                            Content Type
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {(() => {
                                const detected = getContentType(link.trim() || undefined);
                                return TYPE_OPTIONS.map((option) => (
                                    <TypeButton
                                        key={option.type}
                                        label={option.label}
                                        active={detected === option.type}
                                    />
                                ));
                            })()}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-4 bg-surface">
                    <Button
                        varient="primary"
                        size="md"
                        text="Add Content"
                        onClick={handleSubmit}
                    />
                </div>
            </div>
        </div>
    );
};

const TYPE_OPTIONS: { type: ContentType; label: string }[] = [
    { type: "tweet", label: "Twitter" },
    { type: "video", label: "YouTube" },
    { type: "linkedin", label: "LinkedIn" },
    { type: "podcast", label: "Podcast" },
    { type: "document", label: "Article" },
];

// Helper component for content type buttons
const TypeButton = ({ label, active }: { label: string; active: boolean }) => (
  <span
    className={`px-3 py-1 rounded-full text-sm ${
      active
        ? "bg-accent-soft text-accent-soft-fg"
        : "bg-surface-hover text-fg-muted"
    }`}
  >
    {label}
  </span>
);
