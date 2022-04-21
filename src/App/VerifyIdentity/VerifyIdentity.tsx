import Button from "@/common/Button/Button";
import type { Identity } from "@/types";
import { Phase } from "@/types/common";
import orbPng from "@static/orb.png";
import cn from "classnames";
import React from "react";
import { Link } from "react-router-dom";
import { encodeIdentityCommitment } from "../Identity/Identity";

const VerifyIdentity = React.memo(function VerifyIdentity(props: {
  extended?: boolean;
  setPhase: React.Dispatch<React.SetStateAction<Phase>>;
  className?: string;
  setVerificationSkipped: React.Dispatch<React.SetStateAction<boolean>>;
  identity: Identity;
}) {
  const [identityFaucetVisited, setIdentityFaucetVisited] =
    React.useState(false);

  const onGoToClick = React.useCallback(() => {
    setIdentityFaucetVisited(true);
  }, []);

  const continueWithoutVerifying = React.useCallback(() => {
    props.setVerificationSkipped(true);
    props.setPhase(Phase.Identity);
  }, [props]);

  const onDoneClick = React.useCallback(() => {
    location.reload();
  }, []);

  const close = React.useCallback(() => {
    props.setPhase(Phase.Identity);
  }, [props]);

  return (
    <div className={cn("grid content-between gap-y-6", props.className)}>
      <div className="grid gap-y-6">
        <h1 className="text-24 font-semibold text-183c4a">
          {`Verify your identity uniqueness ${props.extended ? "first?" : ""}`}
        </h1>

        <div className="grid gap-y-6 text-15 leading-5 tracking-[-0.01em] text-777e90">
          <p>
            Verifying your identity is the equivalent of going to a Worldcoin
            orb and verifying you are a unique human.
          </p>
          <p>
            In this mock version, you can go to the faucet and just insert your
            identity.
          </p>
        </div>
      </div>

      {!props.extended && (
        <div
          className={cn(
            "justify-self-center rounded-full bg-fbfbfb",
            { "p-8": !identityFaucetVisited },
            { "p-6": identityFaucetVisited },
          )}
        >
          <img
            src={orbPng}
            alt="Orb"
            className={cn(
              { "h-16 w-16": !identityFaucetVisited },
              { "h-12 w-12": identityFaucetVisited },
            )}
          />
        </div>
      )}

      <div className="mt-auto grid gap-y-4">
        {identityFaucetVisited && (
          <Button
            onClick={onDoneClick}
            className="rounded-full bg-4940e0 py-4.5 text-center text-ffffff hover:opacity-70"
          >
            I’ve done this
          </Button>
        )}

        <Link
          to={`/identity-faucet?commitment=${encodeIdentityCommitment(
            props.identity.commitment,
          )}`}
          target="_blank"
          className={cn(
            "rounded-full border border-4940e0 py-4.5 text-center hover:opacity-70",
            { "bg-4940e0 text-ffffff": !identityFaucetVisited },
            { "text-4940e0": identityFaucetVisited },
          )}
          onClick={onGoToClick}
        >
          Go to identity faucet
        </Link>

        {!props.extended && (
          <Button
            onClick={close}
            className="mt-auto border border-4940e0 text-4940e0 hover:opacity-70"
          >
            Close
          </Button>
        )}

        {props.extended && (
          <Button
            onClick={continueWithoutVerifying}
            className="mt-auto border border-4940e0 text-4940e0 hover:opacity-70"
          >
            Continue without verifying
          </Button>
        )}
      </div>
    </div>
  );
});

export default VerifyIdentity;
