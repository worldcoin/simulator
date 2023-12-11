import { Checkbox } from "@/components/Checkbox";
import { Drawer } from "@/components/Drawer";
import { Icon } from "@/components/Icon";
import { IconGradient } from "@/components/Icon/IconGradient";
import Item from "@/components/Item";
import useIdentity from "@/hooks/useIdentity";
import { getFullProof } from "@/lib/proof";
import { cn } from "@/lib/utils";
import { approveRequest } from "@/services/bridge";
import type { ModalStore } from "@/stores/modalStore";
import { useModalStore } from "@/stores/modalStore";
import { Status } from "@/types";
import { CredentialType } from "@worldcoin/idkit-core";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import ModalConfirm from "./ModalConfirm";
import ModalEnvironment from "./ModalEnvironment";
import ModalLoading from "./ModalLoading";
import { ModalStatus } from "./ModalStatus";
import Warning from "./ModalWarning";

const getStore = (store: ModalStore) => ({
  open: store.open,
  setOpen: store.setOpen,
  status: store.status,
  setStatus: store.setStatus,
  metadata: store.metadata,
  bridgeInitialData: store.bridgeInitialData,
  url: store.url,
  reset: store.reset,
});

export function Modal() {
  const { activeIdentity } = useIdentity();
  const [showConfirm, setShowConfirm] = useState(false);

  const [biometricsChecked, setBiometricsChecked] = useState<
    boolean | "indeterminate"
  >(activeIdentity?.verified[CredentialType.Orb] ?? false);

  const [deviceChecked, setDeviceChecked] = useState<boolean | "indeterminate">(
    activeIdentity?.verified[CredentialType.Device] ?? false,
  );

  const {
    open,
    setOpen,
    status,
    setStatus,
    bridgeInitialData,
    url,
    metadata,
    reset,
  } = useModalStore(getStore);

  const close = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset, setOpen]);

  const isLoading = useMemo(() => {
    return status === Status.Loading;
  }, [status]);

  const isVerified = useMemo(() => {
    const orbVerified =
      biometricsChecked && activeIdentity?.verified[CredentialType.Orb];

    const phoneVerified =
      deviceChecked && activeIdentity?.verified[CredentialType.Device];

    const isVerified = orbVerified ?? phoneVerified;
    return isVerified;
  }, [biometricsChecked, activeIdentity?.verified, deviceChecked]);

  const handleClick = useCallback(async () => {
    if (!activeIdentity) return;

    const credentialTypeMap = {
      [CredentialType.Orb]: biometricsChecked,
      [CredentialType.Device]: deviceChecked,
    };

    if (!bridgeInitialData) {
      setStatus(Status.Error);
      return console.error("No bridge initial data");
    }

    const selectedCredentialTypes = Object.entries(credentialTypeMap)
      .filter(([_type, isChecked]) => isChecked)
      .map(([type]) => type) as CredentialType[];

    let credential_type: CredentialType | undefined;

    // NOTE: Orb can be checked in two cases - picked orb only or picked both.
    // In both cases we should prefer orb, otherwise device
    if (selectedCredentialTypes.includes(CredentialType.Orb)) {
      credential_type = CredentialType.Orb;
    } else {
      credential_type = CredentialType.Device;
    }

    // Show additional warning if the identity is unverified or still pending inclusion
    if (!showConfirm && !isVerified) {
      setShowConfirm(true);
      return;
    }

    const { verified, fullProof } = await getFullProof(
      {
        ...bridgeInitialData,
        credential_type,
      },
      activeIdentity,
    );

    if (!verified) {
      setStatus(Status.Error);
      return console.error("Not verified");
    }

    if (url) {
      setShowConfirm(false);
      setStatus(Status.Pending);

      const approveResult = await approveRequest({
        url,
        fullProof,
        credentialType: credential_type,
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
  }, [
    activeIdentity,
    biometricsChecked,
    bridgeInitialData,
    isVerified,
    deviceChecked,
    setStatus,
    showConfirm,
    url,
  ]);

  return (
    <Drawer
      open={open}
      onClose={close}
    >
      {!isLoading && !showConfirm && metadata?.is_staging && (
        <>
          <div className="flex items-center gap-x-4">
            <div className="flex h-15 w-15 items-center justify-center rounded-full border border-gray-200">
              <Image
                src={
                  metadata.verified_app_logo ||
                  metadata.logo_url ||
                  "/icons/question.svg"
                }
                alt={metadata.name ?? "App logo"}
                width={40}
                height={40}
              />
            </div>

            <div className="flex flex-col">
              <span className="text-h3 font-bold">
                {metadata.name ?? "App Name"}
              </span>

              <div
                className={cn(
                  "inline-flex items-center gap-x-0.5",
                  { "text-info-700": metadata.is_verified },
                  { "text-gray-500": !metadata.is_verified },
                )}
              >
                <Icon
                  name={
                    metadata.is_verified
                      ? "badge-verified"
                      : "badge-not-verified"
                  }
                  className={"h-4 w-4"}
                />

                <span className="text-b4 leading-[1px]">
                  {metadata.is_verified ? "Verified" : "Not Verified"}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-b2 text-gray-500">
            {metadata.name ?? "App Name"} is asking for permission to {}
            {metadata.action?.description || "verify with World ID."}
          </p>

          <h3 className="mt-8 text-12 font-medium uppercase leading-[1.25] text-gray-500">
            Choose Credentials
          </h3>

          <Item
            heading="Biometrics"
            className="mt-3 p-4"
            onClick={() => setBiometricsChecked(!biometricsChecked)}
            indicator={() => (
              <Checkbox
                checked={biometricsChecked}
                setChecked={setBiometricsChecked}
              />
            )}
          >
            <IconGradient
              name="user"
              color="#9D50FF"
            />
          </Item>

          <Item
            heading="Device"
            className="mt-3 p-4"
            onClick={() => setDeviceChecked(!deviceChecked)}
            indicator={() => (
              <Checkbox
                checked={deviceChecked}
                setChecked={setDeviceChecked}
              />
            )}
          >
            <IconGradient
              name="phone"
              color="#00C313"
            />
          </Item>

          <Warning
            identity={activeIdentity}
            onChain={metadata.can_user_verify === "on-chain" ? true : false}
            biometricsChecked={biometricsChecked}
            phoneChecked={deviceChecked}
          />

          <ModalStatus
            status={status}
            handleClick={() => void handleClick()}
          />
        </>
      )}

      {isLoading && <ModalLoading />}
      {!isLoading && !metadata?.is_staging && <ModalEnvironment />}

      {!isLoading && showConfirm && (
        <ModalConfirm
          isVerified={isVerified}
          handleClick={() => void handleClick()}
        />
      )}
    </Drawer>
  );
}
