import Button from "@/common/Button/Button";
import orbPng from "@static/orb.png";
import React from "react";

export const IdentityVerification = React.memo(
  function IdentityVerification(props: { onClose: () => void }) {
    return (
      <div className="grid content-between">
        <div className="grid justify-items-center gap-y-4">
          <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-dde7ea">
            <img
              src={orbPng}
              alt="worldcoin orb"
              className="h-15 w-15"
            />
          </div>
          <h2 className="pt-4 font-sora text-30 font-semibold text-000000 dark:text-ffffff">
            Verify your identity
          </h2>

          <p className="text-center text-18 leading-[1.3] text-858494">
            Verifying your identity is the equivalent of going to a Worldcoin
            orb and verifying you are a unique human.
          </p>
        </div>

        <div className="grid">
          <Button
            onClick={() => null}
            type="button"
            className="bg-4940e0 font-sora uppercase text-ffffff dark:shadow-[0px_10px_20px_rgba(83,67,212,0.2),inset_0px_-1px_1px_rgba(0,0,0,0.3),inset_0px_1px_1px_rgba(255,255,255,0.2)]"
          >
            verify now
          </Button>

          <Button
            onClick={props.onClose}
            type="button"
            className="text-18 font-medium text-858494"
          >
            Skip verification
          </Button>
        </div>
      </div>
    );
  },
);
