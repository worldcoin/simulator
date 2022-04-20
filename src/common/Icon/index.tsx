import cn from "classnames";
import React from "react";
import styles from "./icon.module.css";

export const Icon = React.memo(function Icon(props: {
  data: string;
  className?: string;
  noMask?: boolean;
}) {
  return (
    <span
      className={cn(
        styles.icon,
        "icon pointer-events-none flex",

        {
          "bg-current": !props.noMask,
          "no-mask": props.noMask,
        },

        props.className,
      )}
      style={{ "--image": `url(${props.data})` } as React.CSSProperties}
    />
  );
});
