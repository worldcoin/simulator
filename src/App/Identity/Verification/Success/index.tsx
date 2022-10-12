import Button from "@/common/Button/Button";
import { Icon } from "@/common/Icon";
import checkSvg from "@static/check-circle-gradient.svg";
import React from "react";

export const Success = React.memo(function Success(props: {
  onDismiss: () => void;
  description?: string;
}) {
  return (
    <div className="grid h-full place-items-center content-end gap-8 text-center">
      <span className="relative h-25 w-25 rounded-full bg-191c20">
        <Icon
          data={checkSvg}
          className="absolute inset-5"
          noMask
        />
      </span>

      <div className="grid gap-25">
        <div className="grid gap-6">
          <div className="grid gap-4">
            <p className="font-sora text-26 font-semibold">
              Verification Successful
            </p>

            <p className="text-18">
              You have successfully verified.You can return to Gitlab to
              continue.
            </p>
          </div>

          <p className="rounded-8 border border-[#3c4040] bg-191c20 p-4">
            {props.description}
          </p>
        </div>

        <div className="grid gap-4">
          <Button
            onClick={props.onDismiss}
            className="py-0 text-18 font-medium"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
});
