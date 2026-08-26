import { FaGear } from "react-icons/fa6";
import { type IconProps, iconSizeVariants } from ".";

export const SettingIcon = ({ size }: IconProps) => {
  return <FaGear className={iconSizeVariants[size]} />;
};
