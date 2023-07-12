import { cn } from "@/lib/utils";
import React from "react";
import styles from "./Icon.module.css";

const icons = [
  "badge-not-verified",
  "badge-verified",
  "barcode",
  "battery",
  "bead-verified",
  "bead-not-verified",
  "camera-off",
  "check",
  "check-circle",
  "checkmark",
  "chevron-thick",
  "chevron-thin",
  "clock",
  "close",
  "close-circle",
  "copy",
  "cross",
  "direction-down",
  "direction-left",
  "direction-right",
  "favicon",
  "file",
  "info",
  "logo",
  "network",
  "note",
  "orb",
  "phone",
  "question",
  "setting",
  "shield",
  "spinner",
  "text",
  "user",
  "warning",
  "wifi",
  "world-id",
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
      className={cn(
        "inline-flex items-center justify-center",
        props.bgClassName,
      )}
    >
      <span
        className={cn(
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
