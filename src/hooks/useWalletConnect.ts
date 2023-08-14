import getFullProof from "@/lib/proof";
import { encode } from "@/lib/utils";
import { fetchMetadata } from "@/services/metadata";
import { client, core } from "@/services/walletconnect";
import type { ModalStore } from "@/stores/modalStore";
import { useModalStore } from "@/stores/modalStore";
import type {
  Identity,
  MetadataParams,
  SessionEvent,
  SignRequest,
  SignResponse,
  Verification,
} from "@/types";
import { Chain, CredentialType, Status } from "@/types";
import type { FullProof } from "@semaphore-protocol/proof";
import type { SignClientTypes } from "@walletconnect/types";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";
import { useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { encodePacked } from "viem";
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
  chain: Chain,
  credential_type: CredentialType,
  fullProof: FullProof,
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
      merkle_root: encodePacked(
        ["uint256"],
        [fullProof.merkleTreeRoot as bigint],
      ),
      nullifier_hash: encodePacked(
        ["uint256"],
        [fullProof.nullifierHash as bigint],
      ),
      proof: encodePacked(["uint256[8]"], [proof]),
      credential_type,
      chain,
    },
  };
}

async function generateProof(identity: Identity, request: SignRequest) {
  const {
    params: [{ credential_types }],
  } = request;
  const credentialType = getHighestCredentialType(credential_types);

  let verification: Verification;
  try {
    verification = await getFullProof(request, identity, credentialType);
  } catch (error) {
    console.error(`Error verifying semaphore proof, ${error}`);
    throw error;
  }

  return verification;
}

async function rejectRequest(
  id: number,
  topic: string,
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

const getStore = (store: ModalStore) => ({
  setOpen: store.setOpen,
  setStatus: store.setStatus,
  metadata: store.metadata,
  setMetadata: store.setMetadata,
  setEvent: store.setEvent,
  verification: store.verification,
  setVerification: store.setVerification,
  reset: store.reset,
});

export const useWalletConnect = (ready?: boolean) => {
  const { activeIdentity, generateIdentityProofsIfNeeded } = useIdentity();
  const {
    setOpen,
    setStatus,
    metadata,
    setMetadata,
    setEvent,
    verification,
    setVerification,
    reset,
  } = useModalStore(getStore);
  const identityRef = useRef(activeIdentity);
  const metadataRef = useRef(metadata);

  async function approveRequest(
    event: SessionEvent,
    credentialTypes: CredentialType[],
  ): Promise<void> {
    // Destructure session request
    const { id, topic }: SessionEvent = event;
    const credentialType = getHighestCredentialType(credentialTypes);

    console.log(
      `approveRequest: id=${id}, topic=${topic} credentialType=${credentialType}`,
    );

    // Show error if identity, verification, or credential types are missing
    setStatus(Status.Pending);
    if (!identityRef.current || !verification || !credentialTypes.length) {
      setTimeout(() => setStatus(Status.Error), 1000);
      await rejectRequest(id, topic, -32602, "generic_error");
      return;
    }

    // Show warning if user has verified before
    if (metadataRef.current?.can_user_verify === "no") {
      setTimeout(() => setStatus(Status.Warning), 1000);
      await rejectRequest(id, topic, -32602, "generic_error");
      return;
    }

    // Send response to dapp
    const response = buildResponse(
      id,
      Chain.Polygon,
      credentialType,
      verification.fullProof,
    );
    console.log("sending response", response);
    await client.respondSessionRequest({
      topic,
      response,
    });
    console.log("response sent");
    setTimeout(() => setStatus(Status.Success), 1000);
  }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      try {
        if (!identityRef.current) {
          throw new Error("Identity not found");
        }

        // Generate proof
        await generateIdentityProofsIfNeeded(identityRef.current);

        // Generate zero knowledge proof locally
        const verification = await generateProof(identityRef.current, request);
        if (!verification.verified) {
          throw new Error("Proof verification failed");
        }

        // Fetch metadata for the request
        const {
          fullProof: { nullifierHash },
        } = verification;
        const params: MetadataParams = {
          ...request.params[0],
          nullifier_hash: encode(BigInt(nullifierHash)),
        };

        const metadata = await fetchMetadata(params);
        console.log("metadata", metadata);
        if (!metadata.is_staging) {
          throw new Error("Application is not staging");
        }

        toast.success("Proof verified successfully");
        setMetadata(metadata);
        setVerification(verification);
        setStatus(Status.Waiting);
      } catch (error) {
        toast.error((error as Error).message);
        setStatus(Status.Error);
        await rejectRequest(id, topic, -32602, "generic_error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Setup event listeners
  useEffect(() => {
    if (ready) {
      client.on("session_proposal", (e) => void onSessionProposal(e));
      client.on("session_request", (e) => void onSessionRequest(e));
      client.on("session_delete", (e) => void onSessionDisconnect(e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Keep identity up to date
  useEffect(() => {
    identityRef.current = activeIdentity;
  }, [activeIdentity]);

  // Keep metadata up to date
  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  return {
    approveRequest,
    disconnectPairings,
    disconnectSessions,
  };
};
