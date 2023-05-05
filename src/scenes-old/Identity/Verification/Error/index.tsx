import Button from "@/common/Button/Button";
import { Icon } from "@/common/Icon";
import React from "react";

export const Error = React.memo(function Error(props: {
  onTryAgain: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="grid h-full  place-items-center content-end gap-8 text-center">
      <span className="relative h-25 w-25 rounded-full bg-dde7ea dark:bg-191c20">
        <Icon
          name="cross"
          className="absolute inset-5"
          noMask
        />
      </span>

      <div className="grid gap-25">
        <div className="grid gap-4">
          <p className="font-sora text-26 font-semibold text-000000 dark:text-ffffff">
            Something got broken
          </p>

          <p className="text-18 text-858494">
            Sorry, you can try to verify again
          </p>
        </div>

        <div className="grid gap-4">
          <Button
            onClick={props.onTryAgain}
            className="bg-4940e0 text-18 font-medium uppercase text-ffffff"
          >
            Try again
          </Button>

          <Button
            onClick={props.onDismiss}
            className="py-0 text-18 font-medium text-858494"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
});
