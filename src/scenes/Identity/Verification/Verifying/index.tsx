import { Icon } from "@/common/Icon";
import React from "react";

export const Verifying = React.memo(function Verifying() {
  return (
    <div className="grid h-full place-items-center content-center gap-15 py-32 text-center">
      <Icon
        noMask
        name="gradient-spinner"
        className="h-16 w-16 animate-spin"
      />
      <div className="grid gap-4">
        <p className="font-sora text-26 font-semibold text-ffffff">Verifying</p>
        <p className="text-18 text-f1f5f8">
          Generating verification, this can take up to a minute. Please don’t
          close.
        </p>
      </div>
    </div>
  );
});
