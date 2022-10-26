import type { Phase } from "@/types";
import abstractSvg from "@static/bg-abstract.jpg";
import blurSvg from "@static/bg-blur.svg";
import noiseSvg from "@static/bg-noise.png";
import cn from "classnames";
import React from "react";

export const Background = React.memo(function Background(props: {
  className?: string;
  phase: Phase;
}) {
  return (
    <div
      className={cn(
        "group pointer-events-none overflow-hidden bg-f0edf9",
        props.className,
      )}
    >
      <img
        src={abstractSvg}
        alt=""
        className="fixed h-full w-full object-cover opacity-50"
      />
      <img
        src={noiseSvg}
        alt=""
        className="fixed h-full w-full object-cover opacity-10"
      />
      <img
        src={blurSvg}
        alt=""
        className="fixed h-full w-full object-cover"
      />
    </div>
  );
});
