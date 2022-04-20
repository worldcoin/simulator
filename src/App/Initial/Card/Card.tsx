import Button from "@/common/Button/Button";
import { Icon } from "@/common/Icon";
import Tooltip from "@/common/Tooltip/Toolip";
import infoSvg from "@static/info.svg";
import cn from "classnames";
import React from "react";
import { usePopperTooltip } from "react-popper-tooltip";

const Card = React.memo(function Card(props: {
  heading: string;
  text: string;
  buttonText: string;
  buttonAction: () => void;
  className?: string;
  altButton?: boolean;
  tooltipText?: string;
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
    <div className={cn("grid gap-y-3", props.className)}>
      <h2 className="text-20 font-semibold text-183c4a">{props.heading}</h2>

      <div className="relative text-15 leading-5 tracking-[-0.01em] text-777e90">
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
              className="absolute top-[2px] left-[2px] h-4 w-4 rotate-180"
            />
          </span>
        )}
      </div>

      {visible && (
        <Tooltip
          ref={setTooltipRef}
          getTooltipProps={getTooltipProps({ className: "relative px-4" })}
          getArrowProps={getArrowProps({
            className: "absolute bg-transparent w-4 h-4 -top-1.5",
          })}
          backgroundColor="bg-183c4a"
          className="text-ffffff"
          text={props.tooltipText ?? ""}
        />
      )}

      <Button
        onClick={props.buttonAction}
        className={cn(
          "mt-3",
          { "bg-4940e0 text-ffffff hover:bg-4940e0/80": !props.altButton },
          {
            "border border-183c4a text-183c4a hover:opacity-70":
              props.altButton,
          },
        )}
      >
        {props.buttonText}
      </Button>
    </div>
  );
});

export default Card;
