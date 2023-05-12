import React from "react";
import { Root, Overlay, Content, Close } from "@radix-ui/react-dialog";
import type { IconType } from "@/components/Icon";
import { Icon } from "@/components/Icon";

export const Dialog = React.memo(function Dialog(props: {
  className?: string;
  open: boolean;
  onClose: () => void;
  closeIcon?: IconType;
  children: React.ReactNode;
}) {
  return (
    <Root
      open={props.open}
      onOpenChange={props.onClose}
    >
      <Overlay className="absolute inset-0 bg-gray-900/70" />

      <Content className="absolute inset-0 bg-ffffff px-6 pb-6 outline-none xs:pt-6 md:pt-11">
        <div className="absolute">
          <Close className="absolute left-0 top-0 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
            <Icon
              name={props.closeIcon ?? "direction-down"}
              className="h-6 w-6"
            />
          </Close>
        </div>

        {props.children}
      </Content>
    </Root>
  );
});
