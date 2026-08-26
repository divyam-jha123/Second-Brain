import { FaTag } from "react-icons/fa6";
import { type IconProps, iconSizeVariants } from ".";

export const TagIcon = ({ size }: IconProps) => {
  return <FaTag className={iconSizeVariants[size]} />;
};
