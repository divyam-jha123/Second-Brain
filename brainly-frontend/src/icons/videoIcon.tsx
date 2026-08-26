import { FaYoutube } from "react-icons/fa6";
import { type IconProps, iconSizeVariants } from ".";

export const VideoIcon = ({ size }: IconProps) => {
  return <FaYoutube className={iconSizeVariants[size]} />;
};
