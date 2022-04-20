import cn from "classnames";
import React from "react";

const Button = React.memo(function Button(props: {
  children: React.ReactNode;
  type?: "button" | "reset" | "submit";
  onClick: (
    event?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  ) => void;
  className?: string;
  isDisabled?: boolean;
  isInvisible?: boolean;
}) {
  return (
    <button
      className={cn(
        "rounded-full py-4.5 transition-all",
        { "pointer-events-none invisible opacity-0": props.isInvisible },
        props.className,
      )}
      type={props.type ? props.type : "button"}
      onClick={props.onClick}
      disabled={props.isDisabled}
    >
      {props.children}
    </button>
  );
});

export default Button;
