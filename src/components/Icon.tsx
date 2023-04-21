import clsx from "clsx";
import React from "react";

export const Icon = React.memo(function Icon(props: {
  data: string;
  className?: string;
  noMask?: boolean;
}) {
  return (
    <span
      className={clsx(
        "icon pointer-events-none flex",

        {
          "bg-current": !props.noMask,
          "no-mask": props.noMask,
        },

        props.className
      )}
      style={{ "--image": `url(${props.data})` } as React.CSSProperties}
    />
  );
});
