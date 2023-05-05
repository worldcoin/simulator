import Button from "@/common/Button/Button";
import { GradientButton } from "@/common/GradientButton/GradientButton";
import { Icon } from "@/common/Icon";
import React from "react";

export const AlreadyVerified = React.memo(function AlreadyVerified(props: {
  onContinue: () => void;
  onDismiss: () => void;
  description?: string;
}) {
  return (
    <div className="grid h-full place-items-center content-end gap-8 text-center">
      <span className="relative h-25 w-25 rounded-full bg-dde7ea dark:bg-191c20">
        <Icon
          name="cross"
          className="absolute inset-5"
          noMask
        />
      </span>

      <div className="grid gap-6">
        <div className="grid gap-4">
          <p className="font-sora text-26 font-semibold text-000000 dark:text-ffffff">
            Already verified
          </p>

          <p className="text-18 text-858494">
            You have already done this verification before and can only be done
            once.
          </p>
        </div>

        <p className="rounded-8 border border-858494/40 bg-ffffff p-4 text-000000 dark:border-[#3c4040] dark:bg-191c20 dark:text-ffffff">
          {props.description}
        </p>

        <GradientButton
          isVisible
          onClick={props.onContinue}
          textClassName="block p-5 text-000000 dark:text-ffffff"
        >
          Verify with World ID
        </GradientButton>

        <Button
          onClick={props.onDismiss}
          className="py-0 text-18 font-medium text-858494"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
});
