import getFullProof from "@/lib/proof";
import {
  buffer_decode,
  decryptRequest,
  encode,
  encryptResponse,
} from "@/lib/utils";
import { fetchMetadata } from "@/services/metadata";
import type { ModalStore } from "@/stores/modalStore";
import { useModalStore } from "@/stores/modalStore";
import type {
  Identity,
  MetadataParams,
  SignResponse,
  Verification,
} from "@/types";
import { CredentialType, Status } from "@/types";
import type { FullProof } from "@semaphore-protocol/proof";
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
  };
}

async function generateProof(
  identity: Identity,
  request: Pick<
    MetadataParams,
    "credential_types" | "external_nullifier" | "signal"
  >,
) {
  const { credential_types } = request;
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

const getStore = (store: ModalStore) => ({
  iv: store.iv,
  setOpen: store.setOpen,
  setStatus: store.setStatus,
  metadata: store.metadata,
  setRequest: store.setRequest,
  setMetadata: store.setMetadata,
  verification: store.verification,
  setVerification: store.setVerification,
  reset: store.reset,
  key: store.key,
  request: store.request,
  bridgeUrl: store.bridgeUrl,
  requestId: store.requestId,
  setIv: store.setIv,
});

export const useBridge = () => {
  const { activeIdentity, generateIdentityProofsIfNeeded } = useIdentity();
  const {
    iv,
    setOpen,
    setStatus,
    metadata,
    setMetadata,
    key,
    setIv,
    request,
    bridgeUrl,
    requestId,
    setRequest,
    verification,
    setVerification,
  } = useModalStore(getStore);
  const identityRef = useRef(activeIdentity);

  const sendResponse = useCallback(
    async (response: SignResponse | { error_code: string }) => {
      const res = await fetch(`${bridgeUrl}/response/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: await encryptResponse(key!, iv!, JSON.stringify(response)),
      });

      if (!res.ok) {
        throw new Error("Failed to send response");
      }
    },
    [key, iv, bridgeUrl, requestId],
  );

  const declineRequest = useCallback(async () => {
    await sendResponse({ error_code: "verification_rejected" });
  }, [sendResponse]);

  async function approveRequest(
    credentialTypes: CredentialType[],
  ): Promise<void> {
    const credentialType = getHighestCredentialType(credentialTypes);

    console.log(
      `approveRequest: id=${requestId} credentialType=${credentialType}`,
    );

    // Show error if identity, verification, or credential types are missing
    setStatus(Status.Pending);
    if (!identityRef.current || !verification || !credentialTypes.length) {
      setTimeout(() => setStatus(Status.Error), 1000);
      await sendResponse({ error_code: "generic_error" });
      return;
    }

    // Show warning if user has verified before
    if (metadata?.can_user_verify === "no") {
      setTimeout(() => setStatus(Status.Warning), 1000);
      await sendResponse({ error_code: "max_verifications_reached" });
      return;
    }

    // Send response to dapp
    const response = buildResponse(credentialType, verification.fullProof);
    console.log("sending response", response);
    await sendResponse(response);
    console.log("response sent");
    setTimeout(() => setStatus(Status.Success), 1000);
  }

  const retrieveRequest = useCallback(async (): Promise<void> => {
    setOpen(true);
    setStatus(Status.Loading);

    const response = await fetch(`${bridgeUrl}/request/${requestId}`);
    if (!response.ok) {
      throw new Error("Request not found");
    }

    const { iv: encoded_iv, payload } = (await response.json()) as {
      iv: string;
      payload: string;
    };

    const iv = buffer_decode(encoded_iv);
    setIv(iv);

    try {
      setRequest(
        JSON.parse(await decryptRequest(key!, iv, payload)) as MetadataParams,
      );
    } catch {
      setStatus(Status.Error);
      await sendResponse({ error_code: "malformed_request" });
    }
  }, [key, bridgeUrl, requestId]);

  const onSessionRequest = useCallback(
    async (request: MetadataParams): Promise<void> => {
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
          ...request,
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

        await sendResponse({ error_code: (error as Error).message });
      }
    },
    [sendResponse],
  );

  useEffect(() => {
    if (!requestId) return;

    void retrieveRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  useEffect(() => {
    if (!request) return;

    void onSessionRequest(request);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  // Keep identity up to date
  useEffect(() => {
    identityRef.current = activeIdentity;
  }, [activeIdentity]);

  return {
    approveRequest,
    declineRequest,
  };
};
