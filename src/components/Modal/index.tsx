import { Drawer } from "@/components/Drawer";
import { Icon } from "@/components/Icon";
import useIdentity from "@/hooks/useIdentity";
import {
  getIdentityProfile,
  serializeV4PersonaForSidecar,
} from "@/lib/identity-persona";
import {
  generateDummyMerkleProof,
  getFullProof,
  getMerkleProof,
} from "@/lib/proof";
import {
  approveRequest,
  approveRequestV4,
  rejectRequestV4,
} from "@/services/bridge";
import type { ModalStore } from "@/stores/modalStore";
import { useModalStore } from "@/stores/modalStore";
import { Status, type BridgeIdentityAttribute } from "@/types";

import { VerificationLevel } from "@worldcoin/idkit-core";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import ModalConfirm from "./ModalConfirm";
import ModalEnvironment from "./ModalEnvironment";
import ModalError from "./ModalError";
import ModalLoading from "./ModalLoading";
import { ModalStatus } from "./ModalStatus";

const getStore = (store: ModalStore) => ({
  open: store.open,
  setOpen: store.setOpen,
  status: store.status,
  setStatus: store.setStatus,
  errorCode: store.errorCode,
  metadata: store.metadata,
  bridgeInitialData: store.bridgeInitialData,
  url: store.url,
  reset: store.reset,
});

export function Modal() {
  const { activeIdentity, generateIdentityProofsIfNeeded } = useIdentity();
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    open,
    setOpen,
    status,
    setStatus,
    errorCode,
    bridgeInitialData,
    url,
    metadata,
    reset,
  } = useModalStore(getStore);

  const close = useCallback(() => {
    setOpen(false);
    setShowConfirm(false);
    reset();
  }, [reset, setOpen]);

  const isLoading = useMemo(() => {
    return status === Status.Loading;
  }, [status]);
  const isProductionRequest = bridgeInitialData?.environment === "production";
  const showStagingContent = !isProductionRequest && metadata?.is_staging;
  const showEnvironmentError =
    !isLoading && !showStagingContent && status != Status.Error;
  const requestedIdentityAttributes = bridgeInitialData?.identity_attributes;
  const identityCheckAttributes = Array.isArray(requestedIdentityAttributes)
    ? requestedIdentityAttributes
    : null;
  const isIdentityCheck = identityCheckAttributes !== null;

  // v3 proof flow (existing)
  const handleClick = useCallback(
    async (
      malicious?: boolean,
      verification_level: VerificationLevel = VerificationLevel.Orb,
    ) => {
      if (!activeIdentity) return;

      setStatus(Status.Pending);

      await generateIdentityProofsIfNeeded(activeIdentity);

      if (!bridgeInitialData) {
        setStatus(Status.Error);
        return console.error("No bridge initial data");
      }

      // Show additional warning if the identity is unverified or still pending inclusion
      if (!showConfirm && !activeIdentity.verified[verification_level]) {
        setShowConfirm(true);
        return;
      }
      // Generate proofs
      const merkleProof = malicious
        ? generateDummyMerkleProof(activeIdentity)
        : getMerkleProof(activeIdentity, verification_level);

      const { verified, fullProof } = await getFullProof(
        {
          ...bridgeInitialData,
          verification_level,
        },
        activeIdentity,
        merkleProof,
      );

      if (!verified) {
        setStatus(Status.Error);
        return console.error("Not verified");
      }

      if (url) {
        setShowConfirm(false);

        const approveResult = await approveRequest({
          url,
          fullProof,
          verificationLevel: verification_level,
        });

        if (!approveResult.success) {
          setStatus(Status.Error);
          return console.error(approveResult.error);
        }

        setStatus(Status.Success);
      } else {
        console.error("Something went wrong");
        setStatus(Status.Error);
      }
    },
    [
      activeIdentity,
      bridgeInitialData,
      setStatus,
      showConfirm,
      url,
      generateIdentityProofsIfNeeded,
    ],
  );

  // v4 proof flow: calls sidecar, sends response (or error) to bridge
  const handleV4Click = useCallback(async () => {
    if (!activeIdentity || !bridgeInitialData?.proof_request || !url) {
      setStatus(Status.Error);
      return;
    }

    setStatus(Status.Pending);

    const profile = getIdentityProfile(activeIdentity);
    const proofType = bridgeInitialData.proof_request.proof_type;
    const isSession =
      proofType === "create_session" ||
      proofType === "session" ||
      (proofType == null && !!bridgeInitialData.proof_request.session_id);
    const endpoint = isSession ? "proof/session" : "proof/uniqueness";

    try {
      const response = await fetch(`/api/sidecar/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof_request: bridgeInitialData.proof_request,
          ...(identityCheckAttributes !== null && {
            identity_attributes: identityCheckAttributes,
            persona: serializeV4PersonaForSidecar(profile.v4Persona),
          }),
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as Record<string, unknown>;
        const errorCode =
          typeof errorData.error_code === "string"
            ? errorData.error_code
            : null;

        // Sidecar surfaces request/proof errors as 4xx with a structured
        // `error_code` (e.g. `invalid_rp_signature`, `credential_unavailable`).
        // Forward to the bridge so IDKit renders the actual failure to the
        // dapp user, then close the drawer silently.
        if (response.status >= 400 && response.status < 500 && errorCode) {
          console.warn(
            "Sidecar request error, forwarding to bridge:",
            errorCode,
          );
          const rejectResult = await rejectRequestV4({ url, errorCode });
          if (!rejectResult.success) {
            setStatus(Status.Error);
            return console.error(rejectResult.error);
          }
          close();
          return;
        }

        // 5xx or unstructured failure: real internal error, surface the modal.
        console.error("Sidecar error:", errorData);
        await rejectRequestV4({ url, errorCode: "generic_error" });
        setStatus(Status.Error);
        return;
      }

      const proofResponse = (await response.json()) as Record<string, unknown>;

      // Send v4 ProofResponse to bridge
      const bridgeResult = await approveRequestV4({ url, proofResponse });

      if (!bridgeResult.success) {
        setStatus(Status.Error);
        return console.error(bridgeResult.error);
      }

      setStatus(Status.Success);
    } catch (error) {
      console.error("V4 proof generation failed:", error);
      await rejectRequestV4({ url, errorCode: "generic_error" });
      setStatus(Status.Error);
    }
  }, [
    activeIdentity,
    bridgeInitialData,
    close,
    identityCheckAttributes,
    setStatus,
    url,
  ]);

  return (
    <Drawer
      open={open}
      onClose={close}
      className={
        showStagingContent || showEnvironmentError ? "pb-8" : undefined
      }
    >
      {!isLoading && status == Status.Error && (
        <ModalError
          errorCode={errorCode}
          close={close}
        />
      )}
      {!isLoading &&
        !showConfirm &&
        showStagingContent &&
        status != Status.Error && (
          <div className="flex w-full flex-col gap-6">
            <div className="flex items-start justify-between">
              <div className="flex size-[52px] items-center justify-center overflow-hidden rounded-16 bg-gray-900">
                {metadata.verified_app_logo ? (
                  <Image
                    src={metadata.verified_app_logo}
                    alt={metadata.name ?? "App logo"}
                    width={52}
                    height={52}
                    className="size-full object-cover"
                  />
                ) : (
                  <Icon
                    name="question"
                    className="size-8 text-white"
                  />
                )}
              </div>
              <button
                className="flex"
                onClick={close}
              >
                <Icon
                  name="close"
                  className="size-6 text-black"
                  bgClassName="h-9 w-9 rounded-full bg-gray-200"
                />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="font-sora text-26 font-semibold tracking-[-0.01em] text-[#181818]">
                  Verify with World ID
                </h2>
                <div className="inline-flex items-center gap-1">
                  <span className="text-17 font-sora text-[#717680]">
                    to {metadata.name ?? "App Name"}
                  </span>
                  {metadata.is_verified ? (
                    <Icon
                      name="badge-verified"
                      className="size-5 text-[#005CFF]"
                    />
                  ) : (
                    <Icon
                      name="badge-not-verified"
                      className="size-5 text-gray-500"
                    />
                  )}
                </div>
              </div>

              <hr className="h-px w-full rounded-full bg-gray-200" />

              <div className="flex flex-col gap-3">
                <p className="font-sora text-15 text-[#717680]">
                  {isIdentityCheck
                    ? "App will learn whether"
                    : "App will see your"}
                </p>
                {identityCheckAttributes !== null ? (
                  <>
                    {(identityCheckAttributes.length > 0
                      ? identityCheckAttributes
                      : [null]
                    ).map((attribute, index) => (
                      <div
                        key={
                          attribute
                            ? `${attribute.type}-${index}`
                            : "document-backed-identity"
                        }
                        className="flex items-start gap-2"
                      >
                        <CheckIcon />
                        <span className="font-sora text-b2 text-[#181818]">
                          {attribute
                            ? formatIdentityAttribute(attribute)
                            : "A document-backed identity is available"}
                        </span>
                      </div>
                    ))}
                    <p className="font-sora text-b4 text-[#717680]">
                      Your underlying document data is not shared.
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckIcon />
                    <span className="font-sora text-b2 text-[#181818]">
                      Verification level
                    </span>
                  </div>
                )}
              </div>
            </div>

            <ModalStatus
              status={status}
              hasProofRequest={!!bridgeInitialData?.proof_request}
              forceV4={isIdentityCheck}
              handleClick={(malicious, verification_level) =>
                void handleClick(malicious, verification_level)
              }
              handleV4Click={() => void handleV4Click()}
            />
          </div>
        )}
      {isLoading && <ModalLoading />}
      {showEnvironmentError && <ModalEnvironment />}

      {!isLoading && showConfirm && (
        <ModalConfirm handleClick={() => void handleClick()} />
      )}
    </Drawer>
  );
}

function CheckIcon() {
  return (
    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#181818]">
      <Icon
        name="check"
        className="size-3 text-white"
      />
    </span>
  );
}

function formatIdentityAttribute(attribute: BridgeIdentityAttribute): string {
  switch (attribute.type) {
    case "document_type":
      return `Document type is ${
        attribute.value === "eid"
          ? "eID"
          : attribute.value === "mnc"
          ? "MNC"
          : "Passport"
      }`;
    case "document_number":
      return `Document number matches ${attribute.value}`;
    case "issuing_country":
      return `Issuing country is ${attribute.value.toUpperCase()}`;
    case "full_name":
      return `Full name matches ${attribute.value}`;
    case "minimum_age":
      return `Age is ${attribute.value} or older`;
    case "nationality":
      return `Nationality is ${attribute.value.toUpperCase()}`;
  }
}
