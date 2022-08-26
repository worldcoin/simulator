import Button from "@/common/Button/Button";
import { validateImageUrl } from "@/common/helpers";
import { Icon } from "@/common/Icon";
import type { WalletConnectFlow } from "@/types";
import type { Identity } from "@/types/identity";
import { defaultAbiCoder as abi } from "@ethersproject/abi";
import checkSvg from "@static/check.svg";
import verifiedSvg from "@static/checkmark.svg";
import crossSvg from "@static/cross.svg";
import spinnerSvg from "@static/spinner.svg";
import unknownProjectLogoSvg from "@static/unknown-project.svg";
import unverifiedSvg from "@static/unknown.svg";
import { ErrorCodes } from "@worldcoin/id";
import type { Proof, SemaphorePublicSignals } from "@zk-kit/protocols";
import { Semaphore } from "@zk-kit/protocols";
import cn from "classnames";
import React, { useState } from "react";
import verificationKey from "semaphore/verification_key.json";
import "./mask.css";

enum VerificationState {
  Initial,
  Loading,
  AlreadyVerified,
  Error,
  TryAgain,
  Success,
}

const Verification = React.memo(function Verification(props: {
  className?: string;
  dismiss: () => void;
  approval: WalletConnectFlow;
  identity: Identity;
}) {
  const [verificationState, setVerificationState] =
    React.useState<VerificationState>(VerificationState.Initial);

  const [projectLogo, setProjectLogo] = useState<string>("");

  React.useEffect(() => {
    if (
      !props.approval.meta?.logo_image ||
      !validateImageUrl(props.approval.meta.logo_image)
    ) {
      return setProjectLogo(unknownProjectLogoSvg);
    }

    setProjectLogo(props.approval.meta.logo_image);
  }, [props.approval.meta?.logo_image]);

  const onImageLoadError = React.useCallback(() => {
    setProjectLogo(unknownProjectLogoSvg);
  }, []);

  const dismiss = React.useCallback(() => {
    const { connector, request } = props.approval;
    if (connector?.connected) {
      connector.on("disconnect", () => props.dismiss());
      if (request?.id)
        void connector.rejectRequest({
          id: request.id,
          error: {
            code: -32100,
            message: ErrorCodes.VerificationRejected,
          },
        });
    } else props.dismiss();
  }, [props]);

  /**
   * Verifies generated ZKP. Intended only to **exemplify** how to verify proofs on JS. The execution of this function
   * is not required for the flow to generate the proof.
   * @param proof
   * @param publicSignals
   */
  const verifyProof = async (
    proof: Proof,
    publicSignals: SemaphorePublicSignals,
  ): Promise<void> => {
    const isValid = await Semaphore.verifyProof(
      verificationKey as unknown as string,
      {
        proof,
        publicSignals,
      },
    );

    if (isValid) {
      console.info("Generated proof is valid and verified!");
    } else {
      console.error("Generated proof failed to verify.");
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const actionListener = async () => {
    if (verificationState === VerificationState.Initial) {
      if (props.approval.meta?.nullifiers?.length) {
        setVerificationState(VerificationState.AlreadyVerified);
      }
    }

    if (verificationState === VerificationState.Error) {
      setTimeout(() => {
        setVerificationState(VerificationState.TryAgain);
      }, 1000);
      return;
    }

    if (verificationState === VerificationState.Success) {
      setTimeout(() => {
        props.dismiss();
        setVerificationState(VerificationState.Initial);
      }, 1000);
      return;
    }

    if (verificationState === VerificationState.Loading) {
      const { identity } = props;
      const { connector, request } = props.approval;
      if (!connector || !request) {
        console.error("connector or request undefined", props.approval);
        setVerificationState(VerificationState.Error);
        return;
      }

      connector.on("disconnect", (err) => {
        if (err) {
          setVerificationState(VerificationState.Error);
        } else {
          setVerificationState(VerificationState.Success);
        }
      });

      try {
        const { fullProof, merkleProof } = props.approval;

        if (!fullProof || !merkleProof) {
          setVerificationState(VerificationState.Error);
          return;
        }

        await verifyProof(fullProof.proof, fullProof.publicSignals);
        connector.approveRequest({
          id: request.id,
          result: {
            merkle_root:
              identity.inclusionProof?.root ??
              abi.encode(["uint256"], [merkleProof.root]),
            nullifier_hash: abi.encode(
              ["uint256"],
              [fullProof.publicSignals.nullifierHash],
            ),
            proof: abi.encode(
              ["uint256[8]"],
              [Semaphore.packToSolidityProof(fullProof.proof)],
            ),
          },
        });
      } catch (err) {
        console.error(err);
        setVerificationState(VerificationState.Error);
        connector.off("disconnect");
        connector.rejectRequest({
          id: request.id,
          error: {
            code: -32602,
            message: ErrorCodes.GenericError,
          },
        });
      }
    }
  };

  React.useEffect(() => {
    void actionListener();
  }, [
    verificationState,
    props.approval,
    props.identity,
    props,
    actionListener,
  ]);

  const verify = React.useCallback(() => {
    return setVerificationState(VerificationState.Loading);
  }, []);

  const icon = React.useMemo(() => {
    if (verificationState === VerificationState.Loading) {
      return spinnerSvg;
    }

    if (verificationState === VerificationState.Success) {
      return checkSvg;
    }

    return crossSvg;
  }, [verificationState]);

  const buttonText = React.useMemo(() => {
    if (verificationState === VerificationState.Success) {
      return "Verified";
    }

    if (verificationState === VerificationState.TryAgain) {
      return "Try Again";
    }

    if (verificationState === VerificationState.AlreadyVerified) {
      return "Verify anyway";
    }

    return "Verify";
  }, [verificationState]);

  const isError = React.useMemo(
    () =>
      verificationState === VerificationState.Error ||
      verificationState === VerificationState.TryAgain ||
      verificationState === VerificationState.AlreadyVerified,
    [verificationState],
  );

  return (
    <div
      className={cn(
        "grid h-full max-h-full content-between gap-y-8",
        props.className,
      )}
    >
      <div className="grid content-start gap-y-3 text-center">
        <div className="relative grid h-25 w-25 justify-items-center justify-self-center">
          <div className="relative">
            <img
              src={projectLogo}
              alt="Project Logo"
              className="mask h-full bg-f9f9f9 object-cover object-center"
              onError={onImageLoadError}
              width={100}
              height={100}
            />

            <div className="mask-border absolute inset-0 bg-dadada" />
          </div>

          <div className="absolute bottom-1 right-4 z-10 grid rounded-full bg-ffffff p-[3px]">
            <Icon
              data={
                props.approval.meta?.validated ? verifiedSvg : unverifiedSvg
              }
              className={cn(
                "h-6 w-6",
                props.approval.meta?.validated ? "text-4940e0" : "text-dadada",
              )}
            />
          </div>
        </div>

        <div className="grid gap-y-1 text-14 text-777e90">
          <span className="font-semibold text-183c4a">
            {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
            {props.approval.meta?.project_name || "A Project"}
          </span>{" "}
          <span>wants to verify you are only doing this once</span>
        </div>

        {props.approval.meta?.description && (
          <div className="rounded-[8px] border border-f1f2f2 bg-f9f9f9 p-5 text-14 font-medium text-4940e0">
            {props.approval.meta.description}
          </div>
        )}

        {props.approval.request?.code && (
          <div className="text-10 text-777e90">
            {`Code: ${props.approval.request.code}`}
          </div>
        )}

        <div
          className={cn(
            "mt-1.5 text-12 leading-4",
            { "text-bbbec7": !isError },
            { "text-ff6471": isError },
          )}
        >
          {!isError && (
            <React.Fragment>
              <span>
                {`With this verification, ${
                  props.approval.meta?.project_name ?? "Project"
                } will be able to anonymously verify you’re a real person doing this only once. `}
              </span>
              <a
                href="https://id.worldcoin.org/docs/about/privacy"
                target="_blank"
                rel="noreferrer noopener"
                className="text-4940e0"
              >
                Learn more
              </a>
            </React.Fragment>
          )}

          {isError && (
            <>
              You have already verified your identity for this action.{" "}
              <b>For testing purposes</b>, you may still continue.
            </>
          )}
        </div>
      </div>

      <div className="grid gap-y-2">
        <Button
          onClick={verify}
          isDisabled={
            verificationState === VerificationState.Loading ||
            verificationState === VerificationState.Error ||
            verificationState === VerificationState.Success
          }
          className={cn(
            "flex max-h-full justify-center justify-self-center px-4.5 text-ffffff hover:opacity-70",
            {
              "w-full bg-4940e0":
                verificationState === VerificationState.Initial,
            },
            {
              "w-[56px] bg-4940e0":
                verificationState === VerificationState.Loading,
            },
            {
              "w-[56px] bg-4940e0/10":
                verificationState === VerificationState.Error,
            },
            {
              "w-full bg-4940e0/10":
                verificationState === VerificationState.TryAgain,
            },
            {
              "w-full bg-4940e0":
                verificationState === VerificationState.Success ||
                verificationState === VerificationState.AlreadyVerified,
            },
          )}
        >
          <span
            className={cn(
              "overflow-hidden truncate transition-all",
              {
                "invisible w-0 opacity-0":
                  verificationState === VerificationState.Loading,
              },
              {
                "invisible w-0 text-4940e0/30 opacity-0":
                  verificationState === VerificationState.Error,
              },
              {
                "w-full text-4940e0":
                  verificationState === VerificationState.TryAgain,
              },
            )}
          >
            {buttonText}
          </span>

          <Icon
            data={icon}
            className={cn(
              "h-5 w-5 transition-visibility/opacity",
              {
                "invisible w-0 opacity-0":
                  verificationState === VerificationState.Initial,
              },
              {
                "w-5 animate-spin":
                  verificationState === VerificationState.Loading,
              },
              {
                "w-5 text-4940e0":
                  verificationState === VerificationState.Error,
              },
              {
                "invisible w-0 opacity-0":
                  verificationState === VerificationState.TryAgain ||
                  verificationState === VerificationState.AlreadyVerified,
              },
            )}
          />
        </Button>

        <Button
          onClick={dismiss}
          className="text-777e90 hover:opacity-70"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
});

export default Verification;
