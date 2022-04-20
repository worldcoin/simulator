import { Icon } from "@/common/Icon";
import { Phase } from "@/types";
import abstractSvg from "@static/bg-abstract.png";
import blurSvg from "@static/bg-blur.svg";
import bgFigureSvg from "@static/bg-figure.svg";
import noiseSvg from "@static/bg-noise.png";
import wldSymbolSvg from "@static/bg-wld-symbol.svg";
import cn from "classnames";
import React, { Fragment } from "react";

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
      {props.phase !== Phase.IdentityFaucet && (
        <React.Fragment>
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
        </React.Fragment>
      )}

      {props.phase === Phase.IdentityFaucet && (
        <Fragment>
          <Icon
            data={bgFigureSvg}
            className={cn(
              "absolute animate-fade-in-short text-ffffff",
              "right-[-10%] top-[-70%] sm:left-[-60%] sm:bottom-[-20%] sm:right-[unset] sm:top-[unset]",
              "h-[200%] w-[200%] sm:h-[188%] sm:w-[126%]",
            )}
          />
          <Icon
            data={wldSymbolSvg}
            className="absolute right-[-27%] bottom-[-40%] h-[105%] w-[58%] animate-fade-in-long"
            noMask
          />
        </Fragment>
      )}
    </div>
  );
});
