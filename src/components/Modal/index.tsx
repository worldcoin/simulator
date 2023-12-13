import { Drawer } from "@/components/Drawer";
import { Icon } from "@/components/Icon";
import useIdentity from "@/hooks/useIdentity";
import { getFullProof } from "@/lib/proof";
import { cn } from "@/lib/utils";
import { approveRequest } from "@/services/bridge";
import type { ModalStore } from "@/stores/modalStore";
import { useModalStore } from "@/stores/modalStore";
import { Status } from "@/types";

import { CredentialType } from "@worldcoin/idkit-core";

import dynamic from "next/dynamic";
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

const DynamicWorldID = dynamic(() => import("@/components/WorldID"), {
  ssr: false,
});

export function Modal() {
  const { activeIdentity } = useIdentity();
  const [showConfirm, setShowConfirm] = useState(false);

  const biometricsChecked = useMemo(() => {
    return activeIdentity?.verified[CredentialType.Orb];
  }, [activeIdentity?.verified]);

  const deviceChecked = useMemo(() => {
    return activeIdentity?.verified[CredentialType.Device];
  }, [activeIdentity?.verified]);

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
    reset();
  }, [reset, setOpen]);

  const isLoading = useMemo(() => {
    return status === Status.Loading;
  }, [status]);

  const credentialTypeMap = useMemo(
    () => ({
      [CredentialType.Orb]: biometricsChecked,
      [CredentialType.Device]: deviceChecked,
    }),
    [biometricsChecked, deviceChecked],
  );

  const handleClick = useCallback(
    async (malicious?: boolean) => {
      if (!activeIdentity) return;

      if (!bridgeInitialData) {
        setStatus(Status.Error);
        return console.error("No bridge initial data");
      }

      let credential_type: CredentialType | undefined;

      // NOTE: Orb can be checked in two cases - picked orb only or picked both.
      // In both cases we should prefer orb, otherwise device
      if (credentialTypeMap[CredentialType.Orb]) {
        credential_type = CredentialType.Orb;
      } else {
        credential_type = CredentialType.Device;
      }

      // Show additional warning if the identity is unverified or still pending inclusion
      if (!showConfirm && !activeIdentity.verified[credential_type]) {
        setShowConfirm(true);
        return;
      }

      const { verified, fullProof } = await getFullProof(
        {
          ...bridgeInitialData,
          credential_type,
        },
        activeIdentity,
        malicious,
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
    },
    [
      activeIdentity,
      bridgeInitialData,
      credentialTypeMap,
      setStatus,
      showConfirm,
      url,
    ],
  );

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
        metadata?.is_staging &&
        status != Status.Error && (
          <>
            <button
              className="absolute right-5 top-5 flex w-full justify-end"
              onClick={close}
            >
              <Icon
                name="close"
                className="h-6 w-6 text-black"
                bgClassName="h-9 w-9 rounded-full bg-gray-200"
              />
            </button>
            <div className="flex w-full justify-center p-8">
              <DynamicWorldID
                verified={activeIdentity?.verified[CredentialType.Orb]}
                className="w-7/12"
              />
            </div>
            <div className="flex flex-col rounded-18 bg-gray-50 p-4">
              <div className="mb-3 flex w-full flex-row items-center gap-x-4 p-1">
                <div className="flex h-15 w-15 items-center justify-center rounded-full border border-gray-200 bg-white">
                  <Image
                    src={metadata.verified_app_logo ?? "/icons/question.svg"}
                    alt={metadata.name ?? "App logo"}
                    width={40}
                    height={40}
                  />
                </div>
                <div className="flex flex-col py-2">
                  <span className=" text-b2 font-bold">
                    {metadata.name ?? "App Name"}
                  </span>

                  <div
                    className={cn(
                      "inline-flex items-center gap-x-0.5 pt-0.5",
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
              <hr className="h-[1px] w-full rounded-full bg-gray-200 xs:block" />
              <p className="mt-4 px-2 text-b3 text-gray-500">
                {metadata.name ?? "App Name"} is asking for permission to your
                World ID
              </p>
            </div>

            <ModalStatus
              status={status}
              handleClick={() => void handleClick(false)}
            />
          </>
        )}
      {!isLoading &&
        !showConfirm &&
        status !== Status.Success &&
        metadata?.is_staging &&
        status != Status.Error && (
          <div className="flex w-full justify-center">
            <button
              className="mb-4 font-bold text-error-700"
              onClick={() => void handleClick(true)}
            >
              Test Malicious Proof
            </button>
          </div>
        )}

      {isLoading && <ModalLoading />}
      {!isLoading && !metadata?.is_staging && status != Status.Error && (
        <ModalEnvironment />
      )}

      {!isLoading && showConfirm && (
        <ModalConfirm handleClick={() => void handleClick()} />
      )}
    </Drawer>
  );
}
