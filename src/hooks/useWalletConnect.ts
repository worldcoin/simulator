import getFullProof from "@/lib/proof";
import { fetchMetadata } from "@/services/metadata";
import { client, core } from "@/services/walletconnect";
import type { IModalStore } from "@/stores/modalStore";
import { useModalStore } from "@/stores/modalStore";
import type { MetadataParams, SessionEvent, SignResponse } from "@/types";
import { CredentialType, ProofError, Status } from "@/types";
import type { FullProof } from "@semaphore-protocol/proof";
import type { SignClientTypes } from "@walletconnect/types";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";
import { defaultAbiCoder as abi } from "ethers/lib/utils";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import useIdentity from "./useIdentity";

function getHighestCredentialType(
  credentialTypes: CredentialType[],
): CredentialType {
  // Orb credential always takes precedence over all other credential types
  return credentialTypes.includes(CredentialType.Orb)
    ? CredentialType.Orb
    : CredentialType.Phone; // TODO: Add support for arbitrary number of credential types
}

function buildResponse(
  id: number,
  fullProof: FullProof,
  credential_type: CredentialType,
): SignResponse {
  const proof = fullProof.proof as [
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
  ];

  return {
    id,
    jsonrpc: "2.0",
    result: {
      merkle_root: abi.encode(
        ["uint256"],
        [fullProof.merkleTreeRoot as bigint],
      ),
      nullifier_hash: abi.encode(
        ["uint256"],
        [fullProof.nullifierHash as bigint],
      ),
      proof: abi.encode(["uint256[8]"], [proof]),
      credential_type,
    },
  };
}

const getStore = (store: IModalStore) => ({
  setOpen: store.setOpen,
  setStatus: store.setStatus,
  setMetadata: store.setMetadata,
  setEvent: store.setEvent,
  reset: store.reset,
});

export const useWalletConnect = (ready?: boolean) => {
  const { identity } = useIdentity();
  const identityRef = useRef(identity);
  const { setOpen, setStatus, setMetadata, setEvent, reset } =
    useModalStore(getStore);

  async function approveRequest(
    event: SessionEvent,
    credentialTypes: CredentialType[],
  ): Promise<void> {
    // Destructure session request
    const {
      id,
      topic,
      params: { request },
    }: SessionEvent = event;
    const credentialType = getHighestCredentialType(credentialTypes);
    let verification: { verified: boolean; fullProof: FullProof };

    // Show pending modal
    if (!credentialTypes.length) {
      setStatus(Status.Error);
      await rejectRequest(topic, id, -32602, "generic_error");
      return;
    }
    setStatus(Status.Pending);

    // Generate zero knowledge proof locally
    if (!identity) {
      await rejectRequest(topic, id, -32602, "generic_error");
      return;
    }

    try {
      verification = await getFullProof(request, identity, credentialType);
    } catch (error) {
      console.error(`Error verifying semaphore proof, ${error}`);
      if (error instanceof ProofError) {
        return;
      } else {
        await rejectRequest(topic, id, -32602, "generic_error");
        return;
      }
    }

    // Show success or error modal
    if (verification.verified) {
      toast.success("Proof verified successfully");
      setStatus(Status.Success);
    } else {
      toast.error("Proof verification failed");
      setStatus(Status.Error);
    }

    // Send response to dapp
    const response = buildResponse(id, verification.fullProof, credentialType);
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
      // Show loading modal
      reset();
      setStatus(Status.Loading);
      setOpen(true);

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
      // Destructure session request
      const {
        id,
        topic,
        params: { request },
      }: SessionEvent = event;
      setEvent(event);

      // Fetch metadata for the request
      const params: MetadataParams = { ...request.params[0] };
      const metadata = await fetchMetadata(params);
      setMetadata(metadata);
      setStatus(Status.Waiting);

      // Reject session if application is not staging
      if (!metadata.is_staging) {
        await rejectRequest(topic, id, -32602, "generic_error");
        return;
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
        setEvent(null); // TODO: Needed?
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
    approveRequest,
    disconnectPairings,
    disconnectSessions,
  };
};
