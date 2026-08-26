import { FaFileLines } from "react-icons/fa6";
import { type IconProps, iconSizeVariants } from ".";

export const DocumentIcon = ({ size }: IconProps) => {
  return <FaFileLines className={iconSizeVariants[size]} />;
};
