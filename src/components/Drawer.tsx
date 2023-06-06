import { Content, Overlay, Root } from "@radix-ui/react-dialog";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  className?: string;
  fullHeight?: boolean;
  children: React.ReactNode;
}

export const Drawer = React.memo(function Drawer(props: DrawerProps) {
  const contentVariant = {
    closed: {
      y: "100%",
      transition: { type: "spring", stiffness: 500, damping: 30 },
    },
    open: {
      y: "0%",
      transition: { type: "spring", stiffness: 500, damping: 30 },
    },
  };

  return (
    <Root
      open={props.open}
      onOpenChange={props.onClose}
    >
      <AnimatePresence>
        {props.open && (
          <>
            <Overlay
              key="overlay"
              className="absolute inset-0 z-20 bg-gray-900/70"
            />

            <Content
              forceMount
              asChild
            >
              <motion.div
                key="content"
                initial="closed"
                animate="open"
                exit="closed"
                variants={contentVariant}
                className={clsx(
                  "absolute inset-x-0 bottom-0 z-30 rounded-t-20 bg-white p-6 outline-none",
                  {
                    "top-[44px]": props.fullHeight,
                  },
                )}
              >
                {props.children}
              </motion.div>
            </Content>
          </>
        )}
      </AnimatePresence>
    </Root>
  );
});
