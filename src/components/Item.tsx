import clsx from "clsx";
import type { ReactNode } from "react";
import type { IconType } from "./Icon";
import { Icon } from "./Icon";

export default function Item(props: {
  icon: IconType;
  heading: string;
  text: ReactNode | string;
  indicator?: IconType;
  className?: string;
  iconClassName?: string;
  iconBgClassName?: string;
  onClick: (
    event?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  ) => void;
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
      <Icon
        name={props.icon}
        className={clsx(
          "h-5 w-5 text-9ba3ae",
          { "text-9ba3ae": !props.iconClassName },
          props.iconClassName,
        )}
        bgClassName={clsx(
          "h-10 w-10 rounded-12 shrink-0",
          { "bg-ebecef": !props.iconBgClassName },
          props.iconBgClassName,
        )}
      />
      <div className="ml-3 flex-1 text-left">
        <h3 className="font-rubik text-16 font-medium text-191c20">
          {props.heading}
        </h3>
        <p className="mt-1 font-rubik text-14 text-657080">{props.text}</p>
      </div>
      <span className="flex shrink-0 justify-center">
        <Icon
          name={props.indicator ?? "chevron-thin"}
          className="h-6 w-6 text-9ba3ae"
        />
      </span>
    </button>
  );
}
