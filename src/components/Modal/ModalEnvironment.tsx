import { AssetIcon } from "@/components/Icon";
import { WORLD_ID_ICONS } from "@/lib/assets";
import Button from "../Button";
import { ModalContent } from "./ModalContent";

export default function ModalEnvironment(props: { close: () => void }) {
  return (
    <ModalContent
      hero={
        <AssetIcon
          src={WORLD_ID_ICONS.warningGrey}
          noMask
          className="size-16"
        />
      }
      title="Production request detected"
      actions={
        <Button
          variant="tertiary"
          fullWidth
          onClick={props.close}
        >
          Dismiss
        </Button>
      }
    >
      <p>This simulator only accepts staging requests.</p>
      <p className="mt-3">
        Set{" "}
        <code className="rounded-8 bg-surface-secondary px-2 py-1 text-b3 text-fg-primary">
          environment: &quot;staging&quot;
        </code>{" "}
        in your request payload and try again.
      </p>
    </ModalContent>
  );
}
