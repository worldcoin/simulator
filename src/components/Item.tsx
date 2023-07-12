import clsx from "clsx";
import type React from "react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

export default function Item(props: {
  heading: string;
  text?: ReactNode | string;
  indicator?: () => JSX.Element;
  className?: string;
  disabled?: boolean;
  onClick: (
    event?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  ) => void;
  children?: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "flex w-full items-center rounded-16 bg-gray-50",
        { "p-4": !props.className },
        props.className,
      )}
    >
      <button
        onClick={props.onClick}
        disabled={props.disabled}
        className="flex w-full items-center outline-none"
      >
        {props.children}
        <div className="ml-3 flex-1 text-left">
          <h3 className="text-s3">{props.heading}</h3>
          {props.text && (
            <p className="mt-1 text-b4 text-gray-500">{props.text}</p>
          )}
        </div>
        <span className="flex shrink-0 justify-center">
          {props.indicator && <props.indicator />}
          {!props.indicator && (
            <Icon
              name={"chevron-thin"}
              className="h-6 w-6 text-gray-400"
            />
          )}
        </span>
      </button>
    </div>
  );
}
