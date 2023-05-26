import { Icon, type IconType } from "@/components/Icon";
import { Close, Content, Overlay, Root } from "@radix-ui/react-dialog";
import React from "react";

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
        <div className="absolute mt-3">
          <Close className="absolute left-0 top-0 z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gray-200">
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
