import Button from "@/common/Button/Button";
import { Icon } from "@/common/Icon";
import { inclusionProof, insertIdentity } from "@/lib/sequencer-service";
import type { Identity as IdentityType } from "@/types";
import checkCircleGradient from "@static/check-circle-gradient.svg";
import gradientSpinnerSvg from "@static/gradient-spinner-thin.svg";
import orbPng from "@static/orb.png";
import cn from "classnames";
import React from "react";
import { encodeIdentityCommitment } from "../Identity";

export const IdentityVerification = React.memo(
  function IdentityVerification(props: {
    onClose: () => void;
    identity: IdentityType;
    setIdentity: React.Dispatch<React.SetStateAction<IdentityType>>;
    setVerificationSkipped: React.Dispatch<React.SetStateAction<boolean>>;
  }) {
    const [submitSuccess, setSubmitSuccess] = React.useState<boolean | null>(
      false,
    );
    const [loading, setLoading] = React.useState<boolean>(false);

    const verifyHandle = React.useCallback(async () => {
      try {
        setLoading(true);
        const encodedCommitment = encodeIdentityCommitment(
          props.identity.commitment,
        );
        const result = await insertIdentity(encodedCommitment);

        console.info("Identity successfully added.", result);

        let verified: boolean;
        let proof: IdentityType["inclusionProof"];
        inclusionProof(encodedCommitment)
          .then((result) => {
            verified = true;
            proof = result;
          })
          .catch((error) => {
            console.error(error);
          })
          .finally(() => {
            props.setIdentity((identity) => ({
              ...identity,
              verified,
              inclusionProof: proof,
            }));
          });
        setSubmitSuccess(true);
      } catch (err) {
        setSubmitSuccess(false);
        console.error("Error inserting identity.", err);
      } finally {
        setLoading(false);
      }
    }, [props]);

    const handleSkipVerification = React.useCallback(() => {
      props.setVerificationSkipped(true);
      props.onClose();
    }, [props]);

    return (
      <div className="grid content-end gap-y-8">
        <div className="grid justify-items-center gap-y-4">
          <div
            className={cn(
              "relative flex h-[100px] w-[100px] items-center justify-center rounded-full",
              {
                "bg-f1f5f8 dark:bg-191c20": submitSuccess,
                "bg-dde7ea dark:bg-191c20": !submitSuccess,
              },
            )}
          >
            {!submitSuccess && (
              <React.Fragment>
                <img
                  src={orbPng}
                  alt="worldcoin orb"
                  className="h-15 w-15"
                />

                {loading && (
                  <Icon
                    data={gradientSpinnerSvg}
                    noMask
                    className="absolute inset-0 animate-spin"
                  />
                )}
              </React.Fragment>
            )}

            {submitSuccess && (
              <React.Fragment>
                <Icon
                  data={checkCircleGradient}
                  noMask
                  className="h-15 w-15"
                />
              </React.Fragment>
            )}
          </div>

          <h2 className="pt-4 text-center font-sora text-30 font-semibold text-000000 dark:text-ffffff">
            {!loading && !submitSuccess && "Verify your identity"}
            {loading && !submitSuccess && "Verifying identity..."}
            {submitSuccess && "Verification Successful!"}
          </h2>

          <p className="text-center text-18 leading-[1.3] text-858494">
            {!loading &&
              !submitSuccess &&
              `Verifying your identity is the equivalent of going to a Worldcoin
            orb and verifying you are a unique human.`}

            {loading &&
              !submitSuccess &&
              "Generating verification, this can take up to a few seconds. Please don’t close this screen."}

            {submitSuccess &&
              "You have successfully verified.You can return back and scan QR code."}
          </p>
        </div>

        <div className="grid">
          {!submitSuccess && (
            <Button
              isDisabled={loading}
              onClick={verifyHandle}
              type="button"
              className="bg-4940e0 font-sora uppercase text-ffffff disabled:opacity-30 dark:shadow-[0px_10px_20px_rgba(83,67,212,0.2),inset_0px_-1px_1px_rgba(0,0,0,0.3),inset_0px_1px_1px_rgba(255,255,255,0.2)]"
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
            onClick={handleSkipVerification}
            type="button"
            className="text-18 font-medium text-858494 disabled:opacity-20"
          >
            Skip verification
          </Button>
        </div>
      </div>
    );
  },
);
