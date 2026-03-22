import { ShareIcon } from "../icons/shareIcon";
import { DeleteIcon } from "../icons/deleteIcon";
import { DocumentIcon } from "../icons/documentIcon";
import { TwitterIcon } from "../icons/twitterIcon";
import { VideoIcon } from "../icons/videoIcon";
import { LinkedinIcon } from "../icons/linkedinIcon";
import { CrossIcon } from "../icons/crossicon";
import { useEffect, useState, useRef } from "react";

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: () => void;
      };
    };
  }
}

type CardType = "document" | "tweet" | "video" | "linkedin";
interface CardProps {
  title: string;
  type: CardType;
  content?: string;
  contentList?: string[];
  tags: string[];
  addedDate: string;
  onDelete?: () => void;
  onShare?: () => void;
  readOnly?: boolean; // hide action buttons on shared dashboard
}

const typeIcons: Record<CardType, React.ReactElement> = {
  document: <DocumentIcon size="sm" />,
  tweet: <TwitterIcon size="sm" />,
  video: <VideoIcon size="sm" />,
  linkedin: <LinkedinIcon size="sm" />,
};

export const Card = (props: CardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.twttr) {
      window.twttr.widgets.load();
    }
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

      {props.type === "document" && props.content && (
        <p className="text-sm text-gray-600 leading-relaxed">{props.content}</p>
      )}
    </>
  );

  return (
    <>
      {/* Copied toast */}
      {shareCopied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-full shadow-lg animate-scaleIn">
          ✓ Link copied to clipboard
        </div>
      )}

      {/* Preview Card */}
      <div
        ref={cardRef}
        onClick={() => setIsExpanded(true)}
        className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 max-w-sm flex flex-col gap-3 cursor-pointer hover:-translate-y-0.5 h-[220px] overflow-hidden relative group"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-gray-500 shrink-0">{typeIcons[props.type]}</span>
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {props.title}
            </h3>
          </div>
          {!props.readOnly && (
            <div className="flex items-center gap-2 shrink-0">
              {/* Share button */}
              <button
                title="Copy link"
                className="text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors"
                onClick={handleShare}
              >
                <ShareIcon size="sm" />
              </button>
              {/* Delete button */}
              <button
                title="Delete"
                disabled={isDeleting}
                className="text-gray-400 hover:text-red-500 disabled:opacity-50 cursor-pointer transition-colors"
                onClick={handleDelete}
              >
                {isDeleting ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <DeleteIcon size="sm" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Truncated Content */}
        <div className="flex-1 overflow-hidden relative">
          {renderMedia()}
          {/* Fade-out gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>

        {/* Date */}
        <p className="text-xs text-gray-400">Added on {props.addedDate}</p>

        {/* Hover hint */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/5 transition-colors duration-300 rounded-xl">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs font-medium text-gray-500 bg-white/90 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm">
            Click to expand
          </span>
        </div>
      </div>

      {/* Expanded Modal Overlay */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsExpanded(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Expanded Card */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 flex flex-col gap-4 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer z-10"
            >
              <CrossIcon />
            </button>

            {/* Header with action buttons */}
            <div className="flex items-start gap-2 pr-8">
              <span className="text-gray-500 mt-0.5 shrink-0">{typeIcons[props.type]}</span>
              <h3 className="text-lg font-bold text-gray-900 flex-1">{props.title}</h3>
              {!props.readOnly && (
                <div className="flex gap-2 items-center shrink-0 mr-6">
                  <button
                    title="Copy link"
                    onClick={handleShare}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <ShareIcon size="sm" />
                  </button>
                  <button
                    title="Delete"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <DeleteIcon size="sm" />
                  </button>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {props.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Full Content */}
            <div className="flex-1">{renderMedia()}</div>

            {/* Date */}
            <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
              Added on {props.addedDate}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
