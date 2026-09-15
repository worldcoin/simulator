import Button from "../Button";
import { ModalContent } from "./ModalContent";

interface ModalConfirmProps {
  handleClick: () => void;
  onCancel: () => void;
}

export default function ModalConfirm(props: ModalConfirmProps) {
  return (
    <ModalContent
      hero="info-circle"
      title="Unverified identity"
      actions={
        <>
          <Button
            fullWidth
            onClick={props.handleClick}
          >
            Continue anyway
          </Button>
          <Button
            variant="tertiary"
            fullWidth
            onClick={props.onCancel}
          >
            Cancel
          </Button>
        </>
      }
    >
      This test identity isn&apos;t verified for the requested credential, so
      the app will reject the proof.
    </ModalContent>
  );
}
