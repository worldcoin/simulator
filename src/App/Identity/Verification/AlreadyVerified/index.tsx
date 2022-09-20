import Button from "@/common/Button/Button";
import { GradientButton } from "@/common/GradientButton/GradientButton";
import { Icon } from "@/common/Icon";
import crossSvg from "@static/cross-circle-gradient.svg";
import React from "react";

export const AlreadyVerified = React.memo(function AlreadyVerified(props: {
  onContinue: () => void;
  onDismiss: () => void;
  description?: string;
}) {
  return (
    <div className="grid h-full place-items-center content-end gap-8 text-center">
      <span className="relative h-25 w-25 rounded-full bg-191c20">
        <Icon
          data={crossSvg}
          className="absolute inset-5"
          noMask
        />
      </span>

      <div className="grid gap-6">
        <div className="grid gap-4">
          <p className="font-sora text-26 font-semibold">Already verified</p>

          <p className="text-18">
            You have already done this verification before and can only be done
            once.
          </p>
        </div>

        <p className="rounded-8 border border-[#3c4040] bg-191c20 p-4">
          {props.description}
        </p>

        <GradientButton
          isVisible
          onClick={props.onContinue}
          textClassName="block p-5 text-ffffff"
          bgColor="#0C0E10"
        >
          Verify with World ID
        </GradientButton>

        <Button
          onClick={props.onDismiss}
          className="py-0 text-18 font-medium"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
});
