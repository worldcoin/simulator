import { Status } from "@/types";
import { CredentialType } from "@worldcoin/idkit-core";
import { memo } from "react";
import Button from "../Button";
import { Icon } from "../Icon";

interface ModalStatusProps {
  status: Status;
  handleClick: (malicious: boolean, credential_type: CredentialType) => void;
}

export const ModalStatus = memo(function ModalStatus(props: ModalStatusProps) {
  return (
    <div className="mt-6 flex items-center justify-center">
      {props.status === Status.Waiting && (
        <div className="flex w-full flex-col space-y-4">
          <Button
            onClick={() => props.handleClick(false, CredentialType.Orb)}
            className="flex h-14 w-full items-center justify-center bg-gray-900 font-sora text-16 font-semibold text-white"
          >
            <Icon
              name="orb"
              className="h-6 w-6 text-white"
            />
            <span className="mx-2">Verify with Orb</span>
          </Button>
          <Button
            onClick={() => props.handleClick(false, CredentialType.Device)}
            className="flex h-14 w-full items-center justify-center bg-gray-200 font-sora text-16 font-semibold"
          >
            <Icon
              name="smart-phone"
              className="h-6 w-6 text-gray-500"
            />
            <span className="mx-2 text-gray-900">Verify with Device</span>
          </Button>
          <div className="flex w-full justify-center">
            <button
              className="my-2 text-14 font-medium uppercase text-gray-400"
              onClick={() => props.handleClick(true, CredentialType.Orb)}
            >
              Test Invalid Proof
            </button>
          </div>
        </div>
      )}
      {props.status === Status.Pending && (
        <>
          <Icon
            name="spinner"
            className="h-6 w-6 animate-spin text-black"
          />
          <span className="ml-2 text-16 font-semibold text-gray-500">
            Verifying
          </span>
        </>
      )}
      {props.status === Status.Success && (
        <>
          <Icon
            name="checkmark"
            className="h-4 w-4 text-white "
            bgClassName="rounded-full w-6 h-6 bg-success-700"
          />
          <span className="ml-2 text-16 font-semibold text-success-700">
            Verified
          </span>
        </>
      )}
      {props.status === Status.Warning && (
        <>
          <Icon
            name="close"
            className="h-4 w-4 text-white "
            bgClassName="rounded-full w-6 h-6 bg-warning-700"
          />
          <span className="ml-2 text-16 font-semibold text-warning-700">
            You&apos;ve done this before
          </span>
        </>
      )}
      {props.status === Status.Error && (
        <>
          <Icon
            name="cross"
            className="h-4 w-4 text-white "
            bgClassName="rounded-full w-6 h-6 bg-error-700"
          />
          <span className="ml-2 text-16 font-semibold text-error-700">
            Verification failed
          </span>
        </>
      )}
    </div>
  );
});
