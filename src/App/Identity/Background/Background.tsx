import { Icon } from "@/common/Icon";
import { Phase } from "@/types";
import ellipseLeftSvg from "@static/ellipse-left.svg";
import ellipseRightSvg from "@static/ellipse-right.svg";
import cn from "classnames";
import React from "react";

export const Background = React.memo(function Background(props: {
  className?: string;
  phase: Phase;
}) {
  return (
    <div className={cn(props.className, "pointer-events-none")}>
      <Icon
        data={ellipseLeftSvg}
        className={cn(
          "absolute top-24 h-[360px] w-[360px] animate-circle-left",
          { "left-[-120%]": props.phase !== Phase.Identity },
          { "left-[-90px]": props.phase === Phase.Identity },
        )}
        noMask
      />
      <Icon
        data={ellipseRightSvg}
        className={cn(
          "absolute h-[257px] w-[257px] animate-circle-right",
          { "right-[-120%]": props.phase !== Phase.Identity },
          { "right-[-30%]": props.phase === Phase.Identity },
        )}
        noMask
      />
    </div>
  );
});
