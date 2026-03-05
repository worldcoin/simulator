import { cn } from "@/lib/utils";
import { Content, Overlay, Root } from "@radix-ui/react-dialog";
import type { PanInfo } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import React, { useRef } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  className?: string;
  fullHeight?: boolean;
  children: React.ReactNode;
}

export const Drawer = React.memo(function Drawer(props: DrawerProps) {
  const panel = useRef<HTMLDivElement>(null);

  const handleDragEnd = (_: DragEvent, info: PanInfo) => {
    if (!panel.current) return;

    const { velocity, offset } = info;
    const { height } = panel.current.getBoundingClientRect();

    if (velocity.y > 20 || offset.y > height / 2) props.onClose();
  };

  return (
    <Root
      open={props.open}
      onOpenChange={props.onClose}
    >
      <AnimatePresence>
        {props.open && (
          <Overlay
            asChild
            forceMount
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-[rgba(24,24,24,0.4)]"
            />
          </Overlay>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {props.open && (
          <Content forceMount>
            <motion.div
              ref={panel}
              dragElastic={0.05}
              dragConstraints={{ top: 0 }}
              drag="y"
              onDragEnd={handleDragEnd}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "120%" }}
              transition={{ type: "spring", stiffness: 420, damping: 44 }}
              className={cn(
                "absolute z-30 outline-none",
                props.fullHeight
                  ? "inset-x-0 bottom-0 top-[44px] rounded-t-20 bg-white p-6"
                  : "inset-x-3 bottom-[33px] rounded-[28px] bg-white px-8 pb-[68px] pt-8",
                props.className,
              )}
            >
              {props.children}
            </motion.div>
          </Content>
        )}
      </AnimatePresence>
    </Root>
  );
});
