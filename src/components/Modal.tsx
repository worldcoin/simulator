import { Checkbox } from "@/components/Checkbox";
import { Drawer } from "@/components/Drawer";
import { GradientIcon } from "@/components/GradientIcon";
import { Icon } from "@/components/Icon";
import Item from "@/components/Item";
import { VerifyStatus } from "@/components/Verify/VerifyStatus";
import useIdentity from "@/hooks/useIdentity";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import type { IModalStore } from "@/stores/modalStore";
import { useModalStore } from "@/stores/modalStore";
import { Status } from "@/types";
import { CredentialType } from "@worldcoin/idkit";
import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import Warning from "./Warning";

const getStore = (store: IModalStore) => ({
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
  const { identity } = useIdentity();

  const [biometricsChecked, setBiometricsChecked] = useState<
    boolean | "indeterminate"
  >(true);
  const [phoneChecked, setPhoneChecked] = useState<boolean | "indeterminate">(
    true,
  );

  const handleClick = async () => {
    const credentialTypeMap = {
      [CredentialType.Orb]: biometricsChecked,
      [CredentialType.Phone]: phoneChecked,
    };

    const credentialTypes = Object.entries(credentialTypeMap)
      .filter(([_type, isChecked]) => isChecked)
      .map(([type]) => type) as CredentialType[];

    if (event) {
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
      {status !== Status.Loading && metadata?.is_staging && (
        <>
          <div className="grid grid-cols-auto/1fr items-center gap-x-4">
            <div className="flex h-15 w-15 items-center justify-center rounded-full border border-gray-200">
              <Image
                src={
                  metadata.verified_app_logo ??
                  metadata.logo_url ??
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
                className={clsx(
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
            <GradientIcon
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
            <GradientIcon
              name="phone"
              color="#00C313"
            />
          </Item>
          <Warning
            identity={identity}
            biometricsChecked={biometricsChecked}
            phoneChecked={phoneChecked}
          />

          <div className="mt-8">
            <VerifyStatus
              status={status}
              handleClick={handleClick}
              fancy
            />
          </div>
        </>
      )}
      {status !== Status.Loading && !metadata?.is_staging && (
        <div className="flex h-[360px] flex-col items-center justify-center">
          <Icon
            name="close"
            className="h-10 w-10 text-error-700"
            bgClassName="h-12 w-12 rounded-full bg-error-100"
          />
          <h3 className="mt-4 text-center font-sora text-h3 font-semibold">
            Cannot verify production app on simulator
          </h3>
        </div>
      )}
      {status === Status.Loading && (
        <div className="flex h-[360px] items-center justify-center">
          <Icon
            name="spinner"
            className="h-8 w-8 animate-spin text-gray-500"
          />
        </div>
      )}
    </Drawer>
  );
}
