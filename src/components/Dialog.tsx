import React from "react";
import { Root, Overlay, Content, Close } from "@radix-ui/react-dialog";
import { Icon } from "@/components/Icon";

export const Dialog = React.memo(function Dialog(props: {
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

      <Content className="absolute inset-0 rounded-t-20 bg-ffffff p-6">
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
