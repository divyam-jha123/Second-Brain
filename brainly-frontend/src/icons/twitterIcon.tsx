import { FaXTwitter } from "react-icons/fa6";
import { type IconProps, iconSizeVariants } from ".";

export const TwitterIcon = ({ size }: IconProps) => {
  return <FaXTwitter className={iconSizeVariants[size]} />;
};
