import type { IconType } from "@/components/Icon";
import { Content, Overlay, Root } from "@radix-ui/react-dialog";
import clsx from "clsx";
import React from "react";

export interface DrawerProps {
  closeClassName?: string;
  closeIcon?: IconType;
  fullHeight?: boolean;
  open: boolean;
  className?: string;
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
        {props.children}
      </Content>
    </Root>
  );
});
