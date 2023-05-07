import clsx from "clsx";
import React from "react";
import styles from "./Icon.module.css";

const icons = [
  "battery",
  "bead-verified",
  "bead-not-verified",
  "checkmark",
  "clock",
  "cross",
  "favicon",
  "info",
  "logo",
  "network",
  "question",
  "shield",
  "spinner",
  "user",
  "wifi",
] as const;

export type IconType = typeof icons[number];

export const Icon = React.memo(function Icon(props: {
  name: IconType;
  className?: string;
  bgClassName?: string;
  noMask?: boolean;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center",
        props.bgClassName,
      )}
    >
      <span
        className={clsx(
          styles.icon,
          {
            "bg-current": !props.noMask,
            "no-mask": props.noMask,
          },
          props.className,
        )}
        style={
          { "--image": `url(/icons/${props.name}.svg)` } as React.CSSProperties
        }
      />
    </span>
  );
});