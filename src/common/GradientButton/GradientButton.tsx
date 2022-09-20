import cn from "classnames";
import type { CSSProperties } from "react";
import React from "react";

export const GradientButton = React.memo(function GradientButton(props: {
  children: React.ReactNode;
  onClick: () => void;
  isVisible?: boolean;
  className?: string;
  withShadow?: boolean;
  gradientText?: boolean;
  textClassName?: string;
  bgColor?: string;
}) {
  if (!props.isVisible) return null;

  return (
    <button
      onClick={props.onClick}
      className={cn(
        "rounded-12 p-0.5 leading-5",
        "bg-[linear-gradient(var(--bgColor,_#ffffff),var(--bgColor,_#ffffff)),_linear-gradient(to_right,#FF6848,#4940E0)]",
        "bg-origin-border transition-opacity [background-clip:content-box,_border-box]",
        { "shadow-[0_10px_20px_0_rgba(255,104,72,0.2)]": props.withShadow },
        props.className,
      )}
      {...(props.bgColor
        ? { style: { "--bgColor": props.bgColor } as CSSProperties }
        : {})}
    >
      <span
        className={cn(
          "font-sora font-semibold uppercase",
          {
            "bg-[linear-gradient(to_right,#FF6848,#4940E0)] bg-clip-text text-transparent":
              props.gradientText,
          },
          { "text-ffffff": !props.gradientText },
          props.textClassName,
        )}
      >
        {props.children}
      </span>
    </button>
  );
});
