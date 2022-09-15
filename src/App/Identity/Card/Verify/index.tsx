import React from "react";

export const Verify = React.memo(function Verify() {
  return (
    <div className="grid gap-y-3">
      <h1 className="mt-4 px-4 text-center font-sora font-semibold">
        Verify your identity to test World ID
      </h1>

      <p className="mt-0.5 text-center text-14 text-858494">
        Orbs verify your biometrics in a privacy preserving way to make sure
        everyone in the World gets only one World ID.
      </p>
    </div>
  );
});
