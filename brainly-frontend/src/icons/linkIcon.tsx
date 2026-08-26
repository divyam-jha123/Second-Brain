import { FaLink } from "react-icons/fa6";
import { type IconProps, iconSizeVariants } from ".";

export const LinkIcon = ({ size }: IconProps) => {
  return <FaLink className={iconSizeVariants[size]} />;
};
