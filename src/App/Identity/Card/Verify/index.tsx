import Button from "@/common/Button/Button";
import React from "react";

export const Verify = React.memo(function Verify(props: {
  skippedVerification?: boolean;
  onVerify?: () => void;
}) {
  return (
    <div className="grid justify-items-center gap-y-3">
      <h1 className="mt-4 px-4 text-center font-sora font-semibold text-000000 dark:text-ffffff">
        Verify your identity to test World ID
      </h1>

      <p className="mt-0.5 text-center text-14 text-858494">
        Orbs verify your biometrics in a privacy preserving way to make sure
        everyone in the World gets only one World ID.
      </p>

      {props.skippedVerification && (
        <Button
          onClick={() => props.onVerify?.()}
          className="mt-auto px-3 py-2 text-14 text-4940e0 transition-opacity hover:opacity-75"
        >
          verify now
        </Button>
      )}
    </div>
  );
});
