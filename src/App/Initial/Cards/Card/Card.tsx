import { Icon } from "@/common/Icon";
import Tooltip from "@/common/Tooltip/Toolip";
import infoSvg from "@static/info.svg";
import cn from "classnames";
import type { ReactNode } from "react";
import React from "react";
import { usePopperTooltip } from "react-popper-tooltip";

const Card = React.memo(function Card(props: {
  heading: string;
  text: ReactNode | string;
  className?: string;
  tooltipText?: string;
  icon: string;
}) {
  const {
    getArrowProps,
    getTooltipProps,
    setTooltipRef,
    setTriggerRef,
    visible,
  } = usePopperTooltip({
    placement: "bottom",
    offset: [0, 8],
  });

  return (
    <div
      className={cn("grid grid-cols-auto/1fr gap-y-1 gap-x-4", props.className)}
    >
      <Icon
        data={props.icon}
        className="row-span-2 h-8 w-8"
        noMask
      />
      <h2 className="text-16 font-semibold text-183c4a">{props.heading}</h2>

      <div className="relative text-14 leading-5 tracking-[-0.01em] text-777e90">
        {props.text}
        {props.tooltipText && (
          <span
            data-tip
            data-for="tooltip"
            className="relative pl-5"
            ref={setTriggerRef}
          >
            <Icon
              data={infoSvg}
              className={cn(
                "absolute top-[2px] left-[2px] h-4 w-4 rotate-180",
                { "text-191c20": visible },
              )}
            />
          </span>
        )}
      </div>

      {visible && (
        <Tooltip
          ref={setTooltipRef}
          getTooltipProps={getTooltipProps({ className: "relative px-4 z-50" })}
          getArrowProps={getArrowProps({
            className: "absolute bg-transparent w-4 h-4 -top-1.5",
          })}
          backgroundColor="bg-191c20"
          className="text-ffffff"
          text={props.tooltipText ?? ""}
        />
      )}
    </div>
  );
});

export default Card;
