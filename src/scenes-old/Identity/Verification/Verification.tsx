import verificationKey from "@/public/semaphore/verification_key.json";
import type { WalletConnectFlow } from "@/types";
import type { Identity } from "@/types/identity";
import { ErrorCodes } from "@worldcoin/id";
import type { Proof, SemaphorePublicSignals } from "@zk-kit/protocols";
import { defaultAbiCoder as abi } from "ethers/lib/utils";
import React from "react";
import { AlreadyVerified } from "./AlreadyVerified";
import { Error } from "./Error";
import { Success } from "./Success";
import { Verify } from "./Verify";
import { Verifying } from "./Verifying";

// FIXME
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-var-requires
const Semaphore = require("@zk-kit/protocols").Semaphore;

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

  const dismiss = React.useCallback(async () => {
    const { client, request } = props.approval;
    if (client && request) {
      try {
        await client.reject({
          id: request.id,
          reason: {
            code: -32100,
            message: ErrorCodes.VerificationRejected,
          },
        });
      } catch (error) {}
    }
    if (client) {
      props.dismiss();
    }
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
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
      const { client, request } = props.approval;
      if (!client || !request) {
        console.error("client or request undefined", props.approval);
        setVerificationState(VerificationState.Error);
        return;
      }

      client.on("session_delete", () => {
        setVerificationState(VerificationState.Success);
      });

      try {
        const { fullProof, merkleProof } = props.approval;

        if (!fullProof || !merkleProof) {
          setVerificationState(VerificationState.Error);
          return;
        }

        await verifyProof(fullProof.proof, fullProof.publicSignals);

        // Emits 'No matching key' error, https://github.com/WalletConnect/walletconnect-monorepo/issues/1514
        await new Promise((r) => setTimeout(r, 1000));
        await client.respond({
          topic: request.topic,
          response: {
            id: request.id,
            jsonrpc: "2.0",
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
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                [Semaphore.packToSolidityProof(fullProof.proof)],
              ),
              credential_type: "orb",
            },
          },
        });
      } catch (err) {
        console.error(err);
        setVerificationState(VerificationState.Error);

        await client.reject({
          id: request.id,
          reason: {
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
          onDismiss={() => void dismiss()}
          onVerify={verify}
        />
      )}

      {verificationState === VerificationState.Loading && <Verifying />}

      {verificationState === VerificationState.AlreadyVerified && (
        <AlreadyVerified
          onContinue={verify}
          onDismiss={() => void dismiss()}
          description={props.approval.meta?.description}
        />
      )}

      {verificationState === VerificationState.Error && (
        <Error
          onTryAgain={handleReset}
          onDismiss={() => void dismiss()}
        />
      )}

      {verificationState === VerificationState.Success && (
        <Success
          onDismiss={() => void dismiss()}
          description={props.approval.meta?.description}
        />
      )}
    </div>
  );
});

export default Verification;
