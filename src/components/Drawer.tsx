import { Content, Overlay, Root } from "@radix-ui/react-dialog";
import React from "react";

export const Drawer = React.memo(function Drawer(props: {
  open: boolean;
  className?: string;
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
        {props.children}
      </Content>
    </Root>
  );
});
