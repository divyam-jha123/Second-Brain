import type { ReactElement } from "react";

interface ButtonProps {
  varient: "primary" | "secondary";
  size: "sm" | "md" | "lg";
  text: string;
  startIcon?: ReactElement;
  endIcon?: ReactElement;
  onClick: () => void;
}

export const Button = (props: ButtonProps) => {
  const varientStyle = {
    primary: "bg-accent text-accent-fg hover:bg-accent-hover",
    secondary: "bg-accent-soft text-accent-soft-fg hover:bg-surface-hover",
  };

  const sizeStyles = {
    sm: "px-4 py-1.5 text-sm gap-1.5",
    md: "px-5 py-2 text-base gap-2",
    lg: "px-7 py-3 text-lg gap-2.5",
  };

  return (
    <button
      onClick={props.onClick}
      className={`flex items-center justify-center cursor-pointer rounded-md ${varientStyle[props.varient]} ${sizeStyles[props.size]}`}
    >
      {props.startIcon ? <span>{props.startIcon}</span> : null}
      {<span>{props.text}</span>}
      {props.endIcon ? <span>{props.endIcon}</span> : null}
    </button>
  );
};
