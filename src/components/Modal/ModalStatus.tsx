import { Status } from "@/types";
import { memo } from "react";
import Button from "../Button";
import { Icon } from "../Icon";

interface ModalStatusProps {
  status: Status;
  handleClick: () => void;
}

export const ModalStatus = memo(function ModalStatus(props: ModalStatusProps) {
  return (
    <div className="my-8 flex items-center justify-center">
      {props.status === Status.Waiting && (
        <Button
          onClick={props.handleClick}
          className="flex h-14 w-full items-center justify-center bg-gray-900 font-sora text-16 font-semibold text-gray-0"
        >
          <>
            <Icon
              name="world-id"
              className="h-6 w-6"
            />
            <span className="ml-3">Verify with World ID</span>
          </>
        </Button>
      )}
      {props.status === Status.Pending && (
        <>
          <Icon
            name="spinner"
            className="h-6 w-6 animate-spin text-000000"
          />
          <span className="ml-2 text-16 font-semibold text-657080">
            Verifying
          </span>
        </>
      )}
      {props.status === Status.Success && (
        <>
          <Icon
            name="checkmark"
            className="h-4 w-4 text-ffffff "
            bgClassName="rounded-full w-6 h-6 bg-00c313"
          />
          <span className="ml-2 text-16 font-semibold text-00c313">
            Verified
          </span>
        </>
      )}
      {props.status === Status.Warning && (
        <>
          <Icon
            name="close"
            className="h-4 w-4 text-ffffff "
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
            className="h-4 w-4 text-ffffff "
            bgClassName="rounded-full w-6 h-6 bg-ff5a76"
          />
          <span className="ml-2 text-16 font-semibold text-ff5a76">
            Verification failed
          </span>
        </>
      )}
    </div>
  );
});
