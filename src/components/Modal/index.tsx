import Button from "@/components/Button";
import { Drawer } from "@/components/Drawer";
import { AssetIcon, Icon } from "@/components/Icon";
import useIdentity from "@/hooks/useIdentity";
import { CREDENTIAL_PILL_ART, PROOF_ART, WORLD_ID_ICONS } from "@/lib/assets";
import type { CredentialDefinition } from "@/lib/credentials";
import { credentialForLevel, credentialsForIdentity } from "@/lib/credentials";
import {
  generateDummyMerkleProof,
  getFullProof,
  getMerkleProof,
} from "@/lib/proof";
import { cn } from "@/lib/utils";
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
import { useCallback, useEffect, useMemo, useState } from "react";
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

/** 64pt relying-party logo with World App's blue verified badge. */
function AppLogo(props: { src?: string; name?: string; verified?: boolean }) {
  const initials =
    (props.name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "?";

  return (
    <span className="relative inline-flex size-16 shrink-0">
      {props.src ? (
        <Image
          src={props.src}
          alt={props.name ?? "App logo"}
          width={64}
          height={64}
          className="size-16 rounded-full bg-surface-tertiary object-cover"
        />
      ) : (
        <span className="flex size-16 items-center justify-center rounded-full bg-surface-tertiary text-h3 text-fg-primary">
          {initials}
        </span>
      )}
      {props.verified && (
        <AssetIcon
          src={WORLD_ID_ICONS.checkBadge}
          noMask
          label="Verified app"
          bgClassName="absolute -bottom-1 -right-1 size-[22px] rounded-full bg-surface-primary p-0.5"
          className="size-full"
        />
      )}
    </span>
  );
}

function CredentialPill(props: {
  credential: CredentialDefinition;
  selected: boolean;
  selectable: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role={props.selectable ? "radio" : undefined}
      aria-checked={props.selectable ? props.selected : undefined}
      disabled={!props.selectable}
      onClick={props.onSelect}
      className={cn(
        "inline-flex items-center gap-[7px] rounded-8 border py-1.5 pl-2 pr-2.5 text-b2 text-fg-primary transition-colors",
        props.selected
          ? "border-stroke-primary bg-surface-primary"
          : "border-grey-100 bg-grey-50",
        { "opacity-60": props.selectable && !props.selected },
      )}
    >
      <Image
        src={CREDENTIAL_PILL_ART[props.credential.kind]}
        alt=""
        width={20}
        height={20}
        className="size-5 rounded-full"
      />
      {props.credential.pill}
    </button>
  );
}

function SegmentButton(props: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={props.active}
      onClick={props.onClick}
      className={cn(
        "flex-1 rounded-full px-3 py-1.5 text-l3 transition-colors",
        props.active
          ? "bg-surface-inverse text-fg-inverse"
          : "text-fg-secondary",
      )}
    >
      {props.children}
    </button>
  );
}

export function Modal() {
  const { activeIdentity, generateIdentityProofsIfNeeded } = useIdentity();
  const [showConfirm, setShowConfirm] = useState(false);
  const [level, setLevel] = useState<VerificationLevel>(VerificationLevel.Orb);
  const [useV4, setUseV4] = useState(false);

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

  // Default to what the app asked for; the tester can still switch credentials.
  useEffect(() => {
    setLevel(bridgeInitialData?.verification_level ?? VerificationLevel.Orb);
    setUseV4(!!bridgeInitialData?.proof_request);
  }, [bridgeInitialData]);

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
  const hasProofRequest = !!bridgeInitialData?.proof_request;

  const requested = useMemo(() => credentialForLevel(level), [level]);
  const pills = useMemo(() => {
    const available = credentialsForIdentity(activeIdentity);
    return available.length > 0 ? available : [requested];
  }, [activeIdentity, requested]);
  const selectable = !useV4 && status === Status.Waiting && pills.length > 1;
  // Prefer the Developer Portal copy; fall back to the description in the request.
  const actionDescription = [
    metadata?.action?.description,
    bridgeInitialData?.action_description,
  ].find((text) => !!text);

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
          identity_index: identityIndex,
          proof_request: bridgeInitialData.proof_request,
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
          await rejectRequestV4({ url, errorCode });
          close();
          return;
        }

        // 5xx or unstructured failure: real internal error, surface the modal.
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
  }, [activeIdentity, bridgeInitialData, url, setStatus, close]);

  const handleContinue = useCallback(() => {
    if (useV4) void handleV4Click();
    else void handleClick(false, level);
  }, [handleClick, handleV4Click, level, useV4]);

  return (
    <Drawer
      open={open}
      onClose={close}
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
              <AppLogo
                src={metadata.verified_app_logo}
                name={metadata.name}
                verified={metadata.is_verified}
              />
              <Button
                variant="tertiary"
                size={36}
                iconOnly
                aria-label="Close"
                onClick={close}
              >
                <Icon
                  name="xmark"
                  className="size-6"
                />
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-h3 text-fg-primary">Complete verification</h2>
              <div
                className="flex flex-wrap gap-2"
                role={selectable ? "radiogroup" : undefined}
                aria-label={selectable ? "Credential to present" : undefined}
              >
                {pills.map((credential) => (
                  <CredentialPill
                    key={credential.kind}
                    credential={credential}
                    selected={credential.level === level}
                    selectable={selectable}
                    onSelect={() => setLevel(credential.level)}
                  />
                ))}
              </div>
            </div>

            <hr className="border-0 border-t border-stroke-tertiary" />

            <div className="flex flex-col gap-4">
              <p className="text-b2 text-grey-500">
                {metadata.name ?? "This app"} will see these proofs
              </p>
              <ul className="flex flex-col gap-3">
                <li className="flex items-start gap-2">
                  <Image
                    src={PROOF_ART[requested.proofArt]}
                    alt=""
                    width={20}
                    height={20}
                    className="mt-0.5 size-5 rounded-4"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-b2 text-fg-primary">
                      {requested.proof}
                    </span>
                    {actionDescription && (
                      <span className="text-b3 text-fg-tertiary">
                        {actionDescription}
                      </span>
                    )}
                  </div>
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <ModalStatus
                status={status}
                onCancel={close}
                onContinue={handleContinue}
              />
            </div>

            {status === Status.Waiting && (
              <div className="flex flex-col items-center gap-3 border-t border-stroke-tertiary pt-4">
                <p className="text-c1 uppercase tracking-[0.04em] text-fg-tertiary">
                  Simulator options
                </p>
                {hasProofRequest && (
                  <div
                    role="radiogroup"
                    aria-label="Proof protocol"
                    className="flex w-full rounded-full bg-surface-secondary p-1"
                  >
                    <SegmentButton
                      active={!useV4}
                      onClick={() => setUseV4(false)}
                    >
                      Legacy v3 proof
                    </SegmentButton>
                    <SegmentButton
                      active={useV4}
                      onClick={() => setUseV4(true)}
                    >
                      World ID 4.0
                    </SegmentButton>
                  </div>
                )}
                {!useV4 && (
                  <button
                    type="button"
                    className="text-b3 text-fg-tertiary underline underline-offset-2"
                    onClick={() => void handleClick(true, level)}
                  >
                    Send an invalid proof
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      {isLoading && <ModalLoading />}
      {showEnvironmentError && <ModalEnvironment close={close} />}

      {!isLoading && showConfirm && (
        <ModalConfirm
          handleClick={() => void handleClick(false, level)}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </Drawer>
  );
}
