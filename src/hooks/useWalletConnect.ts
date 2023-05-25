import { verifySemaphoreProof } from "@/lib/proof";
import type { SignRequest, SignResponse } from "@/types";
import { CredentialType, ProofError } from "@/types";
import type { FullProof } from "@semaphore-protocol/proof";
import type { SignClientTypes } from "@walletconnect/types";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";
import { defaultAbiCoder as abi } from "ethers/lib/utils";
import { toast } from "react-toastify";

import { client, core } from "@/services/walletconnect";
import type { IModalStore } from "@/stores/modalStore";
import { useModalStore } from "@/stores/modalStore";
import { useCallback, useEffect, useRef } from "react";
import useIdentity from "./useIdentity";

function getHighestCredentialType(request: SignRequest): string {
  const {
    params: [{ credential_types }],
  } = request;

  // Orb credential always takes precedence over all other credential types
  return credential_types.includes("orb") ? "orb" : credential_types[0];
}

function buildResponse(
  id: number,
  request: SignRequest,
  fullProof: FullProof,
): SignResponse {
  const credential_type = getHighestCredentialType(request);

  return {
    id,
    jsonrpc: "2.0",
    result: {
      merkle_root: abi.encode(["uint256"], [fullProof.merkleTreeRoot]),
      nullifier_hash: abi.encode(["uint256"], [fullProof.nullifierHash]),
      proof: abi.encode(["uint256[8]"], [fullProof.proof]),
      credential_type,
    },
  };
}

const getStore = (store: IModalStore) => ({
  open: store.open,
  setOpen: store.setOpen,
});

export const useWalletConnect = (ready?: boolean) => {
  const { identity } = useIdentity();
  const identityRef = useRef(identity);
  const { open, setOpen } = useModalStore(getStore);

  async function approveRequest(
    topic: string,
    response: SignResponse,
  ): Promise<void> {
    await client.respondSessionRequest({
      topic,
      response,
    });
  }

  async function rejectRequest(
    topic: string,
    id: number,
    code: number,
    message: string,
  ): Promise<void> {
    await client.respondSessionRequest({
      topic,
      response: {
        id,
        jsonrpc: "2.0",
        error: {
          code,
          message,
        },
      },
    });
  }

  const onSessionProposal = useCallback(
    async (event: SignClientTypes.EventArguments["session_proposal"]) => {
      const { id, params } = event;
      const namespaces = buildApprovedNamespaces({
        proposal: params,
        supportedNamespaces: {
          eip155: {
            chains: ["eip155:1"],
            methods: ["world_id_v1"],
            events: ["accountsChanged"],
            accounts: ["eip155:1:0"],
          },
        },
      });

      try {
        await client.approveSession({
          id,
          namespaces,
        });
      } catch (error) {
        console.error(error);
        await client.rejectSession({
          id,
          reason: getSdkError("USER_REJECTED_METHODS"),
        });
      }
    },
    [],
  );

  const onSessionRequest = useCallback(
    async (
      event: SignClientTypes.EventArguments["session_request"],
    ): Promise<void> => {
      const { id, params, topic } = event;
      const { request } = params;

      const credentialType = getHighestCredentialType(request);

      let verification: { verified: boolean; fullProof: FullProof };

      if (identityRef.current) {
        try {
          verification = await verifySemaphoreProof(
            request,
            identityRef.current,
            credentialType === "orb"
              ? CredentialType.Orb
              : CredentialType.Phone, // TODO
          );
        } catch (error) {
          console.error(`Error verifying semaphore proof, ${error}`);
          if (error instanceof ProofError) {
            await rejectRequest(topic, id, error.code, error.message);
            return;
          } else {
            await rejectRequest(topic, id, -32602, "generic_error");
            return;
          }
        }

        // TODO: Move to UI layer
        if (verification.verified) {
          toast.success("Proof verified successfully");
        } else {
          toast.error("Proof verification failed");
        }

        const response = buildResponse(id, request, verification.fullProof);
        await approveRequest(topic, response);
      }
    },
    [],
  );

  const onSessionDisconnect = useCallback(
    async (
      event: SignClientTypes.EventArguments["session_delete"],
    ): Promise<void> => {
      const topics = Object.keys(client.getActiveSessions());

      if (topics.includes(event.topic)) {
        await disconnectSessions([event.topic]);
      }
    },
    [],
  );

  async function disconnectPairings(topics: string[]): Promise<void> {
    await Promise.all(
      topics.map((topic) => core.pairing.disconnect({ topic })),
    );
  }

  async function disconnectSessions(topics: string[]): Promise<void> {
    await Promise.all(
      topics.map((topic) =>
        client.disconnectSession({
          topic,
          reason: getSdkError("USER_DISCONNECTED"),
        }),
      ),
    );
  }

  // Setup event listeners
  useEffect(() => {
    if (ready) {
      client.on("session_proposal", onSessionProposal);
      client.on("session_request", onSessionRequest);
      client.on("session_delete", onSessionDisconnect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Keep identity up to date
  useEffect(() => {
    identityRef.current = identity;
  }, [identity]);

  return {
    disconnectPairings,
    disconnectSessions,
  };
};
