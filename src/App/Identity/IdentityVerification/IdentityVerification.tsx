import Button from "@/common/Button/Button";
import { insertIdentity } from "@/lib/sequencer-service";
import type { Identity as IdentityType } from "@/types";
import orbPng from "@static/orb.png";
import React from "react";
import { encodeIdentityCommitment } from "../Identity";

export const IdentityVerification = React.memo(
  function IdentityVerification(props: {
    onClose: () => void;
    identity: IdentityType;
    setIdentity: React.Dispatch<React.SetStateAction<IdentityType>>;
  }) {
    const [submitSuccess, setSubmitSuccess] = React.useState<boolean | null>(
      null,
    );
    const [loading, setLoading] = React.useState<boolean>(false);

    const verifyHandle = React.useCallback(async () => {
      console.log("test");

      try {
        setLoading(true);
        const result = await insertIdentity(
          encodeIdentityCommitment(props.identity.commitment),
        );
        console.info("Identity successfully added.", result);
        props.setIdentity({ ...props.identity, verified: true });
        setSubmitSuccess(true);
      } catch (err) {
        setSubmitSuccess(false);
        console.error("Error inserting identity.", err);
      } finally {
        setLoading(false);
      }
    }, [props]);

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
          <h2 className="pt-4 font-sora text-30 font-semibold">
            Verify your identity
          </h2>

          <p className="text-center text-18 leading-[1.3] text-858494">
            Verifying your identity is the equivalent of going to a Worldcoin
            orb and verifying you are a unique human.
          </p>
        </div>

        <div className="grid">
          {!submitSuccess && (
            <Button
              isDisabled={loading}
              onClick={verifyHandle}
              type="button"
              className="bg-4940e0 font-sora uppercase text-ffffff"
            >
              {loading ? "verifying..." : "verify now"}
            </Button>
          )}

          {submitSuccess && (
            <Button
              onClick={props.onClose}
              type="button"
              className="bg-4940e0 font-sora uppercase text-ffffff"
            >
              done
            </Button>
          )}

          <Button
            isDisabled={loading || Boolean(submitSuccess)}
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
