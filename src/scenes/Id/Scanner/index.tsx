import React from "react";
import { Dialog } from "@/components/Dialog";

export const Scanner = React.memo(function Scanner(props: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
    >
      <div className="py-1.5 text-center text-h3 font-bold">Scanner</div>
    </Dialog>
  );
});
