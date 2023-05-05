import type { IconType } from "@/common/Icon";
import { Icon } from "@/common/Icon";
import type { TabsType } from "@/types";
import clsx from "clsx";
import React from "react";

export const Tab = React.memo(function Tab(props: {
  icon: IconType;
  name: string;
  tab: TabsType;
  setTab: (tab: TabsType) => void;
  active: boolean;
}) {
  return (
    <button
      onClick={() => props.setTab(props.tab)}
      className={clsx(
        "flex select-none flex-col items-center gap-y-2 text-000000 dark:text-ffffff",
        {
          "opacity-40": !props.active,
        },
      )}
    >
      <Icon
        name={props.icon}
        className="h-6 w-6"
      />

      <span className="text-14 font-medium uppercase">{props.name}</span>
    </button>
  );
});
