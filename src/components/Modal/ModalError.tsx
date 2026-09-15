import { AssetIcon } from "@/components/Icon";
import { WORLD_ID_ICONS } from "@/lib/assets";
import { ErrorsCode } from "@/types";
import Button from "../Button";
import { ModalContent } from "./ModalContent";

const DEVELOPER_PORTAL_URL = "https://developer.world.org";

const openDeveloperPortal = () =>
  window.open(DEVELOPER_PORTAL_URL, "_blank", "noopener,noreferrer");

const warningHero = (
  <AssetIcon
    src={WORLD_ID_ICONS.warningGrey}
    noMask
    className="size-16"
  />
);

export default function ModalError(props: {
  errorCode: ErrorsCode | null;
  close: () => void;
}) {
  const dismiss = (
    <Button
      variant="tertiary"
      fullWidth
      onClick={props.close}
    >
      Dismiss
    </Button>
  );

  const portal = (
    <Button
      fullWidth
      onClick={openDeveloperPortal}
    >
      Open Developer Portal
    </Button>
  );

  if (props.errorCode == ErrorsCode.InputError) {
    return (
      <ModalContent
        hero={
          <AssetIcon
            src={WORLD_ID_ICONS.noQr}
            noMask
            className="size-16"
          />
        }
        title="Invalid or expired QR code"
        actions={dismiss}
      >
        Request is invalid or expired. Please request a new one.
      </ModalContent>
    );
  }

  if (props.errorCode == ErrorsCode.MissingAction) {
    return (
      <ModalContent
        hero={warningHero}
        title="Action required"
        actions={
          <>
            {portal}
            {dismiss}
          </>
        }
      >
        No action found for this app. Create one in the Developer Portal and try
        again.
      </ModalContent>
    );
  }

  if (props.errorCode == ErrorsCode.AppNotRegisteredV4) {
    return (
      <ModalContent
        hero={warningHero}
        title="App not found"
        actions={
          <>
            {portal}
            {dismiss}
          </>
        }
      >
        This app isn&apos;t registered in the Developer Portal. Create it there
        and try again.
      </ModalContent>
    );
  }

  return (
    <ModalContent
      hero={warningHero}
      title="Something went wrong"
      actions={dismiss}
    >
      {"We couldn't complete that request. Please try again."}
    </ModalContent>
  );
}
