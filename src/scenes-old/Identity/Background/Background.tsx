import { Icon } from "@/common/Icon";
import { Phase } from "@/types";
import clsx from "clsx";
import React from "react";

export const Background = React.memo(function Background(props: {
  className?: string;
  phase: Phase;
}) {
  return (
    <div className={clsx(props.className, "pointer-events-none")}>
      <Icon
        name="ellipse-left"
        className={clsx(
          "absolute top-24 h-[360px] w-[360px] animate-circle-left",
          { "left-[-120%]": props.phase !== Phase.Identity },
          { "left-[-90px]": props.phase === Phase.Identity },
        )}
        noMask
      />

      <Icon
        name="ellipse-right"
        className={clsx(
          "absolute h-[257px] w-[257px] animate-circle-right",
          { "right-[-120%]": props.phase !== Phase.Identity },
          { "right-[-30%]": props.phase === Phase.Identity },
        )}
        noMask
      />
    </div>
  );
});
