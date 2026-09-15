import Button from "@/components/Button";
import { Icon, type IconType } from "@/components/Icon";
import type { ReactNode } from "react";

/**
 * World App's WLDModalContent: an optional 64pt hero, a centered `h3` title,
 * `b1` body copy, and a stack of full-width actions 8pt apart.
 */
export function ModalContent(props: {
  /** A Nucleus icon name (drawn in a grey circle) or ready-made hero artwork. */
  hero?: IconType | ReactNode;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className="relative flex flex-col items-center gap-6 pt-2 text-center">
      {props.onClose && (
        <Button
          variant="tertiary"
          size={36}
          iconOnly
          aria-label="Close"
          onClick={props.onClose}
          className="absolute -top-1 right-0"
        >
          <Icon
            name="xmark"
            className="size-6"
          />
        </Button>
      )}

      {typeof props.hero === "string" ? (
        <span className="mt-6 flex size-16 items-center justify-center rounded-full bg-surface-secondary">
          <Icon
            name={props.hero as IconType}
            className="size-8 text-fg-primary"
          />
        </span>
      ) : (
        props.hero && <span className="mt-6 flex size-16">{props.hero}</span>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-h3 text-fg-primary">{props.title}</h2>
        {props.children && (
          <div className="text-b1 text-fg-secondary">{props.children}</div>
        )}
      </div>

      {props.actions && (
        <div className="flex w-full flex-col gap-2 pt-2">{props.actions}</div>
      )}
    </div>
  );
}
