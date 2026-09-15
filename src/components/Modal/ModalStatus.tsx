import { WORLD_ID_ICONS } from "@/lib/assets";
import { Status } from "@/types";
import { memo, type ReactNode } from "react";
import { ActivityIndicator } from "../ActivityIndicator";
import Button from "../Button";
import { AssetIcon, Icon } from "../Icon";

interface ModalStatusProps {
  status: Status;
  onCancel: () => void;
  onContinue: () => void;
}

function StatusLabel(props: {
  icon: ReactNode;
  className: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex items-center gap-2 text-s1 ${props.className}`}>
      {props.icon}
      {props.children}
    </div>
  );
}

/**
 * The 56pt action slot of the request sheet: Cancel / Continue while waiting,
 * then an inline status while the proof is presented.
 */
export const ModalStatus = memo(function ModalStatus(props: ModalStatusProps) {
  return (
    <div
      className="flex h-14 w-full items-center justify-center"
      aria-live="polite"
    >
      {props.status === Status.Waiting && (
        <div className="flex w-full gap-4">
          <Button
            variant="secondary"
            className="min-w-0 flex-1"
            onClick={props.onCancel}
          >
            Cancel
          </Button>
          <Button
            className="min-w-0 flex-1"
            onClick={props.onContinue}
          >
            Continue
          </Button>
        </div>
      )}
      {props.status === Status.Pending && (
        <StatusLabel
          className="text-grey-400"
          icon={
            <ActivityIndicator
              size={24}
              className="text-fg-primary"
            />
          }
        >
          Presenting
        </StatusLabel>
      )}
      {props.status === Status.Success && (
        <StatusLabel
          className="text-green-600"
          icon={
            <AssetIcon
              src={WORLD_ID_ICONS.success24}
              noMask
              className="size-6"
            />
          }
        >
          Presented
        </StatusLabel>
      )}
      {props.status === Status.Warning && (
        <StatusLabel
          className="text-amber-600"
          icon={
            <Icon
              name="refresh"
              className="size-6"
            />
          }
        >
          Already verified
        </StatusLabel>
      )}
      {props.status === Status.Error && (
        <StatusLabel
          className="text-red-600"
          icon={
            <AssetIcon
              src={WORLD_ID_ICONS.failure24}
              noMask
              className="size-6"
            />
          }
        >
          Failed
        </StatusLabel>
      )}
    </div>
  );
});
