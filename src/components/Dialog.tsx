import Button from "@/components/Button";
import { Icon, type IconType } from "@/components/Icon";
import { cn } from "@/lib/utils";
import { Close, Content, Overlay, Root } from "@radix-ui/react-dialog";
import React from "react";

/**
 * Full-screen page pushed over the current one, with World App's 44pt toolbar
 * row and a round close button at the leading edge.
 */
export const Dialog = React.memo(function Dialog(props: {
  className?: string;
  open: boolean;
  onClose: () => void;
  closeIcon?: IconType;
  closeLabel?: string;
  /** Dark chrome for camera surfaces. */
  dark?: boolean;
  /** Extra toolbar content rendered after the close button. */
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Root
      open={props.open}
      onOpenChange={props.onClose}
    >
      <Overlay className="absolute inset-0 z-20 bg-surface-overlay" />

      <Content
        className={cn(
          "absolute inset-0 z-30 flex flex-col px-4 pb-6 pt-14 outline-none",
          props.dark ? "bg-black text-white" : "bg-surface-primary",
          props.className,
        )}
      >
        <div className="relative z-10 flex h-11 shrink-0 items-center gap-2">
          <Close asChild>
            <Button
              variant={props.dark ? "ghost" : "tertiary"}
              size={44}
              iconOnly
              aria-label={props.closeLabel ?? "Close"}
              onClick={props.onClose}
            >
              <Icon
                name={props.closeIcon ?? "xmark"}
                className="size-6"
              />
            </Button>
          </Close>
          {props.toolbar}
        </div>

        {props.children}
      </Content>
    </Root>
  );
});
