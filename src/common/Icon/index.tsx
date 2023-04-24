import clsx from "clsx";
import React from "react";
import styles from "./icon.module.css";

const icons = [
  "airdrop",
  "avatar",
  "battery",
  "camera-disallow",
  "card-question",
  "check-badge",
  "check-circle-gradient",
  "check",
  "checkmark-alt",
  "checkmark",
  "copy",
  "cross-circle-gradient",
  "cross",
  "ellipse-left",
  "ellipse-right",
  "favicon",
  "gradient-spinner-thin",
  "gradient-spinner",
  "hex-border",
  "hexagon",
  "info",
  "logo",
  "logout",
  "network",
  "no-camera",
  "no-qr",
  "passport",
  "qr",
  "question",
  "smile-gradient",
  "spinner",
  "unknown-project",
  "unknown-wallet",
  "unknown",
  "user-gradient",
  "user",
  "wallet",
  "wifi",
] as const;

export type IconType = typeof icons[number];

export const Icon = React.memo(function Icon(props: {
  name: IconType;
  className?: string;
  noMask?: boolean;
}) {
  return (
    <span
      className={clsx(
        styles.icon,
        "icon pointer-events-none flex",

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
  );
});
