import type { IconType } from "@/components/Icon";
import { Icon } from "@/components/Icon";
import { Close, Content, Overlay, Root } from "@radix-ui/react-dialog";
import React from "react";
import clsx from "clsx";

export interface DrawerProps {
  className?: string;
  closeClassName?: string;
  closeIcon?: IconType;
  fullHeight?: boolean;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Drawer = React.memo(function Drawer(props: DrawerProps) {
  return (
    <Root
      open={props.open}
      onOpenChange={props.onClose}
    >
      <Overlay className="absolute inset-0 bg-gray-900/70" />

      <Content
        className={clsx(
          "absolute inset-x-0 bottom-0 rounded-t-20 bg-ffffff p-6 outline-none",
          {
            "top-[44px]": props.fullHeight,
          },
        )}
      >
        <Close
          className={clsx(
            props.closeClassName,
            "absolute left-[24px] top-[24px] flex h-9 w-9 items-center justify-center rounded-full bg-gray-200",
          )}
        >
          <Icon
            name={props.closeIcon ?? "direction-down"}
            className="h-6 w-6"
          />
        </Close>

        {props.children}
      </Content>
    </Root>
  );
});
