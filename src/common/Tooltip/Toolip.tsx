import cn from "classnames";
import React from "react";
import type { usePopperTooltip } from "react-popper-tooltip";

type Props = {
  getTooltipProps: ReturnType<
    ReturnType<typeof usePopperTooltip>["getTooltipProps"]
  >;
  getArrowProps: ReturnType<
    ReturnType<typeof usePopperTooltip>["getArrowProps"]
  >;
  text: string;
  backgroundColor: `bg-${string}`;
  className?: string;
};

const Tooltip = React.forwardRef<HTMLDivElement, Props>((props, ref) => (
  <div
    ref={ref}
    {...props.getTooltipProps}
  >
    <div {...props.getArrowProps}>
      <div
        className={cn(
          "absolute inset-0 rotate-[45deg] rounded-[2.5px]",
          props.backgroundColor,
        )}
      />
    </div>

    <div
      className={cn(
        "h-full w-full max-w-[256px] rounded-10 p-3 text-12 leading-4 tracking-[-0.01em]",
        props.className,
        props.backgroundColor,
      )}
    >
      {props.text}
    </div>
  </div>
));

Tooltip.displayName = "Tooltip";

export default Tooltip;
