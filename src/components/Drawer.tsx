import React from "react";
import { Root, Overlay, Content, Close } from "@radix-ui/react-dialog";
import { Icon } from "@/components/Icon";

export const Drawer = React.memo(function Drawer(props: {
  className?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Root
      open={props.open}
      onOpenChange={props.onClose}
    >
      <Overlay className="absolute inset-0 bg-gray-900/70" />

      <Content className="absolute inset-x-0 bottom-0 top-[44px] rounded-t-20 bg-ffffff p-6 outline-none">
        <Close className="absolute left-[24px] top-[24px] flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
          <Icon
            name="direction-down"
            className="h-6 w-6"
          />
        </Close>

        {props.children}
      </Content>
    </Root>
  );
});
