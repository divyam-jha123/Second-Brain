import { SidebarItem } from "./sidebarItem";
import { BrainIcon } from "../icons/brainIcon";
import { TwitterIcon } from "../icons/twitterIcon";
import { VideoIcon } from "../icons/videoIcon";
import { DocumentIcon } from "../icons/documentIcon";
import { LinkIcon } from "../icons/linkIcon";
import { LinkedinIcon } from "../icons/linkedinIcon";
import { TagIcon } from "../icons/tagIcon";
import { UserButton } from "@clerk/react";
import { useNavigate, useLocation } from "react-router-dom";
import { SettingIcon } from "../icons/settingIcon";

export type ContentFilter = "all" | "tweet" | "video" | "document" | "linkedin" | "settings";

interface SidebarProps {
  activeFilter?: ContentFilter;
  onFilterChange?: (filter: ContentFilter) => void;
}

export const Sidebar = ({ activeFilter = "all", onFilterChange }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (filter: ContentFilter) => {
    if (location.pathname !== "/dashboard") {
      navigate("/dashboard");
    }
    // Toggle: clicking the active filter resets to "all"
    if (activeFilter === filter) {
      onFilterChange?.("all"); 
      // if onFilterChnage is present then only call it similar to -> 
      // if (onFilterChange) {
      //   onFilterChange("all");
      // }
    } else {
      onFilterChange?.(filter);
    }
  };

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
      <div
        className="flex items-center gap-2.5 px-5 py-6 cursor-pointer"
        onClick={() => onFilterChange?.("all")}
      >
        <span className="text-purple-600">
          <BrainIcon size="lg" />
        </span>
        <h1 className="text-xl font-bold text-gray-900">Brain Expo</h1>
      </div>

      <nav className="flex flex-col gap-1 px-3 mt-2 flex-1">
        <SidebarItem
          text="Tweets"
          icon={<TwitterIcon size="md" />}
          isActive={activeFilter === "tweet"}
          onClick={() => handleClick("tweet")}
        />
        <SidebarItem
          text="Videos"
          icon={<VideoIcon size="md" />}
          isActive={activeFilter === "video"}
          onClick={() => handleClick("video")}
        />
        <SidebarItem
          text="LinkedIn"
          icon={<LinkedinIcon size="md" />}
          isActive={activeFilter === "linkedin"}
          onClick={() => handleClick("linkedin")}
        />
        <SidebarItem
          text="Documents"
          icon={<DocumentIcon size="md" />}
          isActive={activeFilter === "document"}
          onClick={() => handleClick("document")}
        />
        <SidebarItem
          text="Links"
          icon={<LinkIcon size="md" />}
        />
        <SidebarItem
          text="Tags"
          icon={<TagIcon size="md" />}
        />
        <SidebarItem
          text="Settings"
          icon={<SettingIcon size="md" />}
          isActive={location.pathname === "/settings"}
          onClick={() => navigate("/settings")}
        />
      </nav>

      {/* User profile / sign out at the bottom */}
      <div className="px-5 py-4 border-t border-gray-200">
        <UserButton
          appearance={{
            elements: {
              rootBox: "w-full",
              userButtonTrigger: "w-full justify-start",
            },
          }}
          showName
        />
      </div>
    </div>
  );
};
