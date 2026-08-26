import { FaLinkedin } from "react-icons/fa6";
import { type IconProps, iconSizeVariants } from ".";

export const LinkedinIcon = ({ size }: IconProps) => {
  return <FaLinkedin className={iconSizeVariants[size]} />;
};
