import { Checkbox } from "@/components/Checkbox";
import { Drawer } from "@/components/Drawer";
import { Icon } from "@/components/Icon";
import { IconGradient } from "@/components/Icon/IconGradient";
import Item from "@/components/Item";
import useIdentity from "@/hooks/useIdentity";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { cn } from "@/lib/utils";
import type { ModalStore } from "@/stores/modalStore";
import { useModalStore } from "@/stores/modalStore";
import { Status } from "@/types";
import { CredentialType } from "@worldcoin/idkit";
import Image from "next/image";
import { useMemo, useState } from "react";
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
  event: store.event,
});

export function Modal() {
  const { open, setOpen, status, setStatus, metadata, event } =
    useModalStore(getStore);
  const { approveRequest } = useWalletConnect();
  const { activeIdentity } = useIdentity();

  const [showConfirm, setShowConfirm] = useState(false);
  const [biometricsChecked, setBiometricsChecked] = useState<
    boolean | "indeterminate"
  >(activeIdentity?.verified[CredentialType.Orb] ?? false);
  const [phoneChecked, setPhoneChecked] = useState<boolean | "indeterminate">(
    activeIdentity?.verified[CredentialType.Phone] ?? false,
  );

  const isLoading = useMemo(() => {
    return status === Status.Loading;
  }, [status]);

  const isVerified = useMemo(() => {
    const orbVerified =
      biometricsChecked && activeIdentity?.verified[CredentialType.Orb];
    const phoneVerified =
      phoneChecked && activeIdentity?.verified[CredentialType.Phone];
    const isVerified = orbVerified ?? phoneVerified;
    return isVerified;
  }, [biometricsChecked, activeIdentity?.verified, phoneChecked]);

  const handleClick = async () => {
    if (!activeIdentity) return;
    const credentialTypeMap = {
      [CredentialType.Orb]: biometricsChecked,
      [CredentialType.Phone]: phoneChecked,
    };
    const credentialTypes = Object.entries(credentialTypeMap)
      .filter(([_type, isChecked]) => isChecked)
      .map(([type]) => type) as CredentialType[];

    // Show additional warning if the identity is unverified or still pending inclusion
    if (!showConfirm && !isVerified) {
      setShowConfirm(true);
      return;
    }

    if (event) {
      setShowConfirm(false);
      await approveRequest(event, credentialTypes);
    } else {
      console.error("No event found, WalletConnect session may have expired");
      setStatus(Status.Error);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
    >
      {!isLoading && !showConfirm && metadata?.is_staging && (
        <>
          <div className="flex items-center gap-x-4">
            <div className="flex h-15 w-15 items-center justify-center rounded-full border border-gray-200">
              <Image
                src={
                  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                  metadata.verified_app_logo ||
                  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
            {metadata.name ?? "App Name"} is asking for permission to{" "}
            {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
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
            heading="Phone"
            className="mt-3 p-4"
            onClick={() => setPhoneChecked(!phoneChecked)}
            indicator={() => (
              <Checkbox
                checked={phoneChecked}
                setChecked={setPhoneChecked}
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
            phoneChecked={phoneChecked}
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
