import { Icon } from "@/common/Icon";
import Tooltip from "@/common/Tooltip/Toolip";
import questionSvg from "@static/card-question.svg";
import cn from "classnames";
import React, { useEffect, useRef } from "react";
import { usePopperTooltip } from "react-popper-tooltip";
import { Verified } from "./Verified";
import { Verify } from "./Verify";

export const Card = React.memo(function Card(props: { verified: boolean }) {
  const reference = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const Element = reference.current;
    if (!Element) return;
    window.addEventListener("mousemove", (event) => {
      Element.style.setProperty(
        "--cardTilt",
        `${(event.pageX / window.innerWidth) * 100}%`,
      );
    });
  }, []);

  return (
    <React.Fragment>
      <div
        ref={reference}
        className={cn(
          "relative grid h-[350px] w-[249px] overflow-hidden rounded-[20px] ",
          {
            "border border-d1d3d4 bg-f1f5f8 p-3 pb-10 dark:border-d1d3d4/40 dark:bg-191c20":
              !props.verified,
            "bg-[#2d2e36] p-5 pb-7": props.verified,
          },
        )}
      >
        {visible && (
          <Tooltip
            ref={setTooltipRef}
            getTooltipProps={getTooltipProps({
              className: "relative px-4 z-50",
            })}
            getArrowProps={getArrowProps({
              className: "absolute bg-transparent hidden w-4 h-4 -top-1.5",
            })}
            backgroundColor="bg-191c20"
            className=" text-ffffff"
            text="This is just a representation of your current identity. It can let you know whether you’re using the same identity in multiple sessions. If you generate your identity with the same wallet, the same identity will be fetched."
          />
        )}
        <div
          ref={setTriggerRef}
          className={cn("absolute z-10", {
            "top-5 left-5 text-[#cbe1df]": props.verified,
            "top-3 left-3 text-858494": !props.verified,
          })}
        >
          <Icon
            data={questionSvg}
            className="h-4.5 w-4.5"
          />
        </div>

        <svg
          width="0"
          height="0"
          className="translate-x-10"
        >
          <defs>
            <clipPath id="cardHuman">
              <path d="M37.643 18.043a8.71 8.71 0 1 0 0-17.419 8.71 8.71 0 0 0 0 17.42ZM.749 20.413a3.58 3.58 0 0 1 4.333-2.62c12.798 3.156 22.512 4.675 32.243 4.67 9.737-.004 19.67-1.534 32.909-4.677a3.58 3.58 0 0 1 1.654 6.968c-8.229 1.953-15.358 3.333-22.055 4.114-1.509.176-2.678 1.415-2.714 2.933-.098 4.117-.226 12.164.072 17.897.58 11.169 3.552 28.416 3.552 28.416a3.58 3.58 0 1 1-7.106.889l-5.995-29.089-5.995 29.089a3.58 3.58 0 0 1-7.105-.889s2.974-17.255 3.553-28.429c.296-5.702.17-13.702.073-17.81-.036-1.525-1.214-2.765-2.73-2.937-6.758-.767-13.874-2.17-22.07-4.192a3.58 3.58 0 0 1-2.62-4.333Z" />
            </clipPath>
          </defs>
        </svg>
        <span
          className={cn(
            "col-start-1 row-start-1 grid h-[120px] w-[120px] items-center justify-items-center self-center justify-self-center overflow-hidden rounded-full p-5",
            {
              "bg-ffffff dark:bg-3c4040": !props.verified,
              "bg-[#3f414a]": props.verified,
            },
          )}
        >
          <span
            className={cn(
              "relative z-10 h-full w-full translate-x-0.5 bg-[url('./static/card-iridescent.jpg')]",
              "bg-[length:700px]",
              "bg-[position:var(--cardTilt)_0] [clip-path:_url('#cardHuman')]",
            )}
          />
        </span>

        {props.verified ? <Verified /> : <Verify />}
      </div>
    </React.Fragment>
  );
});
