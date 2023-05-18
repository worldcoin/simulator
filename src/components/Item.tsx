import clsx from "clsx";
import type { ReactNode } from "react";
// import { GradientIcon } from "./GradientIcon";
import type { IconType } from "./Icon";
import { Icon } from "./Icon";

export default function Item(props: {
  heading: string;
  text: ReactNode | string;
  indicator?: IconType;
  className?: string;
  onClick: (
    event?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  ) => void;
  children?: ReactNode;
}) {
  return (
    <button
      onClick={props.onClick}
      className={clsx(
        "flex w-full items-center rounded-16 bg-f9fafb",
        { "p-4": !props.className },
        props.className,
      )}
    >
      {props.children}
      <div className="ml-3 flex-1 text-left">
        <h3 className="text-s3">{props.heading}</h3>
        <p className="mt-1 text-b4 text-gray-500">{props.text}</p>
      </div>
      <span className="flex shrink-0 justify-center">
        <Icon
          name={props.indicator ?? "chevron-thin"}
          className="h-6 w-6 text-gray-400"
        />
      </span>
    </button>
  );
}
