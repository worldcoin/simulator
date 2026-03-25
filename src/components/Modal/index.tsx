import { Drawer } from "@/components/Drawer";
import { Icon } from "@/components/Icon";
import useIdentity from "@/hooks/useIdentity";
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
import { Status } from "@/types";

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

    const identityIndex = parseInt(activeIdentity.id, 10);
    const isSession = !!bridgeInitialData.proof_request.session_id;
    const endpoint = isSession ? "proof/session" : "proof/uniqueness";

    try {
      const response = await fetch(`/api/sidecar/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity_index: identityIndex,
          proof_request: bridgeInitialData.proof_request,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as Record<string, unknown>;

        // Credential unavailable: respond to bridge with error
        if (errorData.error_code === "credential_unavailable") {
          await rejectRequestV4({ url, errorCode: "credential_unavailable" });
          setStatus(Status.Error);
          return;
        }

        console.error("Sidecar error:", errorData);
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
      setStatus(Status.Error);
    }
  }, [activeIdentity, bridgeInitialData, url, setStatus]);

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
                  App will see your
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#181818]">
                    <Icon
                      name="check"
                      className="size-3 text-white"
                    />
                  </span>
                  <span className="text-17 font-sora text-[#181818]">
                    Verification level
                  </span>
                </div>
              </div>
            </div>

            <ModalStatus
              status={status}
              hasProofRequest={!!bridgeInitialData?.proof_request}
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
