import { Status } from "@/types";
import { VerificationLevel } from "@worldcoin/idkit-core";
import { memo, useState } from "react";
import Button from "../Button";
import { Icon } from "../Icon";

interface ModalStatusProps {
  status: Status;
  hasProofRequest: boolean;
  requestedLevel?: VerificationLevel;
  handleClick: (
    malicious: boolean,
    verification_level: VerificationLevel,
  ) => void;
  handleV4Click: () => void;
}

export const ModalStatus = memo(function ModalStatus(props: ModalStatusProps) {
  const [useV4, setUseV4] = useState(props.hasProofRequest);

  return (
    <div className="flex w-full items-center justify-center">
      {props.status === Status.Waiting && (
        <div className="flex w-full flex-col gap-3">
          {!props.hasProofRequest && props.requestedLevel && (
            <p className="text-center font-sora text-b3 text-gray-500">
              App requested: {props.requestedLevel}
            </p>
          )}

          {props.hasProofRequest && (
            <div className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-100 p-1">
              <button
                onClick={() => setUseV4(false)}
                className={`flex-1 rounded-full px-4 py-2 font-sora text-14 font-semibold transition-colors ${
                  !useV4
                    ? "bg-[#181818] text-white"
                    : "hover:text-gray-700 text-gray-500"
                }`}
              >
                v3
              </button>
              <button
                onClick={() => setUseV4(true)}
                className={`flex-1 rounded-full px-4 py-2 font-sora text-14 font-semibold transition-colors ${
                  useV4
                    ? "bg-[#181818] text-white"
                    : "hover:text-gray-700 text-gray-500"
                }`}
              >
                v4
              </button>
            </div>
          )}

          {useV4 ? (
            <Button
              onClick={props.handleV4Click}
              className="h-14 w-full rounded-full bg-[#181818] px-4 font-sora text-16 font-semibold text-white"
            >
              Verify
            </Button>
          ) : (
            <>
              <div className="grid w-full grid-cols-2 gap-3">
                <Button
                  onClick={() =>
                    props.handleClick(false, VerificationLevel.Orb)
                  }
                  className="h-14 w-full rounded-full bg-[#181818] px-4 font-sora text-16 font-semibold text-white"
                >
                  Orb
                </Button>
                <Button
                  onClick={() =>
                    props.handleClick(false, VerificationLevel.SecureDocument)
                  }
                  className="h-14 w-full rounded-full bg-[#181818] px-3 font-sora text-15 font-semibold text-white"
                >
                  Secure Document
                </Button>
                <Button
                  onClick={() =>
                    props.handleClick(false, VerificationLevel.Document)
                  }
                  className="h-14 w-full rounded-full bg-[#181818] px-4 font-sora text-16 font-semibold text-white"
                >
                  Document
                </Button>
                <Button
                  onClick={() =>
                    props.handleClick(false, VerificationLevel.Device)
                  }
                  className="h-14 w-full rounded-full bg-[#181818] px-4 font-sora text-16 font-semibold text-white"
                >
                  Device
                </Button>
              </div>
              <div className="flex w-full justify-center">
                <button
                  className="mt-1 text-12 font-semibold uppercase tracking-[0.04em] text-gray-400"
                  onClick={() =>
                    props.handleClick(
                      true,
                      props.requestedLevel ?? VerificationLevel.Orb,
                    )
                  }
                >
                  Test Invalid Proof
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {props.status === Status.Pending && (
        <>
          <Icon
            name="spinner"
            className="size-6 animate-spin text-black"
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
            className="size-4 text-white "
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
            className="size-4 text-white "
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
            className="size-4 text-white "
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
