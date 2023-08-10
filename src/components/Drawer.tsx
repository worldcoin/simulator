import { cn } from "@/lib/utils";
import { Content, Overlay, Root } from "@radix-ui/react-dialog";
import type { PanInfo } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import React, { useRef } from "react";

export interface DrawerProps {
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
              className="absolute inset-0 z-20 bg-gray-900/70"
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
              transition={{ type: "spring", stiffness: 2000, damping: 120 }}
              className={cn(
                "absolute inset-x-0 bottom-0 z-30 rounded-t-20 bg-white p-6 outline-none",
                {
                  "top-[44px]": props.fullHeight,
                },
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
