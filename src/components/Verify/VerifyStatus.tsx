import { Status } from "@/types";
import { memo } from "react";
import Button from "../Button";
import { Icon } from "../Icon";

interface VerifyStatusProps {
  status: Status;
  handleClick: () => void;
}

export const VerifyStatus = memo(function VerifyStatus(
  props: VerifyStatusProps,
) {
  return (
    <div className="mb-8 flex items-center justify-center">
      {props.status === Status.Waiting && (
        <Button
          onClick={props.handleClick}
          className="flex h-14 w-full items-center justify-center bg-gray-900 font-sora text-16 font-semibold text-white"
        >
          <span>Verify now</span>
        </Button>
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
