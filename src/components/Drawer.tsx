import { cn } from "@/lib/utils";
import { Content, Overlay, Root } from "@radix-ui/react-dialog";
import type { PanInfo } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import React, { useRef } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  className?: string;
  /** Flush, near full-height sheet (settings) instead of a floating card. */
  fullHeight?: boolean;
  children: React.ReactNode;
}

/**
 * World App bottom sheet: a floating card inset 8pt from the edges with 32pt
 * corners, a 58×4 grabber, a faint shadow and a 40% dim behind it.
 */
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
              className="absolute inset-0 z-20 bg-surface-overlay"
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
                "absolute z-30 flex flex-col bg-surface-primary shadow-sheet outline-none",
                props.fullHeight
                  ? "inset-x-0 bottom-0 top-11 rounded-t-32 px-6 pb-8 pt-6"
                  : "inset-x-2 bottom-2 max-h-[calc(100%_-_56px)] rounded-32 px-6 pb-8 pt-6",
                props.className,
              )}
            >
              <span
                aria-hidden
                className="absolute left-1/2 top-2 h-1 w-[58px] -translate-x-1/2 rounded-2 bg-surface-tertiary"
              />
              <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hidden">
                {props.children}
              </div>
            </motion.div>
          </Content>
        )}
      </AnimatePresence>
    </Root>
  );
});
