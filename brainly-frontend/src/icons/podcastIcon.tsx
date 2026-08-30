import { FaPodcast } from "react-icons/fa6";
import { type IconProps, iconSizeVariants } from ".";

export const PodcastIcon = ({ size }: IconProps) => {
  return <FaPodcast className={iconSizeVariants[size]} />;
};
