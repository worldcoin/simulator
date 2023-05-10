import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/Icon";

export const Drawer = React.memo(function Drawer(props: {
  className?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root
      open={props.open}
      onOpenChange={props.onClose}
    >
      <Dialog.Overlay className="absolute inset-0 bg-gray-900/70" />
      <Dialog.Content className="absolute bottom-0 inset-x-0 top-[44px] rounded-t-[20px] bg-ffffff p-6">
        <Dialog.Close className="absolute left-[24px] top-[24px] flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
          <Icon
            name="direction-down"
            className="h-6 w-6"
          />
        </Dialog.Close>
        {props.children}
      </Dialog.Content>
    </Dialog.Root>
  );
});
