import type { WalletConnectFlow } from "@/types";
import type { Identity } from "@/types/identity";
import { defaultAbiCoder as abi } from "@ethersproject/abi";
import { ErrorCodes } from "@worldcoin/id";
import type { Proof, SemaphorePublicSignals } from "@zk-kit/protocols";
import { Semaphore } from "@zk-kit/protocols";
import React from "react";
import verificationKey from "semaphore/verification_key.json";
import { AlreadyVerified } from "./AlreadyVerified";
import { Error } from "./Error";
import { Success } from "./Success";
import { Verify } from "./Verify";
import { Verifying } from "./Verifying";

enum VerificationState {
  Initial,
  Loading,
  AlreadyVerified,
  Error,
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

  const handleReset = React.useCallback(() => {
    setVerificationState(VerificationState.Initial);
  }, []);

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

  return (
    <div className="px-6">
      {verificationState === VerificationState.Initial && (
        <Verify
          meta={props.approval.meta}
          onDismiss={dismiss}
          onVerify={verify}
        />
      )}

      {verificationState === VerificationState.Loading && <Verifying />}

      {verificationState === VerificationState.AlreadyVerified && (
        <AlreadyVerified
          onContinue={verify}
          onDismiss={dismiss}
          description={props.approval.meta?.description}
        />
      )}

      {verificationState === VerificationState.Error && (
        <Error
          onTryAgain={handleReset}
          onDismiss={dismiss}
        />
      )}

      {verificationState === VerificationState.Success && (
        <Success
          onDismiss={dismiss}
          description={props.approval.meta?.description}
        />
      )}
    </div>
  );
});

export default Verification;
