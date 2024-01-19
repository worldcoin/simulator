import { Drawer } from "@/components/Drawer";
import { Icon } from "@/components/Icon";
import useIdentity from "@/hooks/useIdentity";
import {
  generateDummyMerkleProof,
  getFullProof,
  getMerkleProof,
} from "@/lib/proof";
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
  const { activeIdentity } = useIdentity();
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
    reset();
  }, [reset, setOpen]);

  const isLoading = useMemo(() => {
    return status === Status.Loading;
  }, [status]);

  const handleClick = useCallback(
    async (
      malicious?: boolean,
      credential_type: CredentialType = CredentialType.Orb,
    ) => {
      if (!activeIdentity) return;

      if (!bridgeInitialData) {
        setStatus(Status.Error);
        return console.error("No bridge initial data");
      }

      // Show additional warning if the identity is unverified or still pending inclusion
      if (!showConfirm && !activeIdentity.verified[credential_type]) {
        setShowConfirm(true);
        return;
      }
      // Generate proofs
      const merkleProof = malicious
        ? generateDummyMerkleProof(activeIdentity)
        : getMerkleProof(activeIdentity, credential_type);

      const { verified, fullProof } = await getFullProof(
        {
          ...bridgeInitialData,
          credential_type,
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
    [activeIdentity, bridgeInitialData, setStatus, showConfirm, url],
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
              <div className="z-40 w-2/3 no-select xs:aspect-[330/435] ">
                <div
                  className={cn(
                    activeIdentity?.verified[CredentialType.Orb]
                      ? 'bg-[url("/images/card-bg-verified-front.png")]'
                      : 'bg-[url("/images/card-bg-not-verified.png")]',
                    "h-full w-full bg-contain bg-[position:center] bg-no-repeat",
                  )}
                />
              </div>
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
                {metadata.name ?? "App Name"} is asking for permission to verify
                you with your World ID.
              </p>
            </div>

            <ModalStatus
              status={status}
              handleClick={(credential_type) =>
                void handleClick(false, credential_type)
              }
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
              className="mb-4 font-bold text-gray-500"
              onClick={() => void handleClick(true)}
            >
              Test Invalid Proof
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
