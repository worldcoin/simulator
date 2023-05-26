import type { IconType } from "@/components/Icon";
import { Icon } from "@/components/Icon";
import clsx from "clsx";
import type { ReactNode } from "react";
import React from "react";

export const Card = React.memo(function Card(props: {
  icon: IconType;
  heading: string;
  text: ReactNode | string;
  className?: string;
  iconClassName?: string;
  iconBgClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div className={clsx("rounded-16 bg-f9fafb p-5", props.className)}>
      <Icon
        name={props.icon}
        className={clsx("h-6 w-6 text-ffffff", props.iconClassName)}
        bgClassName={clsx(
          "h-10 w-10 bg-000000 rounded-12",
          props.iconBgClassName,
        )}
      />
      <h2 className="mt-3 font-rubik text-18 font-semibold text-191c20 xs:mt-5">
        {props.heading}
      </h2>
      <div className="mt-1 font-rubik text-14 text-657080">{props.text}</div>
      {props.children}
    </div>
  );
});
